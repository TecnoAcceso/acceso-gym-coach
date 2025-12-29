-- ============================================
-- FASE 1: Sistema de Progreso y Comparación
-- Archivo: 03_progress_photos.sql
-- Descripción: Tabla para almacenar fotos de progreso vinculadas a mediciones
-- ============================================

-- 1. Crear tabla progress_photos
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('frontal', 'lateral', 'posterior')),
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_progress_photos_client_id ON progress_photos(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_measurement_id ON progress_photos(measurement_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_created_at ON progress_photos(created_at DESC);

-- 3. Comentarios en la tabla
COMMENT ON TABLE progress_photos IS 'Almacena fotos de progreso de clientes vinculadas a mediciones específicas';
COMMENT ON COLUMN progress_photos.client_id IS 'ID del cliente (referencia a clients)';
COMMENT ON COLUMN progress_photos.measurement_id IS 'ID de la medición asociada (referencia a measurements)';
COMMENT ON COLUMN progress_photos.photo_type IS 'Tipo de foto: frontal, lateral o posterior';
COMMENT ON COLUMN progress_photos.photo_url IS 'URL de la foto en Supabase Storage';

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS - Los trainers solo ven fotos de sus propios clientes

-- Política SELECT: Ver fotos de clientes propios
CREATE POLICY "Trainers can view progress photos of their clients"
ON progress_photos
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE trainer_id = auth.uid()
  )
);

-- Política INSERT: Crear fotos para clientes propios
CREATE POLICY "Trainers can insert progress photos for their clients"
ON progress_photos
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE trainer_id = auth.uid()
  )
);

-- Política DELETE: Eliminar fotos de clientes propios
CREATE POLICY "Trainers can delete progress photos of their clients"
ON progress_photos
FOR DELETE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE trainer_id = auth.uid()
  )
);

-- 6. No permitir UPDATE (las fotos son inmutables, solo crear o eliminar)
-- Si se necesita cambiar una foto, se elimina y se crea una nueva

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Para verificar que todo se creó correctamente:
-- SELECT * FROM progress_photos LIMIT 0;
-- \d progress_photos
