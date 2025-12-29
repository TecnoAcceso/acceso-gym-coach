-- Tabla de planes alimenticios asignados a clientes
CREATE TABLE IF NOT EXISTS client_nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_template_id UUID NOT NULL REFERENCES nutrition_plan_templates(id) ON DELETE RESTRICT,
  assigned_date DATE DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_nutrition_plans_client_id ON client_nutrition_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_client_nutrition_plans_plan_template_id ON client_nutrition_plans(plan_template_id);
CREATE INDEX IF NOT EXISTS idx_client_nutrition_plans_status ON client_nutrition_plans(status);
CREATE INDEX IF NOT EXISTS idx_client_nutrition_plans_dates ON client_nutrition_plans(start_date, end_date);

-- RLS Policies
ALTER TABLE client_nutrition_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Los trainers pueden ver planes de sus clientes
CREATE POLICY "Trainers can view nutrition plans of their clients"
  ON client_nutrition_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_nutrition_plans.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Policy: Los trainers pueden asignar planes a sus clientes
CREATE POLICY "Trainers can assign nutrition plans to their clients"
  ON client_nutrition_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_nutrition_plans.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Policy: Los trainers pueden actualizar planes de sus clientes
CREATE POLICY "Trainers can update nutrition plans of their clients"
  ON client_nutrition_plans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_nutrition_plans.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Policy: Los trainers pueden eliminar planes de sus clientes
CREATE POLICY "Trainers can delete nutrition plans of their clients"
  ON client_nutrition_plans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_nutrition_plans.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER update_client_nutrition_plans_updated_at
  BEFORE UPDATE ON client_nutrition_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Constraint: Un cliente solo puede tener un plan activo a la vez
CREATE UNIQUE INDEX idx_one_active_nutrition_plan_per_client
  ON client_nutrition_plans(client_id)
  WHERE status = 'active';
