-- Tabla de comidas de los planes alimenticios
CREATE TABLE IF NOT EXISTS plan_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_template_id UUID NOT NULL REFERENCES nutrition_plan_templates(id) ON DELETE CASCADE,
  meal_time TEXT NOT NULL CHECK (meal_time IN ('desayuno', 'snack_am', 'almuerzo', 'merienda', 'cena', 'post_entreno')),
  meal_name TEXT NOT NULL,
  foods JSONB DEFAULT '[]'::jsonb,
  calories INTEGER DEFAULT 0,
  protein_g INTEGER DEFAULT 0,
  carbs_g INTEGER DEFAULT 0,
  fats_g INTEGER DEFAULT 0,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plan_meals_plan_template_id ON plan_meals(plan_template_id);
CREATE INDEX IF NOT EXISTS idx_plan_meals_meal_time ON plan_meals(meal_time);
CREATE INDEX IF NOT EXISTS idx_plan_meals_order_index ON plan_meals(order_index);

-- RLS Policies
ALTER TABLE plan_meals ENABLE ROW LEVEL SECURITY;

-- Policy: Los trainers pueden ver las comidas de sus planes
CREATE POLICY "Trainers can view meals of their nutrition plans"
  ON plan_meals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nutrition_plan_templates
      WHERE nutrition_plan_templates.id = plan_meals.plan_template_id
      AND nutrition_plan_templates.trainer_id = auth.uid()
    )
  );

-- Policy: Los trainers pueden crear comidas en sus planes
CREATE POLICY "Trainers can create meals in their nutrition plans"
  ON plan_meals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nutrition_plan_templates
      WHERE nutrition_plan_templates.id = plan_meals.plan_template_id
      AND nutrition_plan_templates.trainer_id = auth.uid()
    )
  );

-- Policy: Los trainers pueden actualizar comidas de sus planes
CREATE POLICY "Trainers can update meals of their nutrition plans"
  ON plan_meals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM nutrition_plan_templates
      WHERE nutrition_plan_templates.id = plan_meals.plan_template_id
      AND nutrition_plan_templates.trainer_id = auth.uid()
    )
  );

-- Policy: Los trainers pueden eliminar comidas de sus planes
CREATE POLICY "Trainers can delete meals of their nutrition plans"
  ON plan_meals
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM nutrition_plan_templates
      WHERE nutrition_plan_templates.id = plan_meals.plan_template_id
      AND nutrition_plan_templates.trainer_id = auth.uid()
    )
  );

-- Comentarios sobre la estructura JSONB de foods:
-- foods: [
--   {
--     "name": "Arroz integral",
--     "quantity": "200g",
--     "protein_g": 5,
--     "carbs_g": 45,
--     "fats_g": 1,
--     "calories": 210
--   },
--   ...
-- ]
