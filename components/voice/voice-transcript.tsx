'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, Trash2 } from 'lucide-react';

export type TranscriptMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCallName?: string;
};

interface VoiceTranscriptProps {
  messages: TranscriptMessage[];
  onClear?: () => void;
  isStreaming?: boolean;
}

export function VoiceTranscript({ messages, onClear, isStreaming }: VoiceTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-3xl bg-white/40 border border-white/60 backdrop-blur-xs min-h-[160px]">
        <div className="w-10 h-10 rounded-full bg-[#F3DCE1]/60 flex items-center justify-center text-[#C9969A] mb-2.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-[#292628]">Live conversation transcript</p>
        <p className="text-xs text-[#827779] mt-0.5 max-w-sm">
          Spoken queries and NavAura&apos;s voice responses will appear here dynamically during your session.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-3xl bg-white/50 border border-white/70 backdrop-blur-md shadow-[0_8px_30px_rgba(140,110,120,0.05)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/60 bg-white/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#C9969A] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#827779]">
            Session Dialogue
          </span>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#827779] hover:text-[#292628] hover:bg-white/60 px-2.5 py-1 rounded-full transition"
            title="Clear transcript"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Messages List */}
      <div className="p-4 md:p-5 max-h-[360px] overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-rose-200" role="log" aria-label="Voice conversation transcript">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSystem = msg.role === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#F3DCE1]/50 text-[11px] font-medium text-[#827779]">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#D9A7AE] to-[#F3DCE1] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs md:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#292628] text-white rounded-tr-xs shadow-xs'
                      : 'bg-white/90 text-[#292628] border border-white rounded-tl-xs shadow-[0_4px_16px_rgba(130,95,105,0.06)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isUser ? 'text-[#EBC5D7]' : 'text-[#C9969A]'}`}>
                      {isUser ? 'You' : 'NavAura (Emma)'}
                    </span>
                    <span className={`text-[9px] ${isUser ? 'text-white/60' : 'text-[#827779]'}`}>
                      {msg.timestamp}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.toolCallName && (
                    <div className="mt-2 pt-1.5 border-t border-black/5 text-[10px] text-[#827779] flex items-center gap-1">
                      <span className="font-semibold text-emerald-700">Action:</span>
                      <span>{msg.toolCallName}</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#E5D7DA] flex items-center justify-center text-[#4E4445] shrink-0 mt-0.5 shadow-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
