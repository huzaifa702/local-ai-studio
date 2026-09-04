import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  Square, 
  Plus, 
  Mic, 
  MicOff, 
  Globe, 
  Brain, 
  FileText, 
  Image as ImageIcon, 
  Camera, 
  FolderPlus, 
  Database, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  X, 
  Loader2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';
import type { AttachedFile } from '../../types';

export const MessageInput: React.FC = () => {
  const { 
    sendMessage, 
    isStreaming, 
    stopStreaming, 
    activeConversationId, 
    activeProjectId, 
    selectedModel, 
    setSelectedModel,
    searchEnabled, 
    thinkEnabled, 
    toggleSearch, 
    toggleThink, 
    setActiveModal,
    settings
  } = useAppStore();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Claude / ChatGPT Plus menu popover
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  // Claude model & effort thinking popover
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  // Thinking effort: 'low' | 'medium' | 'high' | 'max'
  const [thinkingEffort, setThinkingEffort] = useState<'low' | 'medium' | 'high' | 'max'>('max');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const plusMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const fileArray = Array.from(files);
      const uploaded = await api.uploadFiles(fileArray, activeConversationId || undefined, activeProjectId || undefined);
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (e) {
      console.error('File upload error:', e);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;
    sendMessage(input.trim(), attachments, []);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTakeScreenshot = async () => {
    setPlusMenuOpen(false);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const track = stream.getVideoTracks()[0];
        const imageCapture = new (window as any).ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        track.stop();

        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(bitmap, 0, 0);

        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
            const uploaded = await api.uploadFiles([file], activeConversationId || undefined, activeProjectId || undefined);
            setAttachments((prev) => [...prev, ...uploaded]);
          }
        }, 'image/png');
      }
    } catch (e) {
      console.log('Screenshot cancelled or not supported:', e);
    }
  };

  const hasContent = input.trim().length > 0 || attachments.length > 0;

  // Available models list matching exact screenshot options & Cloud models
  const modelsList = [
    {
      id: 'ox-alpha',
      name: 'OX-Alpha (Omni)',
      provider: 'ollama' as const,
      subtitle: 'Most efficient for everyday tasks & auto-routes vision/code',
      badge: 'Auto',
      isDefault: true
    },
    {
      id: 'llama3.2:3b',
      name: 'Llama 3.2 (Fast)',
      provider: 'ollama' as const,
      subtitle: 'Fastest local model for quick answers & conversation',
      badge: 'Local',
      isDefault: false
    },
    {
      id: 'qwen2.5-coder:7b',
      name: 'Qwen 2.5 Coder',
      provider: 'ollama' as const,
      subtitle: 'For complex programming & refactoring tasks',
      badge: 'Code Pro',
      isDefault: false
    },
    {
      id: 'deepseek-r1:7b',
      name: 'DeepSeek-R1 (Reasoning)',
      provider: 'ollama' as const,
      subtitle: 'For your toughest challenges & deep thinking',
      badge: 'Reasoning',
      isDefault: false
    },
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Groq Llama 3.3',
      provider: 'groq' as const,
      subtitle: '300 tok/s blazing cloud speed via Groq LPU',
      badge: '300 t/s ⚡',
      isDefault: false
    },
    {
      id: 'gpt-4o',
      name: 'OpenAI GPT-4o',
      provider: 'openai' as const,
      subtitle: 'Multimodal intelligence & high precision reasoning',
      badge: 'Cloud',
      isDefault: false
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'gemini' as const,
      subtitle: 'Google DeepMind 1M context window model',
      badge: 'Cloud',
      isDefault: false
    }
  ];

  const currentModelObj = modelsList.find(m => m.id.toLowerCase() === selectedModel.toLowerCase()) || modelsList[0];

  return (
    <div className="p-4 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)] to-transparent shrink-0">
      <div className="max-w-3xl mx-auto">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`rounded-3xl bg-[var(--bg-input)] border transition-all shadow-lg relative ${
            isDragging
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-[var(--border-input)] focus-within:border-[var(--text-muted)]'
          }`}
        >
          {/* File Pills List */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-0">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)]"
                >
                  {file.isImage ? (
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  )}
                  <span className="max-w-[140px] truncate font-medium">{file.filename}</span>
                  <button
                    onClick={() => removeAttachment(file.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Top text area with Prompt Input */}
          <div className="flex items-start px-4 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening...' : 'How can I help you today?'}
              rows={1}
              className="flex-1 bg-transparent border-0 text-[var(--text-main)] text-[15px] placeholder-[var(--text-muted)] focus:outline-none resize-none py-1 px-1 max-h-48 leading-relaxed"
            />
          </div>

          {/* Bottom Action Bar (Exact Match to User Screenshots 1 & 2) */}
          <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-[var(--border-subtle)]/50 mt-1">
            {/* Left Buttons: '+' Popup Menu & 'Chat / Cowork' tabs */}
            <div className="flex items-center gap-2 relative">
              {/* '+' Action Menu Button */}
              <div ref={plusMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                  disabled={isUploading}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer border ${
                    plusMenuOpen 
                      ? 'bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] border-[var(--border-input)]' 
                      : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] border-transparent'
                  }`}
                  title="Add attachment, search, screenshot, or memory"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[2]" />}
                </button>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    setPlusMenuOpen(false);
                    handleFileUpload(e.target.files);
                  }}
                  multiple
                  className="hidden"
                />
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    setPlusMenuOpen(false);
                    handleFileUpload(e.target.files);
                  }}
                  multiple
                  className="hidden"
                />

                {/* '+' Popup Menu (Exact Screenshot 1 Layout) */}
                {plusMenuOpen && (
                  <div className="absolute left-0 bottom-9 w-60 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-input)] shadow-2xl p-1.5 z-50 text-xs animate-in fade-in slide-in-from-bottom-2 space-y-0.5">
                    {/* 1. Add files or photos */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[var(--text-sub)]" />
                        <span>Add files or photos</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Ctrl U</span>
                    </button>

                    {/* 2. Take a screenshot */}
                    <button
                      onClick={handleTakeScreenshot}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[var(--text-sub)]" />
                      <span>Take a screenshot</span>
                    </button>

                    {/* 3. Add to project */}
                    <button
                      onClick={() => {
                        setPlusMenuOpen(false);
                        setActiveModal('projects');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderPlus className="w-4 h-4 text-[var(--text-sub)]" />
                        <span>Add to project</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </button>

                    {/* Divider */}
                    <div className="h-[1px] bg-[var(--border-subtle)] my-1" />

                    {/* 4. Web search (toggle with checkmark) */}
                    <button
                      onClick={() => toggleSearch()}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span>Web search</span>
                      </div>
                      {searchEnabled && <Check className="w-4 h-4 text-blue-400" />}
                    </button>

                    {/* 5. Memory (toggle with checkmark) */}
                    <button
                      onClick={() => {
                        setPlusMenuOpen(false);
                        setActiveModal('memory');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4 text-purple-400" />
                        <span>Memory</span>
                      </div>
                      <Check className="w-4 h-4 text-purple-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mode Tabs: 'Chat' | 'Cowork' */}
              <div className="flex items-center bg-[var(--bg-sidebar-hover)] p-0.5 rounded-full text-xs font-medium border border-[var(--border-subtle)]">
                <button
                  type="button"
                  className="px-2.5 py-0.5 rounded-full bg-[var(--bg-main)] text-[var(--text-main)] shadow-sm cursor-pointer text-[11px]"
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('projects')}
                  className="px-2.5 py-0.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer text-[11px]"
                >
                  Cowork
                </button>
              </div>
            </div>

            {/* Right Buttons: Model & Effort Popover, Mic, Voice Pill, and Send */}
            <div className="flex items-center gap-2">
              {/* Model & Thinking Effort Selector Popover (Exact Screenshot 2) */}
              <div ref={modelMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setModelMenuOpen(!modelMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] text-xs font-medium transition cursor-pointer"
                >
                  <span className="font-semibold text-[12px]">{currentModelObj.name.split(' ')[0]}</span>
                  {thinkEnabled && (
                    <span className="flex items-center gap-0.5 text-[11px] text-amber-500 font-normal">
                      <span>{thinkingEffort.toUpperCase()}</span>
                      <Brain className="w-3 h-3" />
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                </button>

                {/* Model & Thinking Effort Dropdown Menu (Exact Screenshot 2 Layout) */}
                {modelMenuOpen && (
                  <div className="absolute right-0 bottom-9 w-72 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-input)] shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-bottom-2 space-y-1">
                    {/* Models List */}
                    <div className="space-y-0.5">
                      {modelsList.map((m) => {
                        const isSelected = selectedModel.toLowerCase().includes(m.id.toLowerCase());
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModel(m.id, m.provider);
                              if (m.id === 'deepseek-r1:7b') {
                                if (!thinkEnabled) toggleThink();
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--bg-sidebar-hover)] text-[var(--text-main)]'
                                : 'hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)]'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--text-main)]">
                                <span>{m.name}</span>
                                {m.badge && (
                                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 text-[9px] font-bold">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                                {m.subtitle}
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Divider */}
                    <div className="h-[1px] bg-[var(--border-subtle)] my-1.5" />

                    {/* Effort / Thinking Selector (Exact Screenshot 2) */}
                    <div className="px-3 py-2 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-[var(--text-main)]">
                          <Brain className="w-3.5 h-3.5 text-amber-500" />
                          <span>Effort</span>
                        </div>
                        <button
                          onClick={() => toggleThink()}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                            thinkEnabled ? 'bg-amber-500/20 text-amber-400' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          {thinkEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {/* Thinking Effort Level Radios */}
                      {thinkEnabled && (
                        <div className="flex items-center justify-between pt-1 gap-1 text-[10px]">
                          {(['low', 'medium', 'high', 'max'] as const).map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setThinkingEffort(lvl)}
                              className={`flex-1 py-1 rounded-lg text-center uppercase font-semibold transition cursor-pointer border ${
                                thinkingEffort === lvl
                                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-sm'
                                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)]'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* More Models Link */}
                    <button
                      onClick={() => {
                        setModelMenuOpen(false);
                        setActiveModal('models');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center justify-between cursor-pointer pt-1"
                    >
                      <span>More models (Models Hub)</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Dictate Voice Mic */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  isListening
                    ? 'bg-red-500/20 text-red-500'
                    : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)]'
                }`}
                title={isListening ? 'Stop dictating' : 'Dictate message'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Solid Blue Voice Mode Pill Button */}
              {!hasContent && !isStreaming ? (
                <button
                  type="button"
                  onClick={() => setActiveModal('voice')}
                  className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition shadow-md hover:scale-105 cursor-pointer"
                  title="Open Voice Assistant Mode"
                >
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
                  </div>
                </button>
              ) : isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="w-8 h-8 rounded-full bg-[var(--text-main)] text-[var(--bg-main)] flex items-center justify-center transition cursor-pointer"
                  title="Stop generation"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  className="w-8 h-8 rounded-full bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-main)] flex items-center justify-center transition cursor-pointer"
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean Footer Note */}
        <div className="text-center pt-2 text-[11px] text-[var(--text-muted)] select-none">
          Guts AI runs 100% locally and privately. Check important info.
        </div>
      </div>
    </div>
  );
};
