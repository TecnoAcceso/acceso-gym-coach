-- Migration: Add day_of_week to plan_meals table
-- Date: 2025-12-27
-- Description: Add day of week field to organize meals by days (Monday to Sunday)

-- Add day_of_week column to plan_meals table
ALTER TABLE plan_meals
ADD COLUMN day_of_week TEXT NOT NULL DEFAULT 'lunes';

-- Add check constraint to ensure valid day values
ALTER TABLE plan_meals
ADD CONSTRAINT valid_day_of_week
CHECK (day_of_week IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'));

-- Create index for better query performance
CREATE INDEX idx_plan_meals_day_of_week ON plan_meals(day_of_week);

-- Create composite index for day_of_week and meal_time (to prevent duplicates per day)
CREATE INDEX idx_plan_meals_day_meal ON plan_meals(plan_template_id, day_of_week, meal_time);

-- Add comment to column
COMMENT ON COLUMN plan_meals.day_of_week IS 'Día de la semana para esta comida (lunes a domingo)';
