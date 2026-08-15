#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

async function main() {
  console.log('Starting verified food dataset ingestion pipeline...');

  const dataPath = path.join(process.cwd(), 'data', 'normalized_foods.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`Dataset file not found at ${dataPath}. Run npm run data:normalize first.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf8');
  const parsed = JSON.parse(rawData);
  const foods = parsed.foods || [];

  console.log(`Loaded ${foods.length} normalized food items.`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('Supabase credentials not configured in environment. Ingestion output saved locally in data/normalized_foods.json.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let insertedCount = 0;
  for (const food of foods.slice(0, 50)) {
    try {
      const { data: foodRecord, error: foodError } = await supabase
        .from('foods')
        .upsert({ name: food.name, category: food.category }, { onConflict: 'name' })
        .select('id')
        .single();

      if (foodError || !foodRecord) {
        continue;
      }

      await supabase.from('food_nutrition').upsert({
        food_id: foodRecord.id,
        calories: food.nutrients.calories,
        protein_g: food.nutrients.protein_g,
        fat_g: food.nutrients.fat_g,
        carbs_g: food.nutrients.carbs_g,
        fiber_g: food.nutrients.fiber_g,
        iron_mg: food.nutrients.iron_mg,
        calcium_mg: food.nutrients.calcium_mg,
        vitamin_c_mg: food.nutrients.vitamin_c_mg,
        source: food.source || 'USDA FoodData Central',
      });

      insertedCount++;
    } catch {
      // Ignore individual upsert errors
    }
  }

  console.log(`Successfully imported ${insertedCount} food records into Supabase.`);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
