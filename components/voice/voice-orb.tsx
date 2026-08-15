'use client';

import { motion } from 'framer-motion';
import { Mic, Volume2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export type VoiceOrbState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error' | 'disconnected';

interface VoiceOrbProps {
  state: VoiceOrbState;
  volumeLevel?: number; // 0 to 1
  onClick?: () => void;
  statusMessage?: string;
}

export function VoiceOrb({
  state,
  volumeLevel = 0,
  onClick,
  statusMessage,
}: VoiceOrbProps) {
  const getStatusText = () => {
    if (statusMessage) return statusMessage;
    switch (state) {
      case 'idle':
        return 'Ready when you are';
      case 'connecting':
        return 'Connecting to NavAura...';
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'NavAura is speaking...';
      case 'error':
        return 'Something went wrong. Try again.';
      case 'disconnected':
        return 'Conversation ended';
      default:
        return 'Ready when you are';
    }
  };

  const getSubtext = () => {
    switch (state) {
      case 'idle':
        return 'Tap "Start Conversation" below to begin hands-free';
      case 'connecting':
        return 'Establishing secure audio stream';
      case 'listening':
        return 'Speak naturally about feedings, meals, or wellness';
      case 'thinking':
        return 'Formulating evidence-based guidance';
      case 'speaking':
        return 'Emma voice active';
      case 'error':
        return 'Check microphone permissions and connection';
      case 'disconnected':
        return 'Audio session closed cleanly';
      default:
        return '';
    }
  };

  // Sound reactive scale factor
  const audioScale = state === 'speaking' || state === 'listening' ? 1 + Math.min(volumeLevel * 0.45, 0.4) : 1;

  return (
    <div className="flex flex-col items-center justify-center text-center select-none py-6">
      {/* Orb Outer Stage */}
      <div className="relative flex items-center justify-center w-64 h-64 md:w-72 md:h-72">
        {/* Ambient Outer Halo Layers */}
        <motion.div
          animate={{
            scale: state === 'listening' || state === 'speaking' ? [1, 1.25 * audioScale, 1] : state === 'connecting' ? [1, 1.15, 1] : [1, 1.05, 1],
            opacity: state === 'error' ? 0.3 : state === 'disconnected' ? 0.15 : [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: state === 'listening' || state === 'speaking' ? 2 : 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute inset-0 rounded-full blur-3xl ${
            state === 'error'
              ? 'bg-rose-400/30'
              : state === 'speaking'
              ? 'bg-gradient-to-tr from-[#D9A7AE]/70 via-[#EBC5D7]/60 to-[#F2D0C1]/60'
              : state === 'listening'
              ? 'bg-gradient-to-tr from-[#C9969A]/70 via-[#F3DCE1]/80 to-[#DDE9DF]/60'
              : state === 'thinking'
              ? 'bg-gradient-to-tr from-[#C9969A]/60 via-[#E8DDF0]/70 to-[#F3DCE1]/60'
              : 'bg-gradient-to-tr from-[#F3DCE1]/60 via-[#EBC5D7]/40 to-[#F2D0C1]/40'
          }`}
        />

        {/* Pulse Waves for Active State */}
        {(state === 'listening' || state === 'speaking') && (
          <>
            <motion.div
              animate={{
                scale: [1, 1.45 * audioScale],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute w-48 h-48 md:w-56 md:h-56 rounded-full border border-[#D9A7AE]/50"
            />
            <motion.div
              animate={{
                scale: [1, 1.3 * audioScale],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2.2,
                delay: 0.6,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute w-44 h-44 md:w-52 md:h-52 rounded-full border border-[#C9969A]/40"
            />
          </>
        )}

        {/* Central Core Orb */}
        <motion.div
          onClick={onClick}
          animate={{
            scale: state === 'speaking' || state === 'listening' ? audioScale : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`relative z-10 w-36 h-36 md:w-44 md:h-44 rounded-full flex flex-col items-center justify-center cursor-pointer shadow-[0_16px_50px_rgba(201,150,154,0.35)] transition-all duration-500 ${
            state === 'error'
              ? 'bg-gradient-to-br from-rose-200 via-rose-300 to-rose-400 text-rose-900 border-2 border-rose-300'
              : state === 'speaking'
              ? 'bg-gradient-to-br from-[#FFF5F6] via-[#F8E3E7] to-[#E9B5BD] text-[#292628] border-2 border-white/90 ring-4 ring-[#F3DCE1]/60'
              : state === 'listening'
              ? 'bg-gradient-to-br from-[#FAF7F5] via-[#F3DCE1] to-[#D9A7AE] text-[#292628] border-2 border-white/90 ring-4 ring-[#C9969A]/30'
              : state === 'thinking'
              ? 'bg-gradient-to-br from-[#F5F2F8] via-[#E8DDF0] to-[#D9A7AE] text-[#292628] border-2 border-white/90'
              : 'bg-gradient-to-br from-[#FFFFFF] via-[#FAF3F4] to-[#F3DCE1] text-[#4E4445] border-2 border-white/90 hover:scale-105'
          }`}
        >
          {/* Inner Light Specular Highlight */}
          <div className="absolute top-2 left-4 w-12 h-6 rounded-full bg-white/60 blur-xs rotate-[-30deg]" />

          {/* Central State Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-1.5">
            {state === 'connecting' && <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-[#C9969A] animate-spin" />}
            {state === 'listening' && (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <Mic className="w-8 h-8 md:w-10 md:h-10 text-[#C9969A]" />
              </motion.div>
            )}
            {state === 'thinking' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-[#A288A6]" />
              </motion.div>
            )}
            {state === 'speaking' && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <Volume2 className="w-8 h-8 md:w-10 md:h-10 text-[#C9969A]" />
              </motion.div>
            )}
            {state === 'error' && <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-rose-700" />}
            {(state === 'idle' || state === 'disconnected') && (
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#F3DCE1]/80 flex items-center justify-center text-[#C9969A] mb-1 shadow-inner">
                  <Mic className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* State Status Headings */}
      <div className="mt-4 space-y-1 max-w-md px-4" aria-live="polite">
        <h3 className="text-xl md:text-2xl font-bold font-serif text-[#292628] tracking-tight">
          {getStatusText()}
        </h3>
        <p className="text-xs md:text-sm text-[#827779]">
          {getSubtext()}
        </p>
      </div>
    </div>
  );
}
