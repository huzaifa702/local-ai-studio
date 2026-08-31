import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  PanelLeft, 
  Check, 
  Sparkles, 
  User, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  LogOut,
  Brain,
  Cpu
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export const Header: React.FC = () => {
  const {
    modelsData,
    selectedModel,
    selectedProvider,
    setSelectedModel,
    setActiveModal,
    user,
    sidebarOpen,
    setSidebarOpen,
    settings,
    updateSettings,
    setUser
  } = useAppStore();

  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOllamaRunning = modelsData?.isOllamaRunning || false;

  const toggleTheme = () => {
    const next = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: next });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-14 bg-[var(--bg-main)] px-4 flex items-center justify-between shrink-0 select-none border-b border-transparent">
      {/* Left: ChatGPT Title & Model Selector Dropdown */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
          title="Toggle Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        {/* Model Picker Pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-semibold text-lg tracking-tight transition cursor-pointer"
          >
            <span>ChatGPT</span>
            <span className="text-xs text-[var(--text-muted)] font-normal ml-1 font-mono">
              {selectedModel === 'auto' ? 'Auto (Omni)' : selectedModel}
            </span>
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] mt-0.5" />
          </button>

          {/* Clean ChatGPT Model Dropdown */}
          {modelDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] shadow-2xl p-2 z-50 text-xs animate-in fade-in">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] px-3 py-1.5 uppercase tracking-wider">
                Model Engine ({isOllamaRunning ? 'Local Free' : 'Offline'})
              </div>

              {/* Omni Model Option */}
              <button
                onClick={() => {
                  setSelectedModel('auto', 'ollama');
                  setModelDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                  selectedModel === 'auto' ? 'bg-[var(--bg-sidebar-active)] font-semibold text-[var(--text-main)]' : 'hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-sub)]'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <span>⚡ Auto (Omni-Model)</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Automatically picks the best model for chat, code, or images</div>
                </div>
                {selectedModel === 'auto' && <Check className="w-4 h-4 text-emerald-500" />}
              </button>

              {/* Individual Models */}
              {modelsData?.installedModels?.map((m) => (
                <button
                  key={m.name}
                  onClick={() => {
                    setSelectedModel(m.name, 'ollama');
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                    selectedModel === m.name ? 'bg-[var(--bg-sidebar-active)] font-semibold text-[var(--text-main)]' : 'hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-sub)]'
                  }`}
                >
                  <div className="font-medium">{m.name}</div>
                  {selectedModel === m.name && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              ))}

              <div className="border-t border-[var(--border-input)] my-1 pt-1">
                <button
                  onClick={() => {
                    setModelDropdownOpen(false);
                    setActiveModal('models');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-sub)] font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Model Hub & Downloads</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Clean Segmented Mode Control (Chat / Work) */}
      <div className="hidden sm:flex items-center p-1 rounded-full bg-[var(--bg-sidebar-hover)] border border-[var(--border-subtle)] text-xs font-semibold">
        <button className="px-5 py-1.5 rounded-full bg-[var(--bg-main)] text-[var(--text-main)] shadow-sm cursor-pointer">
          Chat
        </button>
        <button 
          onClick={() => setActiveModal('projects')}
          className="px-4 py-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer flex items-center gap-1"
        >
          <span>+ Projects</span>
        </button>
      </div>

      {/* Right: Clean Upgrade & Profile Avatar */}
      <div className="flex items-center gap-3">
        {/* Profile Avatar Button */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-8 h-8 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-sm hover:opacity-90 transition"
          >
            {getInitials(user?.displayName || user?.username || 'HR')}
          </button>

          {/* User Account Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] shadow-2xl p-2 z-50 text-xs animate-in fade-in">
              <div className="px-3 py-2 border-b border-[var(--border-input)] mb-1">
                <div className="font-bold text-sm text-[var(--text-main)]">
                  {user?.displayName || 'Huzaifa Rajput'}
                </div>
                <div className="text-[var(--text-muted)] text-[11px]">
                  {user?.email || 'Local Account (Free)'}
                </div>
              </div>

              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  toggleTheme();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>Theme: {settings.theme === 'dark' ? 'Dark' : 'Light'}</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  setActiveModal('memory');
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center gap-2 cursor-pointer"
              >
                <Brain className="w-4 h-4 text-purple-500" />
                <span>Memory & Context</span>
              </button>

              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  setActiveModal('settings');
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center gap-2 cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-[var(--text-muted)]" />
                <span>Settings</span>
              </button>

              <div className="border-t border-[var(--border-input)] my-1 pt-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setActiveModal('auth');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center gap-2 cursor-pointer font-medium"
                >
                  <User className="w-4 h-4" />
                  <span>Switch Account / Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
