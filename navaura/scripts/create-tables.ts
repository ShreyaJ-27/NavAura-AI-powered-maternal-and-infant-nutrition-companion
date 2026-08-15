// Create all missing Supabase tables using Management API
// Supabase allows SQL execution via the `pg` REST endpoint with service_role

const SUPABASE_URL = 'https://fzbvzfsabgisymipbbfj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnZ6ZnNhYmdpc3ltaXBiYmZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3OTg1MCwiZXhwIjoyMTAyMzU1ODUwfQ.P25NZlOrtHd2bvf1jhySW9Z8ctzdt5xuo7JBKz6_620';

// Individual SQL statements - Supabase rpc can run one at a time
const statements = [
  `CREATE TABLE IF NOT EXISTS meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    confidence DECIMAL(3,2),
    visible_portion TEXT CHECK (visible_portion IN ('small','medium','large','unclear')),
    calories DECIMAL(7,2), protein_g DECIMAL(6,2), fat_g DECIMAL(6,2),
    carbs_g DECIMAL(6,2), fiber_g DECIMAL(6,2), iron_mg DECIMAL(6,2), calcium_mg DECIMAL(6,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS feeding_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
    feeding_type TEXT NOT NULL CHECK (feeding_type IN ('breastfeeding','expressed','formula','solids')),
    duration_minutes INTEGER,
    amount_ml DECIMAL(6,2),
    food_name TEXT,
    notes TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS hydration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_ml DECIMAL(6,2) NOT NULL,
    beverage_type TEXT NOT NULL DEFAULT 'water',
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS wellness_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    energy_rating INTEGER CHECK (energy_rating BETWEEN 1 AND 5),
    rest_rating INTEGER CHECK (rest_rating BETWEEN 1 AND 5),
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
    notes TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS food_introductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES babies(id) ON DELETE SET NULL,
    food_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('introduced','recently_introduced','planned','caution')),
    preparation TEXT,
    texture TEXT,
    reaction_notes TEXT,
    introduced_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS food_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    calories DECIMAL(7,2), protein_g DECIMAL(6,2), fat_g DECIMAL(6,2),
    carbs_g DECIMAL(6,2), fiber_g DECIMAL(6,2), iron_mg DECIMAL(6,2),
    calcium_mg DECIMAL(6,2), vitamin_c_mg DECIMAL(6,2),
    source TEXT NOT NULL DEFAULT 'USDA FoodData Central',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE feeding_logs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE food_introductions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE foods ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE food_nutrition ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can manage feeding_logs" ON feeding_logs;
    DROP POLICY IF EXISTS "Users can manage hydration_logs" ON hydration_logs;
    DROP POLICY IF EXISTS "Users can manage wellness_logs" ON wellness_logs;
    DROP POLICY IF EXISTS "Users can manage food_introductions" ON food_introductions;
    DROP POLICY IF EXISTS "Public read foods" ON foods;
    DROP POLICY IF EXISTS "Public read food_nutrition" ON food_nutrition;
    DROP POLICY IF EXISTS "Users can manage meal_items for their meals" ON meal_items;
  EXCEPTION WHEN OTHERS THEN NULL;
  END $$`,
  `CREATE POLICY "Users can manage feeding_logs" ON feeding_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  `CREATE POLICY "Users can manage hydration_logs" ON hydration_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  `CREATE POLICY "Users can manage wellness_logs" ON wellness_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  `CREATE POLICY "Users can manage food_introductions" ON food_introductions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  `CREATE POLICY "Public read foods" ON foods FOR SELECT USING (true)`,
  `CREATE POLICY "Public read food_nutrition" ON food_nutrition FOR SELECT USING (true)`,
  `CREATE POLICY "Users can manage meal_items for their meals" ON meal_items FOR ALL USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()))`,
];

async function runSQL(sql: string): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pg_catalog.pg_execute`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, message: text };
    }
    return { ok: true, message: 'OK' };
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

// Supabase doesn't expose direct SQL exec via REST for DDL.
// Use the Management API instead.
async function runViaManagementAPI(sql: string): Promise<{ ok: boolean; message: string }> {
  try {
    // Supabase Management API endpoint for running queries
    const response = await fetch(`https://api.supabase.com/v1/projects/fzbvzfsabgisymipbbfj/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    const text = await response.text();
    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}: ${text}` };
    }
    return { ok: true, message: text };
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  console.log('Creating NavAura database tables via Supabase Management API...\n');

  // Try Management API
  const testResult = await runViaManagementAPI('SELECT 1 AS test');
  if (testResult.ok) {
    console.log('✅ Management API accessible\n');
    for (const sql of statements) {
      const shortSql = sql.trim().substring(0, 60).replace(/\n/g, ' ');
      const result = await runViaManagementAPI(sql);
      if (result.ok) {
        console.log(`✅ ${shortSql}...`);
      } else {
        console.log(`⚠️  ${shortSql}... -> ${result.message.substring(0, 100)}`);
      }
    }
  } else {
    console.log('Management API not accessible:', testResult.message.substring(0, 200));
    console.log('\nPlease manually run supabase/migrations/apply_now.sql in the Supabase Dashboard SQL Editor');
    console.log('URL: https://supabase.com/dashboard/project/fzbvzfsabgisymipbbfj/sql/new');
  }
}

main();
