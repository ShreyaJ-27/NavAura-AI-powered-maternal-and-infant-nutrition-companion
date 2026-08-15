'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Baby,
  Bookmark,
  BookmarkCheck,
  Camera,
  Droplets,
  Heart,
  Mic,
  Play,
  Send,
  Sparkles,
  UtensilsCrossed,
  Wind,
  Sun,
  Moon,
  Salad,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { calculateBabyAge, calculatePostpartumAge } from '@/lib/age';

type HydrationLog = { amount_ml: number; logged_at: string };
type WellnessLog = { energy_rating: number; rest_rating: number; mood_rating: number; logged_at: string };
type FoodIntro = { id: string; food_name: string; status: string };
type SavedMeal = { id: string; food_name: string; created_at: string };
type ChildProfile = { name: string; birthDate: string; weightKg: number; complications?: string };

type InsightCard = {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  icon: React.ReactNode;
  href: string;
};

function getInsightCards(
  tab: string,
  postpartumDay: number,
  babyMonths: number,
  babyName: string,
  waterMl: number,
  wellnessScore: number,
  feedingMethod: string,
  motherComplications: string,
  foodIntrosCount: number,
): InsightCard[] {
  switch (tab) {
    case 'Recovery':
      return [
        {
          id: 'rec-1',
          title: postpartumDay <= 7 ? 'Wound Healing Priority' : postpartumDay <= 42 ? 'Tissue Repair & Iron' : 'Sustained Recovery',
          subtitle: postpartumDay <= 7
            ? 'Vitamin C, Zinc & Protein for early wound closure'
            : postpartumDay <= 42
            ? 'Iron-rich lentils, eggs & leafy greens for blood recovery'
            : 'Maintaining energy with balanced nutrients & rest cycles',
          gradient: 'from-[#F3DCE1] via-[#EBC5D7] to-[#F2D0C1]',
          icon: <Heart className="h-5 w-5 text-[#C9969A]" />,
          href: '/nutrition',
        },
        {
          id: 'rec-2',
          title: motherComplications && motherComplications !== 'None'
            ? `${motherComplications.split(',')[0].trim()} Support`
            : 'Postpartum Nutrition Guide',
          subtitle: motherComplications && motherComplications !== 'None'
            ? `Nutrition tailored for ${motherComplications.split(',')[0].trim()} recovery`
            : 'Evidence-based foods for day ' + postpartumDay + ' recovery',
          gradient: 'from-[#DDE9DF] via-[#E8DDF0] to-[#F3DCE1]',
          icon: <Sparkles className="h-5 w-5 text-emerald-700" />,
          href: '/nutrition',
        },
        {
          id: 'rec-3',
          title: 'Rest & Sleep Recovery',
          subtitle: `Energy score ${wellnessScore}/5 — Micro-rests optimize recovery at day ${postpartumDay}`,
          gradient: 'from-[#E8DDF0] via-[#DDE9DF] to-[#F3DCE1]',
          icon: <Moon className="h-5 w-5 text-purple-700" />,
          href: '/wellness',
        },
      ];

    case 'Lactation':
      return [
        {
          id: 'lac-1',
          title: feedingMethod === 'exclusive-breastfeeding' ? 'Lactation Boost Foods' : feedingMethod === 'formula' ? 'Recovery Nutrition' : 'Mixed Feeding Balance',
          subtitle: feedingMethod === 'exclusive-breastfeeding'
            ? 'Fenugreek, oats, fennel & dark leafy greens boost supply'
            : feedingMethod === 'formula'
            ? 'Focus on iron, protein & Vitamin D for full recovery'
            : 'Balance supply-support foods with general recovery nutrition',
          gradient: 'from-[#F3DCE1] via-[#E7D0AA] to-[#EBC5D7]',
          icon: <Salad className="h-5 w-5 text-amber-700" />,
          href: '/nutrition',
        },
        {
          id: 'lac-2',
          title: 'Hydration & Milk Supply',
          subtitle: `${(waterMl / 1000).toFixed(1)} L logged — ${waterMl >= 2000 ? 'Great hydration for supply' : 'Aim for 2.5 L to support milk production'}`,
          gradient: 'from-[#DDE9DF] via-[#E8DDF0] to-white',
          icon: <Droplets className="h-5 w-5 text-blue-600" />,
          href: '/hydration',
        },
        {
          id: 'lac-3',
          title: 'Caloric Needs for Breastfeeding',
          subtitle: 'An extra 400–500 kcal/day supports healthy milk production and energy',
          gradient: 'from-[#E7D0AA] via-[#F3DCE1] to-[#DDE9DF]',
          icon: <Zap className="h-5 w-5 text-amber-600" />,
          href: '/nutrition',
        },
      ];

    case 'Baby Solids':
      return [
        {
          id: 'baby-1',
          title: babyMonths < 6
            ? 'Exclusive Milk Phase'
            : babyMonths < 9
            ? '6–8m: First Foods to Explore'
            : babyMonths < 12
            ? '9–11m: Finger Foods Stage'
            : '12–24m: Toddler Table Foods',
          subtitle: babyMonths < 6
            ? `${babyName} needs only breast milk or formula right now`
            : babyMonths < 9
            ? `Introduce ${babyName} to single-ingredient smooth purees — sweet potato, banana, avocado`
            : babyMonths < 12
            ? `${babyName} can explore soft diced finger foods and thick mashes`
            : `${babyName} can enjoy modified family meals — balanced and nutrient-dense`,
          gradient: 'from-[#E8DDF0] via-[#F3DCE1] to-[#EBC5D7]',
          icon: <Baby className="h-5 w-5 text-purple-700" />,
          href: '/journey',
        },
        {
          id: 'baby-2',
          title: '3-Day Rule Tracker',
          subtitle: `${foodIntrosCount} foods catalogued — introduce one new food every 3 days to monitor tolerance`,
          gradient: 'from-[#DDE9DF] via-[#E7D0AA] to-white',
          icon: <Sparkles className="h-5 w-5 text-emerald-700" />,
          href: '/journey',
        },
        {
          id: 'baby-3',
          title: 'Safe Texture Guide',
          subtitle: babyMonths < 6
            ? 'Liquid only — no solids at this stage'
            : babyMonths < 9
            ? 'Smooth puree — mashable with tongue on palate'
            : babyMonths < 12
            ? 'Soft, bite-sized, fork-mashed or small pieces'
            : 'Small soft table portions from family meals',
          gradient: 'from-[#F2D0C1] via-[#F3DCE1] to-[#DDE9DF]',
          icon: <UtensilsCrossed className="h-5 w-5 text-rose-600" />,
          href: '/nutrition',
        },
      ];

    case 'Hydration':
      return [
        {
          id: 'hyd-1',
          title: waterMl >= 2500 ? 'Hydration Goal Reached! 🎉' : 'Daily Water Target',
          subtitle: `${(waterMl / 1000).toFixed(1)} L of 2.5 L — ${Math.max(0, 2500 - waterMl)} mL remaining for full lactation support`,
          gradient: 'from-[#DDE9DF] via-[#E8DDF0] to-[#F3DCE1]',
          icon: <Droplets className="h-5 w-5 text-blue-600" />,
          href: '/hydration',
        },
        {
          id: 'hyd-2',
          title: 'Electrolyte Balance',
          subtitle: 'Coconut water, ORS, or warm herbal teas replenish minerals lost during feeding',
          gradient: 'from-[#E7D0AA] via-[#F3DCE1] to-[#DDE9DF]',
          icon: <Zap className="h-5 w-5 text-amber-600" />,
          href: '/hydration',
        },
        {
          id: 'hyd-3',
          title: 'Hydration Timing Tips',
          subtitle: 'Drink a glass of water before each nursing session and first thing in the morning',
          gradient: 'from-[#F3DCE1] via-[#EBC5D7] to-white',
          icon: <Sun className="h-5 w-5 text-orange-500" />,
          href: '/hydration',
        },
      ];

    case 'Mindfulness':
      return [
        {
          id: 'mind-1',
          title: 'Postpartum Breathwork',
          subtitle: '5-minute gentle breathing to ease postnatal anxiety and reset nervous system',
          gradient: 'from-[#E8DDF0] via-[#F3DCE1] to-[#DDE9DF]',
          icon: <Wind className="h-5 w-5 text-purple-600" />,
          href: '/wellness',
        },
        {
          id: 'mind-2',
          title: 'Daily Mood Check-In',
          subtitle: `Wellness score ${wellnessScore}/5 — Track emotional equilibrium and identify patterns over time`,
          gradient: 'from-[#F3DCE1] via-[#EBC5D7] to-[#E8DDF0]',
          icon: <Heart className="h-5 w-5 text-[#C9969A]" />,
          href: '/wellness',
        },
        {
          id: 'mind-3',
          title: 'Restful Sleep Habits',
          subtitle: 'Sleep when baby sleeps — even 20-minute naps meaningfully reduce cortisol and aid healing',
          gradient: 'from-[#DDE9DF] via-[#E7D0AA] to-[#F3DCE1]',
          icon: <Moon className="h-5 w-5 text-indigo-600" />,
          href: '/wellness',
        },
      ];

    default:
      return [];
  }
}

export default function DashboardPage() {
  const [motherName, setMotherName] = useState('Mama');
  const [postpartumDate, setPostpartumDate] = useState(
    new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [feedingMethod, setFeedingMethod] = useState('mixed');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [motherComplications, setMotherComplications] = useState('None');
  const [children, setChildren] = useState<ChildProfile[]>([]);

  const [waterMl, setWaterMl] = useState(0);
  const [mealsCount, setMealsCount] = useState(0);
  const [wellnessScore, setWellnessScore] = useState<number>(3);
  const [foodIntrosCount, setFoodIntrosCount] = useState(0);

  const [activeFilter, setActiveFilter] = useState('Recovery');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const profStr = localStorage.getItem('navaura_profile_data');
      if (profStr) {
        const p = JSON.parse(profStr);
        if (p.motherName) setMotherName(p.motherName);
        if (p.postpartumDate) setPostpartumDate(p.postpartumDate);
        if (p.feedingMethod) setFeedingMethod(p.feedingMethod);
        if (p.dietaryRestrictions) setDietaryRestrictions(p.dietaryRestrictions);
        if (p.motherComplications) setMotherComplications(p.motherComplications);
        if (p.children && Array.isArray(p.children)) setChildren(p.children);
        else if (p.babyName) {
          // Legacy single-baby format
          setChildren([{ name: p.babyName, birthDate: p.birthDate || '', weightKg: p.weightKg || 7.5, complications: 'None' }]);
        }
      }
    } catch {}

    try {
      const hydStr = localStorage.getItem('navaura_hydration_logs');
      if (hydStr) {
        const logs: HydrationLog[] = JSON.parse(hydStr);
        const todayStr = new Date().toISOString().split('T')[0];
        const sum = logs
          .filter((l) => l.logged_at && l.logged_at.startsWith(todayStr))
          .reduce((acc, l) => acc + (Number(l.amount_ml) || 0), 0);
        setWaterMl(sum);
      }
    } catch {}

    try {
      const mealsStr = localStorage.getItem('navaura_saved_meals');
      if (mealsStr) {
        const m: SavedMeal[] = JSON.parse(mealsStr);
        setMealsCount(m.length);
      }
    } catch {}

    try {
      const wellStr = localStorage.getItem('navaura_wellness_logs');
      if (wellStr) {
        const w: WellnessLog[] = JSON.parse(wellStr);
        if (w.length > 0) setWellnessScore(w[0].energy_rating || 3);
      }
    } catch {}

    try {
      const introStr = localStorage.getItem('navaura_food_introductions');
      if (introStr) {
        const intros: FoodIntro[] = JSON.parse(introStr);
        setFoodIntrosCount(intros.length);
      }
    } catch {}

    try {
      const bmStr = localStorage.getItem('navaura_bookmarks');
      if (bmStr) setBookmarked(new Set(JSON.parse(bmStr)));
    } catch {}
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAnswering]);

  const postpartumStage = calculatePostpartumAge(new Date(postpartumDate), new Date());

  // Primary baby (first child)
  const primaryChild = children[0];
  const babyAge = primaryChild?.birthDate
    ? calculateBabyAge(new Date(primaryChild.birthDate), new Date())
    : { days: 0, weeks: 0, months: 7, years: 0, formatted: '7m' };
  const babyName = primaryChild?.name || 'Little One';

  // Multiple children greeting
  const allChildrenNames =
    children.length === 0
      ? 'Little One'
      : children.length === 1
      ? children[0].name
      : children.length === 2
      ? `${children[0].name} & ${children[1].name}`
      : `${children[0].name} and ${children.length - 1} others`;

  function toggleBookmark(id: string) {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('navaura_bookmarks', JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || isAnswering) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsAnswering(true);

    const profile = {
      motherName,
      postpartumDay: postpartumStage.day,
      postpartumStage: postpartumStage.stage,
      feedingMethod,
      dietaryRestrictions,
      motherComplications,
      todayWaterMl: waterMl,
      wellnessScore,
      mealsLogged: mealsCount,
      children: children.map((c) => ({
        name: c.name || 'Little One',
        ageMonths: c.birthDate ? calculateBabyAge(new Date(c.birthDate)).months : 7,
        ageFormatted: c.birthDate ? calculateBabyAge(new Date(c.birthDate)).formatted : '7m',
        complications: c.complications || 'None',
      })),
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, profile }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        throw new Error('No reply');
      }
    } catch {
      // Local fallback
      let fallback = `At day ${postpartumStage.day} postpartum, focus on iron-rich foods like lentils and spinach, and stay hydrated toward your 2.5 L target. You're doing wonderfully, ${motherName}. 💗`;
      const ml = userMsg.toLowerCase();
      if (ml.includes('water') || ml.includes('hydrat')) {
        fallback = `You've logged ${(waterMl / 1000).toFixed(1)} L today. Aim for ${Math.max(0, 2500 - waterMl)} mL more — warm herbal teas and electrolyte water count!`;
      } else if (ml.includes('baby') || ml.includes('solid') || ml.includes('food')) {
        fallback = babyAge.months >= 6
          ? `${babyName} at ${babyAge.formatted} is ready for smooth purees. Try sweet potato, banana, or avocado — introduce one new food every 3 days.`
          : `${babyName} at ${babyAge.formatted} needs only breast milk or formula right now — no solids yet per WHO guidelines.`;
      } else if (ml.includes('tired') || ml.includes('energy')) {
        fallback = `Postpartum fatigue on day ${postpartumStage.day} is completely normal. Boost iron with soaked almonds and spinach, and rest whenever ${babyName} sleeps. 🌿`;
      }
      setChatMessages((prev) => [...prev, { sender: 'ai', text: fallback }]);
    } finally {
      setIsAnswering(false);
    }
  }

  const insightCards = getInsightCards(
    activeFilter,
    postpartumStage.day,
    babyAge.months,
    babyName,
    waterMl,
    wellnessScore,
    feedingMethod,
    motherComplications,
    foodIntrosCount,
  );

  return (
    <AppShell title="Dashboard">
      <div className="space-y-7">
        {/* Filter Pills */}
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

        {/* Main Asymmetric Grid */}
        <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Top Row Bento */}
            <div className="grid gap-5 md:grid-cols-12">
              
              {/* Scan Plate Card */}
              <Link
                href="/scanner"
                className="md:col-span-8 group relative overflow-hidden rounded-[34px] glass-card p-6 md:p-7 flex flex-col justify-between min-h-[210px] border border-white/90"
              >
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
                    Dual analysis for your recovery and {allChildrenNames}&apos;s stage safety.
                  </p>
                </div>
              </Link>

              {/* Wellness / Rest Card */}
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
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                    <span>Log wellness</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Feeding & Hydration */}
            <div className="grid gap-5 sm:grid-cols-2">
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
                  <p className="text-[11px] text-[#4E4445] mt-1">
                    {children.length > 1
                      ? `Log feeds for ${allChildrenNames}`
                      : 'Log breastmilk, formula, or complementary solids.'}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-purple-700">
                    <span>Log feed</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>

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
                  <p className="text-[11px] text-[#4E4445] mt-1">
                    {waterMl >= 2500
                      ? 'Goal reached today! 🎉'
                      : `${Math.max(0, 2500 - waterMl)} mL to target for lactation.`}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                    <span>Log water</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Recommended Care & Insights — Dynamic by Tab */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-[#292628] font-serif">Recommended Care & Insights</h4>
                <span className="text-xs font-semibold text-[#827779]">
                  {activeFilter} · Day {postpartumStage.day}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {insightCards.map((card) => (
                  <Link
                    key={card.id}
                    href={card.href}
                    className="group rounded-[26px] glass-card p-4 space-y-3 border border-white/80 bg-white/70 hover:shadow-md transition duration-200"
                  >
                    <div className={`relative h-28 w-full overflow-hidden rounded-2xl bg-gradient-to-tr ${card.gradient} p-3 flex items-start justify-between`}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 backdrop-blur-md shadow-xs">
                        {card.icon}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); toggleBookmark(card.id); }}
                        className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#4E4445] hover:bg-white shadow-xs transition"
                        aria-label={bookmarked.has(card.id) ? 'Remove bookmark' : 'Bookmark'}
                      >
                        {bookmarked.has(card.id)
                          ? <BookmarkCheck className="h-3.5 w-3.5 text-[#C9969A]" />
                          : <Bookmark className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-[#292628] font-serif group-hover:text-[#C9969A] transition">
                        {card.title}
                      </h5>
                      <p className="text-[11px] text-[#827779] mt-0.5 leading-relaxed">{card.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Companion */}
          <div className="rounded-[36px] glass-card p-6 md:p-7 border border-white/95 bg-white/80 flex flex-col justify-between dot-pattern">
            <div>
              {/* Greeting & Orb */}
              <div className="text-center pt-2 pb-5 border-b border-stone-200/60">
                <div className="mx-auto h-12 w-12 rounded-full orb-glow mb-3 shadow-[0_10px_35px_rgba(217,126,139,0.4)] animate-pulse" />
                <h3 className="text-2xl font-bold text-[#292628] font-serif">
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}{' '}
                  <span className="text-[#C9969A]">{motherName}</span>,
                </h3>
                <p className="text-xs text-[#4E4445] font-medium mt-0.5">
                  {children.length > 1
                    ? `What's on your mind for you and ${allChildrenNames} today?`
                    : `What's on your mind for you and ${babyName} today?`}
                </p>
                <div className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-[#F3DCE1]/70 px-3.5 py-1 text-[11px] font-bold text-[#4E4445]">
                  <Sparkles className="h-3 w-3 text-[#C9969A]" />
                  Day {postpartumStage.day} · {postpartumStage.stage}
                </div>
                {children.length > 1 && (
                  <div className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-[10px] font-semibold text-purple-700 border border-purple-100 ml-2">
                    <Baby className="h-3 w-3" />
                    {children.length === 2 ? 'Twin' : `${children.length} Children`} Mode
                  </div>
                )}
              </div>

              {/* Quick prompts if no conversation yet */}
              {chatMessages.length === 0 && (
                <div className="py-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#827779] text-center">Ask NavAura</p>
                  {[
                    `What should I eat on day ${postpartumStage.day}?`,
                    `Is ${babyName} ready for solids at ${babyAge.months} months?`,
                    `How do I increase my milk supply?`,
                    `I feel very tired today, what helps?`,
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setChatInput(prompt)}
                      className="w-full text-left rounded-2xl bg-white/70 border border-white/80 px-3.5 py-2.5 text-xs text-[#4E4445] hover:bg-white hover:text-[#292628] transition shadow-xs font-medium"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Timeline */}
              {chatMessages.length > 0 && (
                <div className="py-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`space-y-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-1.5" style={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
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
                        Consulting maternal & pediatric nutrition guidelines…
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Quick Action Pill */}
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
                  aria-label="Scan a new meal"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </Link>
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="relative mt-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything (nutrition, solids, recovery)…"
                className="w-full rounded-full bg-white/90 pl-4 pr-20 py-3 text-xs text-[#292628] placeholder-[#827779] border border-white focus:bg-white focus:outline-none shadow-xs transition"
              />
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const prompts = [
                      `What should I eat on day ${postpartumStage.day}?`,
                      `Is ${babyName} ready for solids at ${babyAge.months} months?`,
                      `How do I boost my milk supply naturally?`,
                    ];
                    setChatInput(prompts[Math.floor(Math.random() * prompts.length)]);
                  }}
                  className="p-1.5 text-[#827779] hover:text-[#292628] transition"
                  title="Try a suggested question"
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
