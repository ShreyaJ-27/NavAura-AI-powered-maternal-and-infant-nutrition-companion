-- Create profiles table for mother/postpartum data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mother_name TEXT NOT NULL,
  postpartum_date DATE NOT NULL,
  feeding_method TEXT NOT NULL CHECK (feeding_method IN ('exclusive-breastfeeding', 'mixed', 'formula')),
  dietary_restrictions TEXT,
  allergen_awareness TEXT CHECK (allergen_awareness IN ('default', 'high', 'severe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create babies table
CREATE TABLE babies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_weight_kg DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create meals table for scanner results
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_id UUID REFERENCES babies(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  analysis JSONB NOT NULL, -- Groq vision analysis result
  texture TEXT,
  preparation TEXT,
  allergen_status TEXT,
  safety_notes JSONB, -- Results from safety-rules evaluation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create meal_images table for file uploads
CREATE TABLE meal_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_babies_user_id ON babies(user_id);
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_baby_id ON meals(baby_id);
CREATE INDEX idx_meals_created_at ON meals(created_at DESC);
CREATE INDEX idx_meal_images_meal_id ON meal_images(meal_id);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (users can only see their own profile)
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for babies (users can see their own baby profiles)
CREATE POLICY "Users can view their own babies"
  ON babies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own babies"
  ON babies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own babies"
  ON babies FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for meals (users can see their own meals)
CREATE POLICY "Users can view their own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON meals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meal_images (users can see images for their own meals)
CREATE POLICY "Users can view images for their own meals"
  ON meal_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_images.meal_id
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images for their own meals"
  ON meal_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_images.meal_id
      AND meals.user_id = auth.uid()
    )
  );
