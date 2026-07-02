import React, { useState } from "react";
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
  LogOut
} from "lucide-react";
import { ChatSession } from "../types";
import { motion } from "motion/react";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  user?: any;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  userEmail?: string;
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
  user,
  onOpenAuth,
  onLogout,
  userEmail = "Waqar Haider"
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || userEmail;

  const recents = sessions.length > 0
    ? sessions.slice(0, 10).map(session => ({ id: session.id, title: session.title }))
    : defaultRecents.map((title, index) => ({ id: `demo-${index}`, title }));

  const navItems = [
    { label: "New chat", icon: SquarePen, action: onNewChat, active: true },
    { label: "Search chats", icon: Search },
    { label: "Images", icon: Image },
    { label: "Library", icon: LayoutGrid }
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 56 : 280 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative z-20 flex h-screen shrink-0 flex-col border-r border-slate-100 bg-white/78 text-black backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-100"
      id="sidebar-container"
    >
      <div className={`flex h-[64px] items-center ${isCollapsed ? "justify-center" : "justify-between px-3.5"}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <NovaLogo />
          {!isCollapsed && <span className="truncate text-[20px] font-semibold tracking-normal">Nova</span>}
        </div>

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-black transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
          className="absolute left-2 top-[74px] grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-black transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          title="Open sidebar"
          aria-label="Open sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <nav className={`mt-1 flex flex-col gap-1 ${isCollapsed ? "items-center px-1.5 pt-14" : "px-1.5"}`}>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className={`flex h-9 items-center gap-3 rounded-full text-[14px] font-semibold transition ${
                isCollapsed
                  ? "w-9 justify-center"
                  : `w-full px-3.5 ${item.active ? "bg-[#efeded]" : "hover:bg-slate-100 dark:hover:bg-slate-900"}`
              }`}
              title={item.label}
            >
              <Icon size={NAV_ICON_SIZE} strokeWidth={2} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pt-7">
          <section>
            <h2 className="mb-3 text-[14px] font-normal text-[#5f6368] dark:text-slate-400">Notebooks</h2>
            <button className="mb-3 flex h-7 items-center gap-3 text-[14px] transition hover:text-sky-700">
              <Plus size={18} />
              <span>New notebook</span>
            </button>
            <button className="flex h-7 items-center gap-3 text-[14px] transition hover:text-sky-700">
              <BookOpen size={18} />
              <span>Untitled notebook</span>
            </button>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-[14px] font-normal text-[#5f6368] dark:text-slate-400">Recents</h2>
            <div className="space-y-3">
              {recents.map(item => {
                const isRealSession = !item.id.startsWith("demo-");
                const isActive = activeSessionId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isRealSession) onSelectSession(item.id);
                    }}
                    className={`block w-full truncate rounded-md text-left text-[14px] font-medium transition ${
                      isActive
                        ? "text-sky-700"
                        : "text-black hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300"
                    }`}
                    title={item.title}
                  >
                    {item.title}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <div className={`mt-auto flex items-center ${isCollapsed ? "flex-col gap-6 px-1.5 pb-4" : "justify-between px-3.5 py-4"}`}>
        {isCollapsed ? (
          <>
            <button
              onClick={onOpenSettings}
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-slate-100 dark:hover:bg-slate-900"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            {user ? (
              <button
                onClick={onLogout}
                className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-slate-100 dark:hover:bg-slate-900"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-slate-100 dark:hover:bg-slate-900"
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
              <span className="truncate text-[16px] font-medium">{displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <button
                  onClick={onLogout}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-slate-100 dark:hover:bg-slate-900"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-slate-100 dark:hover:bg-slate-900"
                  title="Login"
                >
                  <LogIn size={18} />
                </button>
              )}
              <button
                onClick={onOpenSettings}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-slate-100 dark:hover:bg-slate-900"
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
