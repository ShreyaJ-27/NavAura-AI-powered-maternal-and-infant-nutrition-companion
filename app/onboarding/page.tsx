'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Baby, Check, ChevronRight, Sparkles, Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateBabyAge, calculatePostpartumAge } from '@/lib/age';

type FeedingMethodType = 'exclusive-breastfeeding' | 'mixed' | 'formula';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Mother State
  const [motherName, setMotherName] = useState('Maya');
  const [deliveryDate, setDeliveryDate] = useState('2026-07-01');
  const [feedingMethod, setFeedingMethod] = useState<FeedingMethodType>('mixed');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  // Baby State
  const [babyName, setBabyName] = useState('Arya');
  const [birthDate, setBirthDate] = useState('2026-01-15');
  const [birthWeightKg, setBirthWeightKg] = useState('3.4');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculations
  const postpartumStage = calculatePostpartumAge(new Date(deliveryDate));
  const babyAge = calculateBabyAge(new Date(birthDate));

  async function handleFinish() {
    setLoading(true);
    setError('');

    // Save to local storage first
    try {
      localStorage.setItem(
        'navaura_profile_data',
        JSON.stringify({
          motherName: motherName || 'Mama',
          postpartumDate: deliveryDate,
          feedingMethod,
          dietaryRestrictions,
          babyName: babyName || 'Little One',
          birthDate,
          weightKg: birthWeightKg,
        })
      );
    } catch {}

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          mother_name: motherName || 'Mama',
          postpartum_date: deliveryDate,
          feeding_method: feedingMethod,
          dietary_restrictions: dietaryRestrictions,
          allergen_awareness: 'default',
        });

        await supabase.from('babies').upsert({
          user_id: user.id,
          name: babyName || 'Little One',
          birth_date: birthDate,
          birth_weight_kg: Number(birthWeightKg) || 3.4,
        });
      }
    } catch {
      // smooth fallback
    }

    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center selection:bg-[#F3DCE1]">
      <div className="w-full max-w-xl rounded-[40px] glass-panel p-6 md:p-10 border border-white/95 shadow-[0_24px_80px_rgba(140,110,120,0.08)] space-y-6">
        
        {/* Step Indicator matching reference */}
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#292628] text-xs font-bold text-white shadow-xs">
              {step}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#827779]">
              {step === 1 ? 'Step 1: Mother Profile' : 'Step 2: Baby Profile'}
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className={`h-2 w-8 rounded-full transition duration-300 ${step >= 1 ? 'bg-[#C9969A]' : 'bg-white/80'}`} />
            <div className={`h-2 w-8 rounded-full transition duration-300 ${step >= 2 ? 'bg-[#C9969A]' : 'bg-white/80'}`} />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3DCE1] text-[#C9969A]">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9969A]">Mother Recovery</p>
                <h2 className="text-2xl font-bold text-[#292628] font-serif">Tell us about your recovery</h2>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Your Name</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="e.g. Maya"
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Delivery / Postpartum Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#C9969A] border border-white shadow-xs">
                <Sparkles className="h-3 w-3" />
                Calculated Stage: Day {postpartumStage.day} ({postpartumStage.stage})
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Feeding Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'exclusive-breastfeeding', label: 'Breastfeeding' },
                  { id: 'mixed', label: 'Mixed' },
                  { id: 'formula', label: 'Formula' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFeedingMethod(item.id as FeedingMethodType)}
                    className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold transition ${
                      feedingMethod === item.id
                        ? 'border-white bg-white text-[#292628] font-bold shadow-xs'
                        : 'border-white/60 bg-white/40 text-[#4E4445] hover:bg-white/70'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Dietary Focus or Allergens</label>
              <input
                type="text"
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                placeholder="e.g. Vegetarian, Dairy-free, Iron focus"
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#292628] py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#4E4445] active:scale-95"
            >
              <span>Continue to Baby Details</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E7D0AA]/40 text-amber-800">
                <Baby className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-800">Infant Milestones</p>
                <h2 className="text-2xl font-bold text-[#292628] font-serif">Tell us about your little one</h2>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Baby&apos;s Name</label>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="e.g. Arya"
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Date of Birth</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 border border-white shadow-xs">
                <Baby className="h-3.5 w-3.5 text-amber-700" />
                Calculated Stage: {babyAge.formatted} ({babyAge.months} months old)
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={birthWeightKg}
                onChange={(e) => setBirthWeightKg(e.target.value)}
                placeholder="3.4"
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 rounded-full border border-white bg-white/70 py-3 text-xs font-bold text-[#4E4445] transition hover:bg-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="w-2/3 flex items-center justify-center gap-2 rounded-full bg-[#292628] py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#4E4445] active:scale-95 disabled:opacity-50"
              >
                <Check className="h-4 w-4 text-[#EBC5D7]" />
                {loading ? 'Saving Setup...' : 'Complete & Launch Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
