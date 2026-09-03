import React, { useState, useRef, useEffect } from 'react';
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
  Image as ImageIcon,
  BookMarked,
  Clock,
  MoreHorizontal,
  Sparkles,
  Zap,
  ChevronRight,
  HelpCircle,
  Plus,
  Boxes,
  Code2,
  Sliders
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
    setSelectedModel,
    logout
  } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      {/* Sidebar Top Header: Guts AI Branding */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)] px-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white text-[10px]">
            G
          </div>
          <span>Guts AI</span>
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

      {/* Main Navigation Actions (Matching Claude Screenshot 1) */}
      <div className="px-2 space-y-0.5">
        {/* + New Button */}
        <button
          onClick={() => createNewChat()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[var(--text-sub)]" />
          <span className="font-semibold">New</span>
        </button>

        {/* Projects */}
        <button
          onClick={() => setActiveModal('projects')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer"
        >
          <FolderGit2 className="w-4 h-4 text-[var(--text-sub)]" />
          <span>Projects</span>
        </button>

        {/* Artifacts */}
        <button
          onClick={() => setActiveModal('memory')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer"
        >
          <Boxes className="w-4 h-4 text-[var(--text-sub)]" />
          <span>Artifacts</span>
        </button>

        {/* Code */}
        <button
          onClick={() => {
            setSelectedModel('qwen2.5-coder:7b', 'ollama');
            createNewChat();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Code2 className="w-4 h-4 text-[var(--text-sub)]" />
            <span>Code</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-semibold border border-indigo-500/20">
            Qwen Pro
          </span>
        </button>

        {/* Customize */}
        <button
          onClick={() => setActiveModal('settings')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer"
        >
          <Sliders className="w-4 h-4 text-[var(--text-sub)]" />
          <span>Customize</span>
        </button>
      </div>

      {/* Pinned Section */}
      {pinned.length > 0 && (
        <div className="px-2 pt-3 space-y-0.5 text-xs">
          <div className="px-3 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Pinned
          </div>
          {pinned.map((c) => renderConversationRow(c, true))}
        </div>
      )}

      {/* Recents Section with Search */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 text-xs">
        <div className="px-3 pt-1 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Recents
          </span>
        </div>

        {/* Search Chats */}
        <div className="px-1 pb-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-[var(--bg-sidebar-hover)] border border-transparent focus:border-[var(--border-input)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
            />
          </div>
        </div>

        {unpinned.map((c) => renderConversationRow(c, false))}

        {conversations.length === 0 && (
          <div className="text-center py-6 text-[var(--text-muted)] text-xs">
            No previous chats
          </div>
        )}
      </div>

      {/* Bottom Footer Section */}
      {user ? (
        /* Logged-In User Profile Card (Screenshot 1) */
        <div className="p-2 border-t border-[var(--border-sidebar)] relative" ref={profileRef}>
          {/* Profile Menu Popup (Exact Match to User Screenshot) */}
          {profileMenuOpen && (
            <div className="absolute bottom-16 left-2 right-2 p-1.5 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl shadow-2xl z-40 text-xs animate-in fade-in slide-in-from-bottom-2">
              {/* Top User Account Header */}
              <div 
                onClick={() => {
                  setProfileMenuOpen(false);
                  setActiveModal('auth');
                }}
                className="px-3 py-2.5 flex items-center justify-between hover:bg-[var(--bg-sidebar-hover)] rounded-xl cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                    {getInitials(user.displayName || user.username)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[var(--text-main)] truncate">
                      {user.displayName || user.username || 'huzaifa rajput'}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">
                      Free
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              </div>

              {/* Divider */}
              <div className="h-[1px] bg-[var(--border-subtle)] my-1" />

              {/* 1. Profile */}
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  setActiveModal('profile');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer text-left font-normal"
              >
                <User className="w-4 h-4 text-[var(--text-sub)]" />
                <span>Profile</span>
              </button>

              {/* 2. Settings */}
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  setActiveModal('settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer text-left font-normal"
              >
                <SettingsIcon className="w-4 h-4 text-[var(--text-sub)]" />
                <span>Settings</span>
              </button>

              {/* Divider */}
              <div className="h-[1px] bg-[var(--border-subtle)] my-1" />

              {/* 3. Help */}
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  setActiveModal('commandPalette');
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer text-left font-normal"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[var(--text-sub)]" />
                  <span>Help</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </button>

              {/* 4. Log out */}
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--text-main)] hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer text-left font-normal"
              >
                <LogOut className="w-4 h-4 text-[var(--text-sub)]" />
                <span>Log out</span>
              </button>
            </div>
          )}

          {/* User Card */}
          <div 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {getInitials(user.displayName || user.username)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-[var(--text-main)] truncate">
                  {user.displayName || user.username || 'huzaifa rajput'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  {user.email ? 'Free' : 'Local'}
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal('models');
              }}
              className="px-2.5 py-1 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-main)] transition cursor-pointer shrink-0 ml-1"
            >
              Upgrade
            </button>
          </div>
        </div>
      ) : (
        /* Logged-Out Guest Card (Screenshot 2) */
        <div className="p-3 border-t border-[var(--border-sidebar)] space-y-3">
          <div className="space-y-1">
            <div className="font-semibold text-xs text-[var(--text-main)]">
              Get responses tailored to you
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Log in to get answers based on saved chats, plus create images and upload files.
            </p>
          </div>

          <button
            onClick={() => setActiveModal('auth')}
            className="w-full py-2 rounded-full bg-white hover:bg-slate-200 text-black font-semibold text-xs shadow-md transition cursor-pointer"
          >
            Log in
          </button>
        </div>
      )}
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
