'use client';

import { useEffect, useState } from 'react';
import { Trash2, UtensilsCrossed, Calendar, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

type SavedMealItem = {
  id: string;
  food_name: string;
  texture?: string;
  created_at: string;
};

const STORAGE_KEY = 'navaura_saved_meals';

function loadFromStorage(): SavedMealItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToStorage(meals: SavedMealItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
}

export default function HistoryPage() {
  const [meals, setMeals] = useState<SavedMealItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const localMeals = loadFromStorage();

    async function loadMeals() {
      try {
        const res = await fetch('/api/meals');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data)) {
          const combined = [...localMeals];
          for (const item of data.data) {
            if (!combined.some((m) => m.id === item.id)) {
              combined.push(item);
            }
          }
          setMeals(combined);
          saveToStorage(combined);
          return;
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
      if (isMounted) {
        setMeals(localMeals);
        setLoading(false);
      }
    }

    loadMeals();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDelete(id: string) {
    const updated = meals.filter((m) => m.id !== id);
    setMeals(updated);
    saveToStorage(updated);

    try {
      await fetch(`/api/meals/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AppShell title="Saved Meal History">
      <div className="space-y-6 max-w-5xl mx-auto">
        <section className="rounded-[38px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3DCE1] text-[#C9969A] shadow-xs">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9969A]">Nutrition Archive</p>
                <h3 className="text-xl font-bold text-[#292628] font-serif">
                  Your Scanned Meal Logs ({meals.length})
                </h3>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C9969A]">
              <Sparkles className="h-3.5 w-3.5" />
              Vision History
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-[#827779] italic py-4">Loading meal records...</p>
          ) : meals.length > 0 ? (
            <div className="space-y-3.5">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[26px] border border-white bg-white/80 p-4.5 shadow-xs hover:bg-white transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#292628] font-serif">{meal.food_name}</span>
                      <span className="rounded-full bg-[#F3DCE1] px-2.5 py-0.5 text-[10px] font-bold text-[#C9969A]">
                        {meal.texture || 'soft'}
                      </span>
                    </div>
                    <p className="text-xs text-[#827779] flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Logged on {new Date(meal.created_at).toLocaleDateString()} at{' '}
                      {new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(meal.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-50/80 px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="h-10 w-10 rounded-full orb-glow mx-auto opacity-70" />
              <p className="text-xs text-[#827779] italic">
                No meal records saved yet. Use the Meal Scanner to photograph your first plate!
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
