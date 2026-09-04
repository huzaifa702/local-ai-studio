import React, { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ChatContainer } from './components/chat/ChatContainer';
import { ModelsModal } from './components/modals/ModelsModal';
import { MemoryModal } from './components/modals/MemoryModal';
import { ProjectsModal } from './components/modals/ProjectsModal';
import { VoiceModeModal } from './components/modals/VoiceModeModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { AuthModal } from './components/modals/AuthModal';
import { CommandPalette } from './components/modals/CommandPalette';
import { ProfileModal } from './components/modals/ProfileModal';
import { ImagesModal } from './components/modals/ImagesModal';

export const App: React.FC = () => {
  const { 
    initApp, 
    activeModal, 
    setActiveModal, 
    createNewChat, 
    sidebarOpen, 
    setSidebarOpen,
    settings 
  } = useAppStore();

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K : Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveModal(activeModal === 'commandPalette' ? null : 'commandPalette');
      }

      // Ctrl+N / Cmd+N : New Chat
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewChat();
      }

      // Ctrl+B or Ctrl+Shift+S : Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }

      // Escape : Close modals
      if (e.key === 'Escape' && activeModal) {
        e.preventDefault();
        setActiveModal(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, setActiveModal, createNewChat, sidebarOpen, setSidebarOpen]);

  // Apply theme, contrast, and accent color to document
  useEffect(() => {
    // 1. Theme
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (settings.theme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.add('dark');
    }

    // 2. Contrast
    if (settings.contrast === 'Increased') {
      document.documentElement.classList.add('contrast-increased');
    } else {
      document.documentElement.classList.remove('contrast-increased');
    }

    // 3. Accent Color
    const accents: Record<string, { color: string; bg: string; border: string }> = {
      Purple: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)' },
      Indigo: { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)' },
      Emerald: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
      Blue: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)' },
      Amber: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' }
    };
    const current = accents[settings.accentColor || 'Purple'] || accents.Purple;
    document.documentElement.style.setProperty('--accent-color', current.color);
    document.documentElement.style.setProperty('--accent-bg', current.bg);
    document.documentElement.style.setProperty('--accent-border', current.border);
  }, [settings.theme, settings.contrast, settings.accentColor]);

  return (
    <div className="app-root flex h-screen w-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-content flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--bg-main)] relative">
        <Header />
        <ChatContainer />
      </div>

      {/* Interactive Modals */}
      <ModelsModal />
      <MemoryModal />
      <ProjectsModal />
      <VoiceModeModal />
      <SettingsModal />
      <AuthModal />
      <ProfileModal />
      <ImagesModal />
      <CommandPalette />
    </div>
  );
};

export default App;
