import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzbvzfsabgisymipbbfj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnZ6ZnNhYmdpc3ltaXBiYmZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3OTg1MCwiZXhwIjoyMTAyMzU1ODUwfQ.P25NZlOrtHd2bvf1jhySW9Z8ctzdt5xuo7JBKz6_620';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkTables() {
  const tables = ['profiles', 'babies', 'meals', 'meal_items', 'ai_analyses', 'feeding_logs', 'hydration_logs', 'wellness_logs', 'food_introductions', 'foods', 'food_nutrition'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': NOT FOUND or ERROR (${error.message})`);
    } else {
      console.log(`Table '${table}': EXISTS (${data.length} records)`);
    }
  }
}

checkTables();
