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
  Loader2
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
    setSelectedModel 
  } = useAppStore();

  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<{ status: string; completed?: number; total?: number; percent?: number }>({ status: '' });
  const [customModelInput, setCustomModelInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (activeModal !== 'models') return null;

  const isOllamaRunning = modelsData?.isOllamaRunning || false;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchModels();
    setIsRefreshing(false);
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
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Local Model Hub & Hardware</h2>
              <p className="text-xs text-slate-400">Manage offline models running on your HP ZBook</p>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
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

          {/* Recommended Models Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              Curated Models for Your Hardware
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
        </div>
      </div>
    </div>
  );
};
