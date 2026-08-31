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
  toggleSearch: () => void;
  toggleThink: () => void;

  // Navigation & Modals
  sidebarOpen: boolean;
  activeModal: 'models' | 'memory' | 'projects' | 'settings' | 'voice' | 'auth' | 'commandPalette' | null;
  searchQuery: string;

  // Models
  modelsData: ModelsResponse | null;
  selectedModel: string;
  selectedProvider: 'ollama' | 'openai' | 'groq' | 'anthropic' | 'gemini' | 'openrouter';

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

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
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
  toggleSearch: () => set((state) => ({ searchEnabled: !state.searchEnabled })),
  toggleThink: () => set((state) => ({ thinkEnabled: !state.thinkEnabled })),
  sidebarOpen: true,
  activeModal: null,
  searchQuery: '',
  modelsData: null,
  selectedModel: 'llama3.2:3b',
  selectedProvider: 'ollama',
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
    // Reload user-scoped data
    get().fetchConversations();
    get().fetchProjects();
    get().fetchMemories();
    get().fetchSettings();
  },
  logout: () => {
    api.logout();
    set({ 
      user: null, 
      conversations: [], 
      activeConversationId: null, 
      activeConversation: null,
      projects: [],
      memories: []
    });
    get().initApp();
  },

  initApp: async () => {
    try {
      const [user, settings] = await Promise.all([
        api.getCurrentUser().catch(() => null),
        api.getSettings().catch(() => null)
      ]);

      if (user) set({ user });
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
      thinkEnabled
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
      conversation_id: activeConversationId || 'temp',
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
    }

    let targetConvId = activeConversationId;
    let accumulatedText = '';
    let latestCitations: CitationItem[] = [];

    try {
      await api.sendMessageStream(
        {
          conversationId: activeConversationId || undefined,
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
          thinkEnabled
        },
        // onToken
        (token) => {
          accumulatedText += token;
          set({ streamingContent: accumulatedText });
        },
        // onInit
        (initData) => {
          targetConvId = initData.conversationId;
          if (initData.citations) {
            latestCitations = initData.citations;
            set({ streamingCitations: initData.citations });
          }
          set({ activeConversationId: initData.conversationId });
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
            conversation_id: targetConvId || 'temp',
            role: 'assistant',
            content: finalContent || accumulatedText,
            citations: citations || latestCitations,
            model: selectedModel,
            created_at: new Date().toISOString()
          };

          set((state) => ({
            isStreaming: false,
            streamingContent: '',
            streamingCitations: [],
            abortController: null,
            activeConversation: state.activeConversation ? {
              ...state.activeConversation,
              id: targetConvId || state.activeConversation.id,
              messages: [
                ...(state.activeConversation.messages || []).filter(m => !m.id.startsWith('temp_')),
                tempUserMsg,
                finalAssistantMsg
              ]
            } : null
          }));

          get().fetchConversations();
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
      if (targetConvId) {
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
