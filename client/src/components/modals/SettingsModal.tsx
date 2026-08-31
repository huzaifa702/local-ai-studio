import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Settings as SettingsIcon, 
  Bell, 
  Clock, 
  Puzzle, 
  Volume2, 
  CreditCard, 
  Layers, 
  BarChart2, 
  Database, 
  HardDrive, 
  Shield, 
  Key, 
  UserCheck, 
  User, 
  Keyboard, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Trash2, 
  Archive, 
  ExternalLink,
  VolumeX,
  Share2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';
import type { UserSettings } from '../../types';

export const SettingsModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    settings, 
    updateSettings, 
    clearAllConversations,
    conversations
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<string>('general');
  const [searchFilter, setSearchFilter] = useState('');

  // General Tab States
  const [appearance, setAppearance] = useState<'Dark' | 'Light' | 'System'>('Dark');
  const [contrast, setContrast] = useState<'Default' | 'Increased'>('Increased');
  const [accentColor, setAccentColor] = useState<'Purple' | 'Indigo' | 'Emerald' | 'Blue' | 'Amber'>('Purple');
  const [language, setLanguage] = useState<'Auto-detect' | 'English' | 'Urdu' | 'Spanish'>('Auto-detect');
  const [higherIntelligence, setHigherIntelligence] = useState(true);
  const [enableDictation, setEnableDictation] = useState(true);

  // Notification Tab States
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [soundChime, setSoundChime] = useState(true);

  // Personalization Tab States
  const [baseStyle, setBaseStyle] = useState('Default');
  const [warmth, setWarmth] = useState('Default');
  const [enthusiastic, setEnthusiastic] = useState('Default');
  const [headersLists, setHeadersLists] = useState('Default');
  const [emojiLevel, setEmojiLevel] = useState('Default');
  const [fastAnswers, setFastAnswers] = useState(true);
  const [customInstructions, setCustomInstructions] = useState(
    'Clear reasoning, and actionable feedback. Think and respond like a no-nonsense coach or a brutal friend who is focused on making me better. Push back whenever necessary, and never feed sugarcoated advice.'
  );

  // Voice Tab States
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

  // Storage Tab States
  const [storageUsed] = useState('3.51 MB of 512 MB used');

  if (activeModal !== 'settings') return null;

  const tabsList = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'personalization', label: 'Personalization', icon: Clock },
    { id: 'plugins', label: 'Plugins', icon: Puzzle },
    { id: 'voice', label: 'Voice', icon: Volume2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'usage', label: 'Usage', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'data_controls', label: 'Data controls', icon: Database },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'security', label: 'Security and login', icon: Key },
    { id: 'parental', label: 'Parental controls', icon: UserCheck },
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-4xl h-[620px] flex rounded-2xl bg-[#171717] border border-[#2e2e2e] shadow-2xl overflow-hidden text-xs text-[#d1d5db]">
        {/* Left Settings Sidebar */}
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

          {/* Navigation Tabs List */}
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
            {/* 1. GENERAL TAB (Screenshot 1) */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'general' && (
              <div className="space-y-5 animate-in fade-in">
                {/* MFA Banner (Exact Match to Screenshot 1) */}
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
                      onChange={(e) => setAppearance(e.target.value as any)}
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
                      onChange={(e) => setContrast(e.target.value as any)}
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
                      onChange={(e) => setAccentColor(e.target.value as any)}
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
                      onChange={(e) => setLanguage(e.target.value as any)}
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
                        ChatGPT can automatically use a higher intelligence setting when you ask a complex question.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={higherIntelligence}
                      onChange={(e) => setHigherIntelligence(e.target.checked)}
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
                      onChange={(e) => setEnableDictation(e.target.checked)}
                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. NOTIFICATIONS TAB (User Voice Request) */}
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
            {/* 3. PERSONALIZATION TAB (Screenshot 2) */}
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

                {/* Custom instructions text area */}
                <div className="space-y-1.5 pt-1">
                  <div className="font-semibold text-xs text-white">Custom instructions</div>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-2xl bg-[#0f0f0f] border border-[#2a2a2a] text-xs text-white focus:outline-none focus:border-[#444] resize-none leading-relaxed font-sans"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. VOICE TAB (Screenshot 3) */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'voice' && (
              <div className="space-y-6 animate-in fade-in text-center pt-2">
                <div className="font-semibold text-sm text-white text-left border-b border-[#262626] pb-2">
                  Voice
                </div>

                {/* Big Animated Orb & Carousel (Exact Match to Screenshot 3) */}
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="relative">
                    <div className={`w-36 h-36 rounded-full bg-gradient-to-tr ${voices[currentVoiceIdx].color} opacity-90 shadow-2xl blur-[1px] animate-pulse flex items-center justify-center`} />
                  </div>

                  <div className="flex items-center justify-center gap-6 pt-1">
                    <button
                      onClick={() => setCurrentVoiceIdx((currentVoiceIdx - 1 + voices.length) % voices.length)}
                      className="p-2 rounded-full hover:bg-[#262626] text-[#a3a3a3] hover:text-white transition cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="font-bold text-base text-white">{voices[currentVoiceIdx].name}</div>
                      <div className="text-xs text-[#737373]">{voices[currentVoiceIdx].desc}</div>
                    </div>
                    <button
                      onClick={() => setCurrentVoiceIdx((currentVoiceIdx + 1) % voices.length)}
                      className="p-2 rounded-full hover:bg-[#262626] text-[#a3a3a3] hover:text-white transition cursor-pointer"
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
            {/* 5. DATA CONTROLS TAB (Screenshot 4) */}
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
                  <button className="px-3.5 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white text-xs border border-[#383838]">
                    Export
                  </button>
                </div>

                {/* Marketing privacy */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-[#e5e7eb]">Marketing privacy</span>
                  <ChevronRight className="w-4 h-4 text-[#737373]" />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 6. STORAGE TAB (Screenshot 5) */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'storage' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="font-semibold text-sm text-white border-b border-[#262626] pb-2">
                  Storage
                </div>

                {/* Storage Bar (Exact Match to Screenshot 5) */}
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

            {/* Other Tabs Fallback */}
            {!['general', 'notifications', 'personalization', 'voice', 'data_controls', 'storage'].includes(activeTab) && (
              <div className="py-12 text-center text-[#737373] text-xs">
                {activeTab.toUpperCase()} settings are configured and active.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
