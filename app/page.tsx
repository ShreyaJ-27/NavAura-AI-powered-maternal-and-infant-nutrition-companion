'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Baby,
  Camera,
  CheckCircle2,
  ChevronRight,
  Heart,
  Mic,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { JourneyOrb3D } from '@/components/journey-orb-3d';

export default function LandingPage() {
  return (
    <div className="min-h-screen selection:bg-[#F3DCE1] selection:text-[#4E4445] pb-16">
      {/* Top Header matching reference */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-full orb-glow group-hover:scale-105 transition duration-300 shadow-[0_6px_25px_rgba(217,126,139,0.35)]" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#292628] font-serif">NavAura</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#827779]">One Plate • Two Journeys</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/sign-in"
            className="text-sm font-semibold text-[#4E4445] transition hover:text-[#292628]"
          >
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-full bg-[#292628] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#4E4445] active:scale-95"
          >
            Begin Your Journey
          </Link>
        </div>
      </header>

      {/* Cinematic Hero Section */}
      <section className="relative overflow-hidden px-6 pt-6 pb-16 md:pt-10 md:pb-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/75 px-4 py-1.5 text-xs font-semibold text-[#C9969A] shadow-xs backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Multimodal AI • Deterministic Safety Engine • Evidence-Grounded
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-[#292628] font-serif sm:text-5xl md:text-6xl leading-[1.15]">
              One plate. <br />
              <span className="text-gradient-rose">Two journeys.</span>
            </h1>

            <p className="text-base md:text-lg leading-relaxed text-[#4E4445] max-w-xl">
              An intelligent, calming nutrition companion for mothers and little ones, from the first postpartum day through the first two years.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#292628] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#4E4445] active:scale-95"
              >
                <Camera className="h-4 w-4 text-[#EBC5D7]" />
                Begin Your Journey
              </Link>
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center gap-2 rounded-full glass-card px-6 py-3.5 text-sm font-semibold text-[#292628] shadow-xs transition hover:bg-white"
              >
                Explore Live Demo
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Key Trust Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/60">
              <div>
                <p className="text-2xl font-bold text-[#292628] font-serif">100%</p>
                <p className="text-xs text-[#827779]">Verified USDA Data</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#292628] font-serif">0–24m</p>
                <p className="text-xs text-[#827779]">Infant Safety Rules</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#292628] font-serif">WHO/UNICEF</p>
                <p className="text-xs text-[#827779]">Guideline Citations</p>
              </div>
            </div>
          </motion.div>

          {/* 3D Visual Experience Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex flex-col items-center justify-center rounded-[40px] glass-card p-6 md:p-8 shadow-xl border border-white/95"
          >
            <div className="absolute top-6 left-6 z-10">
              <span className="rounded-full bg-white/85 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#C9969A] shadow-xs">
                Interactive Journey Orb
              </span>
            </div>

            <JourneyOrb3D className="h-[340px] w-full" />

            <div className="mt-4 text-center max-w-sm">
              <p className="text-sm font-bold text-[#292628] font-serif">The NavAura Interconnected Realm</p>
              <p className="mt-1 text-xs text-[#827779]">
                Maternal replenishment (rose-gold) and infant developmental growth (champagne) rotating in harmonious sync.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Flagship Differentiator: ONE PLATE. TWO JOURNEYS. */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9969A]">Flagship Innovation</p>
            <h2 className="mt-2 text-3xl font-bold text-[#292628] font-serif sm:text-4xl">
              One Plate. Two Separate Health Paths.
            </h2>
            <p className="mt-3 text-sm text-[#4E4445]">
              Every photographed plate is simultaneously evaluated for maternal recovery needs and age-specific baby safety.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* For You Panel */}
            <div className="rounded-[36px] glass-card p-8 border border-white/90 bg-gradient-to-b from-white/80 to-[#F3DCE1]/30 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-rose-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3DCE1] text-[#C9969A] shadow-xs">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C9969A]">Maternal Recovery</span>
                  <h3 className="text-2xl font-bold text-[#292628] font-serif">🤍 FOR YOU</h3>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-[#4E4445]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#C9969A] shrink-0 mt-0.5" />
                  <span><strong>Tissue & Energy Rebuilding:</strong> Tracks iron, protein, calcium, and B-vitamins vital for postpartum revitalization.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#C9969A] shrink-0 mt-0.5" />
                  <span><strong>Lactation Hydration:</strong> Contextualizes daily fluid intake against optimal milk synthesis targets.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#C9969A] shrink-0 mt-0.5" />
                  <span><strong>Holistic Wellness Check:</strong> Non-diagnostic energy and mood logs tailored to your postpartum day.</span>
                </li>
              </ul>
            </div>

            {/* For Baby Panel */}
            <div className="rounded-[36px] glass-card p-8 border border-white/90 bg-gradient-to-b from-white/80 to-[#E7D0AA]/25 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-amber-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7D0AA]/40 text-amber-800 shadow-xs">
                  <Baby className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Infant Development</span>
                  <h3 className="text-2xl font-bold text-[#292628] font-serif">🌷 FOR BABY</h3>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-[#4E4445]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <span><strong>Exact Age Engine:</strong> Evaluates feeding appropriateness for 0–24 months based on precise developmental milestones.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <span><strong>Deterministic Safety Checks:</strong> Automatic alerts for choking hazards, texture modifications, and allergen protocols.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <span><strong>Solid Food Journey:</strong> Catalog single-ingredient introductions with tolerance &amp; reaction logs.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Voice AI Showcase Section */}
      <section className="py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[40px] glass-panel p-8 md:p-12 border border-white/95 shadow-xl relative overflow-hidden bg-gradient-to-tr from-[#FAF3F4] via-white/80 to-[#F3DCE1]/40">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F3DCE1]/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#C9969A] shadow-xs">
                  <Mic className="h-3.5 w-3.5" />
                  Hands-Free Voice AI • Powered by Vapi & Groq
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-[#292628] font-serif leading-tight">
                  Sometimes it&apos;s easier to talk.
                </h2>

                <p className="text-sm md:text-base text-[#4E4445] leading-relaxed max-w-xl">
                  Ask NavAura about your day, your baby&apos;s feeding journey, hydration, meals, or wellness — without reaching for the keyboard. Dedicated, user-initiated, and built with multi-child intelligence.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/voice"
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#292628] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#4E4445] active:scale-95"
                  >
                    <Mic className="h-4 w-4 text-[#EBC5D7]" />
                    Talk to NavAura
                  </Link>
                  <Link
                    href="/auth/sign-in"
                    className="inline-flex items-center gap-2 rounded-full glass-card px-5 py-3 text-sm font-semibold text-[#292628] shadow-xs transition hover:bg-white"
                  >
                    Explore Voice Demo
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-[#F3DCE1] via-[#EBC5D7]/50 to-[#F2D0C1]/50 p-8 flex flex-col items-center justify-center text-center shadow-[0_16px_50px_rgba(201,150,154,0.25)] border-2 border-white">
                  <div className="w-16 h-16 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#C9969A] mb-2 animate-pulse">
                    <Mic className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-bold text-[#292628]">NavAura Voice</p>
                  <p className="text-[10px] text-[#827779]">Emma Voice · Groq Llama 3.3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Responsible AI Card */}
      <section className="px-6 max-w-7xl mx-auto">
        <div className="rounded-[38px] glass-panel p-8 md:p-12 border border-white/95 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3DCE1] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#C9969A]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Responsible Health AI
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#292628] font-serif leading-tight">
              AI perceives your plate. Verified clinical guidelines decide safety.
            </h2>
            <p className="text-sm text-[#4E4445] leading-relaxed">
              NavAura couples high-speed Groq Vision perception with strict USDA nutritional datasets and deterministic WHO/UNICEF infant feeding logic. No hallucinations or unverified medical advice.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs text-[#827779]">
              <div className="border-l-2 border-[#D9A7AE] pl-3">
                <p className="text-[#292628] font-bold">Groq Vision</p>
                <p>qwen3.6-27b</p>
              </div>
              <div className="border-l-2 border-[#D9A7AE] pl-3">
                <p className="text-[#292628] font-bold">Supabase PostgreSQL</p>
                <p>Cookie Auth + RLS</p>
              </div>
              <div className="border-l-2 border-[#D9A7AE] pl-3">
                <p className="text-[#292628] font-bold">USDA FoodData</p>
                <p>Verified Database</p>
              </div>
              <div className="border-l-2 border-[#D9A7AE] pl-3">
                <p className="text-[#292628] font-bold">Private Storage</p>
                <p>Encrypted Images</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/60 py-8 px-6 text-center text-xs text-[#827779]">
        <p>NavAura provides non-diagnostic lifestyle wellness tracking. Always consult your pediatrician or healthcare provider for clinical medical decisions.</p>
        <p className="mt-2 text-[#827779]/70">© 2026 NavAura Companion. All rights reserved.</p>
      </footer>
    </div>
  );
}