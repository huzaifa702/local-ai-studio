import React, { useState } from 'react';
import { 
  SquarePen, 
  Search, 
  Pin, 
  Trash2, 
  Edit2, 
  FolderGit2, 
  Brain, 
  Cpu, 
  Check, 
  X, 
  Settings as SettingsIcon,
  PanelLeftClose,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { Conversation } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    conversations,
    activeConversationId,
    selectConversation,
    createNewChat,
    updateConversationTitle,
    togglePinConversation,
    deleteConversation,
    searchQuery,
    setSearchQuery,
    user,
    setActiveModal,
    logout
  } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const pinned = conversations.filter(c => Boolean(c.is_pinned) && !Boolean(c.is_archived));
  const unpinned = conversations.filter(c => !Boolean(c.is_pinned) && !Boolean(c.is_archived));

  const startRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      updateConversationTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-30 flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] transition-all duration-200 select-none ${
        sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden border-none'
      }`}
    >
      {/* Sidebar Top Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)] px-2">
          <span>ChatGPT</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => createNewChat()}
            className="p-2 rounded-lg text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
            title="New chat"
          >
            <SquarePen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ONLY Real, Functional Navigation Features */}
      <div className="px-2 space-y-0.5">
        <button
          onClick={() => createNewChat()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer"
        >
          <SquarePen className="w-4 h-4 text-[var(--text-sub)]" />
          <span>New chat</span>
        </button>

        <button
          onClick={() => setActiveModal('projects')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer"
        >
          <FolderGit2 className="w-4 h-4 text-[var(--text-sub)]" />
          <span>Projects</span>
        </button>

        <button
          onClick={() => setActiveModal('models')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer"
        >
          <Cpu className="w-4 h-4 text-[var(--text-sub)]" />
          <span>Models Hub</span>
        </button>

        <button
          onClick={() => setActiveModal('memory')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer"
        >
          <Brain className="w-4 h-4 text-[var(--text-sub)]" />
          <span>Memory & Context</span>
        </button>

        <button
          onClick={() => setActiveModal('settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer"
        >
          <SettingsIcon className="w-4 h-4 text-[var(--text-sub)]" />
          <span>Settings</span>
        </button>
      </div>

      {/* Real Search Input */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[var(--bg-sidebar-hover)] border border-transparent focus:border-[var(--border-input)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
          />
        </div>
      </div>

      {/* Recents Chat List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 text-xs">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
          Recents
        </div>

        {/* Pinned */}
        {pinned.map((c) => renderConversationRow(c, true))}

        {/* Unpinned */}
        {unpinned.map((c) => renderConversationRow(c, false))}

        {conversations.length === 0 && (
          <div className="text-center py-6 text-[var(--text-muted)] text-xs">
            No previous chats
          </div>
        )}
      </div>

      {/* Real User Profile Footer */}
      <div className="p-2 border-t border-[var(--border-sidebar)] relative">
        {/* Profile Action Menu Popup */}
        {profileMenuOpen && (
          <div className="absolute bottom-16 left-2 right-2 p-1.5 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl shadow-2xl space-y-1 z-40 text-xs animate-in fade-in slide-in-from-bottom-2">
            <div className="px-3 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-semibold text-[var(--text-primary)] truncate">
                  {user?.displayName || user?.username || 'Huzaifa Rajput'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  {user?.email || 'Local Account'}
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                Active
              </span>
            </div>
            
            <button
              onClick={() => {
                setProfileMenuOpen(false);
                setActiveModal('auth');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer text-left font-medium"
            >
              <User className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Sign In / Switch Account</span>
            </button>

            <button
              onClick={() => {
                setProfileMenuOpen(false);
                setActiveModal('settings');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer text-left"
            >
              <SettingsIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Settings & API Keys</span>
            </button>

            <button
              onClick={() => {
                setProfileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] transition group">
          <div 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {getInitials(user?.displayName || user?.username || 'HR')}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-[var(--text-main)] truncate">
                {user?.displayName || user?.username || 'huzaifa rajput'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] truncate">
                {user?.email ? user.email : 'Local Account'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveModal('auth')}
            className="px-2.5 py-1 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-medium)] text-[11px] font-semibold text-[var(--text-primary)] transition cursor-pointer shrink-0 ml-1"
          >
            Account
          </button>
        </div>
      </div>
    </aside>
  );

  function renderConversationRow(c: Conversation, isPinned: boolean) {
    const isActive = activeConversationId === c.id;
    const isEditing = editingId === c.id;

    return (
      <div
        key={c.id}
        onClick={() => selectConversation(c.id)}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-xs ${
          isActive
            ? 'bg-[var(--bg-sidebar-active)] text-[var(--text-main)] font-medium'
            : 'text-[var(--text-sub)] hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-main)]'
        }`}
      >
        {isEditing ? (
          <form
            onSubmit={(e) => saveRename(c.id, e)}
            className="flex items-center gap-1 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
              className="flex-1 px-1.5 py-0.5 bg-[var(--bg-main)] border border-emerald-500 rounded text-xs text-[var(--text-main)] focus:outline-none"
            />
            <button type="submit" className="text-emerald-500 p-0.5">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setEditingId(null)} className="text-[var(--text-muted)] p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2 truncate flex-1 mr-1">
              {isPinned && <Pin className="w-3 h-3 text-emerald-500 shrink-0" />}
              <span className="truncate">{c.title || 'New chat'}</span>
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => startRename(c, e)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinConversation(c.id);
                }}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
                title={isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(c.id);
                }}
                className="p-1 rounded text-[var(--text-muted)] hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
};
