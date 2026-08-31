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
  X, 
  Loader2,
  Volume2
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
    searchEnabled,
    thinkEnabled,
    toggleSearch,
    toggleThink,
    setActiveModal
  } = useAppStore();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

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

  const hasContent = input.trim().length > 0 || attachments.length > 0;

  return (
    <div className="p-4 bg-gradient-to-t from-[var(--bg-chat)] via-[var(--bg-chat)] to-transparent shrink-0">
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
          className={`rounded-3xl bg-[var(--bg-input)] border transition-all shadow-lg ${
            isDragging
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-[var(--bg-input-border)] focus-within:border-[var(--border-medium)]'
          }`}
        >
          {/* File Pills List */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-0">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                >
                  {file.isImage ? (
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  )}
                  <span className="max-w-[140px] truncate font-medium">{file.filename}</span>
                  <button
                    onClick={() => removeAttachment(file.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Top text area with Plus Icon */}
          <div className="flex items-center px-4 pt-3 pb-1">
            {/* + Attachment Button (Exact ChatGPT Style) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-1.5 rounded-full text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)] transition cursor-pointer disabled:opacity-50 mr-2 shrink-0"
              title="Add attachment (PDF, DOCX, Code, Images)"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening...' : 'Ask anything'}
              rows={1}
              className="flex-1 bg-transparent border-0 text-[var(--text-primary)] text-[15px] placeholder-[var(--text-muted)] focus:outline-none resize-none py-1 px-1 max-h-48 leading-relaxed"
            />
          </div>

          {/* Bottom Action Bar: Think Toggle, Search Toggle, Mic, Voice Mode, and Send Button */}
          <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1">
            {/* Left Toggles (Search & Think) */}
            <div className="flex items-center gap-1.5">
              {/* Think (Reasoning) Toggle Button */}
              <button
                type="button"
                onClick={toggleThink}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                  thinkEnabled
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar-hover)] border-transparent'
                }`}
                title="Toggle deep step-by-step reasoning"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Think</span>
              </button>

              {/* Web Search Toggle Button */}
              <button
                type="button"
                onClick={toggleSearch}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                  searchEnabled
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar-hover)] border-transparent'
                }`}
                title="Toggle real-time live web search"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>

            {/* Right Buttons: Mic, Blue Voice Orb, and Send */}
            <div className="flex items-center gap-2">
              {/* Dictate Voice Mic */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2 rounded-full transition cursor-pointer ${
                  isListening
                    ? 'bg-red-500/20 text-red-500'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar-hover)]'
                }`}
                title={isListening ? 'Stop dictating' : 'Dictate message'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Solid Blue Voice Mode Circle Button (Exact ChatGPT Voice Parity) */}
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
                  className="w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--bg-app)] flex items-center justify-center transition cursor-pointer"
                  title="Stop generation"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  className="w-8 h-8 rounded-full bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-app)] flex items-center justify-center transition cursor-pointer"
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean Footer Hint */}
        <div className="text-center pt-2 text-[11px] text-[var(--text-muted)] select-none">
          ChatGPT can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
};
