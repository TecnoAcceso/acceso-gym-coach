-- ============================================
-- Client Profile Photos
-- Archivo: 10_client_profile_photos.sql
-- Descripción: Agrega campo de foto de perfil a clientes
-- ============================================

-- 1. Agregar columna profile_photo_url a la tabla clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 2. Comentario sobre el campo
COMMENT ON COLUMN clients.profile_photo_url IS 'URL de la foto de perfil del cliente almacenada en Supabase Storage';

-- ============================================
-- STORAGE BUCKET PARA FOTOS DE PERFIL
-- ============================================

-- 3. Crear bucket para fotos de perfil (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  false, -- Privado: Solo accesible con políticas RLS
  5242880, -- 5MB en bytes (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/jpg', 'image/png'] -- Solo JPG y PNG
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS DE ACCESO AL STORAGE
-- ============================================

-- 4. Política SELECT: Trainers pueden ver fotos de perfil de sus clientes
CREATE POLICY "Trainers can view profile photos of their clients"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND EXISTS (
    SELECT 1 FROM clients
    WHERE id::text = split_part(name, '/', 1)
    AND trainer_id = auth.uid()
  )
);

-- 5. Política INSERT: Trainers pueden subir fotos de perfil para sus clientes
CREATE POLICY "Trainers can upload profile photos for their clients"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND EXISTS (
    SELECT 1 FROM clients
    WHERE id::text = split_part(name, '/', 1)
    AND trainer_id = auth.uid()
  )
);

-- 6. Política UPDATE: Trainers pueden actualizar fotos de perfil de sus clientes
CREATE POLICY "Trainers can update profile photos of their clients"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND EXISTS (
    SELECT 1 FROM clients
    WHERE id::text = split_part(name, '/', 1)
    AND trainer_id = auth.uid()
  )
);

-- 7. Política DELETE: Trainers pueden eliminar fotos de perfil de sus clientes
CREATE POLICY "Trainers can delete profile photos of their clients"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND EXISTS (
    SELECT 1 FROM clients
    WHERE id::text = split_part(name, '/', 1)
    AND trainer_id = auth.uid()
  )
);

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
--
-- ESTRUCTURA DE ARCHIVOS EN EL BUCKET:
-- profile-photos/
--   ├── {client_id}/
--   │   └── profile.jpg
--
-- EJEMPLO:
-- profile-photos/
--   └── 123e4567-e89b-12d3-a456-426614174000/
--       └── profile.jpg
--
-- LÍMITES:
-- - Tamaño máximo por archivo: 5MB
-- - Formatos permitidos: JPG, JPEG, PNG
-- - Acceso: Solo el trainer propietario del cliente
--
-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Para verificar que la columna se creó:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'clients' AND column_name = 'profile_photo_url';
--
-- Para verificar que el bucket se creó:
-- SELECT * FROM storage.buckets WHERE id = 'profile-photos';
--
-- Para verificar las políticas:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
