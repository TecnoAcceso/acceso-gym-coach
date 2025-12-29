// Types para el sistema de rutinas de entrenamiento

export type RoutineCategory = 'hipertrofia' | 'fuerza' | 'resistencia' | 'perdida_peso' | 'otro'
export type RoutineDifficulty = 'principiante' | 'intermedio' | 'avanzado'
export type ClientRoutineStatus = 'active' | 'completed' | 'paused'

// Plantilla de rutina
export interface RoutineTemplate {
  id: string
  trainer_id: string
  name: string
  description: string | null
  category: RoutineCategory | null
  difficulty: RoutineDifficulty | null
  duration_weeks: number
  created_at: string
  updated_at: string
  exercise_count?: number
}

// Ejercicio de la rutina
export interface RoutineExercise {
  id: string
  routine_template_id: string
  day_number: number
  day_name: string
  exercise_name: string
  sets: number
  reps: string
  rest_seconds: number
  notes: string | null
  exercise_photo_url: string | null
  order_index: number
  created_at: string
}

// Rutina asignada a cliente
export interface ClientRoutine {
  id: string
  client_id: string
  routine_template_id: string
  assigned_date: string
  start_date: string
  end_date: string
  status: ClientRoutineStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// Datos para crear plantilla de rutina
export interface CreateRoutineTemplateData {
  name: string
  description?: string
  category?: RoutineCategory
  difficulty?: RoutineDifficulty
  duration_weeks?: number
}

// Datos para actualizar plantilla de rutina
export interface UpdateRoutineTemplateData {
  name?: string
  description?: string
  category?: RoutineCategory
  difficulty?: RoutineDifficulty
  duration_weeks?: number
}

// Datos para crear ejercicio
export interface CreateExerciseData {
  routine_template_id: string
  day_number: number
  day_name: string
  exercise_name: string
  sets: number
  reps: string
  rest_seconds?: number
  notes?: string
  exercise_photo_url?: string
  order_index?: number
}

// Datos para actualizar ejercicio
export interface UpdateExerciseData {
  day_number?: number
  day_name?: string
  exercise_name?: string
  sets?: number
  reps?: string
  rest_seconds?: number
  notes?: string
  exercise_photo_url?: string
  order_index?: number
}

// Datos para asignar rutina a cliente
export interface AssignRoutineData {
  client_id: string
  routine_template_id: string
  start_date: string
  end_date: string
  notes?: string
}

// Rutina completa con ejercicios
export interface RoutineTemplateWithExercises extends RoutineTemplate {
  exercises: RoutineExercise[]
}

// Día de rutina agrupado
export interface RoutineDay {
  day_number: number
  day_name: string
  exercises: RoutineExercise[]
}
