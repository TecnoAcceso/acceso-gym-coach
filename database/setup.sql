-- AccesoGym Coach Database Setup
-- Execute this script in your Supabase SQL editor

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('V', 'E')) NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  start_date DATE NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0 AND duration_months <= 12),
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expiring', 'expired')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trainer_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Constraints
  UNIQUE(cedula, document_type, trainer_id),
  CHECK (LENGTH(cedula) >= 7 AND LENGTH(cedula) <= 8),
  CHECK (LENGTH(phone) >= 10)
);

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired')) DEFAULT 'active',
  trainer_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(trainer_id),
  UNIQUE(license_key)
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
DROP POLICY IF EXISTS "Users can view own license" ON licenses;
DROP POLICY IF EXISTS "Users can insert own license" ON licenses;
DROP POLICY IF EXISTS "Users can update own license" ON licenses;

-- Create RLS policies for clients table
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = trainer_id);

-- Create RLS policies for licenses table
CREATE POLICY "Users can view own license" ON licenses
  FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Users can insert own license" ON licenses
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Users can update own license" ON licenses
  FOR UPDATE USING (auth.uid() = trainer_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_trainer_id ON clients(trainer_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_end_date ON clients(end_date);
CREATE INDEX IF NOT EXISTS idx_clients_cedula ON clients(cedula, document_type);
CREATE INDEX IF NOT EXISTS idx_licenses_trainer_id ON licenses(trainer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for clients table
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update client status based on end_date
CREATE OR REPLACE FUNCTION update_client_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate status based on end_date
    IF NEW.end_date < CURRENT_DATE THEN
        NEW.status = 'expired';
    ELSIF NEW.end_date <= CURRENT_DATE + INTERVAL '3 days' THEN
        NEW.status = 'expiring';
    ELSE
        NEW.status = 'active';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update status
DROP TRIGGER IF EXISTS auto_update_client_status ON clients;
CREATE TRIGGER auto_update_client_status
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_client_status();

-- Function to automatically update license status based on expiry_date
CREATE OR REPLACE FUNCTION update_license_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate status based on expiry_date
    IF NEW.expiry_date < CURRENT_DATE THEN
        NEW.status = 'expired';
    ELSE
        NEW.status = 'active';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update license status
DROP TRIGGER IF EXISTS auto_update_license_status ON licenses;
CREATE TRIGGER auto_update_license_status
    BEFORE INSERT OR UPDATE ON licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_license_status();

-- Sample data (optional - remove in production)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   gen_random_uuid(),
--   'demo@accesogym.com',
--   crypt('password123', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- ) ON CONFLICT DO NOTHING;