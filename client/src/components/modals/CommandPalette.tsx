import React, { useState, useEffect } from 'react';
import { 
  X, 
  Command, 
  Plus, 
  Cpu, 
  Brain, 
  FolderGit2, 
  Mic, 
  Settings, 
  Sparkles,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export const CommandPalette: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    createNewChat, 
    setSelectedModel, 
    modelsData,
    settings,
    updateSettings 
  } = useAppStore();

  const [query, setQuery] = useState('');

  if (activeModal !== 'commandPalette') return null;

  const actions = [
    {
      id: 'new-chat',
      title: 'Create New Chat',
      category: 'Conversation',
      icon: Plus,
      run: () => {
        createNewChat();
        setActiveModal(null);
      }
    },
    {
      id: 'voice-mode',
      title: 'Start Voice Mode Assistant',
      category: 'Audio',
      icon: Mic,
      run: () => {
        setActiveModal('voice');
      }
    },
    {
      id: 'images-hub',
      title: 'Open AI Images & Vision Studio',
      category: 'Creation',
      icon: Sparkles,
      run: () => {
        setActiveModal('images');
      }
    },
    {
      id: 'model-hub',
      title: 'Open Model Hub & Hardware Estimator',
      category: 'Models',
      icon: Cpu,
      run: () => {
        setActiveModal('models');
      }
    },
    {
      id: 'memory-hub',
      title: 'Manage Local AI Memory',
      category: 'Memory',
      icon: Brain,
      run: () => {
        setActiveModal('memory');
      }
    },
    {
      id: 'projects-hub',
      title: 'Manage Projects & Folders',
      category: 'Projects',
      icon: FolderGit2,
      run: () => {
        setActiveModal('projects');
      }
    },
    {
      id: 'settings-hub',
      title: 'Open Settings & Cloud API Keys',
      category: 'Settings',
      icon: Settings,
      run: () => {
        setActiveModal('settings');
      }
    },
    {
      id: 'toggle-theme',
      title: `Switch Theme (Current: ${settings.theme})`,
      category: 'Appearance',
      icon: settings.theme === 'dark' ? Sun : Moon,
      run: () => {
        updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
        setActiveModal(null);
      }
    }
  ];

  // Also include quick model switches
  modelsData?.recommendedModels?.forEach((m) => {
    actions.push({
      id: `model-${m.name}`,
      title: `Switch to Model: ${m.displayName || m.name}`,
      category: 'Switch Model',
      icon: Sparkles,
      run: () => {
        setSelectedModel(m.name, 'ollama');
        setActiveModal(null);
      }
    });
  });

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl overflow-hidden text-xs">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900/90">
          <Command className="w-4 h-4 text-indigo-400 mr-2.5" />
          <input
            type="text"
            placeholder="Type a command or search action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.map((action) => (
            <button
              key={action.id}
              onClick={action.run}
              className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between hover:bg-indigo-600/20 text-slate-300 hover:text-white transition group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <action.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition" />
                <span className="font-medium">{action.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono group-hover:bg-indigo-950 group-hover:text-indigo-300">
                  {action.category}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-6 text-slate-500">
              No matching actions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
