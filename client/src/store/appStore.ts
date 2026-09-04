import { create } from 'zustand';
import type { 
  Conversation, 
  Message, 
  ModelsResponse, 
  Project, 
  MemoryItem, 
  UserSettings, 
  UserProfile, 
  AttachedFile,
  CitationItem 
} from '../types';
import { api } from '../services/api';

interface AppState {
  // User & Settings
  user: UserProfile | null;
  settings: UserSettings;
  
  // Feature Toggles (ChatGPT Style)
  searchEnabled: boolean;
  thinkEnabled: boolean;
  isTemporaryChat: boolean;
  toggleSearch: () => void;
  toggleThink: () => void;
  toggleTemporaryChat: () => void;
  setTemporaryChat: (enabled: boolean) => void;

  // Navigation & Modals
  sidebarOpen: boolean;
  activeModal: 'models' | 'memory' | 'projects' | 'settings' | 'voice' | 'auth' | 'commandPalette' | 'profile' | 'images' | null;
  searchQuery: string;

  // Models
  modelsData: ModelsResponse | null;
  selectedModel: string;
  selectedProvider: 'ollama' | 'openai' | 'groq' | 'anthropic' | 'gemini' | 'openrouter';
  customModels: Array<{ id: string; name: string; provider: string; subtitle?: string; badge?: string; thinkingEffort?: string }>;
  addCustomModel: (model: { id: string; name: string; provider: string; subtitle?: string; badge?: string; thinkingEffort?: string }) => void;
  deleteCustomModel: (modelId: string) => void;

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  
  // Streaming & Message state
  isStreaming: boolean;
  streamingContent: string;
  streamingCitations: CitationItem[];
  abortController: AbortController | null;

  // Projects & Memory
  projects: Project[];
  activeProjectId: string | null;
  memories: MemoryItem[];

  // Actions
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: AppState['activeModal']) => void;
  setSearchQuery: (query: string) => void;
  setSelectedModel: (model: string, provider?: AppState['selectedProvider']) => void;
  setActiveProjectId: (id: string | null) => void;
  
  // Async initializers & fetchers
  initApp: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchModels: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchMemories: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  
  // Conversation actions
  selectConversation: (id: string) => Promise<void>;
  createNewChat: (projectId?: string | null) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  toggleArchiveConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearAllConversations: () => Promise<void>;
  
  // Chat messaging & streaming
  sendMessage: (content: string, attachments?: AttachedFile[], images?: string[], forceSearch?: boolean) => Promise<void>;
  stopStreaming: () => void;
  regenerateResponse: () => Promise<void>;
  submitFeedback: (messageId: string, feedback: 'like' | 'dislike') => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  
  // Settings & Profile updates
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

const defaultUserProfile: UserProfile = {
  id: 'user_huzaifa_rajput',
  email: 'huzaifa@local.ai',
  displayName: 'Huzaifa Rajput',
  username: 'huzaifa',
  avatar: '',
  isLoggedIn: true,
  picture: ''
};

const isInitialLoggedOut = typeof window !== 'undefined' && localStorage.getItem('local_ai_logged_out') === 'true';

export const useAppStore = create<AppState>((set, get) => ({
  user: isInitialLoggedOut ? null : defaultUserProfile,
  settings: {
    theme: 'dark',
    defaultModel: 'llama3.2:3b',
    codingModel: 'qwen2.5-coder:7b',
    visionModel: 'llava:7b',
    temperature: 0.7,
    contextSize: 4096,
    memoryEnabled: true,
    voiceEnabled: true,
    voiceAutoPlay: false,
    voiceVoice: 'default',
    webSearchEnabled: true,
    systemPrompt: 'You are a helpful, intelligent, and precise AI assistant running locally and privately.',
    hardwareProfile: 'ZBook-16GB',
    apiKeys: {
      openai: '',
      groq: '',
      anthropic: '',
      openrouter: '',
      gemini: '',
      tavily: ''
    }
  },
  searchEnabled: false,
  thinkEnabled: false,
  isTemporaryChat: false,
  toggleSearch: () => set((state) => ({ searchEnabled: !state.searchEnabled })),
  toggleThink: () => set((state) => ({ thinkEnabled: !state.thinkEnabled })),
  toggleTemporaryChat: () => set((state) => {
    const next = !state.isTemporaryChat;
    if (next) {
      return {
        isTemporaryChat: true,
        activeConversationId: null,
        activeConversation: {
          id: 'temporary-session',
          user_id: state.user?.id || 'guest',
          title: 'Temporary Chat',
          is_pinned: 0,
          is_archived: 0,
          model: state.selectedModel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: []
        }
      };
    } else {
      return { isTemporaryChat: false, activeConversationId: null, activeConversation: null };
    }
  }),
  setTemporaryChat: (enabled) => set((state) => {
    if (enabled) {
      return {
        isTemporaryChat: true,
        activeConversationId: null,
        activeConversation: {
          id: 'temporary-session',
          user_id: state.user?.id || 'guest',
          title: 'Temporary Chat',
          is_pinned: 0,
          is_archived: 0,
          model: state.selectedModel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: []
        }
      };
    } else {
      return { isTemporaryChat: false, activeConversationId: null, activeConversation: null };
    }
  }),
  sidebarOpen: true,
  activeModal: null,
  searchQuery: '',
  modelsData: null,
  selectedModel: 'llama3.2:3b',
  selectedProvider: 'ollama',
  customModels: (() => {
    try {
      const saved = localStorage.getItem('local_custom_models');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })(),
  addCustomModel: (model) => set((state) => {
    const updated = [model, ...state.customModels.filter(m => m.id !== model.id)];
    try { localStorage.setItem('local_custom_models', JSON.stringify(updated)); } catch {}
    return { customModels: updated, selectedModel: model.id, selectedProvider: model.provider as any };
  }),
  deleteCustomModel: (modelId) => set((state) => {
    const updated = state.customModels.filter(m => m.id !== modelId);
    try { localStorage.setItem('local_custom_models', JSON.stringify(updated)); } catch {}
    const newSelected = state.selectedModel === modelId ? 'llama3.2:3b' : state.selectedModel;
    return { customModels: updated, selectedModel: newSelected };
  }),
  conversations: [],
  activeConversationId: null,
  activeConversation: null,
  isStreaming: false,
  streamingContent: '',
  streamingCitations: [],
  abortController: null,
  projects: [],
  activeProjectId: null,
  memories: [],

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedModel: (selectedModel, provider = 'ollama') => set({ selectedModel, selectedProvider: provider }),
  setActiveProjectId: (activeProjectId) => {
    set({ activeProjectId });
    get().fetchConversations();
  },
  setUser: (user) => {
    set({ user });
    if (user?.token) localStorage.setItem('localai_token', user.token);
    if (user) {
      localStorage.setItem('local_ai_user', JSON.stringify(user));
      localStorage.removeItem('local_ai_logged_out');
    } else {
      localStorage.removeItem('local_ai_user');
      localStorage.setItem('local_ai_logged_out', 'true');
    }
    // Reload user-scoped data
    get().fetchConversations();
    get().fetchProjects();
    get().fetchMemories();
    get().fetchSettings();
  },
  logout: () => {
    api.logout();
    localStorage.removeItem('local_ai_user');
    localStorage.removeItem('localai_token');
    localStorage.setItem('local_ai_logged_out', 'true');
    set({ 
      user: null, 
      conversations: [], 
      activeConversationId: null, 
      activeConversation: null,
      projects: [],
      memories: []
    });
    get().fetchModels();
    get().fetchSettings();
  },

  initApp: async () => {
    try {
      const [remoteUser, settings] = await Promise.all([
        api.getCurrentUser().catch(() => null),
        api.getSettings().catch(() => null)
      ]);

      if (remoteUser) {
        set({ user: remoteUser });
        localStorage.setItem('local_ai_user', JSON.stringify(remoteUser));
        localStorage.removeItem('local_ai_logged_out');
      } else {
        const isLoggedOut = localStorage.getItem('local_ai_logged_out') === 'true';
        if (isLoggedOut) {
          set({ user: null });
        } else {
          const saved = localStorage.getItem('local_ai_user');
          if (saved) {
            try {
              set({ user: JSON.parse(saved) });
            } catch {
              set({ user: defaultUserProfile });
            }
          } else {
            set({ user: defaultUserProfile });
          }
        }
      }

      if (settings) {
        set({ settings, selectedModel: settings.defaultModel || 'llama3.2:3b' });
      }

      await Promise.all([
        get().fetchModels(),
        get().fetchConversations(),
        get().fetchProjects(),
        get().fetchMemories()
      ]);
    } catch (e) {
      console.error('App init error:', e);
    }
  },

  fetchModels: async () => {
    try {
      const data = await api.getModels();
      set({ modelsData: data });
    } catch (e) {
      console.error('Failed to load models:', e);
    }
  },

  fetchConversations: async () => {
    try {
      const { searchQuery, activeProjectId } = get();
      const list = await api.listConversations(searchQuery, activeProjectId || undefined);
      set({ conversations: list });
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  },

  fetchProjects: async () => {
    try {
      const list = await api.listProjects();
      set({ projects: list });
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  },

  fetchMemories: async () => {
    try {
      const list = await api.listMemories(get().activeProjectId || undefined);
      set({ memories: list });
    } catch (e) {
      console.error('Failed to load memories:', e);
    }
  },

  fetchSettings: async () => {
    try {
      const settings = await api.getSettings();
      set({ settings });
    } catch (e) {}
  },

  selectConversation: async (id: string) => {
    try {
      const conv = await api.getConversation(id);
      set({ 
        activeConversationId: id, 
        activeConversation: conv, 
        selectedModel: conv.model || get().selectedModel 
      });
    } catch (e) {
      console.error('Failed to select conversation:', e);
    }
  },

  createNewChat: async (projectId = null) => {
    try {
      const { selectedModel, settings } = get();
      const targetProjId = projectId ?? get().activeProjectId;
      
      const newConv = await api.createConversation(
        'New Chat',
        selectedModel,
        targetProjId || undefined,
        settings.systemPrompt
      );

      set((state) => ({
        conversations: [newConv, ...state.conversations],
        activeConversationId: newConv.id,
        activeConversation: { ...newConv, messages: [] }
      }));
    } catch (e) {
      console.error('Failed to create new chat:', e);
    }
  },

  updateConversationTitle: async (id: string, title: string) => {
    try {
      const updated = await api.updateConversation(id, { title });
      set((state) => ({
        conversations: state.conversations.map((c) => c.id === id ? { ...c, title: updated.title } : c),
        activeConversation: state.activeConversation?.id === id ? { ...state.activeConversation, title: updated.title } : state.activeConversation
      }));
    } catch (e) {}
  },

  togglePinConversation: async (id: string) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    const isPinned = !Boolean(conv.is_pinned);
    try {
      await api.updateConversation(id, { isPinned });
      get().fetchConversations();
    } catch (e) {}
  },

  toggleArchiveConversation: async (id: string) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    const isArchived = !Boolean(conv.is_archived);
    try {
      await api.updateConversation(id, { isArchived });
      get().fetchConversations();
      if (get().activeConversationId === id) {
        set({ activeConversationId: null, activeConversation: null });
      }
    } catch (e) {}
  },

  deleteConversation: async (id: string) => {
    try {
      await api.deleteConversation(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        activeConversation: state.activeConversation?.id === id ? null : state.activeConversation
      }));
    } catch (e) {}
  },

  clearAllConversations: async () => {
    try {
      await api.clearAllConversations();
      set({ conversations: [], activeConversationId: null, activeConversation: null });
    } catch (e) {}
  },

  sendMessage: async (content: string, attachments: AttachedFile[] = [], images: string[] = [], forceSearch = false) => {
    const { 
      activeConversationId, 
      selectedModel, 
      selectedProvider, 
      settings, 
      activeProjectId,
      searchEnabled,
      thinkEnabled,
      isTemporaryChat,
      activeConversation
    } = get();

    if (!content.trim() && attachments.length === 0 && images.length === 0) return;

    let cloudApiKey: string | undefined = undefined;
    if (selectedProvider !== 'ollama' && settings.apiKeys) {
      cloudApiKey = settings.apiKeys[selectedProvider as keyof typeof settings.apiKeys] || '';
    }

    const abortCtrl = new AbortController();
    set({ 
      isStreaming: true, 
      streamingContent: '', 
      streamingCitations: [],
      abortController: abortCtrl 
    });

    const tempUserMsg: Message = {
      id: `temp_user_${Date.now()}`,
      conversation_id: isTemporaryChat ? 'temporary-session' : (activeConversationId || 'temp'),
      role: 'user',
      content,
      attachments,
      created_at: new Date().toISOString()
    };

    if (get().activeConversation) {
      set((state) => ({
        activeConversation: {
          ...state.activeConversation!,
          messages: [...(state.activeConversation!.messages || []), tempUserMsg]
        }
      }));
    } else {
      const initialConvId = isTemporaryChat ? 'temporary-session' : (activeConversationId || `conv_${Date.now()}`);
      set({
        activeConversationId: initialConvId,
        activeConversation: {
          id: initialConvId,
          user_id: get().user?.id || 'guest',
          title: content.slice(0, 32),
          is_pinned: 0,
          is_archived: 0,
          model: selectedModel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: [tempUserMsg]
        }
      });
    }

    let targetConvId = isTemporaryChat ? 'temporary-session' : (activeConversationId || undefined);
    let accumulatedText = '';
    let latestCitations: CitationItem[] = [];

    // Prior messages for multi-turn context
    const priorTemporaryMessages = isTemporaryChat && activeConversation?.messages 
      ? activeConversation.messages.map(m => ({ role: m.role, content: m.content }))
      : undefined;

    try {
      await api.sendMessageStream(
        {
          conversationId: isTemporaryChat ? undefined : (activeConversationId || undefined),
          content,
          model: selectedModel,
          systemPrompt: settings.systemPrompt,
          attachments,
          images,
          temperature: settings.temperature,
          projectId: activeProjectId || undefined,
          cloudApiKey,
          provider: selectedProvider,
          webSearchEnabled: forceSearch || searchEnabled,
          thinkEnabled,
          isTemporary: isTemporaryChat,
          messages: priorTemporaryMessages
        },
        // onToken
        (token) => {
          accumulatedText += token;
          set({ streamingContent: accumulatedText });
        },
        // onInit
        (initData) => {
          if (!isTemporaryChat && initData.conversationId) {
            targetConvId = initData.conversationId;
            set((state) => ({
              activeConversationId: initData.conversationId,
              activeConversation: state.activeConversation ? {
                ...state.activeConversation,
                id: initData.conversationId
              } : state.activeConversation
            }));
          }
          if (initData.citations) {
            latestCitations = initData.citations;
            set({ streamingCitations: initData.citations });
          }
        },
        // onError
        (error) => {
          accumulatedText += `\n\n> ⚠️ **Error**: ${error}`;
          set({ streamingContent: accumulatedText });
        },
        // onDone
        (finalContent, citations) => {
          const finalAssistantMsg: Message = {
            id: `msg_asst_${Date.now()}`,
            conversation_id: targetConvId || 'temporary-session',
            role: 'assistant',
            content: finalContent || accumulatedText,
            citations: citations || latestCitations,
            model: selectedModel,
            created_at: new Date().toISOString()
          };

          set((state) => {
            const currentConv = state.activeConversation || {
              id: targetConvId || 'conv_active',
              user_id: state.user?.id || 'guest',
              title: content.slice(0, 32),
              is_pinned: 0,
              is_archived: 0,
              model: selectedModel,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              messages: []
            };

            const existingMessages = (currentConv.messages || []).filter(m => !m.id.startsWith('temp_user_'));

            return {
              isStreaming: false,
              streamingContent: '',
              streamingCitations: [],
              abortController: null,
              activeConversationId: targetConvId || currentConv.id,
              activeConversation: {
                ...currentConv,
                id: targetConvId || currentConv.id,
                messages: [
                  ...existingMessages,
                  tempUserMsg,
                  finalAssistantMsg
                ]
              }
            };
          });

          if (!isTemporaryChat) {
            get().fetchConversations();
          }
        },
        abortCtrl.signal
      );
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Stream stopped by user');
      } else {
        console.error('Streaming error:', e);
      }
      set({ isStreaming: false, streamingContent: '', streamingCitations: [], abortController: null });
      if (targetConvId && !isTemporaryChat) {
        get().selectConversation(targetConvId);
      }
    }
  },

  stopStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ isStreaming: false, abortController: null });
    }
  },

  regenerateResponse: async () => {
    const { activeConversation } = get();
    if (!activeConversation || !activeConversation.messages || activeConversation.messages.length === 0) return;

    const msgs = activeConversation.messages;
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;
    const lastUserMsg = msgs[lastUserIndex];

    const trimmedMsgs = msgs.slice(0, lastUserIndex + 1);
    set((state) => ({
      activeConversation: {
        ...state.activeConversation!,
        messages: trimmedMsgs
      }
    }));

    await get().sendMessage(lastUserMsg.content, lastUserMsg.attachments, []);
  },

  submitFeedback: async (messageId: string, feedback: 'like' | 'dislike') => {
    try {
      await api.submitFeedback(messageId, feedback);
      set((state) => ({
        activeConversation: state.activeConversation ? {
          ...state.activeConversation,
          messages: (state.activeConversation.messages || []).map((m) =>
            m.id === messageId ? { ...m, feedback } : m
          )
        } : null
      }));
    } catch (e) {}
  },

  deleteMessage: async (messageId: string) => {
    try {
      await api.deleteMessage(messageId);
      set((state) => ({
        activeConversation: state.activeConversation ? {
          ...state.activeConversation,
          messages: (state.activeConversation.messages || []).filter((m) => m.id !== messageId)
        } : null
      }));
    } catch (e) {}
  },

  updateSettings: async (newSettings: Partial<UserSettings>) => {
    try {
      const updated = await api.updateSettings(newSettings);
      set({ settings: updated });
    } catch (e) {}
  }
}));
