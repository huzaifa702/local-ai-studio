import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Plus, 
  Brain, 
  Volume2, 
  Loader2,
  FileText,
  Image as ImageIcon,
  Radio,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';
import type { AttachedFile } from '../../types';

export const VoiceModeModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    activeConversation,
    thinkEnabled,
    toggleThink,
    settings,
    activeConversationId,
    activeProjectId,
    selectedModel,
    selectedProvider
  } = useAppStore();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [spokenText, setSpokenText] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 real-time audio volume
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ttsWatchdogRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isComponentMountedRef = useRef(true);

  // Play modern chime via Web Audio Oscillator
  const playChime = (type: 'start' | 'done' | 'pop') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'done') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {}
  };

  // Setup Web Audio Mic Visualizer
  const setupAudioVisualizer = async () => {
    try {
      if (analyserRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!isComponentMountedRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e: any) {
      console.warn('Microphone stream access not granted:', e);
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  };

  // Interruption helper: stops TTS playback immediately
  const interruptSpeaking = () => {
    if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    (window as any)._activeUtterance = null;
    if (voiceStatus === 'speaking') {
      setVoiceStatus('idle');
    }
  };

  // Lifecycle
  useEffect(() => {
    isComponentMountedRef.current = true;

    if (activeModal === 'voice') {
      setupAudioVisualizer();
      playChime('start');
      const timer = setTimeout(() => {
        startListening();
      }, 400);
      return () => {
        clearTimeout(timer);
        stopListening();
        interruptSpeaking();
        stopAudioVisualizer();
      };
    } else {
      stopListening();
      interruptSpeaking();
      stopAudioVisualizer();
    }

    return () => {
      isComponentMountedRef.current = false;
      stopAudioVisualizer();
    };
  }, [activeModal]);

  // Speech Recognition (STT)
  const startListening = () => {
    interruptSpeaking();
    setErrorMessage(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
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

        // Auto-send prompt after 1.2s silence
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (currentTranscript.trim()) {
            handleSendSpoken(currentTranscript.trim());
          }
        }, 1200);
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setErrorMessage('Microphone access blocked. Please allow microphone permissions in your browser URL bar.');
        } else if (e.error !== 'no-speech') {
          console.warn('Recognition error:', e.error);
        }
        setIsListening(false);
        if (voiceStatus === 'listening') setVoiceStatus('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (voiceStatus === 'listening') {
          // Restart listening automatically if user didn't intentionally stop
          try { recognition.start(); } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e: any) {
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

  // Text-To-Speech (TTS)
  const speakResponse = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceStatus('idle');
      startListening();
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

      if (cleanText.length > 400) {
        const periodIdx = cleanText.indexOf('.', 280);
        if (periodIdx !== -1) {
          cleanText = cleanText.slice(0, periodIdx + 1);
        } else {
          cleanText = cleanText.slice(0, 380) + '...';
        }
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredName = (settings?.voiceVoice || 'juniper').toLowerCase();
        let selectedVoice = voices.find(v => v.name.toLowerCase().includes(preferredName));
        if (!selectedVoice) {
          selectedVoice = voices.find(v => 
            v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny'))
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        }
        if (selectedVoice) utterance.voice = selectedVoice;
      }

      (window as any)._activeUtterance = utterance;
      setSpokenText(cleanText);
      setVoiceStatus('speaking');

      const estimatedDurationMs = Math.max(6000, (cleanText.length / 14) * 1000);
      if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
      ttsWatchdogRef.current = setTimeout(() => {
        (window as any)._activeUtterance = null;
        setVoiceStatus('idle');
        startListening();
      }, estimatedDurationMs);

      utterance.onend = () => {
        if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
        (window as any)._activeUtterance = null;
        setVoiceStatus('idle');
        playChime('done');
        startListening();
      };

      utterance.onerror = (e) => {
        if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
        (window as any)._activeUtterance = null;
        setVoiceStatus('idle');
        startListening();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setVoiceStatus('idle');
      startListening();
    }
  };

  // Send query to fast model
  const handleSendSpoken = async (text: string) => {
    stopListening();
    interruptSpeaking();
    setVoiceStatus('thinking');
    setTranscript('');

    const fastModel = selectedModel.includes('3.2') || selectedProvider !== 'ollama' 
      ? selectedModel 
      : 'llama3.2:3b';

    const voiceSystemPrompt = "You are Guts Voice, an ultra-fast private voice assistant. Give spoken, natural, concise responses in 1 to 2 sentences without markdown, code blocks, or thinking tags.";

    let accumulatedText = '';
    let cloudApiKey: string | undefined = undefined;
    if (selectedProvider !== 'ollama' && settings.apiKeys) {
      cloudApiKey = settings.apiKeys[selectedProvider as keyof typeof settings.apiKeys] || '';
    }

    try {
      await api.sendMessageStream(
        {
          conversationId: activeConversationId || undefined,
          content: text,
          model: fastModel,
          systemPrompt: voiceSystemPrompt,
          attachments,
          images: [],
          temperature: 0.6,
          projectId: activeProjectId || undefined,
          cloudApiKey,
          provider: selectedProvider,
          webSearchEnabled: false, // Fast conversational chat
          thinkEnabled: false
        },
        (token) => {
          accumulatedText += token;
        },
        () => {},
        (err) => {
          accumulatedText += ` ${err}`;
        },
        (finalContent) => {
          const toSpeak = finalContent || accumulatedText;
          speakResponse(toSpeak);
        }
      );
    } catch (e: any) {
      speakResponse("I apologize, but I encountered a connection error. Please try again.");
    } finally {
      setAttachments([]);
    }
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
    stopAudioVisualizer();
    setActiveModal(null);
  };

  if (activeModal !== 'voice') return null;

  // Dynamic visualizer size computation
  const dynamicScale = 1 + (audioLevel / 250);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[var(--bg-main)] text-[var(--text-main)] select-none animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between p-6 z-10">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${voiceStatus === 'listening' ? 'bg-emerald-500 animate-ping' : 'bg-[var(--accent-color)]'}`} />
          <span className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[var(--accent-color)]" />
            <span>Guts Voice Studio</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-color)] text-[10px] font-bold">
            Ultra-Fast 3B
          </span>
        </div>

        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center transition cursor-pointer border border-[var(--border-subtle)] shadow-sm"
          title="Exit voice mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Dynamic Audio Visualizer & Radiant Orb */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-4 my-auto relative">
        <div className="relative flex items-center justify-center">
          
          {/* Audio Visualizer Wave Ring (Expands with mic volume) */}
          <div 
            style={{ transform: `scale(${dynamicScale * 1.3})` }}
            className={`absolute w-80 h-80 rounded-full blur-3xl transition-transform duration-75 pointer-events-none opacity-40 ${
              voiceStatus === 'listening'
                ? 'bg-gradient-to-tr from-violet-600 via-indigo-500 to-emerald-400'
                : voiceStatus === 'speaking'
                ? 'bg-gradient-to-tr from-purple-500 via-pink-400 to-sky-400 animate-pulse'
                : voiceStatus === 'thinking'
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 animate-spin'
                : 'bg-indigo-900/20'
            }`} 
          />

          {/* Secondary ambient ring */}
          <div 
            style={{ transform: `scale(${dynamicScale * 1.15})` }}
            className={`absolute w-60 h-60 rounded-full blur-xl transition-transform duration-100 pointer-events-none opacity-50 ${
              voiceStatus === 'listening'
                ? 'bg-violet-500'
                : voiceStatus === 'speaking'
                ? 'bg-purple-400 animate-pulse'
                : 'bg-indigo-700/20'
            }`} 
          />

          {/* Central Fluid Interactive Orb Button */}
          <button
            onClick={() => {
              playChime('start');
              if (voiceStatus === 'speaking') {
                interruptSpeaking();
                startListening();
              } else if (voiceStatus === 'listening') {
                stopListening();
              } else {
                startListening();
              }
            }}
            style={{ transform: `scale(${dynamicScale})` }}
            className={`relative z-10 w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-75 cursor-pointer overflow-hidden ${
              voiceStatus === 'listening'
                ? 'bg-gradient-to-br from-violet-300 via-indigo-400 to-purple-600 shadow-violet-500/50 ring-4 ring-violet-400/40'
                : voiceStatus === 'speaking'
                ? 'bg-gradient-to-tr from-purple-200 via-violet-300 to-sky-300 shadow-purple-400/50 animate-pulse ring-4 ring-purple-400/40'
                : voiceStatus === 'thinking'
                ? 'bg-gradient-to-tr from-violet-400 via-indigo-500 to-purple-600 shadow-indigo-500/30 animate-pulse'
                : 'bg-gradient-to-br from-violet-400 via-indigo-500 to-purple-700 hover:scale-105 shadow-violet-500/30'
            }`}
          >
            {/* Inner Sheen */}
            <div className="absolute inset-0 bg-radial from-white/70 via-transparent to-transparent opacity-80 pointer-events-none" />
            <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-white/40 blur-lg pointer-events-none" />
            
            {/* Center Status Icon */}
            <div className="relative z-20 flex flex-col items-center justify-center text-white text-center">
              {voiceStatus === 'listening' ? (
                <div className="flex flex-col items-center gap-1">
                  <Mic className="w-8 h-8 text-white drop-shadow-md animate-bounce" />
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Listening</span>
                </div>
              ) : voiceStatus === 'speaking' ? (
                <div className="flex flex-col items-center gap-1">
                  <Volume2 className="w-8 h-8 text-white drop-shadow-md animate-pulse" />
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Speaking</span>
                </div>
              ) : voiceStatus === 'thinking' ? (
                <div className="flex flex-col items-center gap-1">
                  <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow-md" />
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Thinking</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Sparkles className="w-8 h-8 text-white drop-shadow-md" />
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Tap to Talk</span>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Live Spoken Captions & Feedback */}
        <div className="mt-8 text-center max-w-md w-full space-y-2 min-h-[60px]">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-medium animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {transcript && (
            <div className="text-sm font-medium text-[var(--text-main)] animate-in fade-in px-4">
              "{transcript}"
            </div>
          )}

          {voiceStatus === 'speaking' && spokenText && (
            <div className="text-sm font-medium text-purple-600 dark:text-purple-300 animate-in fade-in px-4 leading-relaxed max-h-24 overflow-y-auto">
              "{spokenText}"
            </div>
          )}

          {voiceStatus === 'thinking' && !transcript && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-color)]" />
              <span>Generating response...</span>
            </div>
          )}

          {voiceStatus === 'idle' && !transcript && !spokenText && !errorMessage && (
            <div className="text-xs text-[var(--text-muted)]">
              Speak naturally into your microphone or type below
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)]"
            >
              {file.isImage ? (
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span className="max-w-[130px] truncate">{file.filename}</span>
              <button
                onClick={() => setAttachments(prev => prev.filter(a => a.id !== file.id))}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Interactive Bar */}
      <div className="w-full max-w-2xl px-4 pb-6 pt-2 z-10">
        <form
          onSubmit={handleTextSubmit}
          className="flex items-center justify-between gap-2 p-2 pl-3 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-input)] shadow-2xl backdrop-blur-xl"
        >
          {/* Attachment Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-8 h-8 rounded-full hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center transition cursor-pointer"
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

          {/* Text Input */}
          <input
            type="text"
            value={typeInput}
            onChange={(e) => setTypeInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-0 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none px-2 py-1"
          />

          {/* Right Action Icons: Think Toggle, Mic Toggle, Close (X) */}
          <div className="flex items-center gap-1.5 pr-1">
            <button
              type="button"
              onClick={() => toggleThink()}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                thinkEnabled
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)]'
              }`}
              title="Toggle Deep Thinking"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Think</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isListening) stopListening();
                else startListening();
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                isListening
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar-hover)]'
              }`}
              title={isListening ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center transition cursor-pointer border border-[var(--border-subtle)]"
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
