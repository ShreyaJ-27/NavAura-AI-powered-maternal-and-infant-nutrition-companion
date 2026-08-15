'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Baby,
  Bell,
  BookOpen,
  Camera,
  Compass,
  Droplets,
  Heart,
  History,
  LayoutGrid,
  LogOut,
  Search,
  Settings,
  User,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

const generalNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/scanner', label: 'Meal Scanner', icon: Camera },
  { href: '/journey', label: 'Baby Journey', icon: Compass },
  { href: '/feeding', label: 'Feeding Log', icon: Baby },
  { href: '/wellness', label: 'Maternal Wellness', icon: Heart },
  { href: '/hydration', label: 'Hydration Log', icon: Droplets },
];

const exploreNav = [
  { href: '/nutrition', label: 'Food Library', icon: BookOpen },
  { href: '/history', label: 'Saved Meals', icon: History },
];

const otherNav = [
  { href: '/profile', label: 'Profile Settings', icon: User },
  { href: '/settings', label: 'System & Security', icon: Settings },
];

const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutGrid },
  { href: '/scanner', label: 'Scan', icon: Camera },
  { href: '/journey', label: 'Journey', icon: Compass },
  { href: '/feeding', label: 'Feeding', icon: Baby },
  { href: '/wellness', label: 'Wellness', icon: Heart },
  { href: '/profile', label: 'Profile', icon: User },
];

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    router.push('/');
  }

  return (
    <div className="min-h-screen py-4 md:py-7 px-3 md:px-7 flex justify-center selection:bg-[#F3DCE1] selection:text-[#4E4445]">
      {/* Master Translucent Frame matching reference screenshot */}
      <div className="w-full max-w-[1480px] rounded-[38px] md:rounded-[44px] glass-panel p-5 md:p-8 flex flex-col lg:flex-row gap-6 md:gap-8 min-h-[90vh] shadow-[0_24px_80px_rgba(140,110,120,0.08)]">
        
        {/* Left Floating Sidebar */}
        <aside className="hidden w-64 xl:w-72 shrink-0 lg:flex flex-col justify-between">
          <div>
            {/* NavAura Logo with 3D Orb */}
            <Link href="/dashboard" className="flex items-center gap-3.5 px-3 py-2 mb-8 group">
              <div className="h-10 w-10 rounded-full orb-glow group-hover:scale-105 transition duration-300 shrink-0" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#292628] font-serif">NavAura</h1>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#827779]">Wellness Companion</p>
              </div>
            </Link>

            {/* General Navigation Group */}
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#827779] px-3.5 mb-2.5">General</p>
                <nav className="space-y-1.5">
                  {generalNav.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-200 ${
                          isActive
                            ? 'bg-white text-[#292628] font-bold shadow-[0_6px_22px_rgba(130,95,105,0.08)] border border-white'
                            : 'text-[#4E4445] hover:bg-white/50 hover:text-[#292628]'
                        }`}
                      >
                        <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition ${
                          isActive ? 'bg-[#F3DCE1] text-[#C9969A]' : 'text-[#827779]'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Explore Group */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#827779] px-3.5 mb-2.5">Explore & Library</p>
                <nav className="space-y-1.5">
                  {exploreNav.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-200 ${
                          isActive
                            ? 'bg-white text-[#292628] font-bold shadow-[0_6px_22px_rgba(130,95,105,0.08)] border border-white'
                            : 'text-[#4E4445] hover:bg-white/50 hover:text-[#292628]'
                        }`}
                      >
                        <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition ${
                          isActive ? 'bg-[#F3DCE1] text-[#C9969A]' : 'text-[#827779]'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Bottom Others & Logout */}
          <div className="pt-6 border-t border-white/60 space-y-1.5 mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#827779] px-3.5 mb-2">Others</p>
            {otherNav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-medium transition ${
                    isActive ? 'bg-white font-bold text-[#292628] shadow-sm' : 'text-[#4E4445] hover:bg-white/40'
                  }`}
                >
                  <Icon className="h-4 w-4 text-[#827779]" />
                  <span>{label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-medium text-red-700/80 hover:bg-red-50/60 hover:text-red-800 transition text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar matching reference */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9969A]">One Plate • Two Journeys</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#292628] font-serif tracking-tight mt-0.5">{title}</h2>
            </div>

            {/* Top Search & Actions */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#827779]" />
                <input
                  type="text"
                  placeholder="Search nutrients, foods..."
                  className="w-full rounded-full bg-white/70 backdrop-blur-md pl-10 pr-4 py-2 text-xs text-[#292628] placeholder-[#827779] border border-white/80 focus:bg-white focus:outline-none shadow-xs transition"
                />
              </div>

              <Link
                href="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 border border-white/80 text-[#4E4445] hover:bg-white hover:text-[#292628] shadow-xs transition"
              >
                <Bell className="h-4 w-4" />
              </Link>

              <Link
                href="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#D9A7AE] to-[#F3DCE1] border border-white text-white font-bold text-xs shadow-xs hover:scale-105 transition"
              >
                <User className="h-4 w-4" />
              </Link>
            </div>
          </header>

          {/* Child Page Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Mobile Bottom Bar matching reference */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex justify-around rounded-full bg-white/85 backdrop-blur-2xl border border-white/90 p-2 shadow-[0_12px_40px_rgba(130,95,105,0.15)] lg:hidden">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium transition ${
                isActive
                  ? 'bg-[#F3DCE1] text-[#292628] font-bold shadow-xs'
                  : 'text-[#827779] hover:text-[#292628]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#C9969A]' : 'text-[#827779]'}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
