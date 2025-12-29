-- Tabla de plantillas de planes alimenticios
CREATE TABLE IF NOT EXISTS nutrition_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT CHECK (goal IN ('volumen', 'definicion', 'mantenimiento', 'perdida_peso')),
  calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fats_g INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_templates_trainer_id ON nutrition_plan_templates(trainer_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_templates_goal ON nutrition_plan_templates(goal);

-- RLS Policies
ALTER TABLE nutrition_plan_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Los trainers solo ven sus propias plantillas
CREATE POLICY "Trainers can view their own nutrition plan templates"
  ON nutrition_plan_templates
  FOR SELECT
  USING (auth.uid() = trainer_id);

-- Policy: Los trainers pueden crear plantillas
CREATE POLICY "Trainers can create nutrition plan templates"
  ON nutrition_plan_templates
  FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

-- Policy: Los trainers pueden actualizar sus plantillas
CREATE POLICY "Trainers can update their own nutrition plan templates"
  ON nutrition_plan_templates
  FOR UPDATE
  USING (auth.uid() = trainer_id)
  WITH CHECK (auth.uid() = trainer_id);

-- Policy: Los trainers pueden eliminar sus plantillas
CREATE POLICY "Trainers can delete their own nutrition plan templates"
  ON nutrition_plan_templates
  FOR DELETE
  USING (auth.uid() = trainer_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_nutrition_plan_templates_updated_at
  BEFORE UPDATE ON nutrition_plan_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
