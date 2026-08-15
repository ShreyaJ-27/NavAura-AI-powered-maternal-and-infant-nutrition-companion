'use client';

import { useState } from 'react';
import { Heart, Moon, Smile, Sparkles, Trash2, Zap } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

type WellnessLogItem = {
  id: string;
  energy_rating: number;
  rest_rating: number;
  mood_rating: number;
  notes?: string;
  logged_at: string;
};

const STORAGE_KEY = 'navaura_wellness_logs';

function loadFromStorage(): WellnessLogItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToStorage(logs: WellnessLogItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function RatingPills({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#4E4445]">
          <Icon className="h-3.5 w-3.5 text-[#C9969A]" />
          {label}
        </span>
        <span className="text-xs font-bold text-[#C9969A]">{value} / 5</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`flex-1 py-3 rounded-2xl text-xs font-bold transition duration-200 active:scale-95 ${
              value === val
                ? 'bg-[#292628] text-white shadow-xs'
                : 'bg-white/80 text-[#4E4445] hover:bg-white border border-white'
            }`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WellnessPage() {
  const [logs, setLogs] = useState<WellnessLogItem[]>(() => loadFromStorage());
  const [energyRating, setEnergyRating] = useState<number>(4);
  const [restRating, setRestRating] = useState<number>(3);
  const [moodRating, setMoodRating] = useState<number>(4);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSavedMessage('');

    const newRecord: WellnessLogItem = {
      id: crypto.randomUUID(),
      energy_rating: energyRating,
      rest_rating: restRating,
      mood_rating: moodRating,
      notes: notes || undefined,
      logged_at: new Date().toISOString(),
    };

    const updated = [newRecord, ...logs];
    setLogs(updated);
    saveToStorage(updated);
    setSavedMessage('✓ Wellness check-in recorded gently.');
    setNotes('');
    setLoading(false);
    setTimeout(() => setSavedMessage(''), 3000);

    fetch('/api/wellness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ energyRating, restRating, moodRating, notes }),
    }).catch(() => {});
  }

  function deleteLog(id: string) {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    saveToStorage(updated);
  }

  return (
    <AppShell title="Maternal Wellness Check-In">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Form Glass Card */}
        <section className="rounded-[38px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3DCE1] text-[#C9969A] shadow-xs">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9969A]">Postpartum Care &amp; Mind</p>
              <h3 className="text-xl font-bold text-[#292628] font-serif">Gentle Daily Check-In</h3>
            </div>
          </div>

          <form onSubmit={handleCheckIn} className="space-y-6">
            <RatingPills label="Physical Vitality & Energy" value={energyRating} onChange={setEnergyRating} icon={Zap} />
            <RatingPills label="Rest Quality & Sleep Stamina" value={restRating} onChange={setRestRating} icon={Moon} />
            <RatingPills label="Emotional Equilibrium & Mood" value={moodRating} onChange={setMoodRating} icon={Smile} />

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">
                Optional Reflection Note
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How does your body feel today? (e.g. slight fatigue in shoulders, feeling nourished after warm soup)"
                className="w-full rounded-2xl border border-white/90 bg-white/90 p-3.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            {savedMessage && (
              <p className="text-xs font-bold text-emerald-800 bg-emerald-50/90 p-3 rounded-2xl border border-emerald-200">
                {savedMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#292628] py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#4E4445] active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-[#EBC5D7]" />
              {loading ? 'Recording...' : 'Record Daily Wellness'}
            </button>
          </form>

          {/* Past History */}
          {logs.length > 0 && (
            <div className="mt-8 pt-6 border-t border-stone-200/60 space-y-3">
              <h4 className="text-sm font-bold text-[#292628] font-serif">
                Recent Check-In Entries ({logs.length})
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {logs.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white bg-white/80 p-4 text-xs space-y-1.5 shadow-xs">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-[#292628]">
                        ⚡ {item.energy_rating}/5 &nbsp; 🌙 {item.rest_rating}/5 &nbsp; 🌸 {item.mood_rating}/5
                      </p>
                      <button onClick={() => deleteLog(item.id)} className="text-stone-300 hover:text-red-600 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-[#827779]">
                      {new Date(item.logged_at).toLocaleDateString()} at{' '}
                      {new Date(item.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.notes && <p className="text-xs text-[#4E4445] italic">&quot;{item.notes}&quot;</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Disclaimer */}
          <div className="mt-6 rounded-2xl border border-white bg-[#FCFAF8] p-4 text-[11px] text-[#827779] leading-relaxed">
            <p className="font-bold text-[#4E4445]">Holistic Health Note</p>
            <p className="mt-0.5">
              NavAura provides non-diagnostic lifestyle wellness tracking. If you experience persistent sadness, severe exhaustion, or medical symptoms, please contact your healthcare provider or postpartum care specialist.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
