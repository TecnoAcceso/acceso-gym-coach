-- ============================================
-- FASE 1: Sistema de Progreso y Comparación
-- Archivo: 04_storage_progress_photos.sql
-- Descripción: Configuración de Supabase Storage para fotos de progreso
-- ============================================

-- IMPORTANTE: Este archivo debe ejecutarse desde el panel de Supabase
-- o usando el SQL Editor, NO desde la consola psql normal

-- 1. Crear bucket para fotos de progreso (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'progress-photos',
  'progress-photos',
  false, -- Privado: Solo accesible con políticas RLS
  5242880, -- 5MB en bytes (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/jpg', 'image/png'] -- Solo JPG y PNG
)
ON CONFLICT (id) DO NOTHING;

-- 2. Comentario en el bucket
-- NOTA: Esto es solo documentación, no se ejecuta
-- El bucket 'progress-photos' almacena fotos de progreso de clientes
-- Estructura de carpetas: {client_id}/{measurement_id}/{photo_type}.jpg

-- ============================================
-- POLÍTICAS DE ACCESO AL STORAGE
-- ============================================

-- 3. Política SELECT: Trainers pueden ver fotos de sus clientes
CREATE POLICY "Trainers can view progress photos of their clients"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'progress-photos'
  AND EXISTS (
    SELECT 1 FROM clients
    WHERE id::text = (storage.foldername(name))[1]
    AND trainer_id = auth.uid()
  )
);

-- 4. Política INSERT: Trainers pueden subir fotos para sus clientes
CREATE POLICY "Trainers can upload progress photos for their clients"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'progress-photos'
  AND EXISTS (
    SELECT 1 FROM clients
    WHERE id::text = (storage.foldername(name))[1]
    AND trainer_id = auth.uid()
  )
);

-- 5. Política DELETE: Trainers pueden eliminar fotos de sus clientes
CREATE POLICY "Trainers can delete progress photos of their clients"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'progress-photos'
  AND EXISTS (
    SELECT 1 FROM clients
    WHERE id::text = (storage.foldername(name))[1]
    AND trainer_id = auth.uid()
  )
);

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
--
-- ESTRUCTURA DE ARCHIVOS EN EL BUCKET:
-- progress-photos/
--   ├── {client_id}/
--   │   ├── {measurement_id}/
--   │   │   ├── frontal.jpg
--   │   │   ├── lateral.jpg
--   │   │   └── posterior.jpg
--
-- EJEMPLO:
-- progress-photos/
--   └── 123e4567-e89b-12d3-a456-426614174000/
--       └── 987f6543-e21b-34c5-d678-543210987654/
--           ├── frontal.jpg
--           ├── lateral.jpg
--           └── posterior.jpg
--
-- LÍMITES:
-- - Tamaño máximo por archivo: 5MB
-- - Formatos permitidos: JPG, JPEG, PNG
-- - Acceso: Solo el trainer propietario del cliente
--
-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Para verificar que el bucket se creó:
-- SELECT * FROM storage.buckets WHERE id = 'progress-photos';
--
-- Para verificar las políticas:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
