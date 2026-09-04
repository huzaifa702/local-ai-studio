export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  phone_number?: string;
  displayName: string;
  avatar: string;
  token?: string;
  createdAt?: string;
  isLoggedIn?: boolean;
  picture?: string;
}

export interface CitationItem {
  title: string;
  url: string;
  snippet?: string;
  domain?: string;
  favicon?: string;
}

export interface AttachedFile {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  extractedText?: string;
  isImage?: boolean;
  preview?: string;
  url?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thought?: string;
  attachments?: AttachedFile[];
  citations?: CitationItem[];
  tokens?: number;
  model?: string;
  feedback?: 'like' | 'dislike' | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  project_id?: string | null;
  is_pinned: number | boolean;
  is_archived: number | boolean;
  model: string;
  system_prompt?: string | null;
  created_at: string;
  updated_at: string;
  messageCount?: number;
  messages?: Message[];
}

export interface ModelInfo {
  name: string;
  displayName?: string;
  description?: string;
  size?: string;
  rawSize?: number;
  vramEstimate?: string;
  recommendedFor?: string;
  tags?: string[];
  isInstalled?: boolean;
  format?: string;
  family?: string;
  parameterSize?: string;
  quantizationLevel?: string;
}

export interface CloudModel {
  id: string;
  name: string;
  provider: 'openai' | 'groq' | 'anthropic' | 'gemini' | 'openrouter';
  context: number;
  vision: boolean;
}

export interface ModelsResponse {
  isOllamaRunning: boolean;
  installedModels: ModelInfo[];
  recommendedModels: ModelInfo[];
  cloudModels: CloudModel[];
  hardwareRecommendation: {
    system: string;
    optimalModel: string;
    maxVramRecommended: string;
    maxRamRecommended: string;
  };
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  instructions: string;
  default_model: string;
  workspace_path: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryItem {
  id: string;
  user_id: string;
  project_id?: string | null;
  category: string;
  content: string;
  enabled: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface ApiKeys {
  openai: string;
  groq: string;
  anthropic: string;
  openrouter: string;
  gemini: string;
  tavily?: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  contrast?: 'Default' | 'Increased';
  accentColor?: 'Purple' | 'Indigo' | 'Emerald' | 'Blue' | 'Amber';
  language?: string;
  higherIntelligence?: boolean;
  enableDictation?: boolean;
  defaultModel: string;
  codingModel: string;
  visionModel: string;
  temperature: number;
  contextSize: number;
  memoryEnabled: boolean;
  voiceEnabled: boolean;
  voiceAutoPlay: boolean;
  voiceVoice: string;
  webSearchEnabled?: boolean;
  systemPrompt: string;
  hardwareProfile: string;
  apiKeys: ApiKeys;
}
