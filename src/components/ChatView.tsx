import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Paperclip,
  Mic,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Trash2,
  X,
  Clock,
  Cpu,
  Bookmark,
  ChevronDown,
  Pencil
} from "lucide-react";
import { ChatSession, Message, ModelId, ModelConfig } from "../types";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";

interface ChatViewProps {
  session: ChatSession;
  onSendMessage: (content: string, attachment?: any) => void;
  onRegenerate: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
  isListening?: boolean;
  onToggleListen?: () => void;
  fontSize?: "sm" | "md" | "lg";
}

const MODELS: ModelConfig[] = [
  { id: "gemini", name: "Nova Flash", provider: "Nova", badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20", description: "", simulatedCostPer1kInput: 0.000075, simulatedCostPer1kOutput: 0.0003 },
  { id: "gpt5", name: "GPT-5 Omni", provider: "OpenAI", badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", description: "", simulatedCostPer1kInput: 0.005, simulatedCostPer1kOutput: 0.015 },
  { id: "gpt4", name: "GPT-4.1 Turbo", provider: "OpenAI", badgeColor: "bg-teal-500/10 text-teal-500 border-teal-500/20", description: "", simulatedCostPer1kInput: 0.01, simulatedCostPer1kOutput: 0.03 },
  { id: "claude", name: "Claude 3.5 Sonnet", provider: "Anthropic", badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20", description: "", simulatedCostPer1kInput: 0.003, simulatedCostPer1kOutput: 0.015 },
  { id: "deepseek", name: "DeepSeek R1", provider: "DeepSeek", badgeColor: "bg-violet-500/10 text-violet-500 border-violet-500/20", description: "", simulatedCostPer1kInput: 0.00014, simulatedCostPer1kOutput: 0.00028 },
  { id: "llama", name: "Llama 3.3 70B", provider: "Meta", badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", description: "", simulatedCostPer1kInput: 0.0005, simulatedCostPer1kOutput: 0.001 },
  { id: "mistral", name: "Mistral Large 2", provider: "Mistral", badgeColor: "bg-orange-500/10 text-orange-500 border-orange-500/20", description: "", simulatedCostPer1kInput: 0.002, simulatedCostPer1kOutput: 0.006 },
  { id: "qwen", name: "Qwen 2.5 Max", provider: "Alibaba", badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20", description: "", simulatedCostPer1kInput: 0.001, simulatedCostPer1kOutput: 0.003 },
];

function NovaChatLogo({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      aria-label="Nova"
      className={`h-7 w-7 shrink-0 ${spinning ? "animate-spin" : ""}`}
      viewBox="0 0 40 40"
      role="img"
    >
      <defs>
        <linearGradient id="novaChatBlueGreen" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4285f4" />
          <stop offset="0.48" stopColor="#34a853" />
          <stop offset="1" stopColor="#1a73e8" />
        </linearGradient>
        <linearGradient id="novaChatRedYellow" x1="8" y1="31" x2="29" y2="7" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbc04" />
          <stop offset="0.44" stopColor="#ea4335" />
          <stop offset="1" stopColor="#4285f4" />
        </linearGradient>
      </defs>
      <path
        d="M21.3 4.9c.5-1.6 2.9-1.6 3.4 0l1.8 6.2c.2.6.7 1.1 1.3 1.3l6.2 1.8c1.6.5 1.6 2.9 0 3.4l-6.2 1.8c-.6.2-1.1.7-1.3 1.3l-1.8 6.2c-.5 1.6-2.9 1.6-3.4 0l-1.8-6.2c-.2-.6-.7-1.1-1.3-1.3L12 17.6c-1.6-.5-1.6-2.9 0-3.4l6.2-1.8c.6-.2 1.1-.7 1.3-1.3l1.8-6.2Z"
        fill="url(#novaChatBlueGreen)"
      />
      <path
        d="M8.3 21.7c.3-1 1.8-1 2.1 0l.9 3.1c.1.4.4.7.8.8l3.1.9c1 .3 1 1.8 0 2.1l-3.1.9c-.4.1-.7.4-.8.8l-.9 3.1c-.3 1-1.8 1-2.1 0l-.9-3.1c-.1-.4-.4-.7-.8-.8l-3.1-.9c-1-.3-1-1.8 0-2.1l3.1-.9c.4-.1.7-.4.8-.8l.9-3.1Z"
        fill="url(#novaChatRedYellow)"
      />
    </svg>
  );
}

export default function ChatView({
  session,
  onSendMessage,
  onRegenerate,
  onEditMessage,
  onDeleteMessage,
  isGenerating,
  onStopGeneration,
  isListening = false,
  onToggleListen,
  fontSize = "md"
}: ChatViewProps) {
  const [promptInput, setPromptInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{ name: string; type: string; size: number; base64?: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeModel = MODELS.find(m => m.id === session.model) || MODELS[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isGenerating]);

  // Clean speaking on component unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSend = () => {
    if (!promptInput.trim() && !attachment) return;
    onSendMessage(promptInput.trim(), attachment);
    setPromptInput("");
    setAttachment(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSpeak = (text: string, messageId: string) => {
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_\-]/g, ''));
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingMessageId(messageId);
    }
  };

  const handleEditSave = (id: string) => {
    if (editContent.trim()) {
      onEditMessage(id, editContent.trim());
    }
    setEditingMessageId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        setAttachment({
          name: file.name,
          type: file.type || "text/plain",
          size: file.size,
          base64: base64String
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        setAttachment({
          name: file.name,
          type: file.type || "text/plain",
          size: file.size,
          base64: base64String
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const fontSizeClass = {
    sm: "text-xs md:text-sm",
    md: "text-sm md:text-base",
    lg: "text-base md:text-lg"
  }[fontSize];

  return (
    <div 
      className={`flex-1 flex flex-col justify-between overflow-hidden relative h-full bg-white dark:bg-slate-950 ${isDragOver ? 'border-2 border-dashed border-blue-500 bg-blue-50/10' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      id="chat-view-container"
    >
      {/* File Upload Dropoverlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 pointer-events-none"
          >
            <Sparkles size={48} className="animate-bounce mb-3" />
            <p className="font-display font-semibold text-xl">Drop files to upload context</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message History Scroller */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        {session.messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3.5 max-w-3xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar Column (Assistant side) */}
                {!isUser && (
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
                    <NovaChatLogo />
                  </div>
                )}

                {/* Content Block */}
                <div className={`flex flex-col gap-1.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Floating action bar (only for user messages, on hover) */}
                  {isUser && (
                    <div
                      onMouseEnter={() => setHoveredMessageId(msg.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                      className={`flex items-center gap-2 mb-1 transition-opacity duration-200 ${hoveredMessageId === msg.id ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        title="Copy message"
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        {copiedMessageId === msg.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </button>

                      <button
                        onClick={() => onEditMessage(msg.id, msg.content)}
                        title="Edit message"
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}

                  {/* User File attachment details */}
                  {isUser && msg.attachment && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-800/80 max-w-xs mb-1">
                      <Bookmark size={14} className="text-blue-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200 truncate leading-snug">{msg.attachment.name}</p>
                        <p className="text-[9px] text-gray-400 leading-none">{(msg.attachment.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  )}

                  {/* Message Bubble Card */}
                  <div
                    className={`${
                      isUser
                        ? 'rounded-2xl p-4 shadow-sm border bg-[#f1f0ee] border-[#f1f0ee] text-[#1f1f1f] shadow-gray-200/40 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-100'
                        : 'bg-transparent border-none shadow-none p-0 text-gray-800 dark:text-gray-100'
                    } ${fontSizeClass}`}
                  >
                    {isUser && editingMessageId === msg.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-1.5 justify-end">
                          <button 
                            onClick={() => handleEditSave(msg.id)}
                            className="px-2.5 py-1 rounded bg-green-500 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingMessageId(null)}
                            className="px-2.5 py-1 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-[10px] font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="markdown-body">
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <Markdown>{msg.content}</Markdown>
                        )}
                      </div>
                    )}
                  </div>

                  {!isUser && !isGenerating && (
                    <div className="flex items-center gap-3.5 mt-1 px-1 text-[10px] text-gray-400 font-mono">
                      <span>{msg.timestamp}</span>

                      {msg.stats && (
                        <div className="flex flex-wrap items-center gap-3 text-gray-400 dark:text-gray-500 border-l border-gray-100 dark:border-slate-800/80 pl-3">
                          <span className="flex items-center gap-1">
                            <Cpu size={10} />
                            {msg.stats.totalTokens} tokens
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          title="Copy message"
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer transition-colors"
                        >
                          {copiedMessageId === msg.id ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                        </button>

                        <button
                          onClick={() => handleSpeak(msg.content, msg.id)}
                          title={speakingMessageId === msg.id ? "Stop Narration" : "Read Aloud"}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
                        >
                          {speakingMessageId === msg.id ? <VolumeX size={11} className="text-red-500" /> : <Volume2 size={11} />}
                        </button>

                        {index === session.messages.length - 1 && (
                          <button
                            onClick={onRegenerate}
                            title="Regenerate reply"
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
                          >
                            <RotateCcw size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            );
          })}

        {/* Generative typing placeholder */}
        {isGenerating && (
          <div className="flex gap-3.5 max-w-3xl mx-auto justify-start">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
              <NovaChatLogo spinning />
            </div>
            <div className="flex flex-col gap-1.5 max-w-[85%] items-start">
              <div className="rounded-xl p-2 border border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-900/40 text-gray-800 dark:text-gray-200">
                <div className="flex items-center gap-1 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 typing-dot"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 typing-dot [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 typing-dot [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Prompt Input Panel */}
      <div className="px-4 md:px-8 bg-gray-50/10 dark:bg-slate-950/20 relative z-20">
        <div className="max-w-3xl w-full mx-auto pb-4">
          {/* Active file attachments overlay */}
          <AnimatePresence>
            {attachment && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-between p-2 rounded-xl bg-blue-50/70 dark:bg-slate-900 border border-blue-200/40 dark:border-slate-800 mb-2 max-w-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <Bookmark size={14} className="text-blue-500 shrink-0" />
                  <div className="truncate">
                    <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200 truncate leading-snug">{attachment.name}</p>
                    <p className="text-[9px] text-gray-400 leading-none">{(attachment.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500 cursor-pointer p-1">
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form wrapper */}
          <div className="nova-input-glow relative rounded-2xl shadow-lg transition-all">
            <textarea
              rows={1}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask Nova"
              className="w-full resize-none bg-transparent py-3 pl-4 pr-32 text-xs md:text-sm text-gray-800 dark:text-gray-100 focus:outline-none rounded-2xl"
            />

            {/* In-bar actions */}
            <div className="absolute right-3 bottom-2 flex items-center gap-2">
              <label className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-all">
                <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".pdf, .docx, .txt, .md, image/*"
                />
                <Paperclip size={14} />
              </label>

              {onToggleListen && (
                <button
                  onClick={onToggleListen}
                  title={isListening ? "Listening... Click to stop" : "Voice Input"}
                  className={`p-1.5 rounded-full cursor-pointer transition-all ${
                    isListening 
                      ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                      : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Mic size={14} />
                </button>
              )}

              <button
                onClick={handleSend}
                disabled={!promptInput.trim() && !attachment}
                className={`p-2 rounded-full text-white cursor-pointer transition-all ${
                  (promptInput.trim() || attachment)
                    ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                    : "bg-gray-150 dark:bg-slate-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                }`}
              >
                <Send size={12} />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-gray-900 dark:text-gray-100 font-medium mt-3">
            Nova is AI and can make mistakes.
          </p>
        </div>
      </div>
    </div>
  );
}
