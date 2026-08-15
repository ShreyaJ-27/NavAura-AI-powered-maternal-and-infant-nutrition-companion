'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { initializeDemoData } from '@/lib/demo';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoSignIn() {
    setError('');
    setDemoLoading(true);

    try {
      // Seed client-side local storage with Ava & Mira demo data
      initializeDemoData();

      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Demo init failed');

      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email: 'demo@navaura.com', password: 'demo123456' });
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in with demo account.');
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 flex items-center justify-center selection:bg-[#F3DCE1]">
      <div className="w-full max-w-4xl rounded-[40px] glass-panel p-6 md:p-10 border border-white/90 shadow-[0_24px_80px_rgba(140,110,120,0.08)] grid md:grid-cols-2 gap-8 items-center">
        
        {/* Left Ethereal Brand Showcase */}
        <div className="rounded-[32px] bg-gradient-to-tr from-[#F3DCE1]/80 via-[#E8DDF0]/60 to-[#F2D0C1]/70 p-8 flex flex-col justify-between min-h-[360px] border border-white/90 relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="h-12 w-12 rounded-full orb-glow shadow-[0_8px_30px_rgba(217,126,139,0.4)] mb-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9969A]">NavAura Companion</span>
            <h2 className="text-3xl font-bold text-[#292628] font-serif leading-tight">
              Welcome back to your journey.
            </h2>
            <p className="text-xs text-[#4E4445] leading-relaxed">
              Continue exploring maternal recovery nutrients, gentle hydration tracking, and baby solid food safety.
            </p>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/60 flex items-center gap-2 text-[11px] font-semibold text-[#4E4445]">
            <ShieldCheck className="h-4 w-4 text-[#C9969A]" />
            Private • Encrypted • Evidence-Grounded
          </div>
        </div>

        {/* Right Form Card */}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-[#292628] font-serif">Sign In</h3>
            <p className="text-xs text-[#827779] mt-0.5">Enter your account or launch instant demo mode.</p>
          </div>

          {/* Quick Demo Button */}
          <div className="rounded-2xl border border-white bg-white/70 p-4 text-center space-y-2 shadow-xs">
            <p className="text-xs font-bold text-[#292628]">Hackathon Judge / Instant Preview?</p>
            <button
              type="button"
              disabled={demoLoading || loading}
              onClick={handleDemoSignIn}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#292628] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#4E4445] transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#EBC5D7]" />
              {demoLoading ? 'Launching Demo Mode...' : '✨ One-Click Demo Mode — Enter Instantly'}
            </button>
            <p className="text-[10px] text-[#827779]">demo@navaura.com / demo123456</p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200/80 w-full" />
            <span className="bg-[#F7F4F2]/90 px-3 text-[10px] font-bold uppercase tracking-wider text-[#827779]">or sign in manually</span>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@navaura.com"
                className="w-full rounded-2xl border border-white/90 bg-white/80 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/90 bg-white/80 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#292628] py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#4E4445] active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Signing In...' : 'Continue to Dashboard'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="text-center text-xs text-[#827779]">
            New to NavAura?{' '}
            <Link href="/auth/sign-up" className="font-bold text-[#C9969A] hover:underline">
              Begin your journey
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
