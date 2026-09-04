import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Plus, 
  Brain, 
  Paperclip, 
  Volume2, 
  VolumeX, 
  Loader2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';
import type { AttachedFile } from '../../types';

export const VoiceModeModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    sendMessage, 
    isStreaming, 
    streamingContent, 
    activeConversation,
    thinkEnabled,
    toggleThink,
    settings,
    activeConversationId,
    activeProjectId
  } = useAppStore();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const accumulatedStreamRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interruption helper: stops TTS playback immediately
  const interruptSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    (window as any)._activeUtterance = null;
    if (voiceStatus === 'speaking') {
      setVoiceStatus('idle');
    }
  };

  // Pre-load available system voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.getVoices();
    }
  }, []);

  // When voice mode opens: resume audio context and auto-start listening
  useEffect(() => {
    if (activeModal === 'voice') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      const timer = setTimeout(() => {
        startListening();
      }, 350);
      return () => {
        clearTimeout(timer);
        stopListening();
        interruptSpeaking();
      };
    } else {
      stopListening();
      interruptSpeaking();
    }
  }, [activeModal]);

  // Track streaming text while AI is responding
  useEffect(() => {
    if (activeModal !== 'voice') return;
    if (isStreaming && streamingContent) {
      accumulatedStreamRef.current = streamingContent;
      setVoiceStatus('thinking');
    }
  }, [activeModal, isStreaming, streamingContent]);

  // When AI finishes streaming: read response ALOUD via Text-To-Speech
  useEffect(() => {
    if (activeModal !== 'voice') return;
    if (!isStreaming && voiceStatus === 'thinking') {
      const textToSpeak = accumulatedStreamRef.current || '';
      accumulatedStreamRef.current = '';

      if (textToSpeak.trim()) {
        speakResponse(textToSpeak);
      } else {
        const msgs = activeConversation?.messages || [];
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
          speakResponse(lastMsg.content);
        } else {
          setVoiceStatus('idle');
          startListening();
        }
      }
    }
  }, [activeModal, isStreaming]);

  // Robust Text-To-Speech function
  const speakResponse = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceStatus('idle');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      // Clean text: strip thinking blocks, code blocks, bold, markdown tags
      let cleanText = text
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/```[\s\S]*?```/gi, ' code snippet ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*#_~>[\]()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        setVoiceStatus('idle');
        startListening();
        return;
      }

      // Limit spoken length to keep voice conversation snappy
      if (cleanText.length > 450) {
        const sentenceEnd = cleanText.indexOf('.', 350);
        if (sentenceEnd !== -1) {
          cleanText = cleanText.slice(0, sentenceEnd + 1);
        } else {
          cleanText = cleanText.slice(0, 450) + '...';
        }
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select voice based on user settings or best available natural voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredName = (settings?.voiceVoice || 'juniper').toLowerCase();
        let selectedVoice = voices.find(v => v.name.toLowerCase().includes(preferredName));
        
        if (!selectedVoice) {
          // Fallback to high quality English voices
          selectedVoice = voices.find(v => 
            v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny'))
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      // Prevent garbage collection bug in Chrome on Windows
      (window as any)._activeUtterance = utterance;
      setVoiceStatus('speaking');

      utterance.onend = () => {
        (window as any)._activeUtterance = null;
        setVoiceStatus('idle');
        // Auto-listen after AI finishes speaking
        startListening();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        (window as any)._activeUtterance = null;
        setVoiceStatus('idle');
        startListening();
      };

      // Keep-alive timer for long speech synthesis in Chrome
      const keepAliveTimer = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(keepAliveTimer);
        } else {
          window.speechSynthesis.resume();
        }
      }, 5000);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('TTS error:', e);
      setVoiceStatus('idle');
      startListening();
    }
  };

  // Start Speech Recognition (STT)
  const startListening = () => {
    interruptSpeaking();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus('listening');
      };

      recognition.onresult = (event: any) => {
        interruptSpeaking();

        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        setTranscript(currentTranscript);

        // Auto-send prompt after 1.5s silence
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (currentTranscript.trim()) {
            handleSendSpoken(currentTranscript.trim());
          }
        }, 1500);
      };

      recognition.onerror = () => {
        setIsListening(false);
        if (voiceStatus === 'listening') setVoiceStatus('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (voiceStatus === 'listening') setVoiceStatus('idle');
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Recognition start error:', e);
      setIsListening(false);
      setVoiceStatus('idle');
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
    if (voiceStatus === 'listening') setVoiceStatus('idle');
  };

  const handleSendSpoken = (text: string) => {
    stopListening();
    interruptSpeaking();
    setVoiceStatus('thinking');
    setTranscript('');

    // Voice mode uses fast conversational prompt and concise responses
    sendMessage(
      text,
      attachments,
      []
    );
    setAttachments([]);
  };

  const handleTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typeInput.trim() && attachments.length === 0) return;

    const text = typeInput.trim();
    setTypeInput('');
    handleSendSpoken(text);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded = await api.uploadFiles(Array.from(files), activeConversationId || undefined, activeProjectId || undefined);
      setAttachments(prev => [...prev, ...uploaded]);
    } catch (e) {
      alert('Failed to attach file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    stopListening();
    interruptSpeaking();
    setActiveModal(null);
  };

  if (activeModal !== 'voice') return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black text-white select-none animate-in fade-in duration-300">
      {/* Top Header: Voice Indicator & Close button */}
      <div className="w-full max-w-4xl flex items-center justify-between p-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span className="text-xs font-semibold text-neutral-400 tracking-wider">
            Guts Voice
          </span>
        </div>

        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-neutral-800"
          title="Close voice mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Radiant Animated Glowing Purple/Violet Fluid Orb (Matching Screenshot 1) */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-4 my-auto relative">
        <div className="relative flex items-center justify-center">
          {/* Outer diffused glowing aura */}
          <div className={`absolute w-80 h-80 rounded-full blur-3xl transition-all duration-700 pointer-events-none opacity-40 ${
            voiceStatus === 'listening'
              ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 scale-125 animate-pulse'
              : voiceStatus === 'speaking'
              ? 'bg-gradient-to-tr from-purple-500 via-violet-400 to-sky-400 scale-135 animate-pulse'
              : voiceStatus === 'thinking'
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 scale-110 animate-spin'
              : 'bg-indigo-900/30 scale-95'
          }`} />

          {/* Secondary ambient ring */}
          <div className={`absolute w-60 h-60 rounded-full blur-xl transition-all duration-500 pointer-events-none opacity-50 ${
            voiceStatus === 'listening'
              ? 'bg-violet-500 animate-pulse'
              : voiceStatus === 'speaking'
              ? 'bg-purple-400 animate-pulse'
              : 'bg-indigo-700/20'
          }`} />

          {/* Authentic Fluid Morphing Orb Button (ChatGPT Voice Orb Match) */}
          <button
            onClick={() => {
              if (voiceStatus === 'speaking') {
                interruptSpeaking();
                startListening();
              } else if (voiceStatus === 'listening') {
                stopListening();
              } else {
                startListening();
              }
            }}
            className={`relative z-10 w-44 h-44 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden ${
              voiceStatus === 'listening'
                ? 'bg-gradient-to-br from-violet-300 via-indigo-400 to-purple-500 shadow-violet-500/40 scale-105 animate-pulse'
                : voiceStatus === 'speaking'
                ? 'bg-gradient-to-tr from-purple-200 via-violet-300 to-sky-300 shadow-purple-400/50 scale-110 animate-pulse'
                : voiceStatus === 'thinking'
                ? 'bg-gradient-to-tr from-violet-400 via-indigo-500 to-purple-600 shadow-indigo-500/30 animate-pulse'
                : 'bg-gradient-to-br from-violet-300/90 via-indigo-400/80 to-purple-500/90 hover:scale-105 shadow-violet-500/30'
            }`}
          >
            {/* Inner fluid milky sheen */}
            <div className="absolute inset-0 bg-radial from-white/60 via-transparent to-transparent opacity-70 pointer-events-none" />
            <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-white/40 blur-lg pointer-events-none" />
          </button>
        </div>

        {/* Live Spoken Captions & Feedback */}
        <div className="mt-8 text-center max-w-md w-full space-y-2 min-h-[50px]">
          {transcript && (
            <div className="text-sm font-medium text-neutral-200 animate-in fade-in">
              "{transcript}"
            </div>
          )}

          {voiceStatus === 'thinking' && !transcript && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-neutral-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Thinking...</span>
            </div>
          )}

          {voiceStatus === 'speaking' && (
            <div className="text-xs text-neutral-400 flex items-center justify-center gap-1.5 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span>AI speaking (Tap orb or speak to interrupt)</span>
            </div>
          )}

          {voiceStatus === 'idle' && !transcript && (
            <div className="text-xs text-neutral-500">
              Tap orb to speak or type your question below
            </div>
          )}
        </div>
      </div>

      {/* Attachments preview pill row if any */}
      {attachments.length > 0 && (
        <div className="w-full max-w-2xl px-6 flex flex-wrap gap-2 mb-2 z-10">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200"
            >
              {file.isImage ? (
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="max-w-[130px] truncate">{file.filename}</span>
              <button
                onClick={() => setAttachments(prev => prev.filter(a => a.id !== file.id))}
                className="text-neutral-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Interactive Bar (Exact Match to ChatGPT Screenshot 1) */}
      <div className="w-full max-w-2xl px-4 pb-6 pt-2 z-10">
        <form
          onSubmit={handleTextSubmit}
          className="flex items-center justify-between gap-2 p-1.5 pl-3 rounded-full bg-neutral-900/95 border border-neutral-800 shadow-2xl backdrop-blur-xl"
        >
          {/* '+' Button: File & Image Attachment */}
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Add photos or files"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2]" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple
              className="hidden"
            />
          </div>

          {/* 'Type' Text Input Field */}
          <input
            type="text"
            value={typeInput}
            onChange={(e) => setTypeInput(e.target.value)}
            placeholder="Type"
            className="flex-1 bg-transparent border-0 text-sm text-white placeholder-neutral-500 focus:outline-none px-2 py-1"
          />

          {/* Right Action Icons: Think Toggle, Mic Toggle, Close (X) Button */}
          <div className="flex items-center gap-1.5 pr-1">
            {/* Think Toggle Button */}
            <button
              type="button"
              onClick={() => toggleThink()}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                thinkEnabled
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Reasoning / Deep Thinking"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Think</span>
            </button>

            {/* Microphone Toggle Button */}
            <button
              type="button"
              onClick={() => {
                if (isListening) stopListening();
                else startListening();
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                isListening
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={isListening ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Exit Voice Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
