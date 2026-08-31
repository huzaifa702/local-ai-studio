import React, { useState } from 'react';
import { 
  X, 
  FolderGit2, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';
import type { Project } from '../../types';

export const ProjectsModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    projects, 
    fetchProjects, 
    activeProjectId, 
    setActiveProjectId 
  } = useAppStore();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  if (activeModal !== 'projects') return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, {
          name: name.trim(),
          description: description.trim(),
          instructions: instructions.trim()
        });
      } else {
        await api.createProject({
          name: name.trim(),
          description: description.trim(),
          instructions: instructions.trim()
        });
      }

      setName('');
      setDescription('');
      setInstructions('');
      setIsCreating(false);
      setEditingProject(null);
      await fetchProjects();
    } catch (e) {
      console.error('Failed to save project:', e);
    }
  };

  const handleEdit = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || '');
    setInstructions(p.instructions || '');
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProject(id);
      if (activeProjectId === id) setActiveProjectId(null);
      await fetchProjects();
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Project Workspaces</h2>
              <p className="text-xs text-slate-400">Group chats, custom instructions, and files into dedicated projects</p>
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
          {!isCreating && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingProject(null);
                  setName('');
                  setDescription('');
                  setInstructions('');
                  setIsCreating(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>
          )}

          {/* Form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h3 className="font-semibold text-white text-xs">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. My Website, Research Paper, API Backend"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief summary of what this project is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Custom System Instructions (Optional)</label>
                <textarea
                  placeholder="Specific rules for this project, e.g.: 'Always generate React code in TypeScript with Tailwind.'"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProject(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md cursor-pointer"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          )}

          {/* Projects List */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              Your Projects ({projects.length})
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    activeProjectId === p.id
                      ? 'bg-indigo-950/30 border-indigo-500/40 text-white'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{p.name}</span>
                      {activeProjectId === p.id && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                          Active Workspace
                        </span>
                      )}
                    </div>
                    {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
                    {p.instructions && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-1">
                        Instructions: {p.instructions}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setActiveProjectId(activeProjectId === p.id ? null : p.id);
                        setActiveModal(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                        activeProjectId === p.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <span>{activeProjectId === p.id ? 'Selected' : 'Open Workspace'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No projects yet. Create a project to organize your workflows!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
