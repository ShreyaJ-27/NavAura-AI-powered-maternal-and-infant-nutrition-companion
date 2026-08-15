'use client';

import { useState } from 'react';
import { Droplets, Plus, Trash2, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

type HydrationLogRecord = {
  id: string;
  amount_ml: number;
  beverage_type: string;
  logged_at: string;
};

const STORAGE_KEY = 'navaura_hydration_logs';

function loadFromStorage(): HydrationLogRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToStorage(logs: HydrationLogRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export default function HydrationPage() {
  const [logs, setLogs] = useState<HydrationLogRecord[]>(() => loadFromStorage());
  const [customMl, setCustomMl] = useState('');
  const [flash, setFlash] = useState('');

  function addWater(ml: number) {
    const newRecord: HydrationLogRecord = {
      id: crypto.randomUUID(),
      amount_ml: ml,
      beverage_type: 'water',
      logged_at: new Date().toISOString(),
    };
    const updated = [newRecord, ...logs];
    setLogs(updated);
    saveToStorage(updated);
    setFlash(`+${ml} mL logged ✓`);
    setTimeout(() => setFlash(''), 2000);

    fetch('/api/hydration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountMl: ml, beverageType: 'water' }),
    }).catch(() => {});
  }

  function handleCustomAdd(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(customMl);
    if (val > 0) {
      addWater(val);
      setCustomMl('');
    }
  }

  function deleteLog(id: string) {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    saveToStorage(updated);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTotal = logs
    .filter((l) => l.logged_at && l.logged_at.startsWith(todayStr))
    .reduce((sum, l) => sum + (Number(l.amount_ml) || 0), 0);
  const targetMl = 2500;
  const progressPercent = Math.min(100, Math.round((todayTotal / targetMl) * 100));

  return (
    <AppShell title="Maternal Hydration Tracker">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Visual Water Sphere Banner matching reference */}
        <section className="rounded-[38px] glass-card p-7 md:p-9 border border-white/95 bg-gradient-to-tr from-white/90 via-[#F3DCE1]/40 to-[#E8DDF0]/50 shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#C9969A] shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Lactation Fluid Balance
              </span>
              <h3 className="text-3xl md:text-4xl font-bold text-[#292628] font-serif">
                {(todayTotal / 1000).toFixed(1)} L <span className="text-base text-[#827779] font-normal">/ 2.5 L Target</span>
              </h3>
              <p className="text-xs text-[#4E4445] max-w-md">
                Consistent hydration supports blood volume restoration and steady breastmilk synthesis.
              </p>
            </div>

            {/* Quick Logging Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => addWater(250)}
                className="rounded-full bg-white text-[#292628] border border-white px-5 py-3 text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5 text-[#C9969A]" />
                +250 mL Cup
              </button>
              <button
                type="button"
                onClick={() => addWater(500)}
                className="rounded-full bg-[#292628] text-white px-5 py-3 text-xs font-bold shadow-md hover:bg-[#4E4445] transition active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5 text-[#EBC5D7]" />
                +500 mL Bottle
              </button>
            </div>
          </div>

          {flash && (
            <div className="mt-4 text-center text-xs font-bold text-emerald-800 bg-emerald-50/90 rounded-2xl py-2 border border-emerald-200 animate-fade-in">
              {flash}
            </div>
          )}

          {/* Ethereal Progress Bar */}
          <div className="mt-6 space-y-2 relative z-10">
            <div className="flex justify-between text-xs font-bold text-[#4E4445]">
              <span>Daily Goal Progress</span>
              <span>{progressPercent}% ({Math.max(0, targetMl - todayTotal)} mL remaining)</span>
            </div>
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/70 border border-white p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#C9969A] via-[#D9A7AE] to-[#EBC5D7] transition-all duration-700 shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Custom Input & Log History */}
        <div className="grid gap-6 md:grid-cols-12">
          
          {/* Custom Log Card */}
          <section className="md:col-span-4 rounded-[32px] glass-card p-6 border border-white/90 bg-white/80 shadow-xs space-y-4">
            <h4 className="text-base font-bold text-[#292628] font-serif">Custom Hydration Amount</h4>
            <form onSubmit={handleCustomAdd} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">
                  Volume in Milliliters
                </label>
                <input
                  type="number"
                  value={customMl}
                  onChange={(e) => setCustomMl(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full rounded-2xl border border-white/90 bg-white px-4 py-2.5 text-xs text-[#292628] focus:outline-none shadow-xs transition"
                />
              </div>
              <button
                type="submit"
                disabled={!customMl}
                className="w-full flex items-center justify-center gap-1.5 rounded-full bg-[#292628] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#4E4445] transition disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Record Custom Amount
              </button>
            </form>
          </section>

          {/* Log History */}
          <section className="md:col-span-8 rounded-[32px] glass-card p-6 border border-white/90 bg-white/80 shadow-xs space-y-4">
            <h4 className="text-base font-bold text-[#292628] font-serif">
              Today&apos;s Hydration Entries ({logs.filter((l) => l.logged_at.startsWith(todayStr)).length})
            </h4>

            {logs.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {logs.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white bg-white/80 p-3.5 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Droplets className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#292628]">{item.amount_ml} mL</p>
                        <p className="text-[10px] text-[#827779]">
                          {new Date(item.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteLog(item.id)}
                      className="text-stone-300 hover:text-red-600 transition p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#827779] italic py-4">No water logged yet today. Click +250 mL to begin!</p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
