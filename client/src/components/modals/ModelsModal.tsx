import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  HardDrive, 
  DownloadCloud, 
  Check, 
  AlertCircle, 
  Terminal, 
  Sparkles, 
  Trash2, 
  RefreshCw,
  Loader2,
  Zap,
  Key,
  Brain,
  Video,
  Image as ImageIcon,
  Code,
  Eye,
  MessageSquare,
  Mic,
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';

export const ModelsModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    modelsData, 
    fetchModels, 
    selectedModel, 
    setSelectedModel,
    detectedModels,
    saveDetectedModels,
    updateDetectedModelEffort,
    updateSettings,
    settings
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<{ status: string; completed?: number; total?: number; percent?: number }>({ status: '' });
  const [customModelInput, setCustomModelInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cloud Auto-Detection States
  const [cloudApiKey, setCloudApiKey] = useState('');
  const [isScanningKey, setIsScanningKey] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    provider?: string;
    message: string;
    counts?: {
      text: number;
      coding?: number;
      image: number;
      video?: number;
      vision?: number;
      audio: number;
      thinking?: number;
    };
  } | null>(null);
  const [cloudFilter, setCloudFilter] = useState<'all' | 'video' | 'image' | 'coding' | 'reasoning' | 'vision' | 'text' | 'audio'>('all');

  if (activeModal !== 'models') return null;

  const isOllamaRunning = modelsData?.isOllamaRunning || false;

  const inferProvider = (key: string): string => {
    const k = key.trim();
    if (k.startsWith('gsk_')) return 'groq';
    if (k.startsWith('sk-ant-')) return 'anthropic';
    if (k.startsWith('sk-or-')) return 'openrouter';
    if (k.startsWith('AIzaSy')) return 'gemini';
    if (k.startsWith('hf_')) return 'huggingface';
    if (k.startsWith('sk-proj-') || (k.startsWith('sk-') && k.length > 30)) return 'openai';
    return 'cloud';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchModels();
    setIsRefreshing(false);
  };

  const handleScanApiKey = async () => {
    const key = cloudApiKey.trim();
    if (!key) return;

    setIsScanningKey(true);
    setScanResult(null);

    try {
      const res = await api.testProviderKey('auto', key);
      const effectiveProvider = res.provider || inferProvider(key);

      setScanResult({
        success: res.success,
        provider: effectiveProvider,
        message: res.message,
        counts: res.counts
      });

      if (res.success && res.detectedModels && res.detectedModels.length > 0) {
        saveDetectedModels(res.detectedModels);
        await fetchModels();

        // Save key into store settings
        if (effectiveProvider && effectiveProvider !== 'ollama') {
          updateSettings({
            apiKeys: {
              ...(settings.apiKeys || {}),
              [effectiveProvider]: key
            } as any
          });
        }
      }
    } catch (e: any) {
      setScanResult({
        success: false,
        message: e.message || 'Failed to scan models with this key'
      });
    } finally {
      setIsScanningKey(false);
    }
  };

  const handlePullModel = async (modelName: string) => {
    setPullingModel(modelName);
    setPullProgress({ status: 'Starting download...' });

    try {
      await api.pullModel(modelName, (data) => {
        if (data.status) {
          const completed = data.completed || 0;
          const total = data.total || 0;
          const percent = total > 0 ? Math.round((completed / total) * 100) : undefined;
          setPullProgress({
            status: data.status,
            completed,
            total,
            percent
          });
        }
      });
      await fetchModels();
      setPullProgress({ status: 'Download completed successfully!' });
      setTimeout(() => setPullingModel(null), 2500);
    } catch (e: any) {
      setPullProgress({ status: `Error: ${e.message || 'Failed to pull model'}` });
      setTimeout(() => setPullingModel(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">AI Model Hub & Engine Manager</h2>
              <p className="text-xs text-slate-400">Offline Ollama models & Cloud API auto-detection with thinking effort</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Refresh Models"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800/80 bg-slate-900/40 gap-2">
          <button
            onClick={() => setActiveTab('local')}
            className={`pb-3 px-3 text-xs font-semibold transition cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'local'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Local Ollama & Hardware</span>
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`pb-3 px-3 text-xs font-semibold transition cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'cloud'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Cloud & Auto-Detected Models</span>
            {detectedModels.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                {detectedModels.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 scrollbar-thin">
          {activeTab === 'local' ? (
            <>
              {/* Ollama Status Alert */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isOllamaRunning ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              }`}>
                {isOllamaRunning ? (
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-semibold text-sm">
                    {isOllamaRunning ? 'Ollama Local Daemon is Connected' : 'Ollama Offline / Standby'}
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {isOllamaRunning
                      ? 'All local models execute 100% offline using your GPU/CPU with zero internet required.'
                      : 'To start local inference, open PowerShell and run `ollama serve`. You can also pull models directly from this screen.'}
                  </p>
                </div>
              </div>

              {/* Hardware Profile Banner (HP ZBook 15 G3) */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-wider">
                    <HardDrive className="w-4 h-4 text-indigo-400" />
                    <span>Hardware Target Profile</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30 font-mono text-[11px]">
                    HP ZBook 15 G3
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Total RAM</div>
                    <div className="font-bold text-white text-sm">16 GB DDR3</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">GPU VRAM</div>
                    <div className="font-bold text-emerald-400 text-sm">4 GB Quadro</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Optimal Quant</div>
                    <div className="font-bold text-indigo-400 text-sm">Q4_K_M (4-bit)</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Max Context</div>
                    <div className="font-bold text-purple-400 text-sm">4096 Tokens</div>
                  </div>
                </div>
              </div>

              {/* Live Pull Progress Bar if active */}
              {pullingModel && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-2">
                  <div className="flex items-center justify-between text-indigo-200 font-semibold">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Downloading `{pullingModel}`...</span>
                    </div>
                    <span>{pullProgress.percent !== undefined ? `${pullProgress.percent}%` : ''}</span>
                  </div>
                  <p className="text-xs text-indigo-300 font-mono">{pullProgress.status}</p>
                  {pullProgress.percent !== undefined && (
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                        style={{ width: `${pullProgress.percent}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Curated Local Hardware Models */}
              <div className="space-y-3">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Curated Local Models for Your HP ZBook
                </h3>

                <div className="grid grid-cols-1 gap-2.5">
                  {modelsData?.recommendedModels?.map((model) => (
                    <div
                      key={model.name}
                      className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{model.displayName}</span>
                          <span className="font-mono text-[11px] text-slate-400">({model.size})</span>
                          {model.isInstalled ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              Installed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                              Available
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{model.description}</p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                            VRAM Est: {model.vramEstimate}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">
                            {model.recommendedFor}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedModel(model.name, 'ollama');
                            setActiveModal(null);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                            selectedModel === model.name
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {selectedModel === model.name ? 'Active' : 'Select'}
                        </button>

                        {!model.isInstalled && (
                          <button
                            onClick={() => handlePullModel(model.name)}
                            disabled={pullingModel !== null}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md cursor-pointer"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>Pull</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Pull Model Input */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white text-xs">Pull Any Custom Ollama Model</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. gemma2:2b, mistral:7b, tinyllama"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (customModelInput.trim()) {
                        handlePullModel(customModelInput.trim());
                        setCustomModelInput('');
                      }
                    }}
                    disabled={!customModelInput.trim() || pullingModel !== null}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Download
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ⚡ Cloud API Auto-Detection Hero */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-purple-950/30 to-slate-900 border border-indigo-500/40 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                      <Key className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-2">
                        <span>Universal API Key Scanner</span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase">
                          Auto-Detects Video, Image, Coding, & Thinking
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Paste any API key (Groq, OpenAI, Gemini, Anthropic, OpenRouter, HuggingFace) to auto-scan models.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      placeholder="Paste your API key (e.g. gsk_..., sk-ant-..., sk-..., AIzaSy..., hf_...)"
                      value={cloudApiKey}
                      onChange={(e) => setCloudApiKey(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && cloudApiKey.trim()) {
                          handleScanApiKey();
                        }
                      }}
                      className="w-full pl-3 pr-24 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                    {cloudApiKey.trim() && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold uppercase">
                          {inferProvider(cloudApiKey)}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleScanApiKey}
                    disabled={!cloudApiKey.trim() || isScanningKey}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningKey ? 'animate-spin' : ''}`} />
                    <span>{isScanningKey ? 'Detecting...' : 'Scan & Auto-Detect'}</span>
                  </button>
                </div>
              </div>

              {/* Scan Result Feedback Banner */}
              {scanResult && (
                <div className={`p-4 rounded-xl border transition animate-in fade-in ${
                  scanResult.success 
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {scanResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-xs">{scanResult.message}</div>
                        {scanResult.provider && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[9px]">
                            {scanResult.provider}
                          </span>
                        )}
                      </div>

                      {scanResult.counts && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {Boolean(scanResult.counts.video) && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-medium flex items-center gap-1">
                              <Video className="w-3 h-3" /> {scanResult.counts.video} Video
                            </span>
                          )}
                          {Boolean(scanResult.counts.image) && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-medium flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" /> {scanResult.counts.image} Image
                            </span>
                          )}
                          {Boolean(scanResult.counts.coding) && (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-medium flex items-center gap-1">
                              <Code className="w-3 h-3" /> {scanResult.counts.coding} Code
                            </span>
                          )}
                          {Boolean(scanResult.counts.thinking) && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-medium flex items-center gap-1">
                              <Brain className="w-3 h-3" /> {scanResult.counts.thinking} Reasoning
                            </span>
                          )}
                          {Boolean(scanResult.counts.vision) && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-medium flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {scanResult.counts.vision} Vision
                            </span>
                          )}
                          {Boolean(scanResult.counts.text) && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-medium flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {scanResult.counts.text} Text
                            </span>
                          )}
                          {Boolean(scanResult.counts.audio) && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-medium flex items-center gap-1">
                              <Mic className="w-3 h-3" /> {scanResult.counts.audio} Audio
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Detected Models List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Auto-Detected Models ({detectedModels.length})</span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1">
                    {(['all', 'video', 'image', 'coding', 'reasoning', 'vision', 'text', 'audio'] as const).map(cat => {
                      const count = cat === 'all' 
                        ? detectedModels.length
                        : cat === 'video' ? detectedModels.filter(m => m.capabilities?.video).length
                        : cat === 'image' ? detectedModels.filter(m => m.capabilities?.image).length
                        : cat === 'coding' ? detectedModels.filter(m => m.capabilities?.coding).length
                        : cat === 'reasoning' ? detectedModels.filter(m => m.capabilities?.thinking).length
                        : cat === 'vision' ? detectedModels.filter(m => m.capabilities?.vision).length
                        : cat === 'text' ? detectedModels.filter(m => m.capabilities?.text).length
                        : detectedModels.filter(m => m.capabilities?.audio).length;

                      if (count === 0 && cat !== 'all') return null;

                      return (
                        <button
                          key={cat}
                          onClick={() => setCloudFilter(cat)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-medium capitalize transition cursor-pointer ${
                            cloudFilter === cat
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat === 'all' ? `All (${count})`
                            : cat === 'video' ? `🎬 Video (${count})`
                            : cat === 'image' ? `🖼️ Image (${count})`
                            : cat === 'coding' ? `💻 Code (${count})`
                            : cat === 'reasoning' ? `🧠 Reasoning (${count})`
                            : cat === 'vision' ? `👁️ Vision (${count})`
                            : cat === 'text' ? `💬 Text (${count})`
                            : `🎙️ Audio (${count})`
                          }
                        </button>
                      );
                    })}
                  </div>
                </div>

                {detectedModels.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                    <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-slate-300 font-semibold">No Cloud Models Scanned Yet</div>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                      Paste your Groq, OpenAI, Anthropic, Gemini, OpenRouter, or Hugging Face API key above to instantly scan and detect your models!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {detectedModels
                      .filter(dm => {
                        if (cloudFilter === 'all') return true;
                        if (cloudFilter === 'video') return dm.capabilities?.video;
                        if (cloudFilter === 'image') return dm.capabilities?.image;
                        if (cloudFilter === 'coding') return dm.capabilities?.coding;
                        if (cloudFilter === 'reasoning') return dm.capabilities?.thinking;
                        if (cloudFilter === 'vision') return dm.capabilities?.vision;
                        if (cloudFilter === 'text') return dm.capabilities?.text;
                        if (cloudFilter === 'audio') return dm.capabilities?.audio;
                        return true;
                      })
                      .map((dm) => {
                        const isCurrent = selectedModel === dm.id;
                        const modelIcon = dm.capabilities?.video 
                          ? '🎬' 
                          : dm.capabilities?.image 
                            ? '🖼️' 
                            : dm.capabilities?.coding 
                              ? '💻' 
                              : dm.capabilities?.thinking 
                                ? '🧠' 
                                : dm.capabilities?.vision 
                                  ? '👁️' 
                                  : dm.capabilities?.audio 
                                    ? '🎙️' 
                                    : '💬';

                        return (
                          <div
                            key={dm.id}
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-lg shrink-0">{modelIcon}</span>
                              <div className="min-w-0">
                                <div className="font-mono text-xs font-semibold text-white truncate">
                                  {dm.id}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span>{dm.name}</span>
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30 text-[9px] font-bold uppercase">
                                    {dm.provider}
                                  </span>
                                  {dm.capabilities?.video && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 text-[9px] font-semibold">
                                      Video
                                    </span>
                                  )}
                                  {dm.capabilities?.image && (
                                    <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 text-[9px] font-semibold">
                                      Image
                                    </span>
                                  )}
                                  {dm.capabilities?.coding && (
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[9px] font-semibold">
                                      Coding
                                    </span>
                                  )}
                                  {dm.capabilities?.thinking && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 text-[9px] font-semibold">
                                      Reasoning
                                    </span>
                                  )}
                                  {dm.capabilities?.vision && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 text-[9px] font-semibold">
                                      Vision
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions & Thinking Configuration */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {/* Thinking Effort Selector */}
                              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                <Brain className="w-3 h-3 text-amber-400" />
                                <span className="text-[9px] text-slate-400 font-medium">Thinking:</span>
                                <select
                                  value={dm.thinkingEffort || (dm.capabilities?.thinking ? 'MEDIUM' : 'OFF')}
                                  onChange={(e) => updateDetectedModelEffort(dm.id, e.target.value as any)}
                                  className="bg-transparent text-[9px] font-bold text-white focus:outline-none cursor-pointer"
                                >
                                  <option value="OFF" className="bg-slate-900">OFF</option>
                                  <option value="LOW" className="bg-slate-900">LOW</option>
                                  <option value="MEDIUM" className="bg-slate-900">MEDIUM</option>
                                  <option value="HIGH" className="bg-slate-900">HIGH</option>
                                  <option value="MAX" className="bg-slate-900">MAX</option>
                                </select>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedModel(dm.id, dm.provider as any);
                                  setActiveModal(null);
                                }}
                                className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                                  isCurrent
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                }`}
                              >
                                {isCurrent ? 'Active' : 'Select'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
