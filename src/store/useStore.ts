import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatSession, Message, ModelId } from '../types';

export interface Notebook {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface NotebookFolder {
  id: string;
  name: string;
  createdAt: string;
}

export interface StoredImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
  sessionId?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface AppState {
  // Chat sessions
  sessions: ChatSession[];
  activeSessionId: string | null;
  
  // Notebooks
  notebooks: Notebook[];
  notebookFolders: NotebookFolder[];
  activeNotebookId: string | null;
  
  // Images
  images: StoredImage[];
  
  // Toast notifications
  toasts: Toast[];
  
  // Sidebar state
  sidebarCollapsed: boolean;
  
  // Theme
  theme: 'light' | 'dark';
  
  // User preferences
  selectedModel: ModelId;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  streamingEnabled: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  selectedLanguage: string;
  
  // Actions
  setSessions: (sessions: ChatSession[]) => void;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  deleteSession: (id: string) => void;
  setActiveSessionId: (id: string | null) => void;
  
  setNotebooks: (notebooks: Notebook[]) => void;
  addNotebook: (notebook: Notebook) => void;
  updateNotebook: (id: string, updates: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;
  setActiveNotebookId: (id: string | null) => void;
  
  setNotebookFolders: (folders: NotebookFolder[]) => void;
  addNotebookFolder: (folder: NotebookFolder) => void;
  updateNotebookFolder: (id: string, updates: Partial<NotebookFolder>) => void;
  deleteNotebookFolder: (id: string) => void;
  
  setImages: (images: StoredImage[]) => void;
  addImage: (image: StoredImage) => void;
  deleteImage: (id: string) => void;
  
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  setTheme: (theme: 'light' | 'dark') => void;
  
  setSelectedModel: (model: ModelId) => void;
  setSystemPrompt: (prompt: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setTopP: (topP: number) => void;
  setStreamingEnabled: (enabled: boolean) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  setSelectedLanguage: (language: string) => void;
  
  // Utility actions
  addMessageToSession: (sessionId: string, message: Message) => void;
  updateMessageInSession: (sessionId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessageFromSession: (sessionId: string, messageId: string) => void;
  
  reset: () => void;
}

const INITIAL_SYSTEM_PROMPT = "You are Nova, a premium AI assistant with magnificent reasoning, coding, and writing abilities. Respond precisely with elegant markdown structures.";

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      sessions: [],
      activeSessionId: null,
      notebooks: [],
      notebookFolders: [],
      activeNotebookId: null,
      images: [],
      toasts: [],
      sidebarCollapsed: true,
      theme: 'light',
      selectedModel: 'gemini',
      systemPrompt: INITIAL_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      streamingEnabled: true,
      fontSize: 'md',
      selectedLanguage: 'English',
      
      // Session actions
      setSessions: (sessions) => set({ sessions }),
      addSession: (session) => set((state) => ({ sessions: [session, ...state.sessions] })),
      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
      })),
      deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter(s => s.id !== id),
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId
      })),
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      
      // Notebook actions
      setNotebooks: (notebooks) => set({ notebooks }),
      addNotebook: (notebook) => set((state) => ({ notebooks: [notebook, ...state.notebooks] })),
      updateNotebook: (id, updates) => set((state) => ({
        notebooks: state.notebooks.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)
      })),
      deleteNotebook: (id) => set((state) => ({
        notebooks: state.notebooks.filter(n => n.id !== id),
        activeNotebookId: state.activeNotebookId === id ? null : state.activeNotebookId
      })),
      setActiveNotebookId: (id) => set({ activeNotebookId: id }),
      
      // Notebook folder actions
      setNotebookFolders: (folders) => set({ notebookFolders: folders }),
      addNotebookFolder: (folder) => set((state) => ({ notebookFolders: [...state.notebookFolders, folder] })),
      updateNotebookFolder: (id, updates) => set((state) => ({
        notebookFolders: state.notebookFolders.map(f => f.id === id ? { ...f, ...updates } : f)
      })),
      deleteNotebookFolder: (id) => set((state) => ({
        notebookFolders: state.notebookFolders.filter(f => f.id !== id)
      })),
      
      // Image actions
      setImages: (images) => set({ images }),
      addImage: (image) => set((state) => ({ images: [image, ...state.images] })),
      deleteImage: (id) => set((state) => ({ images: state.images.filter(img => img.id !== id) })),
      
      // Toast actions
      addToast: (toast) => set((state) => ({
        toasts: [...state.toasts, { ...toast, id: `toast-${Date.now()}` }]
      })),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),
      
      // Sidebar actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Theme actions
      setTheme: (theme) => set({ theme }),
      
      // Preference actions
      setSelectedModel: (model) => set({ selectedModel: model }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setTemperature: (temp) => set({ temperature: temp }),
      setMaxTokens: (tokens) => set({ maxTokens: tokens }),
      setTopP: (topP) => set({ topP }),
      setStreamingEnabled: (enabled) => set({ streamingEnabled: enabled }),
      setFontSize: (size) => set({ fontSize: size }),
      setSelectedLanguage: (language) => set({ selectedLanguage: language }),
      
      // Utility actions
      addMessageToSession: (sessionId, message) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId 
            ? { ...s, messages: [...s.messages, message], updatedAt: new Date().toISOString() }
            : s
        )
      })),
      updateMessageInSession: (sessionId, messageId, updates) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId 
            ? {
                ...s,
                messages: s.messages.map(m => m.id === messageId ? { ...m, ...updates } : m),
                updatedAt: new Date().toISOString()
              }
            : s
        )
      })),
      deleteMessageFromSession: (sessionId, messageId) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId 
            ? { ...s, messages: s.messages.filter(m => m.id !== messageId), updatedAt: new Date().toISOString() }
            : s
        )
      })),
      
      reset: () => set({
        sessions: [],
        activeSessionId: null,
        notebooks: [],
        notebookFolders: [],
        activeNotebookId: null,
        images: [],
        toasts: [],
        sidebarCollapsed: true,
        theme: 'light',
        selectedModel: 'gemini',
        systemPrompt: INITIAL_SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        streamingEnabled: true,
        fontSize: 'md',
        selectedLanguage: 'English',
      }),
    }),
    {
      name: 'nova-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        notebooks: state.notebooks,
        notebookFolders: state.notebookFolders,
        activeNotebookId: state.activeNotebookId,
        images: state.images,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        selectedModel: state.selectedModel,
        systemPrompt: state.systemPrompt,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        topP: state.topP,
        streamingEnabled: state.streamingEnabled,
        fontSize: state.fontSize,
        selectedLanguage: state.selectedLanguage,
      }),
    }
  )
);
