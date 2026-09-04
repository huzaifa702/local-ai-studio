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

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('localai_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // --- Auth ---
  async getCurrentUser(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to get current user');
    return res.json();
  },

  async loginEmail(email: string, password: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid email or password' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    if (data.token) localStorage.setItem('localai_token', data.token);
    return data;
  },

  async registerEmail(email: string, password: string, displayName?: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await res.json();
    if (data.token) localStorage.setItem('localai_token', data.token);
    return data;
  },

  async loginGoogle(credential?: string, email?: string, name?: string, picture?: string, googleId?: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, email, name, picture, googleId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Google login failed' }));
      throw new Error(err.detail || 'Google sign-in failed');
    }
    const data = await res.json();
    if (data.token) localStorage.setItem('localai_token', data.token);
    return data;
  },

  async sendEmailOtp(email: string): Promise<{ success: boolean; message: string; otpCode?: string; otpHint?: string }> {
    const res = await fetch(`${API_BASE}/auth/email/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send OTP code' }));
      throw new Error(err.detail || 'Failed to send OTP code');
    }
    return res.json();
  },

  async verifyEmailOtp(email: string, otpCode: string, displayName?: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/email/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode, displayName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid or expired OTP code' }));
      throw new Error(err.detail || 'Invalid or expired OTP code');
    }
    const data = await res.json();
    if (data.token) localStorage.setItem('localai_token', data.token);
    return data;
  },

  async sendPhoneOtp(phoneNumber: string): Promise<{ success: boolean; sessionId: string; message: string; demoOtp?: string }> {
    const res = await fetch(`${API_BASE}/auth/phone/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send OTP' }));
      throw new Error(err.detail || 'Failed to send OTP');
    }
    return res.json();
  },

  async verifyPhoneOtp(phoneNumber: string, otpCode: string, displayName?: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/phone/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, otpCode, displayName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid or expired OTP' }));
      throw new Error(err.detail || 'Invalid or expired OTP');
    }
    const data = await res.json();
    if (data.token) localStorage.setItem('localai_token', data.token);
    return data;
  },

  async updateProfile(data: { displayName?: string; avatar?: string; email?: string }): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  logout(): void {
    localStorage.removeItem('localai_token');
  },

  // --- Web Search ---
  async searchWeb(query: string, maxResults = 5): Promise<{ query: string; results: CitationItem[] }> {
    const res = await fetch(`${API_BASE}/chat/search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, maxResults })
    });
    if (!res.ok) throw new Error('Failed to perform web search');
    return res.json();
  },

  // --- Conversations ---
  async listConversations(search?: string, projectId?: string, includeArchived = false): Promise<Conversation[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (projectId) params.append('project_id', projectId);
    if (includeArchived) params.append('include_archived', 'true');

    const res = await fetch(`${API_BASE}/chat/conversations?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  },

  async createConversation(title?: string, model?: string, projectId?: string, systemPrompt?: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, model, projectId, systemPrompt })
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async updateConversation(id: string, updates: { title?: string; isPinned?: boolean; isArchived?: boolean; projectId?: string | null }): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
  },

  async clearAllConversations(): Promise<void> {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to clear conversations');
  },

  async shareConversation(convId: string): Promise<{ success: boolean; shareToken: string; shareUrl: string; title: string }> {
    const res = await fetch(`${API_BASE}/chat/conversations/${convId}/share`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to share conversation');
    return res.json();
  },

  async getSharedConversation(shareToken: string): Promise<{ title: string; createdAt: string; messages: any[] }> {
    const res = await fetch(`${API_BASE}/chat/shared/${shareToken}`);
    if (!res.ok) throw new Error('Failed to load shared conversation');
    return res.json();
  },

  async getConversationFiles(convId: string): Promise<{ conversationId: string; files: any[] }> {
    const res = await fetch(`${API_BASE}/chat/conversations/${convId}/files`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load conversation files');
    return res.json();
  },

  async submitFeedback(messageId: string, feedback: 'like' | 'dislike'): Promise<void> {
    await fetch(`${API_BASE}/chat/messages/${messageId}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ messageId, feedback })
    });
  },

  async deleteMessage(messageId: string): Promise<void> {
    await fetch(`${API_BASE}/chat/messages/${messageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // --- SSE Chat Streaming ---
  async sendMessageStream(
    params: {
      conversationId?: string;
      content: string;
      model: string;
      systemPrompt?: string;
      attachments?: AttachedFile[];
      images?: string[];
      temperature?: number;
      projectId?: string;
      cloudApiKey?: string;
      provider?: string;
      webSearchEnabled?: boolean;
      thinkEnabled?: boolean;
      isTemporary?: boolean;
      messages?: { role: string; content: string }[];
    },
    onToken: (token: string) => void,
    onInit: (data: { conversationId: string; userMessageId: string; assistantMessageId: string; citations?: CitationItem[] }) => void,
    onError: (error: string) => void,
    onDone: (finalContent: string, citations?: CitationItem[]) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
      signal: abortSignal
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();
    let buffer = '';
    let streamCitations: CitationItem[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'init') {
              if (data.citations) streamCitations = data.citations;
              onInit(data);
            } else if (data.type === 'token') {
              onToken(data.content);
            } else if (data.type === 'error') {
              onError(data.error);
            } else if (data.type === 'done') {
              onDone(data.finalContent, data.citations || streamCitations);
            }
          } catch (e) {}
        }
      }
    }
  },

  // --- Models ---
  async getModels(): Promise<ModelsResponse> {
    const res = await fetch(`${API_BASE}/models`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch models');
    return res.json();
  },

  async testProviderKey(provider: string, apiKey?: string): Promise<{ success: boolean; message: string; models: string[] }> {
    const res = await fetch(`${API_BASE}/models/test-key`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ provider, apiKey })
    });
    if (!res.ok) {
      return { success: false, message: 'Server communication error', models: [] };
    }
    return res.json();
  },

  async pullModel(name: string, onProgress: (data: any) => void): Promise<void> {
    const res = await fetch(`${API_BASE}/models/pull`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });

    if (!res.ok) throw new Error('Failed to start model pull');
    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            onProgress(parsed);
          } catch (e) {}
        }
      }
    }
  },

  // --- Files ---
  async uploadFiles(files: File[], conversationId?: string, projectId?: string): Promise<AttachedFile[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    if (conversationId) formData.append('conversation_id', conversationId);
    if (projectId) formData.append('project_id', projectId);

    const token = localStorage.getItem('localai_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) throw new Error('Failed to upload files');
    return res.json();
  },

  async deleteFile(fileId: string): Promise<void> {
    await fetch(`${API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // --- Projects ---
  async listProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async createProject(data: { name: string; description?: string; instructions?: string; defaultModel?: string }): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  // --- Memory ---
  async listMemories(projectId?: string): Promise<MemoryItem[]> {
    const url = projectId ? `${API_BASE}/memory?project_id=${projectId}` : `${API_BASE}/memory`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  },

  async createMemory(content: string, category = 'general', projectId?: string): Promise<MemoryItem> {
    const res = await fetch(`${API_BASE}/memory`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, category, projectId })
    });
    if (!res.ok) throw new Error('Failed to create memory');
    return res.json();
  },

  async updateMemory(id: string, updates: { content?: string; category?: string; enabled?: boolean }): Promise<MemoryItem> {
    const res = await fetch(`${API_BASE}/memory/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update memory');
    return res.json();
  },

  async deleteMemory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/memory/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete memory');
  },

  async clearAllMemories(): Promise<void> {
    const res = await fetch(`${API_BASE}/memory`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to clear memories');
  },

  // --- Settings ---
  async getSettings(): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};
