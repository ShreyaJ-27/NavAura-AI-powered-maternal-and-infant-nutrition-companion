'use client';

import { useEffect, useState } from 'react';
import { Baby, Droplets, Plus, Trash2, Clock, Milk, Utensils, Heart } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

type FeedingLogRecord = {
  id: string;
  feeding_type: string;
  duration_minutes?: number;
  amount_ml?: number;
  food_name?: string;
  notes?: string;
  logged_at: string;
};

const STORAGE_KEY = 'navaura_feeding_logs';

function loadFromStorage(): FeedingLogRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToStorage(logs: FeedingLogRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export default function FeedingPage() {
  const [logs, setLogs] = useState<FeedingLogRecord[]>([]);
  const [feedingType, setFeedingType] = useState<'breastfeeding' | 'expressed' | 'formula' | 'solids'>('breastfeeding');
  const [durationMinutes, setDurationMinutes] = useState('15');
  const [amountMl, setAmountMl] = useState('120');
  const [foodName, setFoodName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLogs(loadFromStorage());
  }, []);

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const newRecord: FeedingLogRecord = {
      id: crypto.randomUUID(),
      feeding_type: feedingType,
      duration_minutes: feedingType === 'breastfeeding' ? (Number(durationMinutes) || 15) : undefined,
      amount_ml: feedingType !== 'breastfeeding' ? (Number(amountMl) || 120) : undefined,
      food_name: foodName || undefined,
      notes: notes || undefined,
      logged_at: new Date().toISOString(),
    };

    const updated = [newRecord, ...logs];
    setLogs(updated);
    saveToStorage(updated);

    try {
      await fetch('/api/feeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedingType,
          durationMinutes: feedingType === 'breastfeeding' ? Number(durationMinutes) : null,
          amountMl: feedingType !== 'breastfeeding' ? Number(amountMl) : null,
          foodName: foodName || null,
          notes,
        }),
      });
    } catch {}

    setFoodName('');
    setNotes('');
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2000);
  }

  function deleteLog(id: string) {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    saveToStorage(updated);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((l) => l.logged_at.startsWith(todayStr));

  return (
    <AppShell title="Infant Feeding Tracker">
      <div className="space-y-8 max-w-5xl mx-auto">
        
        {/* Form Glass Card */}
        <section className="rounded-[36px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3DCE1] text-[#C9969A] shadow-xs">
              <Baby className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9969A]">Infant Care &amp; Nutrition</p>
              <h3 className="text-xl font-bold text-[#292628] font-serif">Log Feeding Activity</h3>
            </div>
          </div>

          <form onSubmit={handleAddLog} className="space-y-5">
            {/* Feeding Type Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'breastfeeding', label: 'Breastfeeding', icon: Heart },
                { id: 'expressed', label: 'Expressed Milk', icon: Droplets },
                { id: 'formula', label: 'Formula', icon: Milk },
                { id: 'solids', label: 'Solids Exploration', icon: Utensils },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFeedingType(id as 'breastfeeding' | 'expressed' | 'formula' | 'solids')}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-3.5 py-3 text-xs font-semibold transition duration-200 ${
                    feedingType === id
                      ? 'border-white bg-white text-[#292628] font-bold shadow-[0_4px_18px_rgba(130,95,105,0.08)]'
                      : 'border-white/60 bg-white/40 text-[#4E4445] hover:bg-white/70'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-[#C9969A]" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {feedingType === 'breastfeeding' ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">
                    Duration (Minutes)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3 h-4 w-4 text-[#827779]" />
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="15"
                      className="w-full rounded-2xl border border-white/90 bg-white/90 pl-10 pr-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">
                    Amount (mL)
                  </label>
                  <div className="relative">
                    <Droplets className="absolute left-3.5 top-3 h-4 w-4 text-[#827779]" />
                    <input
                      type="number"
                      value={amountMl}
                      onChange={(e) => setAmountMl(e.target.value)}
                      placeholder="120"
                      className="w-full rounded-2xl border border-white/90 bg-white/90 pl-10 pr-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">
                  Food / Detail Notes
                </label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Pureed Sweet Potato, Left side"
                  className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold text-white shadow-md transition active:scale-95 ${
                saved ? 'bg-emerald-700' : 'bg-[#292628] hover:bg-[#4E4445]'
              } disabled:opacity-50`}
            >
              <Plus className="h-4 w-4 text-[#EBC5D7]" />
              {loading ? 'Logging...' : saved ? '✓ Feeding Record Saved!' : 'Save Feeding Record'}
            </button>
          </form>
        </section>

        {/* Timeline Glass Card */}
        <section className="rounded-[36px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-[#292628] font-serif">
              Today&apos;s Feeding Timeline
            </h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#C9969A] border border-white shadow-xs">
              {todayLogs.length} Entries Logged
            </span>
          </div>

          {todayLogs.length > 0 ? (
            <div className="space-y-3">
              {todayLogs.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-white/90 bg-white/70 p-4 shadow-xs hover:bg-white transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3DCE1] text-[#C9969A] shadow-xs">
                      <Droplets className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#292628] capitalize">
                        {item.feeding_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-[#827779]">
                        {item.duration_minutes ? `${item.duration_minutes} min` : ''}
                        {item.amount_ml ? `${item.amount_ml} mL` : ''}
                        {item.food_name ? ` • ${item.food_name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#827779] font-medium">
                      {new Date(item.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => deleteLog(item.id)}
                      className="text-stone-300 hover:text-red-600 transition p-1"
                      title="Delete record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="h-10 w-10 rounded-full orb-glow mx-auto opacity-70" />
              <p className="text-xs text-[#827779] italic">
                No feeding entries logged today yet. Use the form above to record infant feeding.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
