-- Migración: Cambiar meal_name por meal_time_hour y post_entreno por post_cena
-- Fecha: 2024-12-26

-- 1. Agregar columna meal_time_hour
ALTER TABLE plan_meals
ADD COLUMN meal_time_hour TEXT;

-- 2. Migrar datos existentes: copiar meal_name a meal_time_hour
UPDATE plan_meals
SET meal_time_hour = COALESCE(meal_name, '12:00');

-- 3. Eliminar columna meal_name
ALTER TABLE plan_meals
DROP COLUMN meal_name;

-- 4. Actualizar valores de meal_time de 'post_entreno' a 'post_cena'
UPDATE plan_meals
SET meal_time = 'post_cena'
WHERE meal_time = 'post_entreno';

-- 5. Hacer meal_time_hour NOT NULL después de la migración
-- Nota: En SQLite no se puede agregar NOT NULL directamente, se debe recrear la tabla
-- Por ahora dejamos que acepte NULL para compatibilidad con datos existentes
