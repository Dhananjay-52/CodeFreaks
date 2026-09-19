import {
  Plus,
  Settings,
  UserCircle,
  Bell,
  MessageSquare,
  Trash2,
  LogOut,
  Database,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

function WorkspaceLayout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    chats,
    activeChatId,
    selectChat,
    createNewChat,
    deleteChatSession,
    loadingChats,
  } = useChat();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get user initials
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CF";

  return (
    <div className="flex h-screen max-h-screen w-screen overflow-hidden bg-[#080C11] text-white">
      {/* SIDEBAR */}
      <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#202934] bg-[#0B1016]">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-[#202934] px-6">
          <Logo />
        </div>

        {/* New Chat Button */}
        <div className="shrink-0 p-3">
          <button
            type="button"
            onClick={createNewChat}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#151C24] px-3.5 py-2.5 text-sm font-medium text-gray-200 shadow-sm transition hover:bg-[#1C2530] active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <Plus size={16} className="text-gray-400" />
              <span>New Chat</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">⌘N</span>
          </button>
        </div>

        {/* Old Chats Header & Scroll Window */}
        <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <div className="flex items-center gap-1.5">
            <Database size={12} className="text-gray-600" />
            <span>Saved Chats</span>
          </div>
          <span className="rounded-full bg-[#16202c] px-1.5 py-0.2 text-[10px] text-gray-400">
            {chats.length}
          </span>
        </div>

        {/* Dedicated Sidebar Scroll Window */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-1 space-y-1">
          {loadingChats && chats.length === 0 && (
            <div className="py-6 text-center text-xs text-gray-600">
              Loading chat history...
            </div>
          )}

          {!loadingChats && chats.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#1c2736] p-4 text-center text-xs text-gray-600">
              No previous chats yet. Start asking questions to save!
            </div>
          )}

          {chats.map((c) => {
            const isActive = activeChatId === c.chat_id;
            return (
              <div
                key={c.chat_id}
                onClick={() => selectChat(c.chat_id)}
                className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                  isActive
                    ? "bg-[#182330] text-sky-200 font-medium border border-sky-500/20 shadow-sm"
                    : "text-gray-400 hover:bg-[#111822] hover:text-gray-200"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5 flex-1 pr-1">
                  <MessageSquare
                    size={14}
                    className={`shrink-0 ${
                      isActive ? "text-sky-400" : "text-gray-600 group-hover:text-gray-400"
                    }`}
                  />
                  <span className="truncate">
                    {c.title || "Untitled Chat"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChatSession(c.chat_id);
                  }}
                  className="shrink-0 p-1 opacity-0 text-gray-600 transition hover:text-red-400 group-hover:opacity-100"
                  title="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation & User Profile */}
        <div className="shrink-0 border-t border-[#202934] p-3 bg-[#0B1016]">
          {/* User Profile Card */}
          <div className="flex items-center justify-between rounded-xl bg-[#0E141B] p-2.5 border border-[#1b2532]">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 text-xs font-semibold text-white shadow-sm">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-200">
                  {user?.name || "Guest User"}
                </p>
                <p className="truncate text-[10px] text-gray-500">
                  {user?.workspace_name || "Sovereign Workspace"}
                </p>
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-[#17202b] hover:text-red-400"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded px-2 py-1 text-[11px] font-medium text-sky-400 hover:text-sky-300"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
        {/* FIXED TOP BAR */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#202934] bg-[#0B1016] px-6 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
              Workspace
            </span>
            <span className="text-gray-700">/</span>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
              <Sparkles size={13} className="text-sky-400" />
              <span>{user?.workspace_name || "Core AI Workspace"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative rounded-lg p-2 text-gray-500 transition hover:bg-[#111820] hover:text-gray-200"
              title="Notifications"
            >
              <Bell size={17} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            </button>
          </div>
        </header>

        {/* FIXED PAGE WRAPPER */}
        <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col relative bg-[#080C11]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default WorkspaceLayout;