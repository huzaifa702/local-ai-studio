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
    const accents: Record<string, string> = {
      Purple: '#a855f7',
      Indigo: '#6366f1',
      Emerald: '#10b981',
      Blue: '#3b82f6',
      Amber: '#f59e0b'
    };
    const accent = accents[settings.accentColor || 'Purple'] || '#a855f7';
    document.documentElement.style.setProperty('--accent-color', accent);
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
