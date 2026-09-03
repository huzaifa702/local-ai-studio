import React, { useState, useRef, useEffect } from 'react';
import { 
  PanelLeft, 
  Share2, 
  MoreHorizontal, 
  FileText, 
  Pin, 
  Archive, 
  Trash2, 
  FolderPlus, 
  Sparkles, 
  Check, 
  Copy, 
  Link as LinkIcon,
  X
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';

export const Header: React.FC = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    activeConversationId,
    activeConversation,
    togglePinConversation,
    toggleArchiveConversation,
    deleteConversation,
    createNewChat,
    setActiveModal,
    user
  } = useAppStore();

  const [dotsMenuOpen, setDotsMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatFiles, setChatFiles] = useState<any[]>([]);
  const [loadingShare, setLoadingShare] = useState(false);

  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dotsRef.current && !dotsRef.current.contains(e.target as Node)) {
        setDotsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPinned = Boolean(activeConversation?.is_pinned);

  // Handle Share Chat
  const handleShareClick = async () => {
    if (!activeConversationId) return;
    setDotsMenuOpen(false);
    setLoadingShare(true);
    setShareModalOpen(true);
    try {
      const res = await api.shareConversation(activeConversationId);
      setShareLink(res.shareUrl);
    } catch (e: any) {
      setShareLink(`http://localhost:5173/share/${activeConversationId}`);
    } finally {
      setLoadingShare(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle View Files
  const handleViewFiles = async () => {
    if (!activeConversationId) return;
    setDotsMenuOpen(false);
    setFilesModalOpen(true);
    try {
      const res = await api.getConversationFiles(activeConversationId);
      setChatFiles(res.files || []);
    } catch (e) {
      setChatFiles([]);
    }
  };

  return (
    <>
      <header className="h-14 bg-[var(--bg-main)] px-4 flex items-center justify-between shrink-0 select-none border-b border-transparent">
        {/* Left: Guts AI Branding & Single Unified OX-Alpha Model */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          {/* Single Unified OX-Alpha Super-Model Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-sidebar-hover)] border border-[var(--border-subtle)] text-[var(--text-main)]">
            <img 
              src="/assets/guts-logo.png" 
              alt="Guts AI" 
              className="w-5 h-5 rounded-md object-cover shadow-sm ring-1 ring-red-500/20" 
            />
            <div className="flex items-center gap-1.5 font-semibold text-sm tracking-tight">
              <span>OX-Alpha</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-bold border border-indigo-500/20">
                Omni Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Center: Segmented Chat / Work Control */}
        <div className="hidden sm:flex items-center p-1 rounded-full bg-[var(--bg-sidebar-hover)] border border-[var(--border-subtle)] text-xs font-semibold">
          <button 
            onClick={() => createNewChat()}
            className="px-5 py-1.5 rounded-full bg-[var(--bg-main)] text-[var(--text-main)] shadow-sm cursor-pointer"
          >
            Chat
          </button>
          <button 
            onClick={() => setActiveModal('projects')}
            className="px-4 py-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer flex items-center gap-1"
          >
            <span>+ Work</span>
          </button>
        </div>

        {/* Right: Clean Share & 3-Dots Action Menu (Matching Exact User Screenshot) */}
        <div className="flex items-center gap-2">
          {activeConversationId ? (
            <>
              {/* Share Button */}
              <button
                onClick={handleShareClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-sidebar-hover)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] text-xs font-medium transition cursor-pointer border border-[var(--border-subtle)]"
                title="Share Chat"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {/* 3-Dots Action Menu */}
              <div className="relative" ref={dotsRef}>
                <button
                  onClick={() => setDotsMenuOpen(!dotsMenuOpen)}
                  className="p-2 rounded-full hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition cursor-pointer"
                  title="More chat options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {/* 3-Dots Dropdown Options */}
                {dotsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-2xl p-1.5 z-50 text-xs animate-in fade-in space-y-0.5">
                    {/* View Files in Chat */}
                    <button
                      onClick={handleViewFiles}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>View files in chat</span>
                    </button>

                    {/* Pin Chat */}
                    <button
                      onClick={() => {
                        setDotsMenuOpen(false);
                        togglePinConversation(activeConversationId);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <Pin className="w-4 h-4 text-amber-400" />
                      <span>{isPinned ? 'Unpin chat' : 'Pin chat'}</span>
                    </button>

                    {/* Archive Chat */}
                    <button
                      onClick={() => {
                        setDotsMenuOpen(false);
                        toggleArchiveConversation(activeConversationId);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <Archive className="w-4 h-4 text-slate-400" />
                      <span>Archive</span>
                    </button>

                    {/* Move to Project */}
                    <button
                      onClick={() => {
                        setDotsMenuOpen(false);
                        setMoveModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <FolderPlus className="w-4 h-4 text-emerald-400" />
                      <span>Move to project</span>
                    </button>

                    {/* Share Chat */}
                    <button
                      onClick={handleShareClick}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-blue-400" />
                      <span>Share chat</span>
                    </button>

                    {/* Delete Chat */}
                    <div className="border-t border-[var(--border-subtle)] my-0.5 pt-0.5">
                      <button
                        onClick={() => {
                          setDotsMenuOpen(false);
                          deleteConversation(activeConversationId);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 transition flex items-center gap-2.5 cursor-pointer font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete chat</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : user ? (
            /* Logged in user avatar pill on top right */
            <button
              onClick={() => setActiveModal('profile')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-sidebar-hover)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-xs transition cursor-pointer"
              title="View Profile & Settings"
            >
              <div className="w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                {(user.displayName || user.username).slice(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold text-[var(--text-main)] max-w-[130px] truncate">
                {user.displayName || user.username.split('@')[0]}
              </span>
            </button>
          ) : (
            /* Logged out guest view */
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModal('auth')}
                className="px-4 py-1.5 rounded-full bg-[var(--bg-sidebar-hover)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] text-xs font-semibold transition cursor-pointer border border-[var(--border-subtle)]"
              >
                Log in
              </button>
              <button
                onClick={() => setActiveModal('auth')}
                className="px-4 py-1.5 rounded-full bg-white text-black hover:bg-slate-200 text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Sign up for free
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Share Chat Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
          <div className="w-full max-w-md rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Share Public Link to Chat</span>
              </div>
              <button onClick={() => setShareModalOpen(false)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Messages you send after sharing won't be visible to others. Anyone with the link will be able to view this conversation.
            </p>

            <div className="flex items-center gap-2 p-2 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
              <LinkIcon className="w-4 h-4 text-[var(--text-muted)] shrink-0 ml-1" />
              <input
                type="text"
                readOnly
                value={shareLink || 'Generating link...'}
                className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none truncate font-mono"
              />
              <button
                onClick={copyShareLink}
                disabled={!shareLink}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Files in Chat Modal */}
      {filesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Files & Images in this Chat</span>
              </div>
              <button onClick={() => setFilesModalOpen(false)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {chatFiles.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No files or images attached in this conversation yet.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {chatFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-medium text-[var(--text-primary)] truncate">{f.filename || 'Attached document'}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                      {f.fileSize ? `${Math.round(f.fileSize / 1024)} KB` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Move to Project Modal */}
      {moveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
          <div className="w-full max-w-md rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <span>Move to Project</span>
              </div>
              <button onClick={() => setMoveModalOpen(false)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Group related chats and project context together inside a dedicated workspace.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setMoveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-sidebar-hover)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setMoveModalOpen(false);
                  setActiveModal('projects');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer"
              >
                Open Project Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
