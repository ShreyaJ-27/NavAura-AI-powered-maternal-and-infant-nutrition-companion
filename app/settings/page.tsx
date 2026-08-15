'use client';

import { ShieldCheck, Lock, Database, Sparkles, Key } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

export default function SettingsPage() {
  return (
    <AppShell title="System & Security Settings">
      <div className="space-y-6 max-w-4xl mx-auto">
        <section className="rounded-[38px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3DCE1] text-[#C9969A] shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9969A]">Privacy & Architecture</p>
              <h3 className="text-xl font-bold text-[#292628] font-serif">Security &amp; Data Safeguards</h3>
            </div>
          </div>

          <p className="text-xs text-[#4E4445] leading-relaxed">
            NavAura protects all mother and infant records with Supabase Row Level Security (RLS). Server-side Groq Vision processing ensures secret keys remain strictly unexposed to browser clients.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-white bg-white/80 shadow-xs text-xs">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-[#C9969A]" />
                <span className="font-bold text-[#292628]">Groq Vision Multimodal Perception</span>
              </div>
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Connected (qwen/qwen3.6-27b)
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-white bg-white/80 shadow-xs text-xs">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-[#C9969A]" />
                <span className="font-bold text-[#292628]">Supabase PostgreSQL &amp; SSR Cookies</span>
              </div>
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Active (Service Role Protected)
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-white bg-white/80 shadow-xs text-xs">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-[#C9969A]" />
                <span className="font-bold text-[#292628]">Verified Clinical Database</span>
              </div>
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                USDA FoodData Central
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-white bg-white/80 shadow-xs text-xs">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-[#C9969A]" />
                <span className="font-bold text-[#292628]">Pediatric Safety Rules Engine</span>
              </div>
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                WHO &amp; UNICEF Guidelines
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
