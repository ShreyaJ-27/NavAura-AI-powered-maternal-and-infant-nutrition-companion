'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Baby,
  Bookmark,
  Camera,
  Droplets,
  Heart,
  Mic,
  Play,
  Send,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { calculateBabyAge, calculatePostpartumAge } from '@/lib/age';

type HydrationLog = { amount_ml: number; logged_at: string };
type WellnessLog = { energy_rating: number; rest_rating: number; mood_rating: number; logged_at: string };
type FoodIntro = { id: string; food_name: string; status: string };
type SavedMeal = { id: string; food_name: string; created_at: string };

export default function DashboardPage() {
  const [motherName, setMotherName] = useState('Maya');
  const [postpartumDate, setPostpartumDate] = useState('2026-07-01');
  const [babyName, setBabyName] = useState('Arya');
  const [babyBirthDate, setBabyBirthDate] = useState('2026-01-15');

  const [waterMl, setWaterMl] = useState(1500);
  const [mealsCount, setMealsCount] = useState(2);
  const [wellnessScore, setWellnessScore] = useState<number>(4);
  const [foodIntrosCount, setFoodIntrosCount] = useState(4);

  const [activeFilter, setActiveFilter] = useState('Recovery');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'user',
      text: 'Hi, what foods should I focus on for day 14 postpartum recovery?',
    },
    {
      sender: 'ai',
      text: 'Warm nourishment is key 🌿 Focus on iron-dense lentils, oats for lactation, healthy fats (ghee/avocado), and aim for 2.5 L water today.',
    },
  ]);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    // Load stored profile data
    try {
      const profStr = localStorage.getItem('navaura_profile_data');
      if (profStr) {
        const p = JSON.parse(profStr);
        if (p.motherName) setMotherName(p.motherName);
        if (p.postpartumDate) setPostpartumDate(p.postpartumDate);
        if (p.babyName) setBabyName(p.babyName);
        if (p.birthDate) setBabyBirthDate(p.birthDate);
      }
    } catch {}

    // Load hydration
    try {
      const hydStr = localStorage.getItem('navaura_hydration_logs');
      if (hydStr) {
        const logs: HydrationLog[] = JSON.parse(hydStr);
        const todayStr = new Date().toISOString().split('T')[0];
        const sum = logs
          .filter((l) => l.logged_at && l.logged_at.startsWith(todayStr))
          .reduce((acc, l) => acc + (Number(l.amount_ml) || 0), 0);
        if (logs.length > 0) setWaterMl(sum);
      }
    } catch {}

    // Load saved meals
    try {
      const mealsStr = localStorage.getItem('navaura_saved_meals');
      if (mealsStr) {
        const m: SavedMeal[] = JSON.parse(mealsStr);
        setMealsCount(m.length);
      }
    } catch {}

    // Load wellness
    try {
      const wellStr = localStorage.getItem('navaura_wellness_logs');
      if (wellStr) {
        const w: WellnessLog[] = JSON.parse(wellStr);
        if (w.length > 0) setWellnessScore(w[0].energy_rating || 4);
      }
    } catch {}

    // Load food intros
    try {
      const introStr = localStorage.getItem('navaura_food_introductions');
      if (introStr) {
        const intros: FoodIntro[] = JSON.parse(introStr);
        setFoodIntrosCount(intros.length);
      }
    } catch {}
  }, []);

  const postpartumStage = calculatePostpartumAge(new Date(postpartumDate || '2026-07-01'), new Date());
  const babyAge = calculateBabyAge(new Date(babyBirthDate || '2026-01-15'), new Date());

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsAnswering(true);

    setTimeout(() => {
      let reply = `Great question regarding ${babyName}'s stage! For a ${babyAge.months}-month-old, ensure soft, fork-mashed textures and introduce single ingredients one at a time for 3 days to monitor tolerance.`;
      if (userMsg.toLowerCase().includes('water') || userMsg.toLowerCase().includes('hydration')) {
        reply = `For lactation support, consistent water intake makes a huge difference. You're currently at ${(waterMl / 1000).toFixed(1)} L today — aim to reach 2.5 L with warm infusions or electrolyte water.`;
      } else if (userMsg.toLowerCase().includes('tired') || userMsg.toLowerCase().includes('energy') || userMsg.toLowerCase().includes('sleep')) {
        reply = `Postpartum fatigue is completely natural during Day ${postpartumStage.day}. Boost iron and B-vitamins with spinach, soaked almonds, and fortified grains, and take micro-rests whenever ${babyName} sleeps.`;
      }
      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      setIsAnswering(false);
    }, 600);
  }

  return (
    <AppShell title="Dashboard">
      <div className="space-y-7">
        {/* Filter Pills matching reference */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {['Recovery', 'Lactation', 'Baby Solids', 'Hydration', 'Mindfulness'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`rounded-full px-4 py-2 transition duration-200 whitespace-nowrap ${
                activeFilter === tab
                  ? 'bg-white text-[#292628] font-bold shadow-[0_4px_16px_rgba(130,95,105,0.08)] border border-white'
                  : 'bg-white/40 text-[#4E4445] hover:bg-white/70 border border-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Asymmetric Grid matching reference */}
        <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          
          {/* Left Column: Visual Bento Cards & Recommended */}
          <div className="space-y-6">
            
            {/* Top Row Bento */}
            <div className="grid gap-5 md:grid-cols-12">
              
              {/* Large Feature Card: Scan Your Meal (like "Meditate" in screenshot) */}
              <Link
                href="/scanner"
                className="md:col-span-8 group relative overflow-hidden rounded-[34px] glass-card p-6 md:p-7 flex flex-col justify-between min-h-[210px] border border-white/90"
              >
                {/* Ethereal auroral gradient banner matching screenshot */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#F3DCE1]/90 via-[#E8DDF0]/70 to-[#F2D0C1]/80 opacity-90 transition group-hover:scale-105 duration-500" />
                <div className="absolute -right-6 -bottom-6 h-36 w-36 rounded-full bg-[#EBC5D7]/50 blur-2xl" />

                <div className="relative z-10 flex items-start justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold text-[#4E4445] backdrop-blur-md shadow-xs">
                    <Camera className="h-3.5 w-3.5 text-[#C9969A]" />
                    AI Vision Perception
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-xs group-hover:translate-x-1 group-hover:-translate-y-1 transition duration-300">
                    <ArrowUpRight className="h-4 w-4 text-[#292628]" />
                  </div>
                </div>

                <div className="relative z-10 mt-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-[#292628] font-serif tracking-tight">
                    Scan Plate & Reveal
                  </h3>
                  <p className="text-xs text-[#4E4445] mt-1 font-medium max-w-sm">
                    Instant dual analysis for your postpartum recovery and {babyName}&apos;s stage safety.
                  </p>
                </div>
              </Link>

              {/* Smaller Card: Sleep & Rest Recovery (like "Sleep" in screenshot) */}
              <Link
                href="/wellness"
                className="md:col-span-4 group relative overflow-hidden rounded-[34px] glass-card p-6 flex flex-col justify-between min-h-[210px] border border-white/90 bg-gradient-to-b from-[#DDE9DF]/60 to-white/70"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800">
                    <Heart className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-white/80 px-2.5 py-0.5 rounded-full">
                    {wellnessScore}/5 Energy
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="text-xl font-bold text-[#292628] font-serif">Maternal Rest</h4>
                  <p className="text-[11px] text-[#4E4445] mt-1">Daily energy & mood check-in.</p>
                </div>
              </Link>
            </div>

            {/* Middle Row Bento: Feeding & Hydration */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Feeding Activity (like "Move" in screenshot) */}
              <Link
                href="/feeding"
                className="group relative overflow-hidden rounded-[32px] glass-card p-6 flex flex-col justify-between border border-white/90 bg-gradient-to-tr from-[#E8DDF0]/60 via-[#F3DCE1]/40 to-white/80 min-h-[170px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100/80 text-purple-800">
                    <Baby className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-900 bg-white/85 px-2.5 py-0.5 rounded-full">
                    Stage: {babyAge.months}m
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-[#292628] font-serif">Infant Feeding</h4>
                  <p className="text-[11px] text-[#4E4445] mt-1">Log breastmilk, formula, or complementary solids.</p>
                </div>
              </Link>

              {/* Hydration Tracker (like "Music" in screenshot) */}
              <Link
                href="/hydration"
                className="group relative overflow-hidden rounded-[32px] glass-card p-6 flex flex-col justify-between border border-white/90 bg-gradient-to-tr from-[#DDE9DF]/60 via-[#E7D0AA]/40 to-white/80 min-h-[170px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100/80 text-blue-800">
                    <Droplets className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-900 bg-white/85 px-2.5 py-0.5 rounded-full">
                    {(waterMl / 1000).toFixed(1)} L / 2.5 L
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-[#292628] font-serif">Hydration Log</h4>
                  <p className="text-[11px] text-[#4E4445] mt-1">{Math.max(0, 2500 - waterMl)} mL to target for lactation.</p>
                </div>
              </Link>
            </div>

            {/* Bottom Row: Recommended Today Carousel matching reference */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-[#292628] font-serif">Recommended Care & Insights</h4>
                <span className="text-xs font-semibold text-[#827779]">Tailored to Day {postpartumStage.day}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Item 1 */}
                <div className="group rounded-[26px] glass-card p-4 space-y-3 border border-white/80 bg-white/70">
                  <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-gradient-to-tr from-[#F3DCE1] via-[#EBC5D7] to-[#F2D0C1] p-3 flex items-start justify-end">
                    <button className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#4E4445] hover:bg-white shadow-xs">
                      <Bookmark className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-[#292628] font-serif group-hover:text-[#C9969A] transition">
                      Mindful Replenishment
                    </h5>
                    <p className="text-[11px] text-[#827779]">Dr. Elena Vance • 5 Min</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="group rounded-[26px] glass-card p-4 space-y-3 border border-white/80 bg-white/70">
                  <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-gradient-to-tr from-[#E7D0AA] via-[#F2D0C1] to-[#F3DCE1] p-3 flex items-start justify-end">
                    <button className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#4E4445] hover:bg-white shadow-xs">
                      <Bookmark className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-[#292628] font-serif group-hover:text-[#C9969A] transition">
                      Iron & Milk Supply
                    </h5>
                    <p className="text-[11px] text-[#827779]">Evidence Note • USDA Nutrition</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="group rounded-[26px] glass-card p-4 space-y-3 border border-white/80 bg-white/70">
                  <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-gradient-to-tr from-[#E8DDF0] via-[#DDE9DF] to-[#F3DCE1] p-3 flex items-start justify-end">
                    <button className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#4E4445] hover:bg-white shadow-xs">
                      <Bookmark className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-[#292628] font-serif group-hover:text-[#C9969A] transition">
                      Solid Exploration Stage
                    </h5>
                    <p className="text-[11px] text-[#827779]">{babyName} • {foodIntrosCount} Foods Catalogued</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Conversational Companion & Live Stats */}
          <div className="rounded-[36px] glass-card p-6 md:p-7 border border-white/95 bg-white/80 flex flex-col justify-between dot-pattern">
            <div>
              {/* Central Glowing 3D Orb & Greeting matching reference */}
              <div className="text-center pt-2 pb-5 border-b border-stone-200/60">
                <div className="mx-auto h-12 w-12 rounded-full orb-glow mb-3 shadow-[0_10px_35px_rgba(217,126,139,0.4)] animate-pulse" />
                <h3 className="text-2xl font-bold text-[#292628] font-serif">
                  Good Morning <span className="text-[#C9969A]">{motherName}</span>,
                </h3>
                <p className="text-xs text-[#4E4445] font-medium mt-0.5">
                  What&apos;s on your mind for you and {babyName} today?
                </p>
                <div className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-[#F3DCE1]/70 px-3.5 py-1 text-[11px] font-bold text-[#4E4445]">
                  <Sparkles className="h-3 w-3 text-[#C9969A]" />
                  Day {postpartumStage.day} Postpartum ({postpartumStage.stage})
                </div>
              </div>

              {/* Chat Timeline matching reference */}
              <div className="py-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`space-y-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-1.5 justify-end" style={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div className={`h-2 w-2 rounded-full ${msg.sender === 'user' ? 'bg-[#C9969A]' : 'bg-[#D9A7AE]'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#827779]">
                        {msg.sender === 'user' ? 'You' : 'NavAura'}
                      </span>
                    </div>
                    <div
                      className={`inline-block rounded-2xl p-3.5 text-xs leading-relaxed max-w-[90%] ${
                        msg.sender === 'user'
                          ? 'bg-[#F3DCE1] text-[#292628] font-medium rounded-tr-none'
                          : 'bg-white text-[#4E4445] shadow-xs border border-white rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAnswering && (
                  <div className="text-left space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#827779]">NavAura</span>
                    <div className="inline-block rounded-2xl p-3 text-xs bg-white text-[#827779] shadow-xs border border-white animate-pulse">
                      Consulting maternal &amp; pediatric nutrition guidelines...
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Action Routine Pill matching reference */}
              <div className="rounded-2xl border border-white bg-gradient-to-r from-white via-[#FCFAF8] to-[#F3DCE1]/40 p-3.5 flex items-center justify-between shadow-xs mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#D9A7AE] to-[#EBC5D7] flex items-center justify-center text-white shadow-xs">
                    <UtensilsCrossed className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#292628]">Postpartum Replenish</p>
                    <p className="text-[10px] text-[#827779]">{mealsCount} meals recorded in log</p>
                  </div>
                </div>
                <Link
                  href="/scanner"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#292628] shadow-xs hover:scale-105 transition"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </Link>
              </div>
            </div>

            {/* Ask Anything Input Bar matching reference */}
            <form onSubmit={handleSendChat} className="relative mt-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything (nutrition, solids, recovery)..."
                className="w-full rounded-full bg-white/90 pl-4 pr-20 py-3 text-xs text-[#292628] placeholder-[#827779] border border-white focus:bg-white focus:outline-none shadow-xs transition"
              />
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setChatInput('Is dal and rice safe for baby at 7 months?')}
                  className="p-1.5 text-[#827779] hover:text-[#292628] transition"
                  title="Try voice sample"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isAnswering}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#292628] text-white shadow-xs hover:bg-[#4E4445] transition disabled:opacity-40"
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
