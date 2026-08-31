import React, { useState } from 'react';
import { 
  X, 
  Brain, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Search, 
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';
import type { MemoryItem } from '../../types';

export const MemoryModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    memories, 
    fetchMemories,
    activeProjectId 
  } = useAppStore();

  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  if (activeModal !== 'memory') return null;

  const filtered = memories.filter(
    (m) =>
      m.content.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      await api.createMemory(newContent.trim(), newCategory, activeProjectId || undefined);
      setNewContent('');
      await fetchMemories();
    } catch (e) {
      console.error('Failed to add memory:', e);
    }
  };

  const handleToggle = async (m: MemoryItem) => {
    try {
      await api.updateMemory(m.id, { enabled: !Boolean(m.enabled) });
      await fetchMemories();
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMemory(id);
      await fetchMemories();
    } catch (e) {}
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await api.updateMemory(id, { content: editContent.trim() });
      setEditingId(null);
      await fetchMemories();
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-base font-bold text-white">Local AI Memory</h2>
              <p className="text-xs text-slate-400">Remembered facts, preferences, and project context</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center gap-2.5 text-purple-300">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span>All memory records are encrypted & stored in local SQLite on your SSD. Zero cloud sync.</span>
          </div>

          {/* Add New Memory Form */}
          <form onSubmit={handleAddMemory} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="font-semibold text-white text-xs">Add a custom memory / preference</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
              >
                <option value="general">General</option>
                <option value="preference">Preference</option>
                <option value="project">Project</option>
                <option value="coding">Coding Style</option>
              </select>
              <input
                type="text"
                placeholder="e.g. 'Always write Python code with type hints' or 'My name is Alex'"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newContent.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </form>

          {/* Memory Search & Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                Active Memories ({filtered.length})
              </h3>
              <div className="relative w-48">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter memories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    Boolean(m.enabled)
                      ? 'bg-slate-900/80 border-slate-800 text-slate-200'
                      : 'bg-slate-950/40 border-slate-800/40 text-slate-500 opacity-60'
                  }`}
                >
                  {editingId === m.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 px-2.5 py-1 bg-slate-950 border border-purple-500 rounded-lg text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(m.id)}
                        className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-500/30 text-[10px] uppercase font-semibold">
                            {m.category}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(m.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed pt-1 text-slate-200">{m.content}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggle(m)}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          title={Boolean(m.enabled) ? 'Disable memory' : 'Enable memory'}
                        >
                          {Boolean(m.enabled) ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(m.id);
                            setEditContent(m.content);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No memories saved yet. Add a preference above to persist context!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
