'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Baby, Check, ChevronRight, Sparkles, Heart, Plus, Trash2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateBabyAge, calculatePostpartumAge } from '@/lib/age';
import { generateChildId, saveChildrenToStorage, PROFILE_STORAGE_KEY } from '@/lib/children';

type FeedingMethodType = 'exclusive-breastfeeding' | 'mixed' | 'formula';

type ChildProfileInput = {
  id: string;
  name: string;
  birthDate: string;
  weightKg: string;
  complications: string;
};

const defaultChild = (): ChildProfileInput => ({
  id: generateChildId(),
  name: '',
  birthDate: new Date(Date.now() - 7 * 30.4 * 24 * 3600 * 1000).toISOString().split('T')[0],
  weightKg: '7.5',
  complications: '',
});

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Mother State
  const [motherName, setMotherName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('2026-07-01');
  const [feedingMethod, setFeedingMethod] = useState<FeedingMethodType>('mixed');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [motherComplications, setMotherComplications] = useState('');

  // Children State (support multiple)
  const [children, setChildren] = useState<ChildProfileInput[]>([defaultChild()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculations
  const postpartumStage = calculatePostpartumAge(new Date(deliveryDate));
  
  function addChild() {
    setChildren((prev) => [...prev, defaultChild()]);
  }

  function removeChild(idx: number) {
    setChildren((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateChild(idx: number, field: keyof ChildProfileInput, value: string) {
    setChildren((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  }

  function setNoMotherComplications() {
    setMotherComplications('None');
  }

  async function handleFinish() {
    if (children.length === 0) {
      setError('Please add at least one baby profile.');
      return;
    }

    setLoading(true);
    setError('');

    const formattedChildren = children.map((c, i) => ({
      id: c.id || generateChildId(),
      name: c.name || `Child ${i + 1}`,
      birthDate: c.birthDate,
      weightKg: Number(c.weightKg) || 7.5,
      complications: c.complications || 'None',
    }));

    const profileData = {
      motherName: motherName || 'Mama',
      postpartumDate: deliveryDate,
      feedingMethod,
      dietaryRestrictions,
      motherComplications: motherComplications || 'None',
      children: formattedChildren,
      // Legacy single-baby fields for backward compat
      babyName: formattedChildren[0]?.name || 'Little One',
      birthDate: formattedChildren[0]?.birthDate || '',
      weightKg: formattedChildren[0]?.weightKg || 7.5,
    };

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
      saveChildrenToStorage(formattedChildren, formattedChildren[0].id);
    } catch {}

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          mother_name: profileData.motherName,
          postpartum_date: deliveryDate,
          feeding_method: feedingMethod,
          dietary_restrictions: dietaryRestrictions,
          mother_complications: profileData.motherComplications,
          allergen_awareness: 'default',
        });

        // Upsert all babies into Supabase
        for (const child of formattedChildren) {
          await supabase.from('babies').upsert({
            id: child.id,
            user_id: user.id,
            name: child.name,
            birth_date: child.birthDate,
            birth_weight_kg: child.weightKg,
            complications: child.complications,
          });
        }
      }
    } catch {
      // fallback to localStorage
    }

    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center selection:bg-[#F3DCE1]">
      <div className="w-full max-w-xl rounded-[40px] glass-panel p-6 md:p-10 border border-white/95 shadow-[0_24px_80px_rgba(140,110,120,0.08)] space-y-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#292628] text-xs font-bold text-white shadow-xs">
              {step}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#827779]">
              {step === 1 ? 'Step 1: Mother Profile' : 'Step 2: Baby Profiles'}
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className={`h-2 w-8 rounded-full transition duration-300 ${step >= 1 ? 'bg-[#C9969A]' : 'bg-white/80'}`} />
            <div className={`h-2 w-8 rounded-full transition duration-300 ${step >= 2 ? 'bg-[#C9969A]' : 'bg-white/80'}`} />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
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
                placeholder="e.g. Aisha, Maya, Sara…"
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
                        ? 'border-[#C9969A]/60 bg-[#F3DCE1]/80 text-[#292628] font-bold shadow-xs'
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
                placeholder="e.g. Vegetarian, Dairy-free, Iron focus, Gluten-free"
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445]">Medical Complications (optional)</label>
                <button
                  type="button"
                  onClick={setNoMotherComplications}
                  className="text-[10px] font-semibold text-[#C9969A] underline underline-offset-2 hover:text-[#4E4445] transition"
                >
                  No complications
                </button>
              </div>
              <textarea
                value={motherComplications}
                onChange={(e) => setMotherComplications(e.target.value)}
                placeholder="e.g. Gestational diabetes, Thyroid disorder, Anaemia, C-section recovery, Preeclampsia… or leave blank"
                rows={2}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition resize-none"
              />
              <p className="text-[10px] text-[#827779] mt-1 pl-1">This helps NavAura personalize nutrition advice for your specific recovery needs.</p>
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
                <h2 className="text-2xl font-bold text-[#292628] font-serif">
                  {children.length > 1 ? `Tell us about your ${children.length === 2 ? 'twins' : `${children.length} children`}` : 'Tell us about your little one'}
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              {children.map((child, idx) => {
                const babyAge = calculateBabyAge(new Date(child.birthDate));
                return (
                  <div key={idx} className="rounded-[28px] border border-white/80 bg-white/60 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#292628]">
                        {children.length > 1 ? `Child ${idx + 1}` : 'Baby Profile'}
                      </h3>
                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(idx)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Baby&apos;s Name</label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(idx, 'name', e.target.value)}
                        placeholder="e.g. Zara, Omar, Mia…"
                        className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={child.birthDate}
                        onChange={(e) => updateChild(idx, 'birthDate', e.target.value)}
                        className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                      />
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 border border-white shadow-xs">
                        <Baby className="h-3 w-3 text-amber-700" />
                        {babyAge.formatted} old ({babyAge.months} months) — {babyAge.months < 6 ? 'Exclusive milk phase' : babyAge.months < 9 ? 'Early solid exploration' : babyAge.months < 12 ? 'Soft finger foods stage' : 'Toddler table foods'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Current Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={child.weightKg}
                        onChange={(e) => updateChild(idx, 'weightKg', e.target.value)}
                        placeholder="e.g. 7.5"
                        className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445]">Baby&apos;s Medical Complications (optional)</label>
                        <button
                          type="button"
                          onClick={() => updateChild(idx, 'complications', 'None')}
                          className="text-[10px] font-semibold text-amber-700 underline underline-offset-2 hover:text-[#4E4445] transition"
                        >
                          None
                        </button>
                      </div>
                      <input
                        type="text"
                        value={child.complications}
                        onChange={(e) => updateChild(idx, 'complications', e.target.value)}
                        placeholder="e.g. Premature (34w), GERD, Lactose sensitivity, Cow milk protein allergy…"
                        className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {children.length < 4 && (
              <button
                type="button"
                onClick={addChild}
                className="w-full flex items-center justify-center gap-2 rounded-full border border-dashed border-[#C9969A]/60 bg-white/40 py-3 text-xs font-bold text-[#C9969A] hover:bg-[#F3DCE1]/40 transition"
              >
                <Plus className="h-4 w-4" />
                Add Another Child (Twins / Triplets)
              </button>
            )}

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
