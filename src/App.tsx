import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import HomeView from "./components/HomeView";
import ChatView from "./components/ChatView";
import SettingsModal from "./components/SettingsModal";
import AuthModal from "./components/AuthModal";
import PricingModal from "./components/PricingModal";
import { ToastContainer } from "./components/Toast";
import { ChatSession, Message, ModelId, FileAttachment } from "./types";
import { RefreshCw, Sparkles, X, AlertCircle, FileText, Check, Download, Layers, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "./lib/supabase";
import { createCheckoutSession } from "./lib/stripe";
import { useStore } from "./store/useStore";

// Lazy load pages for code splitting
const ImagesPage = lazy(() => import("./pages/ImagesPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const NotebooksPage = lazy(() => import("./pages/NotebooksPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));

const INITIAL_SYSTEM_PROMPT = "You are Nova, a premium AI assistant with magnificent reasoning, coding, and writing abilities. Respond precisely with elegant markdown structures.";

function NovaMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-label="Nova" className={className} viewBox="0 0 40 40" role="img">
      <defs>
        <linearGradient id="novaUpgradeBlueGreen" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4285f4" />
          <stop offset="0.48" stopColor="#34a853" />
          <stop offset="1" stopColor="#1a73e8" />
        </linearGradient>
        <linearGradient id="novaUpgradeRedYellow" x1="8" y1="31" x2="29" y2="7" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbc04" />
          <stop offset="0.44" stopColor="#ea4335" />
          <stop offset="1" stopColor="#4285f4" />
        </linearGradient>
      </defs>
      <path
        d="M21.3 4.9c.5-1.6 2.9-1.6 3.4 0l1.8 6.2c.2.6.7 1.1 1.3 1.3l6.2 1.8c1.6.5 1.6 2.9 0 3.4l-6.2 1.8c-.6.2-1.1.7-1.3 1.3l-1.8 6.2c-.5 1.6-2.9 1.6-3.4 0l-1.8-6.2c-.2-.6-.7-1.1-1.3-1.3L12 17.6c-1.6-.5-1.6-2.9 0-3.4l6.2-1.8c.6-.2 1.1-.7 1.3-1.3l1.8-6.2Z"
        fill="url(#novaUpgradeBlueGreen)"
      />
      <path
        d="M8.3 21.7c.3-1 1.8-1 2.1 0l.9 3.1c.1.4.4.7.8.8l3.1.9c1 .3 1 1.8 0 2.1l-3.1.9c-.4.1-.7.4-.8.8l-.9 3.1c-.3 1-1.8 1-2.1 0l-.9-3.1c-.1-.4-.4-.7-.8-.8l-3.1-.9c-1-.3-1-1.8 0-2.1l3.1-.9c.4-.1.7-.4.8-.8l.9-3.1Z"
        fill="url(#novaUpgradeRedYellow)"
      />
    </svg>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use Zustand store
  const sessions = useStore((state) => state.sessions);
  const setSessions = useStore((state) => state.setSessions);
  const activeSessionId = useStore((state) => state.activeSessionId);
  const setActiveSessionId = useStore((state) => state.setActiveSessionId);
  const selectedModel = useStore((state) => state.selectedModel);
  const setSelectedModel = useStore((state) => state.setSelectedModel);
  const systemPrompt = useStore((state) => state.systemPrompt);
  const setSystemPrompt = useStore((state) => state.setSystemPrompt);
  const temperature = useStore((state) => state.temperature);
  const setTemperature = useStore((state) => state.setTemperature);
  const maxTokens = useStore((state) => state.maxTokens);
  const setMaxTokens = useStore((state) => state.setMaxTokens);
  const topP = useStore((state) => state.topP);
  const setTopP = useStore((state) => state.setTopP);
  const streamingEnabled = useStore((state) => state.streamingEnabled);
  const setStreamingEnabled = useStore((state) => state.setStreamingEnabled);
  const fontSize = useStore((state) => state.fontSize);
  const setFontSize = useStore((state) => state.setFontSize);
  const selectedLanguage = useStore((state) => state.selectedLanguage);
  const setSelectedLanguage = useStore((state) => state.setSelectedLanguage);
  const addMessageToSession = useStore((state) => state.addMessageToSession);
  const updateMessageInSession = useStore((state) => state.updateMessageInSession);
  const deleteMessageFromSession = useStore((state) => state.deleteMessageFromSession);
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useStore((state) => state.setSidebarCollapsed);
  const theme = useStore((state) => state.theme);
  const toasts = useStore((state) => state.toasts);
  const removeToast = useStore((state) => state.removeToast);

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Export panel status
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Runtime statuses
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [promptInput, setPromptInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<{ type: string; details: string } | null>(null);

  // Authentication
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      setIsPricingOpen(false);
      setIsAuthOpen(true);
      return;
    }

    try {
      const session = await createCheckoutSession(user.email, planId);
      if (session && session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  // Synchronize Sessions with localStorage
  useEffect(() => {
    localStorage.setItem("nova_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Synchronize active ID with localStorage
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem("nova_active_id", activeSessionId);
    } else {
      localStorage.removeItem("nova_active_id");
    }
  }, [activeSessionId]);

  // Speech Recognition hook setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    console.log('Speech Recognition API available:', !!SpeechRecognition);
    
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      
      rec.onresult = (e: any) => {
        console.log('Speech recognition result:', e);
        const transcript = e.results[0][0].transcript;
        console.log('Transcript:', transcript);
        const textarea = document.getElementById("prompt-textarea") as HTMLTextAreaElement;
        if (textarea) {
          const currentValue = textarea.value;
          const newValue = (currentValue + " " + transcript).trim();
          textarea.value = newValue;
          textarea.focus();
          // dispatch input event to trigger React state update
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
        }
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e.error, e);
        setIsListening(false);
      };

      rec.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      rec.onstart = () => {
        console.log('Speech recognition started');
      };

      setSpeechRecognition(rec);
      console.log('Speech recognition initialized');
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }, []);

  const handleToggleListen = () => {
    console.log('Toggle listen clicked, isListening:', isListening);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech recognition is not supported in this browser. Please try standard text input.");
      return;
    }

    if (isListening) {
      console.log('Stopping speech recognition');
      setIsListening(false);
      if (speechRecognition) {
        speechRecognition.stop();
      }
    } else {
      console.log('Starting speech recognition');
      setIsListening(true);
      
      // Create new instance each time to avoid state issues
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      
      rec.onresult = (e: any) => {
        console.log('Speech recognition result:', e);
        const transcript = e.results[0][0].transcript;
        console.log('Transcript:', transcript);
        setPromptInput((prev) => (prev + " " + transcript).trim());
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e.error, e);
        setIsListening(false);
      };

      rec.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      rec.onstart = () => {
        console.log('Speech recognition started');
      };

      setSpeechRecognition(rec);
      rec.start();
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    navigate('/');
  };

  const handleNavigateToImages = () => {
    navigate('/images');
  };

  const handleNavigateToLibrary = () => {
    navigate('/library');
  };

  const handleNavigateToNotebooks = () => {
    navigate('/notebooks');
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  const handleNavigateToSubscription = () => {
    navigate('/subscription');
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setErrorMessage(null);
    navigate(`/chat/${id}`);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = sessions.map(s => {
      if (s.id === id) {
        return { ...s, title: newTitle, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    setSessions(updated);
    // Also update in store
    useStore.getState().updateSession(id, { title: newTitle });
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.map(s => {
      if (s.id === id) {
        return { ...s, isPinned: !s.isPinned, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    setSessions(updated);
    useStore.getState().updateSession(id, { isPinned: !sessions.find(s => s.id === id)?.isPinned });
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.map(s => {
      if (s.id === id) {
        return { ...s, isFavorite: !s.isFavorite, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    setSessions(updated);
    useStore.getState().updateSession(id, { isFavorite: !sessions.find(s => s.id === id)?.isFavorite });
  };

  // Central Send Message Logic (Full-Stack server bridge)
  const handleSendMessage = async (content: string, attachment?: FileAttachment) => {
    setErrorMessage(null);
    let currentSessionId = activeSessionId;

    // 1. Create session if none is active
    if (!currentSessionId) {
      const title = content.length > 25 ? content.substring(0, 25) + "..." : content;
      const newSession: ChatSession = {
        id: "session_" + Date.now(),
        title: title || "Untitled Chat",
        model: selectedModel,
        systemPrompt: systemPrompt,
        messages: [],
        isPinned: false,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        temperature,
        maxTokens,
        topP
      };
      useStore.getState().addSession(newSession);
      currentSessionId = newSession.id;
      setActiveSessionId(newSession.id);
    }

    // 2. Add User Message
    const userMsg: Message = {
      id: "msg_" + Date.now(),
      role: "user",
      content: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: attachment
    };

    useStore.getState().addMessageToSession(currentSessionId, userMsg);
    setPromptInput("");
    setIsGenerating(true);
    
    // Navigate to chat route if not already there
    if (location.pathname !== `/chat/${currentSessionId}`) {
      navigate(`/chat/${currentSessionId}`);
    }

    try {
      // Get the absolute latest data from the store
      const latestSessions = useStore.getState().sessions;
      const targetSession = latestSessions.find(s => s.id === currentSessionId);
      if (!targetSession) return;

      // 3. Single backend endpoint — AI Router handles all providers
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: targetSession.messages.map(m => ({ role: m.role, content: m.content })),
          systemInstruction: targetSession.systemPrompt,
          temperature: targetSession.temperature,
          maxTokens: targetSession.maxTokens,
          topP: targetSession.topP,
          model: targetSession.model,
          stream: streamingEnabled,
          fileData: attachment ? { mimeType: attachment.mimeType, data: attachment.base64Data || (attachment as any).base64 } : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";

      // 4. Server-sent events streaming from AI Router
      if (streamingEnabled && contentType.includes("text/event-stream") && response.body) {
        const assistantMsgId = "msg_stream_" + Date.now();
        let displayedText = "";
        let responseStats: Message["stats"];

        const streamMessage: Message = {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        useStore.getState().addMessageToSession(currentSessionId, streamMessage);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const eventBlock of events) {
            const lines = eventBlock.split("\n");
            let eventType = "message";
            let dataLine = "";

            for (const line of lines) {
              if (line.startsWith("event:")) eventType = line.slice(6).trim();
              if (line.startsWith("data:")) dataLine = line.slice(5).trim();
            }

            if (eventType === "error") {
              const errPayload = JSON.parse(dataLine || "{}");
              throw new Error(errPayload.message || "Stream failed");
            }

            if (eventType === "chunk" && dataLine) {
              const payload = JSON.parse(dataLine);
              displayedText += payload.content ?? "";
              useStore.getState().updateMessageInSession(currentSessionId, assistantMsgId, { content: displayedText });
            }

            if (eventType === "done" && dataLine) {
              const payload = JSON.parse(dataLine);
              responseStats = payload.stats;
            }
          }
        }

        useStore.getState().updateMessageInSession(currentSessionId, assistantMsgId, { stats: responseStats });
        setIsGenerating(false);
      } else {
        const data = await response.json();
        const textResponse = data.response ?? data.content;
        const responseStats = data.stats;

        const assistantMsg: Message = {
          id: "msg_" + Date.now(),
          role: "assistant",
          content: textResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stats: responseStats
        };
        
        useStore.getState().addMessageToSession(currentSessionId, assistantMsg);
        setIsGenerating(false);
      }

    } catch (err: any) {
      console.error(err);
      setIsGenerating(false);

      // Handle specific error profiles visually inside beautiful error cards
      let errorType = "Network Failure";
      let explanation = err.message || "An unexpected network error occurred. Please verify your internet server status.";

      if (err.message && err.message.includes("API Key")) {
        errorType = "Invalid API Key";
        explanation = "The Nova API key is missing or invalid. Please populate the GEMINI_API_KEY secret in Settings to run the app.";
      } else if (err.message && err.message.includes("Rate Limit")) {
        errorType = "Rate Limit Exceeded";
        explanation = "You have hit the maximum token requests for Nova Flash. Please retry in a few moments.";
      }

      setErrorMessage({ type: errorType, details: explanation });

      // Add warning message into conversational thread
      const errorMsg: Message = {
        id: "msg_err_" + Date.now(),
        role: "assistant",
        content: `⚠️ **[${errorType}]**\n\n${explanation}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      useStore.getState().addMessageToSession(currentSessionId, errorMsg);
    }
  };

  const handleRegenerate = () => {
    const latestSessions = useStore.getState().sessions;
    const targetSession = latestSessions.find(s => s.id === activeSessionId);
    if (!targetSession || targetSession.messages.length === 0) return;

    // Delete last assistant message, if any
    let messages = [...targetSession.messages];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant") {
      messages.pop();
    }

    // Capture last user prompt to retry
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg && lastUserMsg.role === "user") {
      messages.pop();
      // Update session messages in store
      useStore.getState().updateSession(activeSessionId!, { messages });
      handleSendMessage(lastUserMsg.content, lastUserMsg.attachment);
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    const latestSessions = useStore.getState().sessions;
    const targetSession = latestSessions.find(s => s.id === activeSessionId);
    if (!targetSession) return;

    const msgIndex = targetSession.messages.findIndex(m => m.id === messageId);
    if (msgIndex !== -1) {
      const newMessages = [...targetSession.messages];
      newMessages[msgIndex] = { ...newMessages[msgIndex], content: newContent };
      
      // Truncate everything after this edited message so the conversation flows naturally from here
      const finalMessages = newMessages.slice(0, msgIndex + 1);
      
      // Update session in store
      useStore.getState().updateSession(activeSessionId!, { messages: finalMessages });

      // Trigger regeneration automatically for user edits
      const lastUser = finalMessages[finalMessages.length - 1];
      if (lastUser && lastUser.role === "user") {
        const prefixMessages = finalMessages.slice(0, -1);
        useStore.getState().updateSession(activeSessionId!, { messages: prefixMessages });
        handleSendMessage(lastUser.content, lastUser.attachment);
      }
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessageFromSession(activeSessionId!, messageId);
  };

  const handleStopGeneration = () => {
    setIsGenerating(false);
  };

  // Export handlers
  const handleExportMarkdown = () => {
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session) return;

    let md = `# Conversation Title: ${session.title}\n`;
    md += `*Generated in Premium AI Workspace*\n`;
    md += `*Engine: ${session.model}*\n`;
    md += `*Date: ${session.createdAt}*\n\n---\n\n`;

    session.messages.forEach(m => {
      md += `### ${m.role === "user" ? "USER" : "AI ASSISTANT"} (${m.timestamp})\n\n`;
      md += `${m.content}\n\n`;
      if (m.stats) {
        md += `*Stats: Latency: ${m.stats.responseTimeMs}ms | Tokens: ${m.stats.totalTokens} | Cost: $${m.stats.totalCost}*\n\n`;
      }
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, "_")}_export.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${session.title.replace(/\s+/g, "_")}_session.json`);
    dlAnchorElem.click();
  };

  const handleExportPDF = () => {
    window.print(); // Triggers standard print overlay elegantly formatted in high quality
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Check if sidebar should be shown
  const showSidebar = !location.pathname.startsWith('/settings') && 
                      !location.pathname.startsWith('/profile') && 
                      !location.pathname.startsWith('/subscription') &&
                      !location.pathname.startsWith('/notebooks');

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-gray-50 font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar navigation */}
      {showSidebar && (
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onTogglePin={handleTogglePin}
          onToggleFavorite={handleToggleFavorite}
          onOpenSettings={handleNavigateToSettings}
          onOpenExport={() => setIsExportOpen(true)}
          onNavigateToImages={handleNavigateToImages}
          onNavigateToLibrary={handleNavigateToLibrary}
          onNavigateToNotebooks={handleNavigateToNotebooks}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateToSubscription={handleNavigateToSubscription}
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Core Stage */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden relative" id="stage-panel">
        <div className="pointer-events-none absolute right-5 top-[18px] z-30 flex items-center gap-3">
          <button
            onClick={() => setIsPricingOpen(true)}
            className="pointer-events-auto flex h-10 items-center gap-2 rounded-full border border-sky-200/80 bg-white/80 px-4 text-[16px] font-semibold text-[#064b78] shadow-[0_8px_24px_rgba(14,116,144,0.14)] backdrop-blur-md transition hover:bg-sky-50 hover:shadow-[0_10px_28px_rgba(14,116,144,0.2)] cursor-pointer"
            title="Upgrade"
          >
            <NovaMark className="h-5 w-5 shrink-0" />
            <span>Upgrade</span>
          </button>
          <button
            onClick={handleNewChat}
            className="pointer-events-auto group relative grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            title="Turn on temporary chat"
          >
            <RefreshCw size={18} strokeWidth={2.2} className="transition group-hover:rotate-45" />
            <span className="pointer-events-none absolute right-0 top-12 hidden whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-lg group-hover:block">
              Turn on temporary chat
            </span>
          </button>
        </div>

        {/* Error Alert Overlay */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-4 z-40 max-w-lg mx-auto p-4 rounded-2xl bg-red-50/95 dark:bg-slate-900/95 border border-red-200 dark:border-red-900/40 shadow-xl backdrop-blur-md flex items-start gap-3"
            >
              <AlertCircle className="text-red-500 mt-0.5 shrink-0 animate-bounce" size={18} />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-red-800 dark:text-red-400 font-display">{errorMessage.type}</h4>
                <p className="text-[11px] text-red-700 dark:text-red-300/85 mt-1 leading-relaxed">{errorMessage.details}</p>
              </div>
              <button 
                onClick={() => setErrorMessage(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Routes>
          <Route path="/" element={
            activeSessionId && activeSession ? (
              <ChatView 
                session={activeSession}
                promptInput={promptInput}
                setPromptInput={setPromptInput}
                onSendMessage={handleSendMessage}
                onRegenerate={handleRegenerate}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                isGenerating={isGenerating}
                onStopGeneration={handleStopGeneration}
                isListening={isListening}
                onToggleListen={handleToggleListen}
                fontSize={fontSize}
              />
            ) : (
              <HomeView 
                promptInput={promptInput}
                setPromptInput={setPromptInput}
                onSendMessage={handleSendMessage}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                isListening={isListening}
                onToggleListen={handleToggleListen}
              />
            )
          } />
          <Route path="/chat/:id" element={
            activeSessionId && activeSession ? (
              <ChatView 
                session={activeSession}
                promptInput={promptInput}
                setPromptInput={setPromptInput}
                onSendMessage={handleSendMessage}
                onRegenerate={handleRegenerate}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                isGenerating={isGenerating}
                onStopGeneration={handleStopGeneration}
                isListening={isListening}
                onToggleListen={handleToggleListen}
                fontSize={fontSize}
              />
            ) : (
              <HomeView 
                promptInput={promptInput}
                setPromptInput={setPromptInput}
                onSendMessage={handleSendMessage}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                isListening={isListening}
                onToggleListen={handleToggleListen}
              />
            )
          } />
          <Route path="/images" element={
            <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
              <ImagesPage />
            </Suspense>
          } />
          <Route path="/library" element={
            <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
              <LibraryPage />
            </Suspense>
          } />
          <Route path="/notebooks" element={
            <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
              <NotebooksPage />
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
              <SettingsPage />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
              <ProfilePage />
            </Suspense>
          } />
          <Route path="/subscription" element={
            <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin" /></div>}>
              <SubscriptionPage />
            </Suspense>
          } />
        </Routes>
      </div>

      {/* Global Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            systemPrompt={systemPrompt}
            onChangeSystemPrompt={(p) => {
              setSystemPrompt(p);
            }}
            temperature={temperature}
            onChangeTemperature={setTemperature}
            maxTokens={maxTokens}
            onChangeMaxTokens={setMaxTokens}
            topP={topP}
            onChangeTopP={setTopP}
            streamingEnabled={streamingEnabled}
            onToggleStreaming={setStreamingEnabled}
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
            selectedLanguage={selectedLanguage}
            onChangeLanguage={setSelectedLanguage}
            user={user}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>

      {/* Export / Sharing Sheet Modal */}
      <AnimatePresence>
        {isExportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportOpen(false)}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-950 flex items-center justify-center text-blue-500 mx-auto">
                <Download size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 font-display">Export Conversation</h3>
                <p className="text-[11px] text-gray-400">Save your active sessions securely offline</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                <button
                  onClick={() => {
                    handleExportMarkdown();
                    setIsExportOpen(false);
                  }}
                  disabled={!activeSessionId}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-all text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <FileText size={14} className="text-blue-500" />
                    <span>Download Markdown (.md)</span>
                  </span>
                  <span className="text-[9px] font-mono text-gray-400">MD</span>
                </button>

                <button
                  onClick={() => {
                    handleExportJSON();
                    setIsExportOpen(false);
                  }}
                  disabled={!activeSessionId}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-all text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <Layers size={14} className="text-indigo-500" />
                    <span>Download Raw Data (.json)</span>
                  </span>
                  <span className="text-[9px] font-mono text-gray-400">JSON</span>
                </button>

                <button
                  onClick={() => {
                    handleExportPDF();
                    setIsExportOpen(false);
                  }}
                  disabled={!activeSessionId}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-all text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span>Print/Export to PDF</span>
                  </span>
                  <span className="text-[9px] font-mono text-gray-400">PDF</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} />
                    <span>{copiedLink ? "Copied!" : "Copy Work URL"}</span>
                  </span>
                  <span className="text-[9px] font-mono opacity-80">URL</span>
                </button>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setIsExportOpen(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onAuthSuccess={(userData) => setUser(userData)}
          />
        )}
      </AnimatePresence>

      {/* Pricing Modal */}
      <AnimatePresence>
        {isPricingOpen && (
          <PricingModal
            isOpen={isPricingOpen}
            onClose={() => setIsPricingOpen(false)}
            onSelectPlan={handleSelectPlan}
          />
        )}
      </AnimatePresence>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
