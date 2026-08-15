-- Additional health tracking tables for NavAura

-- 1. Meal Items (detailed items detected per meal)
CREATE TABLE IF NOT EXISTS meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  confidence DECIMAL(3, 2),
  visible_portion TEXT CHECK (visible_portion IN ('small', 'medium', 'large', 'unclear')),
  calories DECIMAL(7, 2),
  protein_g DECIMAL(6, 2),
  fat_g DECIMAL(6, 2),
  carbs_g DECIMAL(6, 2),
  fiber_g DECIMAL(6, 2),
  iron_mg DECIMAL(6, 2),
  calcium_mg DECIMAL(6, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AI Analysis log
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_response JSONB NOT NULL,
  structured_analysis JSONB NOT NULL,
  groq_model TEXT NOT NULL,
  confidence_score DECIMAL(3, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Feeding Logs
CREATE TABLE IF NOT EXISTS feeding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
  feeding_type TEXT NOT NULL CHECK (feeding_type IN ('breastfeeding', 'expressed', 'formula', 'solids')),
  duration_minutes INTEGER,
  amount_ml DECIMAL(6, 2),
  food_name TEXT,
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Hydration Logs
CREATE TABLE IF NOT EXISTS hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml DECIMAL(6, 2) NOT NULL,
  beverage_type TEXT NOT NULL DEFAULT 'water',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Wellness Logs
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

-- 6. Food Introductions (Baby Solid Food Introduction Tracking)
CREATE TABLE IF NOT EXISTS food_introductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('introduced', 'recently_introduced', 'planned', 'caution')),
  preparation TEXT,
  texture TEXT,
  reaction_notes TEXT,
  introduced_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Verified Foods catalog
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Verified Food Nutrition
CREATE TABLE IF NOT EXISTS food_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  calories DECIMAL(7, 2),
  protein_g DECIMAL(6, 2),
  fat_g DECIMAL(6, 2),
  carbs_g DECIMAL(6, 2),
  fiber_g DECIMAL(6, 2),
  iron_mg DECIMAL(6, 2),
  calcium_mg DECIMAL(6, 2),
  vitamin_c_mg DECIMAL(6, 2),
  source TEXT NOT NULL DEFAULT 'USDA FoodData Central',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Evidence Sources
CREATE TABLE IF NOT EXISTS evidence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization TEXT NOT NULL,
  topic TEXT NOT NULL,
  age_range_months TEXT,
  recommendation TEXT NOT NULL,
  citation_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying performance
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_logs_user_id ON feeding_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_logs_baby_id ON feeding_logs(baby_id);
CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_id ON hydration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_logs_user_id ON wellness_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_introductions_user_id ON food_introductions(user_id);
CREATE INDEX IF NOT EXISTS idx_food_introductions_baby_id ON food_introductions(baby_id);
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);

-- Row Level Security (RLS)
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_introductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_sources ENABLE ROW LEVEL SECURITY;

-- Policies for user-owned tables
CREATE POLICY "Users can manage meal_items for their meals"
  ON meal_items FOR ALL
  USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));

CREATE POLICY "Users can view their ai_analyses"
  ON ai_analyses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their ai_analyses"
  ON ai_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage feeding_logs"
  ON feeding_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage hydration_logs"
  ON hydration_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage wellness_logs"
  ON wellness_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage food_introductions"
  ON food_introductions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for reference tables (readable by authenticated users or anon)
CREATE POLICY "Public read foods" ON foods FOR SELECT USING (true);
CREATE POLICY "Public read food_nutrition" ON food_nutrition FOR SELECT USING (true);
CREATE POLICY "Public read evidence_sources" ON evidence_sources FOR SELECT USING (true);
