import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Radio, 
  Zap,
  Hand
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export const VoiceModeModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    sendMessage, 
    isStreaming, 
    streamingContent, 
    activeConversation 
  } = useAppStore();

  const [mode, setMode] = useState<'handsfree' | 'pushtotalk'>('handsfree');
  const [isListening, setIsListening] = useState(false);
  const [isHoldingPtt, setIsHoldingPtt] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [lastAiResponse, setLastAiResponse] = useState('');

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  if (activeModal !== 'voice') return null;

  // Interruption Helper: Halts TTS audio playback instantly
  const interruptSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setVoiceStatus('idle');
    }
  };

  // Start Speech Recognition
  const startListening = () => {
    // Interruption support: If AI is speaking, interrupt it instantly!
    interruptSpeaking();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
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
        // Any detected user voice immediately interrupts any lingering audio
        interruptSpeaking();

        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        setTranscript(currentTranscript);

        // In hands-free mode, auto-send after 1.8s of silence
        if (mode === 'handsfree') {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (currentTranscript.trim()) {
              handleSendSpokenPrompt(currentTranscript.trim());
            }
          }, 1800);
        }
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
      console.error(e);
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

  const handleSendSpokenPrompt = (text: string) => {
    stopListening();
    setVoiceStatus('thinking');
    sendMessage(text, [], []);
    setTranscript('');
  };

  // Push to Talk Handlers (Spacebar & Touch)
  const handlePttDown = () => {
    interruptSpeaking();
    setIsHoldingPtt(true);
    startListening();
  };

  const handlePttUp = () => {
    setIsHoldingPtt(false);
    stopListening();
    if (transcript.trim()) {
      handleSendSpokenPrompt(transcript.trim());
    }
  };

  // Keyboard Spacebar listener for Push-to-Talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && mode === 'pushtotalk' && !isHoldingPtt) {
        e.preventDefault();
        handlePttDown();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && mode === 'pushtotalk' && isHoldingPtt) {
        e.preventDefault();
        handlePttUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, isHoldingPtt, transcript]);

  // Watch for AI stream finish and speak it aloud
  useEffect(() => {
    if (isStreaming) {
      setVoiceStatus('thinking');
    } else if (voiceStatus === 'thinking' && !isStreaming) {
      const msgs = activeConversation?.messages || [];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
        setLastAiResponse(lastMsg.content);
        speakResponse(lastMsg.content);
      } else {
        setVoiceStatus('idle');
      }
    }
  }, [isStreaming]);

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setVoiceStatus('idle');
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown tags before speaking
    const cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/[#*`$_\-\[\]]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.08;

    setVoiceStatus('speaking');

    utterance.onend = () => {
      setVoiceStatus('idle');
      // In hands-free mode, auto-listen again after AI finishes speaking
      if (mode === 'handsfree') {
        startListening();
      }
    };

    utterance.onerror = () => {
      setVoiceStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleClose = () => {
    stopListening();
    interruptSpeaking();
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in select-none">
      <div className="w-full max-w-xl flex flex-col items-center justify-between h-[82vh] p-6 sm:p-8 text-center relative">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
              ChatGPT Real-Time Voice
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-full p-1 gap-1 text-[11px]">
            <button
              onClick={() => {
                setMode('handsfree');
                if (isListening) stopListening();
              }}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                mode === 'handsfree' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hands-Free
            </button>
            <button
              onClick={() => {
                setMode('pushtotalk');
                if (isListening) stopListening();
              }}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                mode === 'pushtotalk' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Push to Talk
            </button>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Fluid Animated Orb Visualizer with Dynamic Waves */}
        <div className="flex flex-col items-center justify-center space-y-8 my-auto">
          <div className="relative flex items-center justify-center">
            {/* Outer dynamic rings */}
            <div className={`absolute w-72 h-72 rounded-full transition-all duration-700 opacity-20 ${
              voiceStatus === 'listening' ? 'bg-blue-500 scale-125 animate-ping' :
              voiceStatus === 'speaking' ? 'bg-cyan-400 scale-125 animate-pulse' :
              voiceStatus === 'thinking' ? 'bg-purple-500 scale-105 animate-spin' : 'bg-slate-800 scale-95'
            }`} />

            <div className={`absolute w-52 h-52 rounded-full transition-all duration-500 opacity-30 ${
              voiceStatus === 'listening' ? 'bg-blue-500 animate-pulse' :
              voiceStatus === 'speaking' ? 'bg-teal-400 animate-pulse' :
              voiceStatus === 'thinking' ? 'bg-purple-500' : 'bg-slate-800'
            }`} />

            {/* Core Circular Orb Button */}
            {mode === 'handsfree' ? (
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
                className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer ${
                  voiceStatus === 'listening'
                    ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-blue-500/50 scale-105 animate-pulse'
                    : voiceStatus === 'speaking'
                    ? 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-500 text-white shadow-cyan-500/50'
                    : voiceStatus === 'thinking'
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-500/50 animate-spin'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-slate-900/50 hover:scale-105'
                }`}
              >
                {voiceStatus === 'listening' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-6 bg-white rounded-full animate-pulse" />
                    <span className="w-1.5 h-10 bg-white rounded-full animate-pulse delay-75" />
                    <span className="w-1.5 h-4 bg-white rounded-full animate-pulse delay-150" />
                  </div>
                ) : voiceStatus === 'speaking' ? (
                  <Volume2 className="w-12 h-12 animate-bounce" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </button>
            ) : (
              /* Push-to-Talk Interactive Hold Orb */
              <button
                onMouseDown={handlePttDown}
                onMouseUp={handlePttUp}
                onTouchStart={handlePttDown}
                onTouchEnd={handlePttUp}
                className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-150 cursor-pointer select-none ${
                  isHoldingPtt
                    ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-blue-500/60 scale-110'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Hand className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isHoldingPtt ? 'Release to Send' : 'Hold to Talk'}
                </span>
              </button>
            )}
          </div>

          {/* Status Label & Interruption Hint */}
          <div className="space-y-2.5 max-w-md">
            <div className="text-sm font-semibold tracking-wide">
              {voiceStatus === 'listening' && (
                <span className="text-blue-400 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  Listening to you...
                </span>
              )}
              {voiceStatus === 'thinking' && <span className="text-purple-400">AI is thinking...</span>}
              {voiceStatus === 'speaking' && (
                <span className="text-cyan-400 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  AI Speaking (Speak or tap to interrupt)
                </span>
              )}
              {voiceStatus === 'idle' && (
                <span className="text-slate-400">
                  {mode === 'pushtotalk' ? 'Hold Spacebar or the Orb to talk' : 'Tap the orb or speak freely'}
                </span>
              )}
            </div>

            {transcript && (
              <p className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 italic max-h-20 overflow-y-auto">
                "{transcript}"
              </p>
            )}

            {streamingContent && (
              <p className="text-xs text-slate-400 max-h-20 overflow-y-auto bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 line-clamp-3">
                {streamingContent}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {voiceStatus === 'speaking' && (
            <button
              onClick={() => {
                interruptSpeaking();
                startListening();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium flex items-center gap-2 cursor-pointer transition"
            >
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              <span>Interrupt & Speak</span>
            </button>
          )}

          {mode === 'handsfree' && (
            <button
              onClick={() => {
                if (isListening) stopListening();
                else startListening();
              }}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium cursor-pointer transition"
            >
              {isListening ? 'Mute Mic' : 'Start Listening'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
