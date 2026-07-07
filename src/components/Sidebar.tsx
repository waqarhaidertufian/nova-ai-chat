import React, { useState, useCallback, useEffect } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Image,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  SquarePen,
  LogIn,
  LogOut,
  X,
  Clock,
  User,
  Moon,
  Sun,
  MoreVertical,
  Edit,
  Trash2,
  Folder,
  ChevronDown,
  GripVertical
} from "lucide-react";
import { ChatSession } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store/useStore";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onNavigateToImages?: () => void;
  onNavigateToLibrary?: () => void;
  onNavigateToNotebooks?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSubscription?: () => void;
  user?: any;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  userEmail?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const defaultRecents = [
  "Nova API Limits Aur Paid Tier",
  "Private Contributions Ko Profile Par Loc...",
  "GitHub Contributions Ko Control Karna",
  "GitHub Activity Overview Graph Enable",
  "MediScan Repository Name Suggestions",
  "GitHub Profile Enhancement For AI Eng...",
  "Website Open Nahi Ho Rahi",
  "WhatsApp Link Update Issue Resolution",
  "WhatsApp About Link Kaise Change Ka..."
];

const NAV_ICON_SIZE = 18;

function NovaLogo() {
  return (
    <svg
      aria-label="Nova"
      className="h-6 w-6 shrink-0"
      viewBox="0 0 40 40"
      role="img"
    >
      <defs>
        <linearGradient id="novaLogoBlueGreen" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4285f4" />
          <stop offset="0.48" stopColor="#34a853" />
          <stop offset="1" stopColor="#1a73e8" />
        </linearGradient>
        <linearGradient id="novaLogoRedYellow" x1="8" y1="31" x2="29" y2="7" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbc04" />
          <stop offset="0.44" stopColor="#ea4335" />
          <stop offset="1" stopColor="#4285f4" />
        </linearGradient>
      </defs>
      <path
        d="M21.3 4.9c.5-1.6 2.9-1.6 3.4 0l1.8 6.2c.2.6.7 1.1 1.3 1.3l6.2 1.8c1.6.5 1.6 2.9 0 3.4l-6.2 1.8c-.6.2-1.1.7-1.3 1.3l-1.8 6.2c-.5 1.6-2.9 1.6-3.4 0l-1.8-6.2c-.2-.6-.7-1.1-1.3-1.3L12 17.6c-1.6-.5-1.6-2.9 0-3.4l6.2-1.8c.6-.2 1.1-.7 1.3-1.3l1.8-6.2Z"
        fill="url(#novaLogoBlueGreen)"
      />
      <path
        d="M8.3 21.7c.3-1 1.8-1 2.1 0l.9 3.1c.1.4.4.7.8.8l3.1.9c1 .3 1 1.8 0 2.1l-3.1.9c-.4.1-.7.4-.8.8l-.9 3.1c-.3 1-1.8 1-2.1 0l-.9-3.1c-.1-.4-.4-.7-.8-.8l-3.1-.9c-1-.3-1-1.8 0-2.1l3.1-.9c.4-.1.7-.4.8-.8l.9-3.1Z"
        fill="url(#novaLogoRedYellow)"
      />
    </svg>
  );
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onOpenSettings,
  onNavigateToImages,
  onNavigateToLibrary,
  onNavigateToNotebooks,
  onNavigateToProfile,
  onNavigateToSubscription,
  user,
  onOpenAuth,
  onLogout,
  userEmail = "Waqar Haider",
  isCollapsed: externalCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setIsCollapsed = onToggleCollapse || setInternalCollapsed;
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Theme toggle
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  
  // Notebook state
  const notebooks = useStore((state) => state.notebooks);
  const notebookFolders = useStore((state) => state.notebookFolders);
  const activeNotebookId = useStore((state) => state.activeNotebookId);
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; notebookId: string } | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Cmd/Ctrl + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsCollapsed(!isCollapsed);
      }
      // Escape to close search or context menu
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery('');
        }
        if (contextMenu) {
          setContextMenu(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isCollapsed, setIsCollapsed, contextMenu]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const toggleNotebookExpand = (notebookId: string) => {
    setExpandedNotebooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notebookId)) {
        newSet.delete(notebookId);
      } else {
        newSet.add(notebookId);
      }
      return newSet;
    });
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleNotebookDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = notebooks.findIndex((nb) => nb.id === active.id);
      const newIndex = notebooks.findIndex((nb) => nb.id === over.id);
      const reordered = arrayMove(notebooks, oldIndex, newIndex);
      useStore.getState().setNotebooks(reordered);
    }
  };

  // Sortable notebook item component
  function SortableNotebookItem({ notebook }: { notebook: any }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: notebook.id });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <button
          onClick={() => {
            onNavigateToNotebooks?.();
            useStore.getState().setActiveNotebookId(notebook.id);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, notebookId: notebook.id });
          }}
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm ${
            activeNotebookId === notebook.id
              ? 'bg-blue-50 text-blue-700'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" {...listeners} />
          <BookOpen className="h-4 w-4" />
          <span className="flex-1 text-left truncate">{notebook.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu({ x: e.clientX, y: e.clientY, notebookId: notebook.id });
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </button>
      </div>
    );
  }

  // Filter sessions based on search
  const filteredSessions = sessions.filter(session => {
    if (!debouncedQuery) return true;
    const query = debouncedQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      session.messages.some(msg => msg.content.toLowerCase().includes(query))
    );
  });

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
  };

  const displayName = user?.email || user?.user_metadata?.full_name || userEmail;

  const recents = sessions.length > 0
    ? sessions.slice(0, 10).map(session => ({ 
        id: session.id, 
        title: session.title,
        preview: session.messages[session.messages.length - 1]?.content?.substring(0, 50) || 'No messages',
        timestamp: session.updatedAt,
        messageCount: session.messages.length
      }))
    : defaultRecents.map((title, index) => ({ id: `demo-${index}`, title, preview: '', timestamp: new Date().toISOString(), messageCount: 0 }));

  const navItems = [
    { label: "New chat", icon: SquarePen, action: onNewChat, active: true },
    { label: "Search chats", icon: Search, action: () => setIsSearchOpen(!isSearchOpen) },
    { label: "Images", icon: Image, action: onNavigateToImages },
    { label: "Library", icon: LayoutGrid, action: onNavigateToLibrary }
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 56 : 280 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative z-20 flex h-screen shrink-0 flex-col border-r border-slate-100 bg-white/78 text-black backdrop-blur-xl"
      id="sidebar-container"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={`flex h-[64px] items-center ${isCollapsed ? "justify-center" : "justify-between px-3.5"}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <NovaLogo />
          {!isCollapsed && <span className="truncate text-[20px] font-semibold tracking-normal">Nova</span>}
        </div>

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-black transition hover:bg-slate-200"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <ChevronLeft size={19} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute left-2 top-[74px] grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-black transition hover:bg-slate-200"
          title="Open sidebar"
          aria-label="Open sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <nav className={`mt-1 flex flex-col gap-1 ${isCollapsed ? "items-center px-1.5 pt-14" : "px-1.5"}`}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              onClick={item.action}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex h-9 items-center gap-3 rounded-full text-[14px] font-semibold transition ${
                isCollapsed
                  ? "w-9 justify-center"
                  : `w-full px-3.5 ${item.active ? "bg-[#efeded]" : "hover:bg-slate-100"}`
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={NAV_ICON_SIZE} strokeWidth={2} className="text-slate-700" aria-hidden="true" />
              {!isCollapsed && <span className="text-slate-700">{item.label}</span>}
            </motion.button>
          );
        })}
      </nav>

      {/* Search Panel */}
      <AnimatePresence>
        {isSearchOpen && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3.5 py-2"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
                aria-label="Search chats"
                role="searchbox"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {debouncedQuery && (
              <div className="mt-2 max-h-48 overflow-y-auto">
                {filteredSessions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No chats found</p>
                ) : (
                  filteredSessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        activeSessionId === session.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: highlightText(session.title, debouncedQuery) 
                        }}
                      />
                    </button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isCollapsed && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pt-7">
          <section>
            <h2 className="mb-3 text-[14px] font-normal text-[#5f6368]">Notebooks</h2>
            <button 
              onClick={onNavigateToNotebooks}
              className="mb-3 flex h-7 items-center gap-3 text-[14px] transition hover:text-sky-700"
            >
              <Plus size={18} />
              <span>New notebook</span>
            </button>
            
            {/* Folders */}
            {notebookFolders.length > 0 && (
              <div className="space-y-1 mb-3">
                {notebookFolders.map(folder => (
                  <div key={folder.id}>
                    <button
                      onClick={() => toggleFolderExpand(folder.id)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-gray-100 text-sm text-gray-700"
                    >
                      {expandedFolders.has(folder.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Folder className="h-4 w-4" />
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                    </button>
                    {expandedFolders.has(folder.id) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {notebooks.filter(nb => nb.folderId === folder.id).map(notebook => (
                          <SortableNotebookItem key={notebook.id} notebook={notebook} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Notebooks without folder */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNotebookDragEnd}>
              <SortableContext items={notebooks.filter(nb => !nb.folderId).map(nb => nb.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {notebooks.filter(nb => !nb.folderId).map(notebook => (
                    <SortableNotebookItem key={notebook.id} notebook={notebook} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            <button 
              onClick={onNavigateToNotebooks}
              className="mt-2 flex h-7 items-center gap-3 text-[14px] transition hover:text-sky-700"
            >
              <BookOpen size={18} />
              <span>View all notebooks</span>
            </button>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-[14px] font-normal text-[#5f6368]">Recents</h2>
            <div className="space-y-2">
              {recents.map((item, index) => {
                const isRealSession = !item.id.startsWith("demo-");
                const isActive = activeSessionId === item.id;
                const timeAgo = new Date(item.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });
                
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.02, backgroundColor: isActive ? '#dbeafe' : '#f3f4f6' }}
                    onClick={() => {
                      if (isRealSession) onSelectSession(item.id);
                    }}
                    className={`block w-full text-left rounded-lg p-2 transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    title={item.title}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium truncate">{item.title}</p>
                        {item.preview && (
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{item.preview}</p>
                        )}
                      </div>
                      {item.messageCount > 0 && (
                        <span className="text-[10px] text-gray-400 shrink-0">{item.messageCount}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400">{timeAgo}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const notebook = notebooks.find(nb => nb.id === contextMenu?.notebookId);
                if (notebook) {
                  const newTitle = prompt('Enter new title:', notebook.title);
                  if (newTitle) {
                    useStore.getState().updateNotebook(contextMenu.notebookId, { title: newTitle });
                  }
                }
                setContextMenu(null);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4" />
              Rename
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this notebook?')) {
                  useStore.getState().deleteNotebook(contextMenu.notebookId);
                }
                setContextMenu(null);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`mt-auto flex items-center ${isCollapsed ? "flex-col gap-6 px-1.5 pb-4" : "justify-between px-3.5 py-4"}`}>
        {isCollapsed ? (
          <>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-slate-100"
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={onNavigateToProfile}
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-slate-100"
              title="Profile"
            >
              <User size={18} />
            </button>
            <button
              onClick={onOpenSettings}
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-slate-100"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            {user ? (
              <button
                onClick={onLogout}
                className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-slate-100"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-slate-100"
                title="Login"
              >
                <LogIn size={18} />
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="profile-avatar grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-white shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-[13px] font-medium">{displayName}</span>
                <span className="text-[10px] font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Free Plan</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-slate-100"
                title={theme === 'light' ? 'Dark mode' : 'Light mode'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button
                onClick={onNavigateToProfile}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-slate-100"
                title="Profile"
              >
                <User size={18} />
              </button>
              <button
                onClick={onNavigateToSubscription}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-slate-100"
                title="Subscription"
              >
                <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">⭐</span>
              </button>
              {user ? (
                <button
                  onClick={onLogout}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-slate-100"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-slate-100"
                  title="Login"
                >
                  <LogIn size={18} />
                </button>
              )}
              <button
                onClick={onOpenSettings}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-slate-100"
                title="Settings"
              >
                <Settings size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </motion.aside>
  );
}
