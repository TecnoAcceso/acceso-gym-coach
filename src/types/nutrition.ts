// Types para gestión de planes alimenticios

export interface FoodItem {
  name: string
  quantity: string
  protein_g?: number
  carbs_g?: number
  fats_g?: number
  calories?: number
}

export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
export type MealTime = 'desayuno' | 'snack_am' | 'almuerzo' | 'merienda' | 'cena' | 'post_entreno'
export type NutritionGoal = 'volumen' | 'definicion' | 'mantenimiento' | 'perdida_peso'
export type PlanStatus = 'active' | 'completed' | 'paused'

export interface PlanMeal {
  id: string
  plan_template_id: string
  day_of_week: DayOfWeek
  meal_time: MealTime
  meal_time_hour: string
  foods: FoodItem[]
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  notes?: string
  order_index: number
  created_at: string
}

export interface NutritionPlanTemplate {
  id: string
  trainer_id: string
  name: string
  description?: string
  goal?: NutritionGoal
  calories?: number
  protein_g?: number
  carbs_g?: number
  fats_g?: number
  created_at: string
  updated_at: string
}

export interface NutritionPlanTemplateWithMeals extends NutritionPlanTemplate {
  meals: PlanMeal[]
}

export interface ClientNutritionPlan {
  id: string
  client_id: string
  plan_template_id: string
  assigned_date: string
  start_date: string
  end_date: string
  status: PlanStatus
  notes?: string
  created_at: string
  updated_at: string
}

// DTOs para crear/actualizar

export interface CreateNutritionPlanData {
  name: string
  description?: string
  goal?: NutritionGoal
  calories?: number
  protein_g?: number
  carbs_g?: number
  fats_g?: number
}

export interface UpdateNutritionPlanData extends Partial<CreateNutritionPlanData> {
  id: string
}

export interface CreateMealData {
  plan_template_id: string
  day_of_week: DayOfWeek
  meal_time: MealTime
  meal_time_hour: string
  foods?: FoodItem[]
  calories?: number
  protein_g?: number
  carbs_g?: number
  fats_g?: number
  notes?: string
  order_index?: number
}

export interface UpdateMealData extends Partial<CreateMealData> {
  id: string
}

export interface AssignNutritionPlanData {
  client_id: string
  plan_template_id: string
  start_date: string
  end_date: string
  notes?: string
}

export interface UpdateClientNutritionPlanData {
  id: string
  start_date?: string
  end_date?: string
  status?: PlanStatus
  notes?: string
}

// Labels para UI
export const daysOfWeek: DayOfWeek[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo'
]

export const dayOfWeekLabels: Record<DayOfWeek, string> = {
  lunes: 'LUN',
  martes: 'MAR',
  miercoles: 'MIÉ',
  jueves: 'JUE',
  viernes: 'VIE',
  sabado: 'SÁB',
  domingo: 'DOM'
}

export const dayOfWeekFullLabels: Record<DayOfWeek, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo'
}

export const mealTimeLabels: Record<MealTime, string> = {
  desayuno: 'Desayuno',
  snack_am: 'Snack AM',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  post_entreno: 'Post-Cena'
}

export const nutritionGoalLabels: Record<NutritionGoal, string> = {
  volumen: 'Volumen Muscular',
  definicion: 'Definición',
  mantenimiento: 'Mantenimiento',
  perdida_peso: 'Pérdida de Peso'
}

export const planStatusLabels: Record<PlanStatus, string> = {
  active: 'Activo',
  completed: 'Completado',
  paused: 'Pausado'
}
