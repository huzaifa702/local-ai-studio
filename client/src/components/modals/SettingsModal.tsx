import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Sliders, 
  UserCheck, 
  Cpu, 
  ShieldCheck, 
  Trash2, 
  Check, 
  Save, 
  Sparkles, 
  Bell, 
  Globe, 
  KeyRound, 
  Eye, 
  HardDrive,
  Brain,
  AlertTriangle
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
    user,
    setUser,
    conversations,
    memories,
    logout
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'general' | 'personalization' | 'model' | 'security'>('general');
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [savedToast, setSavedToast] = useState(false);

  // General tab state
  const [accentColor, setAccentColor] = useState('indigo');
  const [language, setLanguage] = useState('English');
  const [higherIntelligence, setHigherIntelligence] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Personalization tab state
  const [customInstructions, setCustomInstructions] = useState(
    settings.systemPrompt || 'You are OX-Alpha inside Guts AI, an intelligent, concise, and ultra-capable private AI assistant.'
  );
  const [responseStyle, setResponseStyle] = useState<'concise' | 'detailed' | 'code' | 'friendly'>('concise');

  // Security tab state
  const [displayName, setDisplayName] = useState(user?.displayName || 'huzaifa rajput');
  const [emailInput, setEmailInput] = useState(user?.email || 'huzaifa.verified@gmail.com');
  const [githubLinked, setGithubLinked] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (activeModal !== 'settings') return null;

  const handleSave = async () => {
    await updateSettings({
      ...formData,
      systemPrompt: customInstructions
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const u = await api.updateProfile({
        displayName: displayName.trim(),
        email: emailInput.trim()
      });
      setUser(u);
      setStatusMessage('Profile information updated successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage('Failed to update profile.');
    }
  };

  const handleSendOtpTest = async () => {
    try {
      const res = await api.sendEmailOtp(emailInput.trim().toLowerCase());
      setOtpSent(true);
      setStatusMessage(`6-digit verification code generated: ${res.otpCode || 'Check terminal'}`);
    } catch (e: any) {
      setStatusMessage('Failed to send OTP code.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your local account and all conversation data? This action cannot be undone.')) {
      await clearAllConversations();
      logout();
      setActiveModal(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Guts AI Settings</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Configure system preferences, OX-Alpha model, and account security</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Tabs Navigation (Exact User Specification) */}
        <div className="flex border-b border-[var(--border-subtle)] px-6 bg-[var(--bg-main)]/50 text-xs overflow-x-auto gap-2">
          {[
            { id: 'general', label: 'General', icon: Sliders },
            { id: 'personalization', label: 'Personalization', icon: UserCheck },
            { id: 'model', label: 'Model & Usage', icon: Cpu },
            { id: 'security', label: 'Security & Login', icon: ShieldCheck }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-3 border-b-2 font-medium transition cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-[var(--text-secondary)]">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 1: General (System Appearance, Accent, Language, Detection, Notifications) */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Appearance Mode */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  System Appearance
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'dark', label: 'Dark Mode' },
                    { id: 'light', label: 'Light Mode' },
                    { id: 'oled', label: 'OLED Black' },
                    { id: 'contrast', label: 'High Contrast' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setFormData({ ...formData, theme: item.id as any })}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                        formData.theme === item.id || (item.id === 'dark' && formData.theme !== 'light')
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 font-semibold shadow-sm'
                          : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2.5">
                  {[
                    { id: 'indigo', color: '#6366f1', name: 'Indigo' },
                    { id: 'cyan', color: '#06b6d4', name: 'Cyan' },
                    { id: 'emerald', color: '#10b981', name: 'Emerald' },
                    { id: 'amber', color: '#f59e0b', name: 'Amber' },
                    { id: 'violet', color: '#8b5cf6', name: 'Violet' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setAccentColor(c.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer border-2 ${
                        accentColor === c.id ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    >
                      {accentColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selector */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Language
                </label>
                <div className="relative max-w-xs">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="English">English (United States)</option>
                    <option value="Urdu">Urdu (اردو)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Arabic">Arabic (العربية)</option>
                    <option value="Chinese">Chinese (Simplified)</option>
                  </select>
                </div>
              </div>

              {/* Higher Intelligence Enabled Detection */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                <div>
                  <div className="font-semibold text-[var(--text-primary)] text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Higher Intelligence Auto-Detection</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Automatically triggers DeepSeek-R1 reasoning for math and Qwen-Coder for code
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={higherIntelligence}
                  onChange={(e) => setHigherIntelligence(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                <div>
                  <div className="font-semibold text-[var(--text-primary)] text-xs flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-slate-400" />
                    <span>System Sound & Audio Alerts</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Play chime when long reasoning or search completes</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: Personalization (Custom Instructions, Persona, Memories) */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'personalization' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Custom AI Instructions
                </label>
                <p className="text-[11px] text-[var(--text-muted)] mb-2">
                  What would you like OX-Alpha to know about you to provide tailored answers?
                </p>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={3}
                  placeholder="e.g., I am a full-stack engineer building React and Python apps. Keep explanations concise."
                  className="w-full px-3 py-2.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  How would you like OX-Alpha to respond?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'concise', label: 'Direct & Concise', desc: 'Straight to the point with minimal fluff' },
                    { id: 'detailed', label: 'Detailed & Thorough', desc: 'Full explanations and comprehensive steps' },
                    { id: 'code', label: 'Engineering First', desc: 'Code examples, syntax, and architecture' },
                    { id: 'friendly', label: 'Friendly & Casual', desc: 'Warm, conversational tone' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setResponseStyle(style.id as any)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        responseStyle === style.id
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 font-semibold shadow-sm'
                          : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="font-semibold text-xs text-[var(--text-primary)]">{style.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span>Memory & Context Manager</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    {memories.length} Memories Stored
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  OX-Alpha automatically remembers important details across your chats to save you from repeating yourself.
                </p>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: Model & Usage (OX-Alpha Intelligence, VRAM, Tokens) */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'model' && (
            <div className="space-y-4">
              {/* OX-Alpha Model Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-blue-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                      OX
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">OX-Alpha Super Model</div>
                      <div className="text-[10px] text-indigo-300">4-in-1 Unified Intelligence Engine</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    100% Free & Local
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Vision</span>
                    <strong className="text-white font-mono">moondream:1.7b</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Coding</span>
                    <strong className="text-white font-mono">qwen2.5:7b</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Reasoning</span>
                    <strong className="text-white font-mono">deepseek-r1:7b</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Voice/Chat</span>
                    <strong className="text-white font-mono">llama3.2:3b</strong>
                  </div>
                </div>
              </div>

              {/* Hardware Profile */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[var(--text-primary)]">Hardware & VRAM Status</span>
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">ZBook Core i7 • 16GB RAM</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Conversations</span>
                    <strong className="text-[var(--text-primary)] font-mono">{conversations.length} Active</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Search Citations</span>
                    <strong className="text-[var(--text-primary)] font-mono">Live Web RSS</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Inference Speed</span>
                    <strong className="text-emerald-400 font-mono">~35 tok/s</strong>
                  </div>
                </div>
              </div>

              {/* Context Size Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Context Window Size</label>
                  <span className="font-mono text-indigo-400">{formData.contextSize || 8192} Tokens</span>
                </div>
                <input
                  type="range"
                  min="2048"
                  max="16384"
                  step="1024"
                  value={formData.contextSize || 8192}
                  onChange={(e) => setFormData({ ...formData, contextSize: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 4: Security & Login (Email, 6-Digit OTP, GitHub Link, Delete Account) */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Profile Account Details Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-3 p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                <div className="font-semibold text-xs text-[var(--text-primary)] mb-1">Account Credentials</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer"
                  >
                    Update Account
                  </button>
                </div>
              </form>

              {/* 6-Digit OTP Verification Tester */}
              <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                    <span>6-Digit Email OTP Authentication</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Cryptographic 6-digit OTP authentication is enabled. You can test generating a fresh OTP anytime.
                </p>
                <button
                  type="button"
                  onClick={handleSendOtpTest}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium text-xs transition cursor-pointer"
                >
                  Generate Test OTP Code
                </button>
              </div>

              {/* GitHub Account Link */}
              <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <div>
                    <div className="font-semibold text-xs text-[var(--text-primary)]">GitHub Integration</div>
                    <div className="text-[11px] text-slate-400 font-mono">github.com/huzaifa702</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Linked
                </span>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Danger Zone</span>
                </div>
                <p className="text-[11px] text-rose-300/80 leading-relaxed">
                  Permanently erase your local profile, database records, and all chat history.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account & Erase All Data</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]">
          <div>
            {savedToast && (
              <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>Settings saved successfully!</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-secondary)] text-xs font-semibold cursor-pointer border border-[var(--border-subtle)]"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
