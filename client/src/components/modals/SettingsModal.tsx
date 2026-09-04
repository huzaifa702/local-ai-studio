import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Settings as SettingsIcon, 
  Bell, 
  Clock, 
  Volume2, 
  Database, 
  HardDrive, 
  User, 
  Keyboard, 
  ChevronRight, 
  ChevronLeft, 
  Shield, 
  Trash2, 
  Archive, 
  Box, 
  Info, 
  Sparkles,
  Check,
  Key,
  Cpu,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Zap,
  Volume1,
  MessageSquare,
  Image,
  Mic
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';

export const SettingsModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    clearAllConversations,
    user,
    logout,
    settings,
    updateSettings,
    conversations,
    customModels,
    addCustomModel,
    deleteCustomModel,
    detectedModels,
    saveDetectedModels,
    fetchModels,
    modelsData
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<string>('general');
  const [searchFilter, setSearchFilter] = useState('');

  // 1. General Tab States
  const [appearance, setAppearance] = useState<'Dark' | 'Light' | 'System'>(
    settings.theme === 'light' ? 'Light' : settings.theme === 'system' ? 'System' : 'Dark'
  );
  const [contrast, setContrast] = useState<'Default' | 'Increased'>(settings.contrast || 'Default');
  const [accentColor, setAccentColor] = useState<'Purple' | 'Indigo' | 'Emerald' | 'Blue' | 'Amber'>(
    (settings.accentColor as any) || 'Purple'
  );
  const [language, setLanguage] = useState<'Auto-detect' | 'English' | 'Urdu' | 'Spanish'>(
    (settings.language as any) || 'Auto-detect'
  );
  const [higherIntelligence, setHigherIntelligence] = useState(settings.higherIntelligence ?? true);
  const [enableDictation, setEnableDictation] = useState(settings.enableDictation ?? true);

  const handleAppearanceChange = (val: 'Dark' | 'Light' | 'System') => {
    setAppearance(val);
    updateSettings({ theme: val.toLowerCase() as any });
  };

  const handleContrastChange = (val: 'Default' | 'Increased') => {
    setContrast(val);
    updateSettings({ contrast: val });
  };

  const handleAccentColorChange = (val: 'Purple' | 'Indigo' | 'Emerald' | 'Blue' | 'Amber') => {
    setAccentColor(val);
    updateSettings({ accentColor: val });
  };

  const handleLanguageChange = (val: any) => {
    setLanguage(val);
    updateSettings({ language: val });
  };

  // 2. Notification Tab States
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [soundChime, setSoundChime] = useState(true);
  const [testNotifStatus, setTestNotifStatus] = useState<string | null>(null);

  const playTestChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}
  };

  const handleTriggerTestNotification = async () => {
    playTestChime();
    if (!('Notification' in window)) {
      setTestNotifStatus('Browser does not support desktop notifications.');
      return;
    }

    try {
      let perm = Notification.permission;
      if (perm !== 'granted') {
        perm = await Notification.requestPermission();
      }

      if (perm === 'granted') {
        new Notification('Guts AI • Audio & Notification Test', {
          body: 'Your notification system and audio chimes are operating perfectly!',
          icon: '/favicon.ico'
        });
        setTestNotifStatus('✅ Notification and chime sent successfully!');
      } else {
        setTestNotifStatus('⚠️ Permission denied. Enable notifications in browser site settings.');
      }
    } catch (e: any) {
      setTestNotifStatus(`Notification error: ${e.message}`);
    }

    setTimeout(() => setTestNotifStatus(null), 4000);
  };

  // 3. Personalization Tab States
  const [baseStyle, setBaseStyle] = useState('Default');
  const [warmth, setWarmth] = useState('Default');
  const [enthusiastic, setEnthusiastic] = useState('Default');
  const [headersLists, setHeadersLists] = useState('Default');
  const [emojiLevel, setEmojiLevel] = useState('Default');
  const [fastAnswers, setFastAnswers] = useState(true);
  const [customInstructions, setCustomInstructions] = useState(
    settings.systemPrompt || 'Clear reasoning, and actionable feedback. Think and respond like a no-nonsense coach or a brutal friend who is focused on making me better. Push back whenever necessary, and never feed sugarcoated advice.'
  );
  const [instructionsSaved, setInstructionsSaved] = useState(false);

  const handleSaveInstructions = async () => {
    await updateSettings({ systemPrompt: customInstructions });
    setInstructionsSaved(true);
    setTimeout(() => setInstructionsSaved(false), 2500);
  };

  // 4. Voice Tab States
  const voices = [
    { name: 'Juniper', desc: 'Open and upbeat', color: 'from-purple-500 to-indigo-400' },
    { name: 'Breeze', desc: 'Calm and friendly', color: 'from-cyan-500 to-blue-400' },
    { name: 'Cove', desc: 'Direct and thoughtful', color: 'from-emerald-500 to-teal-400' },
    { name: 'Ember', desc: 'Warm and candid', color: 'from-amber-500 to-orange-400' },
    { name: 'Sol', desc: 'Savvy and relaxed', color: 'from-rose-500 to-pink-400' }
  ];
  const [currentVoiceIdx, setCurrentVoiceIdx] = useState(0);
  const [voiceModel, setVoiceModel] = useState('Live');
  const [voiceLang, setVoiceLang] = useState('Auto-detect');
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const playVoiceSample = (name: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      setIsPlayingSample(true);
      const u = new SpeechSynthesisUtterance(`Hello! I'm ${name}, your voice assistant on Guts AI. I'm ready to listen and answer.`);
      u.rate = 1.05;
      u.onend = () => setIsPlayingSample(false);
      u.onerror = () => setIsPlayingSample(false);
      window.speechSynthesis.speak(u);
    }
  };

  const handleVoiceChange = (idx: number) => {
    setCurrentVoiceIdx(idx);
    const v = voices[idx];
    updateSettings({ voiceVoice: v.name.toLowerCase() });
    playVoiceSample(v.name);
  };

  // 5. Storage Tab States
  const [storageUsed] = useState('3.51 MB of 512 MB used');

  // 6. Keyboard Shortcut States
  const defaultShortcuts = {
    sendMessage: true,
    sendBackground: true,
    enableThinking: true,
    toggleDictation: true,
    addPhotosFiles: true,
    openNewChat: true,
    showShortcuts: true,
    search: true,
    toggleDevMode: true,
    toggleSidebar: true,
    setCustomInstructions: true,
    copyLastCodeBlock: true,
    deleteChat: true
  };
  const [shortcuts, setShortcuts] = useState(defaultShortcuts);

  // 7. API Keys & Cloud Models States
  const [groqKey, setGroqKey] = useState(settings.apiKeys?.groq || '');
  const [openaiKey, setOpenaiKey] = useState(settings.apiKeys?.openai || '');
  const [geminiKey, setGeminiKey] = useState(settings.apiKeys?.gemini || '');
  const [anthropicKey, setAnthropicKey] = useState(settings.apiKeys?.anthropic || '');
  const [openrouterKey, setOpenrouterKey] = useState(settings.apiKeys?.openrouter || '');
  const [defaultModelChoice, setDefaultModelChoice] = useState(settings.defaultModel || 'llama3.2:3b');
  const [keysSaved, setKeysSaved] = useState(false);

  // Custom Model Form States
  const [customModelId, setCustomModelId] = useState('');
  const [customModelName, setCustomModelName] = useState('');
  const [customProvider, setCustomProvider] = useState<'ollama' | 'groq' | 'openai' | 'gemini' | 'anthropic' | 'openrouter'>('ollama');
  const [customThinkingEffort, setCustomThinkingEffort] = useState<'OFF' | 'LOW' | 'MEDIUM' | 'HIGH' | 'MAX'>('OFF');
  const [customAddedMessage, setCustomAddedMessage] = useState<string | null>(null);

  // Detection States
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ 
    provider: string; 
    success: boolean; 
    message: string; 
    models: string[];
    detectedModels?: any[];
    counts?: { text: number; audio: number; image: number };
  } | null>(null);
  const [detectedCategoryFilter, setDetectedCategoryFilter] = useState<'all' | 'text' | 'audio' | 'image'>('all');

  const handleTestProvider = async (provider: 'groq' | 'openai' | 'gemini' | 'anthropic' | 'openrouter' | 'ollama') => {
    setTestingProvider(provider);
    setTestResult(null);

    let key = '';
    if (provider === 'groq') key = groqKey;
    else if (provider === 'openai') key = openaiKey;
    else if (provider === 'gemini') key = geminiKey;
    else if (provider === 'anthropic') key = anthropicKey;
    else if (provider === 'openrouter') key = openrouterKey;

    try {
      const res = await api.testProviderKey(provider, key);
      setTestResult({
        provider,
        success: res.success,
        message: res.message,
        models: res.models || [],
        detectedModels: res.detectedModels || [],
        counts: res.counts
      });
      if (res.success && res.detectedModels && res.detectedModels.length > 0) {
        saveDetectedModels(res.detectedModels);
        fetchModels();
      }
    } catch (e: any) {
      setTestResult({
        provider,
        success: false,
        message: e.message || 'Connection test failed',
        models: []
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleAddCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    const id = customModelId.trim();
    if (!id) return;

    const name = customModelName.trim() || id;
    addCustomModel({
      id,
      name,
      provider: customProvider,
      subtitle: `${customProvider.toUpperCase()} • Thinking: ${customThinkingEffort}`,
      badge: customProvider === 'ollama' ? 'LOCAL' : 'CLOUD',
      thinkingEffort: customThinkingEffort
    });

    setCustomAddedMessage(`✅ Added "${name}" to your models!`);
    setCustomModelId('');
    setCustomModelName('');
    setTimeout(() => setCustomAddedMessage(null), 3500);
  };

  const handleSaveApiKeys = async () => {
    const updatedKeys = {
      ...(settings.apiKeys || {}),
      groq: groqKey.trim(),
      openai: openaiKey.trim(),
      gemini: geminiKey.trim(),
      anthropic: anthropicKey.trim(),
      openrouter: openrouterKey.trim()
    };
    await updateSettings({ 
      apiKeys: updatedKeys,
      defaultModel: defaultModelChoice 
    });
    setKeysSaved(true);
    setTimeout(() => setKeysSaved(false), 2500);

    // Auto-detect models in background for any newly configured keys
    const toTest = [
      { provider: 'groq' as const, key: groqKey.trim() },
      { provider: 'openai' as const, key: openaiKey.trim() },
      { provider: 'gemini' as const, key: geminiKey.trim() },
      { provider: 'anthropic' as const, key: anthropicKey.trim() },
      { provider: 'openrouter' as const, key: openrouterKey.trim() }
    ].filter(p => Boolean(p.key));

    for (const p of toTest) {
      api.testProviderKey(p.provider, p.key).then(res => {
        if (res.success && res.detectedModels && res.detectedModels.length > 0) {
          saveDetectedModels(res.detectedModels);
        }
      }).catch(() => {});
    }
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      user,
      settings,
      conversations,
      customModels
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guts_ai_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to delete all chats? This cannot be undone.')) {
      await clearAllConversations();
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account and all data?')) {
      await clearAllConversations();
      logout();
      setActiveModal(null);
    }
  };

  if (activeModal !== 'settings') return null;

  const tabsList = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'models_keys', label: 'API Keys & Models', icon: Sparkles },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'personalization', label: 'Personalization', icon: Clock },
    { id: 'voice', label: 'Voice', icon: Volume2 },
    { id: 'data_controls', label: 'Data controls', icon: Database },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'account', label: 'Account', icon: User },
    { id: 'keyboard', label: 'Keyboard', icon: Keyboard }
  ];

  const filteredTabs = tabsList.filter(t => 
    t.label.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-4xl h-[650px] flex rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-2xl overflow-hidden text-xs text-[var(--text-main)] transition-colors">
        
        {/* Left Settings Sidebar */}
        <div className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex flex-col p-3 shrink-0">
          {/* Top Close Button & Search */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition cursor-pointer border border-[var(--border-subtle)]"
              title="Close Settings"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search settings"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)] transition"
              />
            </div>
          </div>

          {/* Navigation Tabs List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left font-normal text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-[var(--bg-sidebar-active)] text-[var(--text-main)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--accent-color)]' : 'text-[var(--text-muted)]'}`} />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Settings Content Area */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-surface)] relative">
          {/* Top Right Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setActiveModal(null)}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 max-w-2xl mx-auto space-y-6">
            
            {/* ------------------------------------------------------------- */}
            {/* 1. GENERAL TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'general' && (
              <div className="space-y-5 animate-in fade-in">
                {/* Security Banner */}
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[var(--accent-color)]" />
                    <span className="font-semibold text-[var(--text-main)] text-xs">Secure your account</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-sub)] leading-relaxed">
                    Add multi-factor authentication (MFA) or verify your email to ensure uninterrupted access to your local & cloud models.
                  </p>
                  <button
                    onClick={() => setActiveModal('auth')}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer border border-[var(--border-medium)]"
                  >
                    Set up MFA
                  </button>
                </div>

                {/* Settings Rows */}
                <div className="space-y-4 pt-1">
                  {/* Appearance */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                    <div>
                      <div className="text-xs text-[var(--text-main)] font-medium">Appearance</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Switch between sleek Dark and bright Light mode.</div>
                    </div>
                    <select
                      value={appearance}
                      onChange={(e) => handleAppearanceChange(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none cursor-pointer"
                    >
                      <option value="Dark">Dark</option>
                      <option value="Light">Light</option>
                      <option value="System">System</option>
                    </select>
                  </div>

                  {/* Contrast */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-main)]">Contrast</span>
                    <select
                      value={contrast}
                      onChange={(e) => handleContrastChange(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none cursor-pointer"
                    >
                      <option value="Default">Default</option>
                      <option value="Increased">Increased</option>
                    </select>
                  </div>

                  {/* Accent Color */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-main)]">Accent color</span>
                    <select
                      value={accentColor}
                      onChange={(e) => handleAccentColorChange(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none cursor-pointer"
                    >
                      <option value="Purple">Purple</option>
                      <option value="Indigo">Indigo</option>
                      <option value="Emerald">Emerald</option>
                      <option value="Blue">Blue</option>
                      <option value="Amber">Amber</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-main)]">Language</span>
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none cursor-pointer"
                    >
                      <option value="Auto-detect">Auto-detect</option>
                      <option value="English">English</option>
                      <option value="Urdu">Urdu</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>

                  {/* Enable dictation */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                    <div>
                      <div className="text-xs text-[var(--text-main)]">Enable dictation</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Voice speech-to-text directly in the message composer.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableDictation}
                      onChange={(e) => {
                        setEnableDictation(e.target.checked);
                        updateSettings({ enableDictation: e.target.checked });
                      }}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Higher Intelligence */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-xs text-[var(--text-main)]">Auto-Smart Routing</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Automatically pick optimal coding or reasoning model when in OX-Alpha mode.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={higherIntelligence}
                      onChange={(e) => {
                        setHigherIntelligence(e.target.checked);
                        updateSettings({ higherIntelligence: e.target.checked });
                      }}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. API KEYS & MODELS TAB (Supercharged Engine) */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'models_keys' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div>
                    <div className="font-semibold text-sm text-[var(--text-main)] flex items-center gap-2">
                      <Key className="w-4 h-4 text-[var(--accent-color)]" />
                      <span>API Keys & Custom Models Engine</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Configure cloud keys, detect active models, or add any custom model with thinking effort.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveApiKeys}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {keysSaved ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{keysSaved ? 'Saved' : 'Save Keys'}</span>
                  </button>
                </div>

                {/* Default Model Selector */}
                <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-[var(--text-main)]">Primary Default Model</div>
                      <div className="text-[11px] text-[var(--text-muted)]">The model loaded when opening a new chat session.</div>
                    </div>
                    <select
                      value={defaultModelChoice}
                      onChange={(e) => setDefaultModelChoice(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none cursor-pointer"
                    >
                      <option value="llama3.2:3b">⚡ Llama 3.2 3B (Local Ultra-Fast)</option>
                      <option value="ox-alpha">🌟 OX-Alpha (Auto-Smart Omni)</option>
                      <option value="qwen2.5-coder:7b">💻 Qwen 2.5 Coder 7B (Local Coding)</option>
                      <option value="deepseek-r1:7b">🧠 DeepSeek-R1 7B (Local Reasoning)</option>
                      <option value="llama-3.3-70b-versatile">🚀 Groq Llama 3.3 70B (Cloud 300 tok/s)</option>
                      <option value="gpt-4o">✨ OpenAI GPT-4o (Cloud Multimodal)</option>
                      <option value="gemini-2.0-flash">🌐 Google Gemini 2.0 Flash (Cloud)</option>
                      {customModels.map(cm => (
                        <option key={cm.id} value={cm.id}>⚙️ {cm.name} ({cm.provider})</option>
                      ))}
                      {detectedModels.map(dm => (
                        <option key={dm.id} value={dm.id}>
                          {dm.capabilities.audio ? '🎙️' : (dm.capabilities.image ? '🖼️' : '☁️')} {dm.name} ({dm.provider.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add Custom Model Section */}
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-xs text-[var(--text-main)]">Add Custom Model</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">Ollama, Groq, OpenAI, Anthropic, Gemini, OpenRouter</span>
                  </div>

                  <form onSubmit={handleAddCustomModel} className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] block mb-1">Model ID / Exact Tag</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. gemma2:9b or mistral-large-2407"
                          value={customModelId}
                          onChange={(e) => setCustomModelId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] font-mono focus:border-[var(--accent-color)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] block mb-1">Friendly Display Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Gemma 2 9B Local"
                          value={customModelName}
                          onChange={(e) => setCustomModelName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:border-[var(--accent-color)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] block mb-1">Provider Execution Backend</label>
                        <select
                          value={customProvider}
                          onChange={(e) => setCustomProvider(e.target.value as any)}
                          className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none"
                        >
                          <option value="ollama">Ollama Local (127.0.0.1:11434)</option>
                          <option value="groq">Groq Cloud (Fast LPUs)</option>
                          <option value="openai">OpenAI (GPT / o1 API)</option>
                          <option value="gemini">Google Gemini API</option>
                          <option value="anthropic">Anthropic Claude API</option>
                          <option value="openrouter">OpenRouter Multi-Gateway</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] block mb-1">Thinking Effort (Chain-of-Thought)</label>
                        <select
                          value={customThinkingEffort}
                          onChange={(e) => setCustomThinkingEffort(e.target.value as any)}
                          className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none font-semibold"
                        >
                          <option value="OFF">OFF (Standard Direct Response)</option>
                          <option value="LOW">LOW (Fast Concise Thinking)</option>
                          <option value="MEDIUM">MEDIUM (Balanced Reasoning)</option>
                          <option value="HIGH">HIGH (In-depth Step-by-Step)</option>
                          <option value="MAX">MAX (Exhaustive Architectural Analysis)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {customAddedMessage ? (
                        <span className="text-xs text-emerald-500 font-medium">{customAddedMessage}</span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)]">Model will immediately appear in your Chat dropdown</span>
                      )}
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Model</span>
                      </button>
                    </div>
                  </form>

                  {/* Added Custom Models List */}
                  {customModels.length > 0 && (
                    <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
                      <div className="text-[11px] font-semibold text-[var(--text-main)]">Configured Custom Models ({customModels.length})</div>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                        {customModels.map(cm => (
                          <div key={cm.id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-[var(--accent-color)]">{cm.id}</span>
                              <span className="text-[11px] text-[var(--text-sub)]">({cm.name})</span>
                              <span className="px-1.5 py-0.2 rounded bg-[var(--accent-bg)] text-[var(--accent-color)] text-[9px] font-bold uppercase">{cm.provider}</span>
                              {cm.thinkingEffort && cm.thinkingEffort !== 'OFF' && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                                  THINK: {cm.thinkingEffort}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => deleteCustomModel(cm.id)}
                              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Delete model"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection Test Banner & Capability Breakdown */}
                {testResult && (
                  <div className={`p-3.5 rounded-2xl border transition animate-in fade-in ${
                    testResult.success 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />}
                      <div className="flex-1 space-y-2">
                        <div className="font-semibold text-xs">{testResult.message}</div>
                        {testResult.counts && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {testResult.counts.text} Text
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-medium flex items-center gap-1">
                              <Mic className="w-3 h-3" /> {testResult.counts.audio} Audio/Voice
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-medium flex items-center gap-1">
                              <Image className="w-3 h-3" /> {testResult.counts.image} Vision/Image
                            </span>
                          </div>
                        )}
                        {testResult.models && testResult.models.length > 0 && (
                          <div className="mt-1.5 text-[10px] max-h-20 overflow-y-auto font-mono bg-black/25 p-2 rounded-xl text-white/90">
                            Detected: {testResult.models.slice(0, 20).join(', ')}{testResult.models.length > 20 ? ` ...and ${testResult.models.length - 20} more` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-Detected Multi-Modal Models Panel */}
                {detectedModels.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-xs text-[var(--text-main)]">
                          Auto-Detected Multi-Modal Models ({detectedModels.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(['all', 'text', 'audio', 'image'] as const).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setDetectedCategoryFilter(cat)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium capitalize transition cursor-pointer ${
                              detectedCategoryFilter === cat
                                ? 'bg-[var(--accent-color)] text-white'
                                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            {cat === 'all' ? 'All' : cat === 'text' ? '💬 Text' : cat === 'audio' ? '🎙️ Audio' : '🖼️ Vision'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {detectedModels
                        .filter(dm => {
                          if (detectedCategoryFilter === 'all') return true;
                          if (detectedCategoryFilter === 'text') return dm.capabilities.text;
                          if (detectedCategoryFilter === 'audio') return dm.capabilities.audio;
                          if (detectedCategoryFilter === 'image') return dm.capabilities.image;
                          return true;
                        })
                        .map(dm => {
                          const isPrimary = defaultModelChoice === dm.id;
                          return (
                            <div 
                              key={dm.id} 
                              className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs">
                                  {dm.capabilities.audio ? '🎙️' : (dm.capabilities.image ? '🖼️' : '💬')}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-mono text-xs font-semibold text-[var(--text-main)] truncate">
                                    {dm.id}
                                  </div>
                                  <div className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1.5">
                                    <span>{dm.name}</span>
                                    <span className="px-1.5 py-0.1 rounded bg-[var(--accent-bg)] text-[var(--accent-color)] text-[8px] font-bold uppercase">
                                      {dm.provider}
                                    </span>
                                    {dm.capabilities.text && <span className="text-[8px] text-emerald-500 font-medium">Text</span>}
                                    {dm.capabilities.audio && <span className="text-[8px] text-purple-500 font-medium">Audio</span>}
                                    {dm.capabilities.image && <span className="text-[8px] text-blue-500 font-medium">Vision</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isPrimary ? (
                                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Active Default
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setDefaultModelChoice(dm.id);
                                      updateSettings({ defaultModel: dm.id });
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-input)] text-[10px] text-[var(--text-main)] font-medium transition cursor-pointer"
                                  >
                                    Set Default
                                  </button>
                                )}
                                {dm.capabilities.image && (
                                  <button
                                    onClick={() => updateSettings({ visionModel: dm.id })}
                                    className="px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] text-blue-600 dark:text-blue-400 font-medium transition cursor-pointer"
                                    title="Set as active vision engine"
                                  >
                                    Set Vision
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Cloud API Keys & Detect Models Grid */}
                <div className="space-y-3 pt-1">
                  
                  {/* 0. Local Ollama */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2 hover:border-[var(--border-medium)] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-xs text-[var(--text-main)]">Local Ollama Engine</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 text-[9px] font-bold">
                          {modelsData?.isOllamaRunning ? 'Online (localhost:11434)' : 'Offline'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleTestProvider('ollama')}
                        disabled={testingProvider === 'ollama'}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-input)] text-[11px] text-[var(--text-main)] font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${testingProvider === 'ollama' ? 'animate-spin' : ''}`} />
                        <span>Detect Local Models</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Runs 100% locally and privately on your hardware without internet.
                    </p>
                  </div>

                  {/* 1. Groq */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2 hover:border-[var(--border-medium)] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-amber-500">Groq Cloud</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                          300 tok/s LPUs
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestProvider('groq')}
                          disabled={testingProvider === 'groq'}
                          className="px-2 py-1 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-input)] text-[10px] text-[var(--text-main)] font-medium transition cursor-pointer flex items-center gap-1"
                        >
                          <Zap className={`w-3 h-3 ${testingProvider === 'groq' ? 'animate-spin' : ''}`} />
                          <span>Test & Detect</span>
                        </button>
                        <a
                          href="https://console.groq.com/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-500 hover:underline"
                        >
                          Get Free Key &rarr;
                        </a>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Llama 3.3 70B Versatile, Llama 3.1 8B Instant, and Mixtral 8x7B.
                    </p>
                    <input
                      type="password"
                      placeholder="gsk_..."
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] font-mono placeholder-[var(--text-muted)] focus:border-[var(--accent-color)] focus:outline-none"
                    />
                  </div>

                  {/* 2. OpenAI */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2 hover:border-[var(--border-medium)] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-emerald-500">OpenAI</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                          GPT-4o / o1
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestProvider('openai')}
                          disabled={testingProvider === 'openai'}
                          className="px-2 py-1 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-input)] text-[10px] text-[var(--text-main)] font-medium transition cursor-pointer flex items-center gap-1"
                        >
                          <Zap className={`w-3 h-3 ${testingProvider === 'openai' ? 'animate-spin' : ''}`} />
                          <span>Test & Detect</span>
                        </button>
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-500 hover:underline"
                        >
                          Get Key &rarr;
                        </a>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Standard for reasoning, GPT-4o, GPT-4o-mini, and o1 models.
                    </p>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] font-mono placeholder-[var(--text-muted)] focus:border-[var(--accent-color)] focus:outline-none"
                    />
                  </div>

                  {/* 3. Google Gemini */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2 hover:border-[var(--border-medium)] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-blue-500">Google Gemini</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[9px] font-bold">
                          1M Context
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestProvider('gemini')}
                          disabled={testingProvider === 'gemini'}
                          className="px-2 py-1 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-input)] text-[10px] text-[var(--text-main)] font-medium transition cursor-pointer flex items-center gap-1"
                        >
                          <Zap className={`w-3 h-3 ${testingProvider === 'gemini' ? 'animate-spin' : ''}`} />
                          <span>Test & Detect</span>
                        </button>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-500 hover:underline"
                        >
                          Get Free Key &rarr;
                        </a>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Gemini 2.0 Flash, Gemini 1.5 Pro with huge 1,000,000 token context support.
                    </p>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] font-mono placeholder-[var(--text-muted)] focus:border-[var(--accent-color)] focus:outline-none"
                    />
                  </div>

                  {/* 4. Anthropic */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2 hover:border-[var(--border-medium)] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-orange-500">Anthropic Claude</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[9px] font-bold">
                          Claude 3.5
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestProvider('anthropic')}
                          disabled={testingProvider === 'anthropic'}
                          className="px-2 py-1 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-input)] text-[10px] text-[var(--text-main)] font-medium transition cursor-pointer flex items-center gap-1"
                        >
                          <Zap className={`w-3 h-3 ${testingProvider === 'anthropic' ? 'animate-spin' : ''}`} />
                          <span>Test & Detect</span>
                        </button>
                        <a
                          href="https://console.anthropic.com/settings/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-500 hover:underline"
                        >
                          Get Key &rarr;
                        </a>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Claude 3.5 Sonnet and Haiku for code architecture and prose.
                    </p>
                    <input
                      type="password"
                      placeholder="sk-ant-..."
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] font-mono placeholder-[var(--text-muted)] focus:border-[var(--accent-color)] focus:outline-none"
                    />
                  </div>

                  {/* 5. OpenRouter */}
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2 hover:border-[var(--border-medium)] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-purple-500">OpenRouter</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[9px] font-bold">
                          Multi-Model
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestProvider('openrouter')}
                          disabled={testingProvider === 'openrouter'}
                          className="px-2 py-1 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-input)] text-[10px] text-[var(--text-main)] font-medium transition cursor-pointer flex items-center gap-1"
                        >
                          <Zap className={`w-3 h-3 ${testingProvider === 'openrouter' ? 'animate-spin' : ''}`} />
                          <span>Test & Detect</span>
                        </button>
                        <a
                          href="https://openrouter.ai/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-500 hover:underline"
                        >
                          Get Key &rarr;
                        </a>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Unified gateway routing to 100+ models including DeepSeek R1 and Claude.
                    </p>
                    <input
                      type="password"
                      placeholder="sk-or-..."
                      value={openrouterKey}
                      onChange={(e) => setOpenrouterKey(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] font-mono placeholder-[var(--text-muted)] focus:border-[var(--accent-color)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. NOTIFICATIONS TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="font-semibold text-sm text-[var(--text-main)] border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
                  <span>Notifications</span>
                  <button
                    onClick={handleTriggerTestNotification}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar-hover)] border border-[var(--border-input)] text-xs text-[var(--text-main)] font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Volume1 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Test Notification & Chime</span>
                  </button>
                </div>

                {testNotifStatus && (
                  <div className="p-3 rounded-xl bg-[var(--accent-bg)] border border-[var(--accent-border)] text-xs text-[var(--text-main)] font-medium animate-in fade-in">
                    {testNotifStatus}
                  </div>
                )}
                
                <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="text-xs text-[var(--text-main)] font-medium">Task & Generation Alerts</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Notify you when long reasoning, code generation, or web search tasks finish.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={taskNotifications}
                    onChange={(e) => setTaskNotifications(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="text-xs text-[var(--text-main)] font-medium">Audio Chimes</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Play an audible sound chime when responses complete or voice begins.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundChime}
                    onChange={(e) => setSoundChime(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. PERSONALIZATION TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'personalization' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Base style and tone */}
                <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="text-xs text-[var(--text-main)] font-medium">Base style and tone</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Set the style and tone of how Guts AI responds to you.
                    </div>
                  </div>
                  <select
                    value={baseStyle}
                    onChange={(e) => setBaseStyle(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none cursor-pointer"
                  >
                    <option value="Default">Default</option>
                    <option value="Concise">Concise</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>

                {/* Characteristics Section */}
                <div className="space-y-2 pt-1 border-b border-[var(--border-subtle)] pb-3">
                  <div className="font-semibold text-xs text-[var(--text-main)]">Characteristics</div>
                  <div className="text-[11px] text-[var(--text-muted)] mb-2">
                    Choose additional customizations on top of your base style and tone.
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-[var(--text-main)]">Warm</span>
                    <select value={warmth} onChange={(e) => setWarmth(e.target.value)} className="px-3 py-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)]">
                      <option value="Default">Default</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-[var(--text-main)]">Enthusiastic</span>
                    <select value={enthusiastic} onChange={(e) => setEnthusiastic(e.target.value)} className="px-3 py-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)]">
                      <option value="Default">Default</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-[var(--text-main)]">Headers & Lists</span>
                    <select value={headersLists} onChange={(e) => setHeadersLists(e.target.value)} className="px-3 py-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)]">
                      <option value="Default">Default</option>
                      <option value="Always">Always</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-[var(--text-main)]">Emoji</span>
                    <select value={emojiLevel} onChange={(e) => setEmojiLevel(e.target.value)} className="px-3 py-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)]">
                      <option value="Default">Default</option>
                      <option value="Frequent">Frequent</option>
                    </select>
                  </div>
                </div>

                {/* Fast answers */}
                <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="text-xs text-[var(--text-main)] font-medium">Fast answers</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Skip web search and extra reasoning for instant knowledge retrieval.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={fastAnswers}
                    onChange={(e) => setFastAnswers(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Custom instructions */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-[var(--text-main)]">Custom instructions</div>
                    <button
                      onClick={handleSaveInstructions}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      {instructionsSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{instructionsSaved ? 'Saved to System' : 'Save Instructions'}</span>
                    </button>
                  </div>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={4}
                    placeholder="Tell Guts AI how you would like it to respond..."
                    className="w-full p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] resize-none leading-relaxed font-sans transition"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 5. VOICE TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'voice' && (
              <div className="space-y-6 animate-in fade-in text-center pt-2">
                <div className="font-semibold text-sm text-[var(--text-main)] text-left border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
                  <span>Voice Settings</span>
                  {isPlayingSample && (
                    <span className="text-[11px] text-indigo-500 flex items-center gap-1 animate-pulse">
                      <Volume2 className="w-3.5 h-3.5" /> Speaking sample...
                    </span>
                  )}
                </div>

                {/* Big Animated Orb & Carousel */}
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="relative cursor-pointer group" onClick={() => playVoiceSample(voices[currentVoiceIdx].name)}>
                    <div className={`w-36 h-36 rounded-full bg-gradient-to-tr ${voices[currentVoiceIdx].color} opacity-90 shadow-2xl blur-[1px] ${isPlayingSample ? 'animate-bounce scale-105' : 'animate-pulse'} flex items-center justify-center transition-all`} />
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition">
                      Tap to Preview
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 pt-1">
                    <button
                      onClick={() => handleVoiceChange((currentVoiceIdx - 1 + voices.length) % voices.length)}
                      className="p-2 rounded-full hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                      title="Previous voice"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div 
                      onClick={() => playVoiceSample(voices[currentVoiceIdx].name)}
                      className="cursor-pointer group"
                      title="Click to play sample"
                    >
                      <div className="font-bold text-base text-[var(--text-main)] group-hover:text-indigo-500 transition">{voices[currentVoiceIdx].name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{voices[currentVoiceIdx].desc} (Click to preview)</div>
                    </div>
                    <button
                      onClick={() => handleVoiceChange((currentVoiceIdx + 1) % voices.length)}
                      className="p-2 rounded-full hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                      title="Next voice"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Carousel Dots */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {voices.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === currentVoiceIdx ? 'bg-[var(--accent-color)] w-3 h-1.5' : 'bg-[var(--border-medium)]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Voice Model and Language Dropdowns */}
                <div className="space-y-3 text-left pt-2">
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-main)]">Model</span>
                    <select value={voiceModel} onChange={(e) => setVoiceModel(e.target.value)} className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none">
                      <option value="Live">Live (Real-time Fast Llama 3.2 3B)</option>
                      <option value="Turbo">Turbo (Fastest Streaming)</option>
                      <option value="Standard">Standard (High Accuracy)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-[var(--text-main)]">Language</span>
                    <select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)} className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-xs text-[var(--text-main)] focus:outline-none">
                      <option value="Auto-detect">Auto-detect</option>
                      <option value="English">English</option>
                      <option value="Urdu">Urdu</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 6. DATA CONTROLS TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'data_controls' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="font-semibold text-sm text-[var(--text-main)] border-b border-[var(--border-subtle)] pb-2">
                  Data controls
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-main)]">Improve the model for everyone</span>
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">On <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="text-xs text-[var(--text-main)]">Location</div>
                    <div className="text-[11px] text-[var(--text-muted)] max-w-md">
                      When enabled, your location helps provide local weather, news, and directions.
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs border border-[var(--border-input)]">
                    Turn on
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-main)]">Delete all chats</span>
                  <button 
                    onClick={handleClearHistory}
                    className="px-3.5 py-1.5 rounded-xl bg-transparent hover:bg-rose-500/10 border border-rose-500/40 text-rose-500 text-xs font-semibold cursor-pointer transition"
                  >
                    Delete all
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="text-xs text-[var(--text-main)]">Export data</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Download a complete JSON backup of chats, settings, and custom models.</div>
                  </div>
                  <button 
                    onClick={handleExportData}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] text-xs border border-[var(--border-input)] transition cursor-pointer font-medium"
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 7. STORAGE TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'storage' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="font-semibold text-sm text-[var(--text-main)] border-b border-[var(--border-subtle)] pb-2">
                  Storage
                </div>

                <div className="space-y-2">
                  <div className="font-medium text-xs text-[var(--text-main)]">{storageUsed}</div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div className="w-[1.5%] h-full bg-[var(--accent-color)] rounded-full" />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="font-semibold text-xs text-[var(--text-main)]">Manage storage</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Manage your library to free up storage</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer">
                      <div>
                        <div className="text-xs text-[var(--text-main)] font-medium">Files</div>
                        <div className="text-[10px] text-[var(--text-muted)]">852 KB • 8 files</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer">
                      <div>
                        <div className="text-xs text-[var(--text-main)] font-medium">Images</div>
                        <div className="text-[10px] text-[var(--text-muted)]">2.68 MB • 14 images</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 8. ACCOUNT TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'account' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="font-semibold text-sm text-[var(--text-main)] border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
                  <span>Account</span>
                  {user && (
                    <button
                      onClick={() => {
                        logout();
                        setActiveModal(null);
                      }}
                      className="px-3 py-1 rounded-xl bg-[var(--bg-card)] hover:bg-rose-500/10 border border-[var(--border-input)] text-xs text-rose-500 font-medium transition cursor-pointer"
                    >
                      Log out
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-main)]">Name</span>
                    <span className="text-xs text-[var(--text-sub)] font-medium">
                      {user?.displayName || 'Guest User'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-main)]">Username</span>
                    <span className="text-xs text-[var(--text-sub)]">
                      @{user?.username || 'guest'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-main)]">Email</span>
                    <span className="text-xs text-[var(--text-sub)] font-mono text-[11px]">
                      {user?.email || 'Not logged in'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-[var(--text-main)]">Delete account</span>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-1 rounded-xl bg-transparent hover:bg-rose-500/10 border border-rose-500/40 text-rose-500 text-xs font-semibold cursor-pointer transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* GPT Builder Profile Section */}
                <div className="pt-2 space-y-3 border-t border-[var(--border-subtle)]">
                  <div>
                    <div className="font-semibold text-xs text-[var(--text-main)]">GPT builder profile</div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                      Personalize your builder profile to connect with users of your GPTs.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] relative flex flex-col items-center justify-center text-center space-y-2">
                    <span className="absolute top-3 right-3 text-[10px] text-[var(--text-muted)]">Preview</span>
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)] shadow-xs">
                      <Box className="w-5 h-5 text-[var(--accent-color)]" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--text-main)]">PlaceholderGPT</div>
                      <div className="text-[10px] text-[var(--text-muted)]">By community builder 👤</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-start gap-2.5 text-[11px] text-[var(--text-sub)]">
                    <Info className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Complete verification to publish GPTs to everyone. Verify your profile in Account Settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 9. KEYBOARD TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'keyboard' && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <div className="font-semibold text-sm text-[var(--text-main)]">Keyboard</div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Shortcut key combinations for quick composer and app navigation.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="font-semibold text-xs text-[var(--text-main)] pb-1">Composer</div>

                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.sendMessage}
                        onChange={(e) => setShortcuts({ ...shortcuts, sendMessage: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-main)]">Send message or stop answering</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-input)] text-[11px] font-mono text-[var(--text-muted)]">
                      ↵
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.sendBackground}
                        onChange={(e) => setShortcuts({ ...shortcuts, sendBackground: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-main)]">Send message in background</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-input)] text-[11px] font-mono text-[var(--text-muted)]">
                      Ctrl + ↵
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.enableThinking}
                        onChange={(e) => setShortcuts({ ...shortcuts, enableThinking: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-main)]">Enable thinking</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-input)] text-[11px] font-mono text-[var(--text-muted)]">
                      Ctrl + Shift + M
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.toggleDictation}
                        onChange={(e) => setShortcuts({ ...shortcuts, toggleDictation: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-main)]">Toggle dictation</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-input)] text-[11px] font-mono text-[var(--text-muted)]">
                      Ctrl + Shift + D
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.addPhotosFiles}
                        onChange={(e) => setShortcuts({ ...shortcuts, addPhotosFiles: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-main)]">Add photos & files</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-input)] text-[11px] font-mono text-[var(--text-muted)]">
                      Ctrl + U
                    </kbd>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                  <div className="font-semibold text-xs text-[var(--text-main)] pb-1">App</div>

                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.openNewChat}
                        onChange={(e) => setShortcuts({ ...shortcuts, openNewChat: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-main)]">Open new chat</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-input)] text-[11px] font-mono text-[var(--text-muted)]">
                      Ctrl + Shift + O
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.toggleSidebar}
                        onChange={(e) => setShortcuts({ ...shortcuts, toggleSidebar: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-main)]">Toggle sidebar</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-input)] text-[11px] font-mono text-[var(--text-muted)]">
                      Ctrl + Shift + S
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.deleteChat}
                        onChange={(e) => setShortcuts({ ...shortcuts, deleteChat: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-main)]">Delete chat</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-input)] text-[11px] font-mono text-[var(--text-muted)]">
                      Ctrl + Shift + ⌫
                    </kbd>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={() => setShortcuts(defaultShortcuts)}
                    className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] font-medium text-xs transition cursor-pointer border border-[var(--border-input)]"
                  >
                    Restore defaults
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
