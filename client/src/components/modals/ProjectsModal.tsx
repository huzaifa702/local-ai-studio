import React, { useState } from 'react';
import { 
  X, 
  FolderGit2, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Sparkles,
  ArrowRight,
  Code2,
  BookOpen,
  Briefcase,
  Layers
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

  const handleQuickTemplate = async (templateName: string, templateDesc: string, templateInst: string) => {
    try {
      await api.createProject({
        name: templateName,
        description: templateDesc,
        instructions: templateInst
      });
      await fetchProjects();
    } catch (e) {
      console.error('Failed to create template project:', e);
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
    if (window.confirm('Are you sure you want to delete this project workspace?')) {
      try {
        await api.deleteProject(id);
        if (activeProjectId === id) setActiveProjectId(null);
        await fetchProjects();
      } catch (e) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">Project Workspaces</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Organize chats, custom instructions, and files into dedicated workspaces.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[var(--text-main)]">
          
          {/* Active Workspace Banner */}
          {activeProjectId && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">
                  Active Workspace: {projects.find(p => p.id === activeProjectId)?.name || 'Project'}
                </span>
              </div>
              <button
                onClick={() => setActiveProjectId(null)}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-sidebar-hover)] text-[10px] text-[var(--text-main)] font-semibold border border-[var(--border-subtle)] transition cursor-pointer"
              >
                Clear / General Mode
              </button>
            </div>
          )}

          {!isCreating && (
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-[var(--text-main)]">
                Your Workspaces ({projects.length})
              </div>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setName('');
                  setDescription('');
                  setInstructions('');
                  setIsCreating(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>
          )}

          {/* Form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3 animate-in fade-in">
              <div className="font-semibold text-[var(--text-main)] text-xs">
                {editingProject ? 'Edit Project Workspace' : 'Create New Workspace'}
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-sub)] mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Website Overhaul, Deep Learning Research, Mobile App"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-main)] text-xs focus:border-[var(--accent-color)] focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-sub)] mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief summary of what this project covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-main)] text-xs focus:border-[var(--accent-color)] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-sub)] mb-1">Custom Workspace Instructions (Optional)</label>
                <textarea
                  placeholder="e.g. 'Always write clean TypeScript code with Tailwind and full error handling.'"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-main)] text-xs focus:border-[var(--accent-color)] focus:outline-none resize-none transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProject(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-sub)] text-xs font-medium border border-[var(--border-subtle)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm cursor-pointer"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          )}

          {/* Starter Project Templates if 0 projects */}
          {projects.length === 0 && !isCreating && (
            <div className="space-y-4 pt-2">
              <div className="text-center py-4 text-[var(--text-muted)] text-xs">
                No projects yet. Pick a ready-to-use template or create a custom one:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickTemplate(
                    'Full-Stack Coding',
                    'Web development, React, TypeScript, and FastAPI architecture',
                    'Act as a Senior Full-Stack Engineer. Provide production-ready, clean, typed code with complete architecture and zero shortcuts.'
                  )}
                  className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-indigo-500/50 hover:bg-[var(--bg-sidebar-hover)] text-left transition cursor-pointer space-y-2 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-xs text-[var(--text-main)] group-hover:text-indigo-500 transition">
                    Full-Stack Coding
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    Preconfigured for React, TypeScript, Python, and refactoring.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickTemplate(
                    'Research & Writing',
                    'In-depth research synthesis, article drafts, and thesis formulation',
                    'Act as an Academic Research Director and Senior Technical Writer. Analyze concepts in depth with clear structure and academic citations.'
                  )}
                  className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-indigo-500/50 hover:bg-[var(--bg-sidebar-hover)] text-left transition cursor-pointer space-y-2 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-xs text-[var(--text-main)] group-hover:text-indigo-500 transition">
                    Research & Writing
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    Optimized for papers, executive summaries, and long-form prose.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickTemplate(
                    'Product & Business',
                    'Product strategy, roadmaps, market analysis, and user stories',
                    'Act as a Principal Product Strategist. Focus on business value, metrics, user journeys, and crisp feature breakdowns.'
                  )}
                  className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-indigo-500/50 hover:bg-[var(--bg-sidebar-hover)] text-left transition cursor-pointer space-y-2 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-xs text-[var(--text-main)] group-hover:text-indigo-500 transition">
                    Product & Business
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    Built for roadmaps, PRDs, monetization, and launch planning.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Projects List */}
          {projects.length > 0 && (
            <div className="grid grid-cols-1 gap-2.5">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    activeProjectId === p.id
                      ? 'bg-[var(--accent-bg)] border-[var(--accent-border)]'
                      : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-main)] text-sm">{p.name}</span>
                      {activeProjectId === p.id && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                          Active Workspace
                        </span>
                      )}
                    </div>
                    {p.description && <p className="text-xs text-[var(--text-sub)]">{p.description}</p>}
                    {p.instructions && (
                      <p className="text-[10px] text-[var(--text-muted)] italic line-clamp-1">
                        Prompt: "{p.instructions}"
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
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      <span>{activeProjectId === p.id ? 'Active' : 'Open Workspace'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
