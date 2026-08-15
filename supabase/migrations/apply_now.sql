-- NavAura: Apply missing tables migration
-- Paste this entire block into Supabase Dashboard > SQL Editor > Run

CREATE TABLE IF NOT EXISTS meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  confidence DECIMAL(3, 2),
  visible_portion TEXT CHECK (visible_portion IN ('small', 'medium', 'large', 'unclear')),
  calories DECIMAL(7, 2), protein_g DECIMAL(6, 2), fat_g DECIMAL(6, 2),
  carbs_g DECIMAL(6, 2), fiber_g DECIMAL(6, 2), iron_mg DECIMAL(6, 2), calcium_mg DECIMAL(6, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_response JSONB NOT NULL, structured_analysis JSONB NOT NULL,
  groq_model TEXT NOT NULL, confidence_score DECIMAL(3, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feeding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
  feeding_type TEXT NOT NULL CHECK (feeding_type IN ('breastfeeding', 'expressed', 'formula', 'solids')),
  duration_minutes INTEGER, amount_ml DECIMAL(6, 2), food_name TEXT, notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml DECIMAL(6, 2) NOT NULL, beverage_type TEXT NOT NULL DEFAULT 'water',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wellness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  energy_rating INTEGER CHECK (energy_rating BETWEEN 1 AND 5),
  rest_rating INTEGER CHECK (rest_rating BETWEEN 1 AND 5),
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_introductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_id UUID REFERENCES babies(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('introduced', 'recently_introduced', 'planned', 'caution')),
  preparation TEXT, texture TEXT, reaction_notes TEXT,
  introduced_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, category TEXT NOT NULL, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  calories DECIMAL(7, 2), protein_g DECIMAL(6, 2), fat_g DECIMAL(6, 2),
  carbs_g DECIMAL(6, 2), fiber_g DECIMAL(6, 2), iron_mg DECIMAL(6, 2),
  calcium_mg DECIMAL(6, 2), vitamin_c_mg DECIMAL(6, 2),
  source TEXT NOT NULL DEFAULT 'USDA FoodData Central',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_introductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_nutrition ENABLE ROW LEVEL SECURITY;

-- RLS Policies (safe drop+create)
DROP POLICY IF EXISTS "Users can manage meal_items for their meals" ON meal_items;
DROP POLICY IF EXISTS "Users can view their ai_analyses" ON ai_analyses;
DROP POLICY IF EXISTS "Users can insert their ai_analyses" ON ai_analyses;
DROP POLICY IF EXISTS "Users can manage feeding_logs" ON feeding_logs;
DROP POLICY IF EXISTS "Users can manage hydration_logs" ON hydration_logs;
DROP POLICY IF EXISTS "Users can manage wellness_logs" ON wellness_logs;
DROP POLICY IF EXISTS "Users can manage food_introductions" ON food_introductions;
DROP POLICY IF EXISTS "Public read foods" ON foods;
DROP POLICY IF EXISTS "Public read food_nutrition" ON food_nutrition;

CREATE POLICY "Users can manage meal_items for their meals" ON meal_items FOR ALL
  USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));
CREATE POLICY "Users can view their ai_analyses" ON ai_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their ai_analyses" ON ai_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage feeding_logs" ON feeding_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage hydration_logs" ON hydration_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage wellness_logs" ON wellness_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage food_introductions" ON food_introductions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read foods" ON foods FOR SELECT USING (true);
CREATE POLICY "Public read food_nutrition" ON food_nutrition FOR SELECT USING (true);
