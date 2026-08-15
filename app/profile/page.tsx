'use client';

import { useEffect, useState } from 'react';
import { Save, User, Baby, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'navaura_profile_data';

export default function ProfilePage() {
  const [motherName, setMotherName] = useState('Maya');
  const [postpartumDate, setPostpartumDate] = useState('2026-07-01');
  const [feedingMethod, setFeedingMethod] = useState('mixed');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('None');

  const [babyName, setBabyName] = useState('Arya');
  const [birthDate, setBirthDate] = useState('2026-01-15');
  const [weightKg, setWeightKg] = useState('7.5');

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.motherName) setMotherName(parsed.motherName);
        if (parsed.postpartumDate) setPostpartumDate(parsed.postpartumDate);
        if (parsed.feedingMethod) setFeedingMethod(parsed.feedingMethod);
        if (parsed.dietaryRestrictions) setDietaryRestrictions(parsed.dietaryRestrictions);
        if (parsed.babyName) setBabyName(parsed.babyName);
        if (parsed.birthDate) setBirthDate(parsed.birthDate);
        if (parsed.weightKg) setWeightKg(parsed.weightKg);
      }
    } catch {}

    let isMounted = true;
    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          const { data: baby } = await supabase.from('babies').select('*').eq('user_id', user.id).single();

          if (prof) {
            if (prof.mother_name) setMotherName(prof.mother_name);
            if (prof.postpartum_date) setPostpartumDate(prof.postpartum_date);
            if (prof.feeding_method) setFeedingMethod(prof.feeding_method);
            if (prof.dietary_restrictions) setDietaryRestrictions(prof.dietary_restrictions);
          }

          if (baby) {
            if (baby.name) setBabyName(baby.name);
            if (baby.birth_date) setBirthDate(baby.birth_date);
            if (baby.birth_weight_kg) setWeightKg(String(baby.birth_weight_kg));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          motherName,
          postpartumDate,
          feedingMethod,
          dietaryRestrictions,
          babyName,
          birthDate,
          weightKg,
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
          mother_name: motherName,
          postpartum_date: postpartumDate,
          feeding_method: feedingMethod,
          dietary_restrictions: dietaryRestrictions,
        });

        await supabase.from('babies').upsert({
          user_id: user.id,
          name: babyName,
          birth_date: birthDate,
          birth_weight_kg: Number(weightKg) || null,
        });
      }
    } catch (err) {
      console.error(err);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <AppShell title="Health Profile Settings">
      <div className="space-y-8 max-w-4xl mx-auto">
        <form onSubmit={handleSave} className="space-y-6 rounded-[38px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md">
          {/* Mother Profile Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3DCE1] text-[#C9969A] shadow-xs">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9969A]">Maternal Data</p>
              <h3 className="text-xl font-bold text-[#292628] font-serif">Mother Profile &amp; Recovery Stage</h3>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Mother Name</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Delivery / Postpartum Date</label>
              <input
                type="date"
                value={postpartumDate}
                onChange={(e) => setPostpartumDate(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Feeding Method</label>
              <select
                value={feedingMethod}
                onChange={(e) => setFeedingMethod(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              >
                <option value="breastfeeding">Exclusive Breastfeeding</option>
                <option value="formula">Formula Feeding</option>
                <option value="mixed">Mixed / Combination</option>
                <option value="solids">Transitioning to Solids</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Dietary Focus / Restrictions</label>
              <input
                type="text"
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                placeholder="e.g. Iron focus, Plant-based, Dairy-free"
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>
          </div>

          {/* Baby Profile Header */}
          <div className="border-t border-stone-200/60 pt-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E7D0AA]/40 text-amber-800 shadow-xs">
              <Baby className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-800">Infant Milestones</p>
              <h3 className="text-xl font-bold text-[#292628] font-serif">Baby Growth Profile</h3>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Baby Name</label>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Birth Date</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>
          </div>

          {saved && (
            <p className="text-xs font-bold text-emerald-800 bg-emerald-50/90 p-3 rounded-2xl border border-emerald-200">
              ✓ Health profile updated successfully.
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#292628] py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#4E4445] transition active:scale-95"
          >
            <Save className="h-4 w-4 text-[#EBC5D7]" />
            Save Profile Changes
          </button>
        </form>
      </div>
    </AppShell>
  );
}
