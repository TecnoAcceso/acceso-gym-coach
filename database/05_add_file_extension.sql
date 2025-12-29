-- Agregar columna file_extension a la tabla progress_photos
ALTER TABLE progress_photos
ADD COLUMN IF NOT EXISTS file_extension TEXT;

-- NO actualizar fotos existentes, dejar NULL para que el código pruebe ambas extensiones
