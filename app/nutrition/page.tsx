'use client';

import { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

type FoodItem = {
  id?: string;
  name: string;
  category?: string;
  source?: string;
  nutrients?: {
    calories: number;
    protein_g: number;
    iron_mg: number;
    calcium_mg: number;
  };
  safety?: {
    statusBadge?: { label: string };
  };
};

export default function NutritionPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/nutrition?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setFoods(data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [query, category]);

  return (
    <AppShell title="Verified Food & Nutrition Library">
      <div className="space-y-7 max-w-5xl mx-auto">
        {/* Search & Category Glass Panel */}
        <section className="rounded-[36px] glass-card p-6 border border-white/95 bg-white/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3 h-4 w-4 text-[#827779]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods (e.g. Avocado, Spinach, Lentils, Salmon)..."
                className="w-full rounded-full border border-white bg-white/90 pl-11 pr-4 py-2.5 text-xs text-[#292628] focus:outline-none shadow-xs transition"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
              {['All', 'Fruits', 'Vegetables', 'Grains', 'Protein Foods', 'Dairy & Alternatives'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-4 py-2 whitespace-nowrap transition duration-200 ${
                    category === cat
                      ? 'bg-[#292628] text-white font-bold shadow-xs'
                      : 'bg-white/80 text-[#4E4445] hover:bg-white border border-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#292628] font-serif">
              Verified Nutrition Catalog ({foods.length})
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C9969A]">
              <Sparkles className="h-3.5 w-3.5" />
              USDA FoodData Grounded
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-[#827779] italic">Searching dataset...</p>
          ) : foods.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {foods.map((food) => (
                <div
                  key={food.id || food.name}
                  className="rounded-[28px] glass-card p-5 border border-white/90 bg-white/85 shadow-xs space-y-3 hover:bg-white transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#C9969A] uppercase tracking-wider">
                      {food.category || 'Nutrition'}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] text-[#827779] font-medium">
                      {food.source || 'USDA'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#292628] font-serif">{food.name}</h4>

                  {food.nutrients && (
                    <div className="grid grid-cols-4 gap-1 text-center bg-[#FCFAF8] p-2.5 rounded-2xl border border-white text-[11px] font-medium text-[#4E4445]">
                      <div>
                        <p className="text-[9px] text-[#827779]">Calories</p>
                        <p className="font-bold">{food.nutrients.calories}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#827779]">Protein</p>
                        <p className="font-bold">{food.nutrients.protein_g}g</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#827779]">Iron</p>
                        <p className="font-bold">{food.nutrients.iron_mg}mg</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#827779]">Calcium</p>
                        <p className="font-bold">{food.nutrients.calcium_mg}mg</p>
                      </div>
                    </div>
                  )}

                  {food.safety && (
                    <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      {food.safety.statusBadge?.label || 'Suitable for exploration'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-[#827779]">No foods found matching your search query.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
