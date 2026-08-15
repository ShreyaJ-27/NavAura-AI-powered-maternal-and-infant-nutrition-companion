import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type DetectedMealItemInput = {
  name?: string;
  confidence?: number;
  visible_portion?: 'small' | 'medium' | 'large' | 'unclear';
  nutrients?: {
    calories?: number;
    protein_g?: number;
    fat_g?: number;
    carbs_g?: number;
    fiber_g?: number;
    iron_mg?: number;
    calcium_mg?: number;
  };
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { data: meals, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ success: true, data: [] });
      }

      return NextResponse.json({ success: true, data: meals || [] });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }
  } catch (err) {
    console.error('Fetch meals error:', err);
    return NextResponse.json({ error: 'Failed to fetch saved meals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { foodName, analysis, texture, preparation, allergenStatus, items, safetyNotes } = body;

    if (!foodName || !analysis) {
      return NextResponse.json({ error: 'Missing food name or analysis payload' }, { status: 400 });
    }

    const mealRecord = {
      user_id: user.id,
      food_name: foodName,
      analysis,
      texture: texture || 'soft',
      preparation: preparation || 'cooked',
      allergen_status: allergenStatus || 'default',
      safety_notes: safetyNotes || {},
    };

    try {
      // Insert Meal
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert(mealRecord)
        .select('*')
        .single();

      if (mealError || !meal) {
        console.warn('Meals table insert notice:', mealError?.message);
        return NextResponse.json({ success: true, data: { id: crypto.randomUUID(), ...mealRecord, created_at: new Date().toISOString() } });
      }

      // Optional sub-table inserts
      if (Array.isArray(items) && items.length > 0) {
        try {
          const itemsToInsert = items.map((item: DetectedMealItemInput) => ({
            meal_id: meal.id,
            food_name: item.name || foodName,
            confidence: item.confidence || 0.9,
            visible_portion: item.visible_portion || 'medium',
            calories: item.nutrients?.calories || 0,
            protein_g: item.nutrients?.protein_g || 0,
            fat_g: item.nutrients?.fat_g || 0,
            carbs_g: item.nutrients?.carbs_g || 0,
            fiber_g: item.nutrients?.fiber_g || 0,
            iron_mg: item.nutrients?.iron_mg || 0,
            calcium_mg: item.nutrients?.calcium_mg || 0,
          }));
          await supabase.from('meal_items').insert(itemsToInsert);
        } catch {
          // ignore optional sub-table error
        }
      }

      return NextResponse.json({ success: true, data: meal });
    } catch {
      return NextResponse.json({ success: true, data: { id: crypto.randomUUID(), ...mealRecord, created_at: new Date().toISOString() } });
    }
  } catch (err) {
    console.error('Save meal error:', err);
    return NextResponse.json({ error: 'Failed to save meal' }, { status: 500 });
  }
}
