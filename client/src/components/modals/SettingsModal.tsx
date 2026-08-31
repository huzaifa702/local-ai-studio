import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Sliders, 
  Key, 
  SlidersHorizontal, 
  ShieldCheck, 
  Volume2, 
  Trash2, 
  Check, 
  HardDrive, 
  Globe,
  Save
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { UserSettings } from '../../types';

export const SettingsModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    settings, 
    updateSettings, 
    clearAllConversations 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'search' | 'apikeys' | 'voice' | 'privacy'>('general');
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [savedToast, setSavedToast] = useState(false);

  if (activeModal !== 'settings') return null;

  const handleSave = async () => {
    await updateSettings(formData);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
      await clearAllConversations();
      setActiveModal(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]">
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Settings & Preferences</h2>
              <p className="text-xs text-[var(--text-muted)]">Configure AI model defaults, web search, custom API keys, and privacy</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border-subtle)] px-6 bg-[var(--bg-main)]/50 text-xs overflow-x-auto gap-1">
          {[
            { id: 'general', label: 'General', icon: Sliders },
            { id: 'ai', label: 'AI Parameters', icon: SlidersHorizontal },
            { id: 'search', label: 'Web Search', icon: Globe },
            { id: 'apikeys', label: 'Cloud API Keys', icon: Key },
            { id: 'voice', label: 'Voice & Audio', icon: Volume2 },
            { id: 'privacy', label: 'Data & Privacy', icon: ShieldCheck }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-3 border-b-2 font-medium transition cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
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
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {['dark', 'light', 'system'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormData({ ...formData, theme: t as any })}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-medium capitalize transition cursor-pointer ${
                        formData.theme === t
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold shadow-sm'
                          : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t} Mode
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear History */}
              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <label className="block text-xs font-semibold text-rose-400 mb-1">Danger Zone</label>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All Chat History</span>
                </button>
              </div>
            </div>
          )}

          {/* AI Parameters Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Temperature (Creativity)</label>
                  <span className="font-mono text-emerald-400">{formData.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                  <span>Precise (0.0)</span>
                  <span>Balanced (0.7)</span>
                  <span>Creative (1.5)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Context Window Size</label>
                  <span className="font-mono text-emerald-400">{formData.contextSize} Tokens</span>
                </div>
                <input
                  type="range"
                  min="2048"
                  max="16384"
                  step="1024"
                  value={formData.contextSize}
                  onChange={(e) => setFormData({ ...formData, contextSize: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Global System Prompt</label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-medium)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Web Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Real-time web search pulls live online information and references from the internet, citing sources directly in your chat responses.
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] text-xs">Default Search Engine</div>
                    <div className="text-[11px] text-[var(--text-muted)]">DuckDuckGo Real-Time Search (100% Free & Privacy-First)</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    Active
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Optional Tavily Search API Key</label>
                  <input
                    type="password"
                    placeholder="tvly-..."
                    value={formData.apiKeys?.tavily || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiKeys: { ...formData.apiKeys, tavily: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-medium)] text-[var(--text-primary)] font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Leave blank to use built-in free web search.</p>
                </div>
              </div>
            </div>
          )}

          {/* Cloud API Keys Tab */}
          {activeTab === 'apikeys' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-start gap-2.5">
                <Key className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Add custom cloud API keys to access GPT-4o, Claude 3.5, Gemini 2.0, or Groq. All keys remain 100% encrypted in your local database.
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">OpenAI API Key (GPT-4o / GPT-4o-mini)</label>
                  <input
                    type="password"
                    placeholder="sk-proj-..."
                    value={formData.apiKeys?.openai || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiKeys: { ...formData.apiKeys, openai: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-medium)] text-[var(--text-primary)] font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Groq API Key (Fast Llama 3.3 70B)</label>
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={formData.apiKeys?.groq || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiKeys: { ...formData.apiKeys, groq: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-medium)] text-[var(--text-primary)] font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Anthropic API Key (Claude 3.5 Sonnet)</label>
                  <input
                    type="password"
                    placeholder="sk-ant-..."
                    value={formData.apiKeys?.anthropic || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiKeys: { ...formData.apiKeys, anthropic: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-medium)] text-[var(--text-primary)] font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Google Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={formData.apiKeys?.gemini || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiKeys: { ...formData.apiKeys, gemini: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-medium)] text-[var(--text-primary)] font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                <div>
                  <div className="font-semibold text-[var(--text-primary)] text-xs">Auto-Play Voice Responses</div>
                  <div className="text-[11px] text-[var(--text-muted)]">Automatically speak text answers aloud in chat</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.voiceAutoPlay}
                  onChange={(e) => setFormData({ ...formData, voiceAutoPlay: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                <div className="font-semibold text-[var(--text-primary)] text-xs">Push-to-Talk Mode</div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  In Voice Assistant mode, hold the <strong>Spacebar</strong> or the central orb to talk, and release to send instantly.
                </p>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Local Storage & Account Isolation</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  All chats, messages, files, documents, and memory items are partitioned by your user account and stored locally in SQLite (`ai_platform.db`).
                </p>
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
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
