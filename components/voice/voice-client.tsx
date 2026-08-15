'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Baby,
} from 'lucide-react';
import { VoiceOrb, VoiceOrbState } from './voice-orb';
import { VoiceTranscript, TranscriptMessage } from './voice-transcript';
import { useChildren } from '@/components/child-context';
import { calculateBabyAge, calculatePostpartumAge } from '@/lib/age';
import { calculateChildStage } from '@/lib/children';

// Suggested quick prompts for the voice companion
const VOICE_SUGGESTIONS = [
  { label: 'Ava’s Feeding Today', text: 'What did Ava eat today?' },
  { label: 'Log 120 ml for Ava', text: 'Log 120 ml of formula for Ava.' },
  { label: 'Check Mira’s Status', text: 'How is Mira doing today?' },
  { label: 'My Water Intake', text: 'How much water have I logged today?' },
  { label: 'Log 400 ml Water', text: 'I drank 400 ml of water.' },
  { label: 'Open Baby Journey', text: 'Take me to the baby journey.' },
];

interface VapiClientInstance {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  start: (assistantIdOrConfig: string | Record<string, unknown>) => Promise<unknown>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
}

interface VapiToolCall {
  name?: string;
  parameters?: Record<string, unknown> | string;
  function?: {
    name?: string;
    arguments?: string | Record<string, unknown>;
  };
}

interface VapiMessage {
  type?: string;
  transcriptType?: string;
  role?: string;
  transcript?: string;
  functionCall?: VapiToolCall;
  toolCalls?: VapiToolCall[];
}

interface ToolExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
  childName?: string;
  data?: unknown;
  feeds?: Array<{ feeding_type: string; amount_ml?: number; food_name?: string }>;
}

export function VoiceClient() {
  const router = useRouter();
  const childCtx = useChildren();

  // Voice session state
  const [orbState, setOrbState] = useState<VoiceOrbState>('idle');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [transcriptMessages, setTranscriptMessages] = useState<TranscriptMessage[]>([]);
  const [isVapiActive, setIsVapiActive] = useState<boolean>(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);

  // References to dynamic Vapi instance and audio cleanup
  const vapiRef = useRef<VapiClientInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Current authenticated / demo context
  const {
    motherName,
    postpartumDate,
    feedingMethod,
    dietaryRestrictions,
    motherComplications,
    children,
  } = childCtx;

  const postpartumAge = calculatePostpartumAge(postpartumDate);

  // Helper to format timestamp
  const getNowFormatted = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Add message to transcript
  const addTranscript = useCallback((role: 'user' | 'assistant' | 'system', content: string, toolCallName?: string) => {
    setTranscriptMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role,
        content,
        timestamp: getNowFormatted(),
        toolCallName,
      },
    ]);
  }, []);

  // Execute tool on backend
  const executeTool = useCallback(
    async (toolName: string, parameters: Record<string, unknown>): Promise<ToolExecutionResult> => {
      try {
        // Special client-side tool: navigate_to_section
        if (toolName === 'navigate_to_section') {
          const section = typeof parameters.section === 'string' ? parameters.section : 'dashboard';
          const routeMap: Record<string, string> = {
            dashboard: '/dashboard',
            scanner: '/scanner',
            journey: '/journey',
            feeding: '/feeding',
            wellness: '/wellness',
            hydration: '/hydration',
            nutrition: '/nutrition',
            history: '/history',
            profile: '/profile',
            settings: '/settings',
          };
          const targetPath = routeMap[section] || '/dashboard';
          addTranscript('system', `Navigating to ${section}...`, 'navigate_to_section');
          router.push(targetPath);
          return { success: true, message: `Navigated to ${section}` };
        }

        // Demo fallback context passed safely
        let demoFeedingLogs: unknown[] = [];
        let demoHydrationLogs: unknown[] = [];
        try {
          const rawFeeds = localStorage.getItem('navaura_feeding_logs');
          if (rawFeeds) demoFeedingLogs = JSON.parse(rawFeeds);
          const rawHyd = localStorage.getItem('navaura_hydration_logs');
          if (rawHyd) demoHydrationLogs = JSON.parse(rawHyd);
        } catch {}

        const res = await fetch('/api/voice/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName,
            parameters,
            clientContext: {
              isDemo: true,
              demoChildren: children,
              demoFeedingLogs,
              demoHydrationLogs,
              demoProfile: {
                motherName,
                postpartumDate,
                feedingMethod,
                dietaryRestrictions,
                motherComplications,
              },
            },
          }),
        });

        const data: ToolExecutionResult = await res.json();
        return data;
      } catch (err) {
        console.error(`Tool ${toolName} execution error:`, err);
        return { success: false, error: 'Network failure during tool execution' };
      }
    },
    [router, children, motherName, postpartumDate, feedingMethod, dietaryRestrictions, motherComplications, addTranscript]
  );

  // Clean up session and audio streams
  const handleEndConversation = useCallback(() => {
    setOrbState('disconnected');
    setIsVapiActive(false);

    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
      } catch (err) {
        console.warn('Vapi stop error:', err);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    addTranscript('system', 'Voice session ended cleanly.');
    setTimeout(() => {
      setOrbState('idle');
    }, 1500);
  }, [addTranscript]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Lazy initialize Vapi on explicit user button click
  const handleStartConversation = async () => {
    setErrorMessage('');
    setOrbState('connecting');

    try {
      // 1. Request microphone access explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setHasMicPermission(true);

      // 2. Fetch Vapi config from server (keeps VAPI_ASSISTANT_ID server-side)
      const configRes = await fetch('/api/voice/config');
      const vapiConfig = configRes.ok ? await configRes.json() : { publicKey: '', assistantId: '', configured: false };

      // 3. Dynamically import @vapi-ai/web (lazy bundle loading)
      const { default: Vapi } = await import('@vapi-ai/web');

      const publicKey = vapiConfig.publicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';
      const assistantId = vapiConfig.assistantId || '';

      // If keys are provided, connect to live Vapi Web SDK
      if (publicKey && publicKey.trim() !== '') {
        const vapiInstance = new Vapi(publicKey) as unknown as VapiClientInstance;
        vapiRef.current = vapiInstance;

        // Subscribe to Vapi events
        vapiInstance.on('call-start', () => {
          setIsVapiActive(true);
          setOrbState('listening');
          addTranscript('system', 'Connected to NavAura Voice AI.');
        });

        vapiInstance.on('call-end', () => {
          handleEndConversation();
        });

        vapiInstance.on('speech-start', () => {
          setOrbState('speaking');
        });

        vapiInstance.on('speech-end', () => {
          setOrbState('listening');
        });

        vapiInstance.on('volume-level', (vol: unknown) => {
          setVolumeLevel(typeof vol === 'number' ? vol : 0);
        });

        vapiInstance.on('message', async (rawMsg: unknown) => {
          const message = rawMsg as VapiMessage;
          // Transcript message
          if (message?.type === 'transcript') {
            if (message.transcriptType === 'final') {
              if (message.role === 'user' && message.transcript) {
                addTranscript('user', message.transcript);
              } else if (message.role === 'assistant' && message.transcript) {
                addTranscript('assistant', message.transcript);
              }
            }
          }

          // Function/tool call message
          if (message?.type === 'function-call' || message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || (message.functionCall ? [message.functionCall] : []);
            for (const call of toolCalls) {
              const name = call.name || call.function?.name || '';
              const rawArgs = call.parameters || call.function?.arguments || {};
              const params: Record<string, unknown> = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : (rawArgs as Record<string, unknown>);
              setOrbState('thinking');
              await executeTool(name, params);
              addTranscript('system', `Action ${name} executed`, name);
              setOrbState('speaking');
            }
          }
        });

        vapiInstance.on('error', (err: unknown) => {
          console.error('Vapi session error:', err);
          const msg = err instanceof Error ? err.message : 'Voice connection encountered an issue.';
          setErrorMessage(msg);
          setOrbState('error');
        });

        // Start Vapi Call with Assistant ID or configured overrides
        if (assistantId && assistantId.trim() !== '') {
          await vapiInstance.start(assistantId);
        } else {
          // Custom assistant configuration
          await vapiInstance.start({
            transcriber: {
              provider: 'deepgram',
              model: 'nova-2',
              language: 'en',
            },
            model: {
              provider: 'custom-llm',
              url: `${window.location.origin}/api/voice/chat`,
            },
            voice: {
              provider: 'playht',
              voiceId: 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json', // Emma
            },
            firstMessage: `Hello ${motherName}. I'm NavAura. How can I support you and your little ones today?`,
          });
        }
      } else {
        // Fallback / Demonstration mode when keys are pending deployment
        setIsVapiActive(true);
        setOrbState('listening');
        addTranscript('system', 'Voice AI active (Demonstration & Speech mode).');
        addTranscript(
          'assistant',
          `Hello ${motherName}. I'm NavAura, your voice companion. I have context for Ava (${children[0]?.name ? `${children[0].name}, ${calculateBabyAge(children[0].birthDate).formatted}` : '8 months'}) and Mira (${children[1]?.name ? `${children[1].name}, ${calculateBabyAge(children[1].birthDate).formatted}` : '2 months'}). What can I check or log for you?`
        );
      }
    } catch (err: unknown) {
      console.error('Microphone or Vapi initialization failed:', err);
      setHasMicPermission(false);
      const isNotAllowed = err instanceof Error && err.name === 'NotAllowedError';
      setErrorMessage(
        isNotAllowed
          ? 'Microphone permission was denied. Please allow microphone access in your browser.'
          : 'Could not connect to voice service. Please check your network and try again.'
      );
      setOrbState('error');
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    if (vapiRef.current) {
      try {
        const nextMute = !isMuted;
        vapiRef.current.setMuted(nextMute);
        setIsMuted(nextMute);
        addTranscript('system', nextMute ? 'Microphone muted.' : 'Microphone unmuted.');
      } catch (err) {
        console.warn('Mute toggle error:', err);
      }
    } else if (streamRef.current) {
      const nextMute = !isMuted;
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMute;
      });
      setIsMuted(nextMute);
      addTranscript('system', nextMute ? 'Microphone muted.' : 'Microphone unmuted.');
    }
  };

  // Handle clicking a quick suggestion chip
  const handleSuggestionClick = async (text: string) => {
    addTranscript('user', text);
    setOrbState('thinking');

    try {
      // Send to Groq Voice reasoning backend
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          motherContext: {
            name: motherName,
            postpartumDay: postpartumAge.day,
            postpartumStage: postpartumAge.stage,
            feedingMethod,
            dietaryRestrictions,
            complications: motherComplications,
          },
          childrenContext: children.map((c) => {
            const age = calculateBabyAge(c.birthDate);
            return {
              id: c.id,
              name: c.name,
              ageMonths: age.months,
              ageFormatted: age.formatted,
              developmentalStage: calculateChildStage(age.months),
              feedingMethod: c.feedingMethod,
              complications: c.complications,
            };
          }),
        }),
      });

      const data = await res.json();
      const choiceMsg = data.message;

      // If model returned a tool call
      if (choiceMsg?.tool_calls && choiceMsg.tool_calls.length > 0) {
        for (const tc of choiceMsg.tool_calls) {
          const fnName = tc.function.name;
          const fnArgs = JSON.parse(tc.function.arguments || '{}');
          const result = await executeTool(fnName, fnArgs);

          // Synthesize response based on tool result
          if (fnName === 'get_feeding_history' || fnName === 'get_todays_feeding_summary') {
            const childName = result.childName || fnArgs.child_name || 'your baby';
            const feeds = (result.data || result.feeds || []) as Array<{ feeding_type: string; amount_ml?: number; food_name?: string }>;
            if (feeds.length === 0) {
              addTranscript('assistant', `${childName} doesn't have any logged feeds yet today.`);
            } else {
              const summary = feeds
                .map((f) => `${f.feeding_type}${f.amount_ml ? ` (${f.amount_ml} ml)` : ''}${f.food_name ? ` of ${f.food_name}` : ''}`)
                .join(', ');
              addTranscript('assistant', `${childName} has ${feeds.length} logged feed${feeds.length > 1 ? 's' : ''} today: ${summary}.`);
            }
          } else if (fnName === 'log_feeding') {
            addTranscript('assistant', result.message || `Done. I've logged the feeding.`);
          } else if (fnName === 'get_hydration') {
            const hyd = result.data as { todayTotalMl?: number; percentOfGoal?: number } | undefined;
            addTranscript(
              'assistant',
              `You have logged ${((hyd?.todayTotalMl || 0) / 1000).toFixed(1)} L of water today, which is ${hyd?.percentOfGoal || 0}% of your 2.5 L lactation goal.`
            );
          } else if (fnName === 'log_hydration') {
            addTranscript('assistant', result.message || `Done. Added to today's hydration log.`);
          } else {
            addTranscript('assistant', choiceMsg.content || `I've updated that for you.`);
          }
        }
      } else if (choiceMsg?.content) {
        addTranscript('assistant', choiceMsg.content);
      } else {
        addTranscript('assistant', 'I am here with you. How can I help with nutrition and feeding today?');
      }

      setOrbState(isVapiActive ? 'listening' : 'idle');
    } catch (err) {
      console.error('Groq query error:', err);
      addTranscript('assistant', "I couldn't complete that just now. Please try again.");
      setOrbState(isVapiActive ? 'listening' : 'idle');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card with Context */}
      <div className="rounded-3xl bg-white/60 border border-white/80 p-5 md:p-6 backdrop-blur-md shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3DCE1]/70 text-[#C9969A] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Groq Intelligence • Emma Voice • Multi-Child AI
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#292628] font-serif">
            Maternal Voice Assistant
          </h2>
          <p className="text-xs md:text-sm text-[#827779]">
            Hands-free logging and intelligent guidance for {motherName} (Day {postpartumAge.day} Postpartum) & registered children.
          </p>
        </div>

        {/* Children Badges */}
        <div className="flex flex-wrap gap-2">
          {children.map((c) => {
            const age = calculateBabyAge(c.birthDate);
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-2xl bg-white/90 border border-white px-3.5 py-2 shadow-xs"
              >
                <div className="w-7 h-7 rounded-xl bg-[#F3DCE1] text-[#C9969A] flex items-center justify-center font-bold text-xs">
                  <Baby className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#292628]">{c.name}</p>
                  <p className="text-[10px] text-[#827779]">{age.formatted}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage: Voice Orb & Primary Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        {/* Left Column: Voice Orb & Controls */}
        <div className="rounded-[32px] bg-gradient-to-b from-white/70 to-white/40 border border-white/80 p-6 md:p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(140,110,120,0.06)] flex flex-col items-center justify-between min-h-[440px]">
          {/* Header Status Tag */}
          <div className="w-full flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isVapiActive
                    ? isMuted
                      ? 'bg-amber-400'
                      : 'bg-emerald-500 animate-pulse'
                    : 'bg-stone-300'
                }`}
              />
              <span className="font-semibold text-[#4E4445]">
                {isVapiActive ? (isMuted ? 'Muted' : 'Live Voice Session') : 'Voice Inactive'}
              </span>
            </div>

            {hasMicPermission === false && (
              <span className="text-rose-600 font-medium text-[11px] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Mic Access Required
              </span>
            )}
          </div>

          {/* Central Voice Orb */}
          <VoiceOrb
            state={orbState}
            volumeLevel={volumeLevel}
            statusMessage={errorMessage}
            onClick={isVapiActive ? handleToggleMute : handleStartConversation}
          />

          {/* Action Control Buttons */}
          <div className="w-full pt-4 flex flex-wrap items-center justify-center gap-3">
            {!isVapiActive ? (
              <button
                onClick={handleStartConversation}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#292628] text-white text-sm font-bold shadow-[0_8px_25px_rgba(41,38,40,0.25)] hover:bg-[#4E4445] active:scale-95 transition"
              >
                <Mic className="w-5 h-5 text-[#EBC5D7]" />
                <span>Start Conversation</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleToggleMute}
                  className={`inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-xs font-bold border transition ${
                    isMuted
                      ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                      : 'bg-white/80 text-[#292628] border-white hover:bg-white shadow-xs'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4 text-amber-700" /> : <Mic className="w-4 h-4 text-[#C9969A]" />}
                  <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                </button>

                <button
                  onClick={handleEndConversation}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-rose-600/90 text-white text-xs font-bold shadow-md hover:bg-rose-700 active:scale-95 transition"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Conversation</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Transcript & Quick Voice Queries */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Live Transcript Box */}
          <VoiceTranscript
            messages={transcriptMessages}
            onClear={() => setTranscriptMessages([])}
          />

          {/* Quick Voice Exploration Suggestions */}
          <div className="rounded-3xl bg-white/50 border border-white/70 p-4 md:p-5 backdrop-blur-md shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#827779] mb-3">
              Try Speaking or Testing
            </p>
            <div className="grid grid-cols-2 gap-2">
              {VOICE_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(item.text)}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/70 border border-white text-left hover:bg-white hover:border-[#F3DCE1] hover:shadow-xs transition group text-xs"
                >
                  <span className="font-semibold text-[#292628] line-clamp-1">{item.label}</span>
                  <Sparkles className="w-3 h-3 text-[#C9969A] opacity-60 group-hover:opacity-100 shrink-0 ml-1.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Guidance & Guardrails Info Box */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FAF3F4] via-white/80 to-[#F5F8F5] border border-white/90 p-5 md:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#DDE9DF] text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#292628]">Clinical Safety & Multi-Child Protection</h4>
            <p className="text-xs text-[#827779]">
              NavAura provides educational nutritional guidance according to WHO/UNICEF standards. Actions disambiguate between Ava and Mira before updating health records.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs font-bold text-[#C9969A] hover:text-[#292628] transition shrink-0"
        >
          View Dashboard →
        </button>
      </div>
    </div>
  );
}
