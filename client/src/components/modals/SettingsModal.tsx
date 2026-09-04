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
  CornerDownLeft, 
  Sparkles,
  Check
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
    conversations
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<string>('general');
  const [searchFilter, setSearchFilter] = useState('');

  // 1. General Tab States synced with store
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

  // Handlers for General Tab
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

  const handleHigherIntelligenceChange = (val: boolean) => {
    setHigherIntelligence(val);
    updateSettings({ higherIntelligence: val });
  };

  const handleEnableDictationChange = (val: boolean) => {
    setEnableDictation(val);
    updateSettings({ enableDictation: val });
  };

  // 2. Notification Tab States
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [soundChime, setSoundChime] = useState(true);

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

  const playVoiceSample = (name: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`Hello, I'm ${name}, your voice assistant on Guts AI.`);
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    }
  };

  const handleVoiceChange = (idx: number) => {
    setCurrentVoiceIdx(idx);
    const v = voices[idx];
    updateSettings({ voiceVoice: v.name.toLowerCase() });
    playVoiceSample(v.name);
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      user,
      settings,
      conversations
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guts_ai_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 5. Storage Tab States
  const [storageUsed] = useState('3.51 MB of 512 MB used');

  // 6. Keyboard Shortcut States (Exact Match to Screenshots 2 & 3)
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
  };

  if (activeModal !== 'settings') return null;

  // Tabs List with API Keys & Models
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-4xl h-[620px] flex rounded-2xl bg-[#171717] border border-[#2e2e2e] shadow-2xl overflow-hidden text-xs text-[#d1d5db]">
        {/* Left Settings Sidebar (Strictly 8 Options) */}
        <div className="w-64 border-r border-[#262626] bg-[#121212] flex flex-col p-3 shrink-0">
          {/* Top Close Button & Search */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373]" />
              <input
                type="text"
                placeholder="Search settings"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-[#1e1e1e] border border-transparent focus:border-[#383838] text-xs text-white placeholder-[#737373] focus:outline-none"
              />
            </div>
          </div>

          {/* Navigation Tabs List (Exact 8 Options) */}
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {filteredTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left font-normal text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-[#262626] text-white font-medium'
                      : 'text-[#9ca3af] hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#a3a3a3]" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Settings Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#171717] relative">
          {/* Top Right Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setActiveModal(null)}
              className="p-1 rounded-lg text-[#737373] hover:text-white transition cursor-pointer"
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
                {/* MFA Banner */}
                <div className="p-4 rounded-2xl bg-[#0f0f0f] border border-[#2a2a2a] space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white text-xs">Secure your account</span>
                  </div>
                  <p className="text-[11px] text-[#8e8e8e] leading-relaxed">
                    Add multi-factor authentication (MFA), like a text message or authenticator app, to help protect your account when logging in.
                  </p>
                  <button
                    onClick={() => setActiveModal('auth')}
                    className="px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white font-medium text-xs transition cursor-pointer border border-[#383838]"
                  >
                    Set up MFA
                  </button>
                </div>

                {/* Settings Rows */}
                <div className="space-y-4 pt-1">
                  {/* Appearance */}
                  <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                    <span className="text-xs text-[#e5e7eb]">Appearance</span>
                    <select
                      value={appearance}
                      onChange={(e) => handleAppearanceChange(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Dark">Dark</option>
                      <option value="Light">Light</option>
                      <option value="System">System</option>
                    </select>
                  </div>

                  {/* Contrast */}
                  <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                    <span className="text-xs text-[#e5e7eb]">Contrast</span>
                    <select
                      value={contrast}
                      onChange={(e) => handleContrastChange(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Default">Default</option>
                      <option value="Increased">Increased</option>
                    </select>
                  </div>

                  {/* Accent color */}
                  <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                    <span className="text-xs text-[#e5e7eb]">Accent color</span>
                    <select
                      value={accentColor}
                      onChange={(e) => handleAccentColorChange(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Purple">🟣 Purple</option>
                      <option value="Indigo">🔵 Indigo</option>
                      <option value="Emerald">🟢 Emerald</option>
                      <option value="Blue">🔷 Blue</option>
                      <option value="Amber">🟠 Amber</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                    <span className="text-xs text-[#e5e7eb]">Language</span>
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Auto-detect">Auto-detect</option>
                      <option value="English">English</option>
                      <option value="Urdu">Urdu (اردو)</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>

                  {/* Higher intelligence */}
                  <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                    <div>
                      <div className="text-xs text-[#e5e7eb]">Higher intelligence</div>
                      <div className="text-[11px] text-[#737373]">
                        Guts AI automatically selects the optimal reasoning model when you ask a complex question.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={higherIntelligence}
                      onChange={(e) => handleHigherIntelligenceChange(e.target.checked)}
                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* Enable Dictation */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-xs text-[#e5e7eb]">Enable Dictation</div>
                      <div className="text-[11px] text-[#737373]">
                        Use dictation in the chat composer.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableDictation}
                      onChange={(e) => handleEnableDictationChange(e.target.checked)}
                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* API KEYS & CLOUD MODELS TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'models_keys' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>API Keys & Cloud Intelligence</span>
                    </h3>
                    <p className="text-[11px] text-[#8e8e8e] mt-0.5">
                      Connect ultra-fast cloud providers (Groq 300+ tok/s, OpenAI, Google Gemini, Anthropic) or run 100% offline with Ollama.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveApiKeys}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    {keysSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>

                {/* Preferred Default Model Selector */}
                <div className="p-4 rounded-2xl bg-[#121212] border border-[#2a2a2a] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Default Assistant Model</div>
                      <div className="text-[11px] text-[#737373]">Primary model used for new conversations</div>
                    </div>
                    <select
                      value={defaultModelChoice}
                      onChange={(e) => setDefaultModelChoice(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="llama3.2:3b">⚡ Llama 3.2 3B (Local Ultra-Fast)</option>
                      <option value="ox-alpha">🌟 OX-Alpha (Auto-Smart Omni)</option>
                      <option value="qwen2.5-coder:7b">💻 Qwen 2.5 Coder 7B (Local Coding)</option>
                      <option value="deepseek-r1:7b">🧠 DeepSeek-R1 7B (Local Reasoning)</option>
                      <option value="llama-3.3-70b-versatile">🚀 Groq Llama 3.3 70B (300 tok/s Cloud)</option>
                      <option value="gpt-4o">✨ OpenAI GPT-4o (Cloud Multimodal)</option>
                      <option value="gemini-1.5-flash">🌐 Google Gemini 1.5 Flash (Cloud 1M Context)</option>
                    </select>
                  </div>
                </div>

                {/* Cloud API Keys Grid */}
                <div className="space-y-3.5 pt-1">
                  {/* 1. Groq */}
                  <div className="p-3.5 rounded-2xl bg-[#121212] border border-[#262626] space-y-1.5 hover:border-[#383838] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-amber-400">Groq Cloud</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                          300 tok/s
                        </span>
                      </div>
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        Get Free Key &rarr;
                      </a>
                    </div>
                    <p className="text-[11px] text-[#737373]">
                      Ultra-fast LPUs for instant reasoning, Llama 3.3 70B Versatile, and Mixtral 8x7B.
                    </p>
                    <input
                      type="password"
                      placeholder="gsk_..."
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-[#333333] text-xs text-white font-mono placeholder-[#555] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* 2. OpenAI */}
                  <div className="p-3.5 rounded-2xl bg-[#121212] border border-[#262626] space-y-1.5 hover:border-[#383838] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-emerald-400">OpenAI</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                          GPT-4o / o1
                        </span>
                      </div>
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        Get Key &rarr;
                      </a>
                    </div>
                    <p className="text-[11px] text-[#737373]">
                      Standard for high-accuracy reasoning, GPT-4o, and GPT-4o-mini.
                    </p>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-[#333333] text-xs text-white font-mono placeholder-[#555] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* 3. Google Gemini */}
                  <div className="p-3.5 rounded-2xl bg-[#121212] border border-[#262626] space-y-1.5 hover:border-[#383838] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-blue-400">Google Gemini</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[9px] font-bold">
                          1M Context
                        </span>
                      </div>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        Get Free Key &rarr;
                      </a>
                    </div>
                    <p className="text-[11px] text-[#737373]">
                      Gemini 1.5 Flash and Gemini 1.5 Pro with massive 1,000,000-token context support.
                    </p>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-[#333333] text-xs text-white font-mono placeholder-[#555] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* 4. Anthropic */}
                  <div className="p-3.5 rounded-2xl bg-[#121212] border border-[#262626] space-y-1.5 hover:border-[#383838] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-orange-400">Anthropic Claude</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 text-[9px] font-bold">
                          Claude 3.5
                        </span>
                      </div>
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        Get Key &rarr;
                      </a>
                    </div>
                    <p className="text-[11px] text-[#737373]">
                      Claude 3.5 Sonnet and Haiku for nuanced writing and code architecture.
                    </p>
                    <input
                      type="password"
                      placeholder="sk-ant-..."
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-[#333333] text-xs text-white font-mono placeholder-[#555] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* 5. OpenRouter */}
                  <div className="p-3.5 rounded-2xl bg-[#121212] border border-[#262626] space-y-1.5 hover:border-[#383838] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-purple-400">OpenRouter</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                          Multi-Model
                        </span>
                      </div>
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        Get Key &rarr;
                      </a>
                    </div>
                    <p className="text-[11px] text-[#737373]">
                      Unified gateway routing to 100+ AI models including DeepSeek R1 and Claude 3.5.
                    </p>
                    <input
                      type="password"
                      placeholder="sk-or-..."
                      value={openrouterKey}
                      onChange={(e) => setOpenrouterKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-[#333333] text-xs text-white font-mono placeholder-[#555] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. NOTIFICATIONS TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="font-semibold text-sm text-white border-b border-[#262626] pb-2">
                  Notifications
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <div>
                    <div className="text-xs text-[#e5e7eb]">Task & Generation Alerts</div>
                    <div className="text-[11px] text-[#737373]">
                      Notify you when long reasoning, coding, or web search tasks finish.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={taskNotifications}
                    onChange={(e) => setTaskNotifications(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <div>
                    <div className="text-xs text-[#e5e7eb]">Audio Chimes</div>
                    <div className="text-[11px] text-[#737373]">
                      Play an audible sound chime when responses complete.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundChime}
                    onChange={(e) => setSoundChime(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. PERSONALIZATION TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'personalization' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Base style and tone */}
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <div>
                    <div className="text-xs text-[#e5e7eb]">Base style and tone</div>
                    <div className="text-[11px] text-[#737373]">
                      Set the style and tone of how ChatGPT responds to you. This doesn't impact ChatGPT's capabilities.
                    </div>
                  </div>
                  <select
                    value={baseStyle}
                    onChange={(e) => setBaseStyle(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Default">Default</option>
                    <option value="Concise">Concise</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>

                {/* Characteristics Section */}
                <div className="space-y-2 pt-1 border-b border-[#242424] pb-3">
                  <div className="font-semibold text-xs text-white">Characteristics</div>
                  <div className="text-[11px] text-[#737373] mb-2">
                    Choose additional customizations on top of your base style and tone.
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-[#e5e7eb]">Warm</span>
                    <select value={warmth} onChange={(e) => setWarmth(e.target.value)} className="px-3 py-1 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white">
                      <option value="Default">Default</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-[#e5e7eb]">Enthusiastic</span>
                    <select value={enthusiastic} onChange={(e) => setEnthusiastic(e.target.value)} className="px-3 py-1 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white">
                      <option value="Default">Default</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-[#e5e7eb]">Headers & Lists</span>
                    <select value={headersLists} onChange={(e) => setHeadersLists(e.target.value)} className="px-3 py-1 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white">
                      <option value="Default">Default</option>
                      <option value="Always">Always</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-[#e5e7eb]">Emoji</span>
                    <select value={emojiLevel} onChange={(e) => setEmojiLevel(e.target.value)} className="px-3 py-1 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white">
                      <option value="Default">Default</option>
                      <option value="Frequent">Frequent</option>
                    </select>
                  </div>
                </div>

                {/* Fast answers */}
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <div>
                    <div className="text-xs text-[#e5e7eb]">Fast answers</div>
                    <div className="text-[11px] text-[#737373]">
                      ChatGPT can sometimes use its general knowledge to give fast, in-depth answers. These aren't personalized and don't use your memory.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={fastAnswers}
                    onChange={(e) => setFastAnswers(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Custom instructions */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-white">Custom instructions</div>
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
                    className="w-full p-3 rounded-2xl bg-[#0f0f0f] border border-[#2a2a2a] text-xs text-white focus:outline-none focus:border-[#444] resize-none leading-relaxed font-sans"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. VOICE TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'voice' && (
              <div className="space-y-6 animate-in fade-in text-center pt-2">
                <div className="font-semibold text-sm text-white text-left border-b border-[#262626] pb-2">
                  Voice
                </div>

                {/* Big Animated Orb & Carousel */}
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="relative">
                    <div className={`w-36 h-36 rounded-full bg-gradient-to-tr ${voices[currentVoiceIdx].color} opacity-90 shadow-2xl blur-[1px] animate-pulse flex items-center justify-center`} />
                  </div>

                  <div className="flex items-center justify-center gap-6 pt-1">
                    <button
                      onClick={() => handleVoiceChange((currentVoiceIdx - 1 + voices.length) % voices.length)}
                      className="p-2 rounded-full hover:bg-[#262626] text-[#a3a3a3] hover:text-white transition cursor-pointer"
                      title="Previous voice"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div 
                      onClick={() => playVoiceSample(voices[currentVoiceIdx].name)}
                      className="cursor-pointer group"
                      title="Click to play sample"
                    >
                      <div className="font-bold text-base text-white group-hover:text-indigo-400 transition">{voices[currentVoiceIdx].name}</div>
                      <div className="text-xs text-[#737373]">{voices[currentVoiceIdx].desc} (Click to preview)</div>
                    </div>
                    <button
                      onClick={() => handleVoiceChange((currentVoiceIdx + 1) % voices.length)}
                      className="p-2 rounded-full hover:bg-[#262626] text-[#a3a3a3] hover:text-white transition cursor-pointer"
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
                          i === currentVoiceIdx ? 'bg-white w-2 h-2' : 'bg-[#404040]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Voice Model and Language Dropdowns */}
                <div className="space-y-3 text-left pt-2">
                  <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                    <span className="text-xs text-[#e5e7eb]">Model</span>
                    <select value={voiceModel} onChange={(e) => setVoiceModel(e.target.value)} className="px-3 py-1.5 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white">
                      <option value="Live">Live</option>
                      <option value="Turbo">Turbo</option>
                      <option value="Standard">Standard</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-[#e5e7eb]">Language</span>
                    <select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)} className="px-3 py-1.5 rounded-xl bg-[#262626] border border-[#383838] text-xs text-white">
                      <option value="Auto-detect">Auto-detect</option>
                      <option value="English">English</option>
                      <option value="Urdu">Urdu</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 5. DATA CONTROLS TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'data_controls' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="font-semibold text-sm text-white border-b border-[#262626] pb-2">
                  Data controls
                </div>

                {/* Improve the model */}
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <span className="text-xs text-[#e5e7eb]">Improve the model for everyone</span>
                  <span className="text-xs text-[#737373] flex items-center gap-1">On <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>

                {/* Location */}
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <div>
                    <div className="text-xs text-[#e5e7eb]">Location</div>
                    <div className="text-[11px] text-[#737373] max-w-md">
                      When enabled, your location helps ChatGPT provide more relevant information, like local recommendations, news, and weather.
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white font-medium text-xs border border-[#383838]">
                    Turn on
                  </button>
                </div>

                {/* Information shared with apps */}
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <span className="text-xs text-[#e5e7eb]">Information shared with apps</span>
                  <ChevronRight className="w-4 h-4 text-[#737373]" />
                </div>

                {/* Shared links */}
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <span className="text-xs text-[#e5e7eb]">Shared links</span>
                  <button className="px-3.5 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white text-xs border border-[#383838]">
                    Manage
                  </button>
                </div>

                {/* Archived chats */}
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <span className="text-xs text-[#e5e7eb]">Archived chats</span>
                  <button className="px-3.5 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white text-xs border border-[#383838]">
                    Manage
                  </button>
                </div>

                {/* Archive all chats */}
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <span className="text-xs text-[#e5e7eb]">Archive all chats</span>
                  <button className="px-3.5 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white text-xs border border-[#383838]">
                    Archive all
                  </button>
                </div>

                {/* Delete all chats (Red button) */}
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <span className="text-xs text-[#e5e7eb]">Delete all chats</span>
                  <button 
                    onClick={handleClearHistory}
                    className="px-3.5 py-1.5 rounded-xl bg-transparent hover:bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs font-semibold"
                  >
                    Delete all
                  </button>
                </div>

                {/* Export data */}
                <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                  <span className="text-xs text-[#e5e7eb]">Export data</span>
                  <button 
                    onClick={handleExportData}
                    className="px-3.5 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white text-xs border border-[#383838] transition cursor-pointer"
                  >
                    Export
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 6. STORAGE TAB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'storage' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="font-semibold text-sm text-white border-b border-[#262626] pb-2">
                  Storage
                </div>

                {/* Storage Bar */}
                <div className="space-y-2">
                  <div className="font-medium text-xs text-white">{storageUsed}</div>
                  <div className="w-full h-1.5 rounded-full bg-[#262626] overflow-hidden">
                    <div className="w-[1.5%] h-full bg-white rounded-full" />
                  </div>
                </div>

                {/* Manage Storage Section */}
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="font-semibold text-xs text-white">Manage storage</div>
                    <div className="text-[11px] text-[#737373]">Manage your library to free up storage</div>
                  </div>

                  <div className="space-y-2">
                    {/* Files */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0f0f0f] border border-[#262626] hover:bg-[#141414] transition cursor-pointer">
                      <div>
                        <div className="text-xs text-[#e5e7eb] font-medium">Files</div>
                        <div className="text-[10px] text-[#737373]">852 KB • 8 files</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#737373]" />
                    </div>

                    {/* Images */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0f0f0f] border border-[#262626] hover:bg-[#141414] transition cursor-pointer">
                      <div>
                        <div className="text-xs text-[#e5e7eb] font-medium">Images</div>
                        <div className="text-[10px] text-[#737373]">2.68 MB • 14 images</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#737373]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 7. ACCOUNT TAB (Exact Match to Screenshot 1 of Batch 2) */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'account' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="font-semibold text-sm text-white border-b border-[#262626] pb-2">
                  Account
                </div>

                {/* Account Details Rows */}
                <div className="space-y-3">
                  {/* Name */}
                  <div className="flex items-center justify-between py-2 border-b border-[#242424]">
                    <span className="text-xs text-[#e5e7eb]">Name</span>
                    <span className="text-xs text-[#a3a3a3] font-medium">
                      {user?.displayName || 'huzaifa rajput'}
                    </span>
                  </div>

                  {/* Username */}
                  <div className="flex items-center justify-between py-2 border-b border-[#242424] cursor-pointer hover:bg-[#1f1f1f] px-1 rounded-xl transition">
                    <span className="text-xs text-[#e5e7eb]">Username</span>
                    <span className="text-xs text-[#a3a3a3] flex items-center gap-1">
                      @{user?.username || 'hr1034072'} <ChevronRight className="w-3.5 h-3.5 text-[#737373]" />
                    </span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between py-2 border-b border-[#242424] cursor-pointer hover:bg-[#1f1f1f] px-1 rounded-xl transition">
                    <span className="text-xs text-[#e5e7eb]">Email</span>
                    <span className="text-xs text-[#a3a3a3] flex items-center gap-1 font-mono text-[11px]">
                      {user?.email || 'hr1034072@gmail.com'} <ChevronRight className="w-3.5 h-3.5 text-[#737373]" />
                    </span>
                  </div>

                  {/* Delete Account */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-[#e5e7eb]">Delete account</span>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-1 rounded-xl bg-transparent hover:bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs font-semibold cursor-pointer transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* GPT Builder Profile Section (Exact Match to Screenshot) */}
                <div className="pt-2 space-y-3 border-t border-[#262626]">
                  <div>
                    <div className="font-semibold text-xs text-white">GPT builder profile</div>
                    <p className="text-[11px] text-[#737373] mt-1 leading-relaxed">
                      Personalize your builder profile to connect with users of your GPTs. These settings apply to publicly shared GPTs.
                    </p>
                  </div>

                  {/* Placeholder GPT Preview Card */}
                  <div className="p-4 rounded-2xl bg-[#0f0f0f] border border-[#262626] relative flex flex-col items-center justify-center text-center space-y-2">
                    <span className="absolute top-3 right-3 text-[10px] text-[#737373]">Preview</span>
                    <div className="w-9 h-9 rounded-xl bg-[#262626] flex items-center justify-center text-white shadow-sm">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">PlaceholderGPT</div>
                      <div className="text-[10px] text-[#737373]">By community builder 👤</div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-3.5 rounded-2xl bg-[#0f0f0f] border border-[#262626] flex items-start gap-2.5 text-[11px] text-[#8e8e8e]">
                    <Info className="w-4 h-4 text-[#737373] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Complete verification to publish GPTs to everyone. Verify your identity by adding billing details or verifying your profile.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 8. KEYBOARD TAB (Exact Match to Screenshots 2 & 3 of Batch 2) */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'keyboard' && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <div className="font-semibold text-sm text-white">Keyboard</div>
                  <p className="text-[11px] text-[#737373] mt-1">
                    To change a shortcut, select the key combination, and then type the new keys.
                  </p>
                </div>

                {/* Composer Section */}
                <div className="space-y-3">
                  <div className="font-semibold text-xs text-white pb-1">Composer</div>

                  {/* Send message */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.sendMessage}
                        onChange={(e) => setShortcuts({ ...shortcuts, sendMessage: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Send message or stop answeri...</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      ↵
                    </kbd>
                  </div>

                  {/* Send in background */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.sendBackground}
                        onChange={(e) => setShortcuts({ ...shortcuts, sendBackground: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Send message in background</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + ↵
                    </kbd>
                  </div>

                  {/* Enable thinking */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.enableThinking}
                        onChange={(e) => setShortcuts({ ...shortcuts, enableThinking: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Enable thinking</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + Shift + M
                    </kbd>
                  </div>

                  {/* Toggle dictation */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.toggleDictation}
                        onChange={(e) => setShortcuts({ ...shortcuts, toggleDictation: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Toggle dictation</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + Shift + D
                    </kbd>
                  </div>

                  {/* Add photos & files */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.addPhotosFiles}
                        onChange={(e) => setShortcuts({ ...shortcuts, addPhotosFiles: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Add photos & files</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + U
                    </kbd>
                  </div>
                </div>

                {/* App Section */}
                <div className="space-y-3 pt-2 border-t border-[#242424]">
                  <div className="font-semibold text-xs text-white pb-1">App</div>

                  {/* Open new chat */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.openNewChat}
                        onChange={(e) => setShortcuts({ ...shortcuts, openNewChat: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Open new chat</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + Shift + O
                    </kbd>
                  </div>

                  {/* Show shortcuts */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.showShortcuts}
                        onChange={(e) => setShortcuts({ ...shortcuts, showShortcuts: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Show shortcuts</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + /
                    </kbd>
                  </div>

                  {/* Search */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.search}
                        onChange={(e) => setShortcuts({ ...shortcuts, search: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Search</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + K
                    </kbd>
                  </div>

                  {/* Toggle dev mode */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.toggleDevMode}
                        onChange={(e) => setShortcuts({ ...shortcuts, toggleDevMode: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Toggle dev mode</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + .
                    </kbd>
                  </div>

                  {/* Toggle sidebar */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.toggleSidebar}
                        onChange={(e) => setShortcuts({ ...shortcuts, toggleSidebar: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Toggle sidebar</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + Shift + S
                    </kbd>
                  </div>

                  {/* Set custom instructions */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.setCustomInstructions}
                        onChange={(e) => setShortcuts({ ...shortcuts, setCustomInstructions: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Set custom instructions</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + Shift + I
                    </kbd>
                  </div>

                  {/* Copy last code block */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.copyLastCodeBlock}
                        onChange={(e) => setShortcuts({ ...shortcuts, copyLastCodeBlock: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Copy last code block</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + Shift + ;
                    </kbd>
                  </div>

                  {/* Delete chat */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shortcuts.deleteChat}
                        onChange={(e) => setShortcuts({ ...shortcuts, deleteChat: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-[#e5e7eb]">Delete chat</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-[#262626] border border-[#383838] text-[11px] font-mono text-[#a3a3a3]">
                      Ctrl + Shift + ⌫
                    </kbd>
                  </div>
                </div>

                {/* Restore Defaults Button (Exact Match to Screenshot) */}
                <div className="flex justify-end pt-3">
                  <button
                    onClick={() => setShortcuts(defaultShortcuts)}
                    className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-white font-medium text-xs transition cursor-pointer border border-[#383838]"
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
