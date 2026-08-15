'use client';

import { useEffect, useState } from 'react';
import { Compass, Plus, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

type FoodIntroItem = {
  id: string;
  food_name: string;
  status: 'introduced' | 'recently_introduced' | 'planned' | 'caution';
  preparation: string;
  texture: string;
  reaction_notes?: string;
  introduced_date: string;
};

const STORAGE_KEY = 'navaura_food_introductions';

function loadFromStorage(): FoodIntroItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToStorage(items: FoodIntroItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const STATUS_BADGES: Record<string, { label: string; style: string }> = {
  introduced: { label: 'Introduced (Well Tolerated)', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  recently_introduced: { label: 'Monitoring (Day 1–3)', style: 'bg-blue-50 text-blue-800 border-blue-200' },
  planned: { label: 'Planned Next', style: 'bg-amber-50 text-amber-900 border-amber-200' },
  caution: { label: 'Caution / Sensitive', style: 'bg-rose-50 text-rose-800 border-rose-200' },
};

export default function JourneyPage() {
  const [introductions, setIntroductions] = useState<FoodIntroItem[]>([]);
  const [foodName, setFoodName] = useState('');
  const [status, setStatus] = useState<FoodIntroItem['status']>('introduced');
  const [preparation, setPreparation] = useState('steamed');
  const [texture, setTexture] = useState('smooth puree');
  const [reactionNotes, setReactionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setIntroductions(loadFromStorage());
  }, []);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!foodName.trim()) return;
    setLoading(true);
    setSaved(false);

    const newItem: FoodIntroItem = {
      id: crypto.randomUUID(),
      food_name: foodName.trim(),
      status,
      preparation,
      texture,
      reaction_notes: reactionNotes || undefined,
      introduced_date: new Date().toISOString().split('T')[0],
    };

    const updated = [newItem, ...introductions];
    setIntroductions(updated);
    saveToStorage(updated);

    setFoodName('');
    setReactionNotes('');
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2000);

    fetch('/api/food-introduction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodName, status, preparation, texture, reactionNotes }),
    }).catch(() => {});
  }

  function deleteItem(id: string) {
    const updated = introductions.filter((i) => i.id !== id);
    setIntroductions(updated);
    saveToStorage(updated);
  }

  return (
    <AppShell title="Baby Solid Food Journey">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Form Glass Card */}
        <section className="rounded-[38px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E7D0AA]/40 text-amber-800 shadow-xs">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-800">Infant Complementary Feeding</p>
              <h3 className="text-xl font-bold text-[#292628] font-serif">Record Single Food Introduction</h3>
            </div>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Food Name</label>
                <input
                  type="text"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Steamed Sweet Potato, Mashed Avocado"
                  className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Introduction Stage Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FoodIntroItem['status'])}
                  className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                >
                  <option value="introduced">Introduced (Well Tolerated)</option>
                  <option value="recently_introduced">Monitoring (Day 1–3 Protocol)</option>
                  <option value="planned">Planned Next</option>
                  <option value="caution">Caution / Sensitive</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Preparation Method</label>
                <input
                  type="text"
                  value={preparation}
                  onChange={(e) => setPreparation(e.target.value)}
                  placeholder="e.g. Steamed, Boiled, Roasted"
                  className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Texture Offered</label>
                <input
                  type="text"
                  value={texture}
                  onChange={(e) => setTexture(e.target.value)}
                  placeholder="e.g. Smooth Puree, Fork Mashed, Finger Soft"
                  className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Tolerance &amp; Reaction Notes</label>
              <input
                type="text"
                value={reactionNotes}
                onChange={(e) => setReactionNotes(e.target.value)}
                placeholder="e.g. Loved the natural sweetness, clear skin, no bowel changes."
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold text-white shadow-md transition active:scale-95 ${
                saved ? 'bg-emerald-700' : 'bg-[#292628] hover:bg-[#4E4445]'
              } disabled:opacity-50`}
            >
              <Plus className="h-4 w-4 text-[#EBC5D7]" />
              {loading ? 'Saving...' : saved ? '✓ Food Entry Catalogued!' : 'Catalogue Food Introduction'}
            </button>
          </form>
        </section>

        {/* Catalog Cards matching reference */}
        <section className="rounded-[38px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#292628] font-serif">
              Introduced Solid Foods Catalog ({introductions.length})
            </h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-900 border border-white shadow-xs">
              WHO 3-Day Rule Active
            </span>
          </div>

          {introductions.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {introductions.map((item) => {
                const badge = STATUS_BADGES[item.status] || STATUS_BADGES.introduced;
                return (
                  <div
                    key={item.id}
                    className="rounded-[26px] glass-card p-4.5 border border-white/90 bg-white/85 shadow-xs space-y-2.5 hover:bg-white transition"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-base font-bold text-[#292628] font-serif">{item.food_name}</span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-stone-300 hover:text-red-600 transition p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${badge.style}`}>
                      {badge.label}
                    </span>

                    <p className="text-xs text-[#827779]">
                      Prep: {item.preparation} • Texture: {item.texture}
                    </p>

                    {item.reaction_notes && (
                      <p className="text-xs text-[#4E4445] italic">&quot;{item.reaction_notes}&quot;</p>
                    )}

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-[#827779]">
                      <span>Logged {item.introduced_date}</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="h-3 w-3" /> Tracked
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="h-10 w-10 rounded-full orb-glow-amber mx-auto opacity-70" />
              <p className="text-xs text-[#827779] italic">
                No solid foods catalogued yet. Add your baby&apos;s first taste above!
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
