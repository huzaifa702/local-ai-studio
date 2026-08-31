import React, { useRef, useEffect, useState } from 'react';
import { 
  Image as ImageIcon, 
  PenLine, 
  Globe, 
  ArrowDown
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

export const ChatContainer: React.FC = () => {
  const { 
    activeConversation, 
    isStreaming, 
    streamingContent, 
    streamingCitations,
    sendMessage,
    selectedModel
  } = useAppStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messages = activeConversation?.messages || [];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, streamingContent]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const suggestions = [
    {
      icon: ImageIcon,
      text: 'Analyze an image or screenshot',
      prompt: 'Describe what you see in this image and extract any text or data from it.'
    },
    {
      icon: PenLine,
      text: 'Write or edit',
      prompt: 'Help me draft and edit a well-structured document.'
    },
    {
      icon: Globe,
      text: 'Code & problem solve',
      prompt: 'Write clean, robust Python code with error handling.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] overflow-hidden relative">
      {/* Messages Scroll Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
      >
        {messages.length === 0 && !isStreaming ? (
          /* Exact ChatGPT Home Screen Layout (From User Screenshot) */
          <div className="max-w-2xl w-full mx-auto px-4 my-auto flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in pb-12">
            <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--text-main)] tracking-tight">
              What's on the agenda today?
            </h1>

            {/* Centered ChatGPT Input Box */}
            <div className="w-full">
              <MessageInput />
            </div>

            {/* 3 Suggestions list below Input */}
            <div className="flex flex-col items-start gap-2 w-full max-w-xl text-left pt-2">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(item.prompt, [], [])}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition cursor-pointer w-full text-xs font-medium"
                >
                  <item.icon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <span>{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Messages History */
          <div className="pb-6">
            {messages.map((msg, idx) => (
              <MessageItem
                key={msg.id || idx}
                message={msg}
                isLastAssistant={idx === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}

            {/* Live Streaming Message Bubble */}
            {isStreaming && (
              <div className="py-4 px-4 sm:px-6 md:px-8">
                <div className="max-w-3xl w-full mx-auto space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-muted)]">
                    <span>{selectedModel}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>

                  {streamingCitations && streamingCitations.length > 0 && (
                    <div className="p-2.5 rounded-2xl bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Searching the web ({streamingCitations.length} sources)</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[var(--text-primary)] text-[15px] leading-relaxed">
                    <MarkdownRenderer content={streamingContent} />
                    <span className="inline-block w-2 h-4 ml-1 bg-[var(--text-primary)] animate-pulse align-middle" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 p-2.5 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-main)] shadow-lg border border-[var(--border-input)] transition cursor-pointer z-10"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Message Input at Bottom when messages exist */}
      {messages.length > 0 && <MessageInput />}
    </div>
  );
};
