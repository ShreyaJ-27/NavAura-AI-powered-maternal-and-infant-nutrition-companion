import { NextResponse } from 'next/server';
import normalizedDataset from '@/data/normalized_foods.json';
import { evaluateSafetyEngine } from '@/lib/safety-engine';

type CatalogFoodRecord = {
  id?: string;
  name: string;
  category?: string;
  source?: string;
  nutrients?: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    iron_mg: number;
    calcium_mg: number;
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').toLowerCase().trim();
    const category = searchParams.get('category');
    const babyAgeDays = Number(searchParams.get('babyAgeDays') || 210);

    const foods: CatalogFoodRecord[] = normalizedDataset.foods || [];

    let filtered = foods;

    if (query) {
      filtered = filtered.filter(
        (f) => f.name.toLowerCase().includes(query) || (f.category && f.category.toLowerCase().includes(query)),
      );
    }

    if (category && category !== 'All') {
      filtered = filtered.filter((f) => f.category === category);
    }

    const results = filtered.slice(0, 30).map((f: CatalogFoodRecord) => {
      const safety = evaluateSafetyEngine({
        babyAgeDays,
        foodName: f.name,
        texture: 'soft',
        preparation: 'cooked',
      });
      return {
        ...f,
        safety,
      };
    });

    return NextResponse.json({
      success: true,
      totalCount: filtered.length,
      data: results,
    });
  } catch (err) {
    console.error('Nutrition search error:', err);
    return NextResponse.json({ error: 'Failed to search food database' }, { status: 500 });
  }
}
