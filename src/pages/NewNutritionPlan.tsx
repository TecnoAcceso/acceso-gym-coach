import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useNutritionPlans } from '@/hooks/useNutritionPlans'
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Edit,
  ChevronDown
} from 'lucide-react'
import type {
  NutritionGoal,
  MealTime,
  FoodItem,
  DayOfWeek
} from '@/types/nutrition'
import { nutritionGoalLabels, mealTimeLabels, dayOfWeekFullLabels, daysOfWeek } from '@/types/nutrition'
import LoadingSpinner from '@/components/LoadingSpinner'
import MealFormModal from '@/components/MealFormModal'

interface MealFormData {
  id?: string
  day_of_week: DayOfWeek
  meal_time: MealTime
  meal_time_hour: string
  foods: FoodItem[]
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  notes: string
  order_index: number
}

export default function NewNutritionPlan() {
  const navigate = useNavigate()
  const { planId } = useParams()
  const isEditMode = !!planId

  // Obtener parámetro de duplicación de URL
  const searchParams = new URLSearchParams(window.location.search)
  const duplicateFromId = searchParams.get('duplicateFrom')
  const isDuplicateMode = !!duplicateFromId

  // Helper para formatear hora de 24h a 12h con AM/PM
  const formatTime = (time24: string) => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'p.m.' : 'a.m.'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const {
    fetchPlanById,
    createPlanTemplate,
    updatePlanTemplate,
    createMeal,
    updateMeal,
    deleteMeal
  } = useNutritionPlans()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Plan data
  const [planName, setPlanName] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [planGoal, setPlanGoal] = useState<NutritionGoal | ''>('')
  const [meals, setMeals] = useState<MealFormData[]>([])

  // Tab state for days
  const [activeDay, setActiveDay] = useState<DayOfWeek>('lunes')
  const [dayMenuOpen, setDayMenuOpen] = useState(false)

  // Modal state
  const [mealModalOpen, setMealModalOpen] = useState(false)
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null)

  // Calculate totals in real-time
  const totals = useMemo(() => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein_g: acc.protein_g + (meal.protein_g || 0),
      carbs_g: acc.carbs_g + (meal.carbs_g || 0),
      fats_g: acc.fats_g + (meal.fats_g || 0)
    }), { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 })
  }, [meals])

  // Load plan if editing or duplicating
  useEffect(() => {
    if (isEditMode && planId) {
      loadPlan(planId, false)
    } else if (isDuplicateMode && duplicateFromId) {
      loadPlan(duplicateFromId, true)
    }
  }, [isEditMode, planId, isDuplicateMode, duplicateFromId])

  const loadPlan = async (id: string, isDuplicate: boolean) => {
    if (!id) return

    setLoading(true)
    try {
      const plan = await fetchPlanById(id)
      if (plan) {
        // Si es duplicado, agregar " - Copia" al nombre
        setPlanName(isDuplicate ? `${plan.name} - Copia` : plan.name)
        setPlanDescription(plan.description || '')
        setPlanGoal(plan.goal || '')

        // Si es duplicado, no incluir los IDs de las comidas
        setMeals(plan.meals.map(meal => ({
          id: isDuplicate ? undefined : meal.id,
          day_of_week: meal.day_of_week,
          meal_time: meal.meal_time,
          meal_time_hour: meal.meal_time_hour,
          foods: meal.foods,
          calories: meal.calories,
          protein_g: meal.protein_g,
          carbs_g: meal.carbs_g,
          fats_g: meal.fats_g,
          notes: meal.notes || '',
          order_index: meal.order_index
        })))
      }
    } catch (error) {
      console.error('Error loading plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMeal = () => {
    setEditingMealIndex(null)
    setMealModalOpen(true)
  }

  const editMeal = (index: number) => {
    setEditingMealIndex(index)
    setMealModalOpen(true)
  }

  const handleSaveMeal = (mealData: {
    day_of_week: DayOfWeek;
    meal_time: MealTime;
    meal_time_hour: string;
    foods: FoodItem[];
    notes: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fats_g?: number;
  }) => {
    const newMeal: MealFormData = {
      ...mealData,
      calories: mealData.calories || 0,
      protein_g: mealData.protein_g || 0,
      carbs_g: mealData.carbs_g || 0,
      fats_g: mealData.fats_g || 0,
      order_index: editingMealIndex !== null ? meals[editingMealIndex].order_index : meals.length,
      id: editingMealIndex !== null ? meals[editingMealIndex].id : undefined
    }

    if (editingMealIndex !== null) {
      // Edit existing meal
      const updatedMeals = [...meals]
      updatedMeals[editingMealIndex] = newMeal
      setMeals(updatedMeals)
    } else {
      // Add new meal
      setMeals([...meals, newMeal])
    }

    setMealModalOpen(false)
    setEditingMealIndex(null)
  }

  // Obtener los tiempos de comida ya usados en el día activo (excluyendo la comida que se está editando)
  const getUsedMealTimesInDay = (day: DayOfWeek): MealTime[] => {
    return meals
      .filter((meal, index) => {
        // Excluir la comida que se está editando
        if (editingMealIndex !== null && index === editingMealIndex) {
          return false
        }
        // Solo incluir comidas del día especificado
        return meal.day_of_week === day
      })
      .map(meal => meal.meal_time)
  }

  // Filtrar comidas por día activo
  const mealsInActiveDay = useMemo(() => {
    return meals.filter(meal => meal.day_of_week === activeDay)
  }, [meals, activeDay])

  const removeMeal = async (index: number) => {
    const meal = meals[index]

    if (meal.id) {
      // If meal has ID, delete from database
      try {
        await deleteMeal(meal.id)
      } catch (error) {
        console.error('Error deleting meal:', error)
        return
      }
    }

    setMeals(meals.filter((_, i) => i !== index))
  }


  const handleSave = async () => {
    // Validación: Nombre del plan
    if (!planName.trim()) {
      alert('Por favor ingresa un nombre para el plan')
      return
    }

    // Validación: Al menos una comida
    if (meals.length === 0) {
      alert('El plan debe tener al menos una comida. Por favor agrega una comida antes de guardar.')
      return
    }

    // Validación: Cada comida debe tener al menos un alimento
    const mealsWithoutFood = meals.filter(meal => meal.foods.length === 0)
    if (mealsWithoutFood.length > 0) {
      alert('Todas las comidas deben tener al menos un alimento. Por favor revisa tus comidas.')
      return
    }

    setSaving(true)
    try {
      // Los totales ya están calculados en tiempo real con useMemo

      if (isEditMode && planId) {
        // Update existing plan
        await updatePlanTemplate({
          id: planId,
          name: planName,
          description: planDescription || undefined,
          goal: planGoal || undefined,
          ...totals
        })

        // Update or create meals
        for (const meal of meals) {
          if (meal.id) {
            await updateMeal({
              id: meal.id,
              day_of_week: meal.day_of_week,
              meal_time: meal.meal_time,
              meal_time_hour: meal.meal_time_hour,
              foods: meal.foods,
              calories: meal.calories,
              protein_g: meal.protein_g,
              carbs_g: meal.carbs_g,
              fats_g: meal.fats_g,
              notes: meal.notes || undefined,
              order_index: meal.order_index
            })
          } else {
            await createMeal({
              plan_template_id: planId,
              day_of_week: meal.day_of_week,
              meal_time: meal.meal_time,
              meal_time_hour: meal.meal_time_hour,
              foods: meal.foods,
              calories: meal.calories,
              protein_g: meal.protein_g,
              carbs_g: meal.carbs_g,
              fats_g: meal.fats_g,
              notes: meal.notes || undefined,
              order_index: meal.order_index
            })
          }
        }
      } else {
        // Create new plan
        const newPlan = await createPlanTemplate({
          name: planName,
          description: planDescription || undefined,
          goal: planGoal || undefined,
          ...totals
        })

        // Create meals
        for (const meal of meals) {
          await createMeal({
            plan_template_id: newPlan.id,
            day_of_week: meal.day_of_week,
            meal_time: meal.meal_time,
            meal_time_hour: meal.meal_time_hour,
            foods: meal.foods,
            calories: meal.calories,
            protein_g: meal.protein_g,
            carbs_g: meal.carbs_g,
            fats_g: meal.fats_g,
            notes: meal.notes || undefined,
            order_index: meal.order_index
          })
        }
      }

      navigate('/nutrition-plans')
    } catch (error) {
      console.error('Error saving nutrition plan:', error)
      alert('Error al guardar el plan alimenticio')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-dark-300/80 backdrop-blur-lg border-b border-white/10 p-4"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/nutrition-plans')}
            className="p-2 rounded-lg bg-dark-200/50 border border-white/10 text-slate-400 hover:text-accent-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-white">
            {isEditMode ? 'Editar Plan' : 'Nuevo Plan'}
          </h1>
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Plan Info */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Información del Plan</h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre del Plan *
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Ej: Plan Volumen Avanzado"
                className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Descripción
              </label>
              <textarea
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Describe el objetivo y características del plan..."
                rows={3}
                className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all resize-none"
              />
            </div>

            {/* Goal */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Objetivo
              </label>
              <select
                value={planGoal}
                onChange={(e) => setPlanGoal(e.target.value as NutritionGoal)}
                className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
              >
                <option value="">Seleccionar objetivo...</option>
                {Object.entries(nutritionGoalLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Total Macros Summary */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-5 bg-gradient-to-br from-accent-primary/10 via-accent-secondary/5 to-transparent border border-accent-primary/20 rounded-2xl"
          >
            <h3 className="text-sm font-semibold text-accent-primary mb-4 flex items-center">
              <span className="w-2 h-2 bg-accent-primary rounded-full mr-2 animate-pulse"></span>
              Totales Diarios
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Calorías */}
              <div className="bg-dark-200/30 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-slate-400 mb-1.5">Calorías</p>
                <p className="text-3xl font-bold text-white">
                  {totals.calories}
                  <span className="text-sm text-slate-400 font-normal ml-1">kcal</span>
                </p>
              </div>

              {/* Proteína */}
              <div className="bg-dark-200/30 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-slate-400 mb-1.5">Proteína</p>
                <p className="text-3xl font-bold text-blue-400">
                  {totals.protein_g}
                  <span className="text-sm text-slate-400 font-normal ml-1">g</span>
                </p>
              </div>

              {/* Carbohidratos */}
              <div className="bg-dark-200/30 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-slate-400 mb-1.5">Carbohidratos</p>
                <p className="text-3xl font-bold text-orange-400">
                  {totals.carbs_g}
                  <span className="text-sm text-slate-400 font-normal ml-1">g</span>
                </p>
              </div>

              {/* Grasas */}
              <div className="bg-dark-200/30 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-slate-400 mb-1.5">Grasas</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {totals.fats_g}
                  <span className="text-sm text-slate-400 font-normal ml-1">g</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Meals organized by days */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Comidas por Día</h2>

          {/* Day Selector */}
          <div className="mb-6 relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Día de la Semana
            </label>

            {/* Selected Day Button */}
            <motion.button
              onClick={() => setDayMenuOpen(!dayMenuOpen)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full px-4 py-3 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-white">
                  {dayOfWeekFullLabels[activeDay]}
                </span>
                {(() => {
                  const mealsCount = meals.filter(m => m.day_of_week === activeDay).length
                  if (mealsCount > 0) {
                    return (
                      <span className="px-2 py-1 rounded-lg text-xs bg-white/20 text-white font-medium">
                        {mealsCount} {mealsCount === 1 ? 'comida' : 'comidas'}
                      </span>
                    )
                  }
                  return null
                })()}
              </div>
              <ChevronDown className={`w-5 h-5 text-white transition-transform ${dayMenuOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {dayMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-2 bg-dark-200 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >
                  {daysOfWeek.map((day) => {
                    const mealsCount = meals.filter(m => m.day_of_week === day).length
                    const isActive = activeDay === day

                    return (
                      <motion.button
                        key={day}
                        onClick={() => {
                          setActiveDay(day)
                          setDayMenuOpen(false)
                        }}
                        whileHover={{ backgroundColor: 'rgba(124, 58, 237, 0.1)' }}
                        className={`w-full px-4 py-3 flex items-center justify-between border-b border-white/5 last:border-b-0 transition-colors ${
                          isActive ? 'bg-accent-primary/10' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`font-medium ${isActive ? 'text-accent-primary' : 'text-white'}`}>
                            {dayOfWeekFullLabels[day]}
                          </span>
                          {mealsCount > 0 && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              isActive
                                ? 'bg-accent-primary/30 text-accent-primary'
                                : 'bg-white/10 text-slate-400'
                            }`}>
                              {mealsCount}
                            </span>
                          )}
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
                        )}
                      </motion.button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {mealsInActiveDay.map((meal) => {
                const originalIndex = meals.findIndex(m => m === meal)
                return (
                  <motion.div
                    key={originalIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-dark-200/30 border border-white/10 rounded-xl hover:border-accent-primary/30 transition-all"
                  >
                    {/* Header with buttons */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-accent-primary/20 border border-accent-primary/30 text-accent-primary text-xs font-medium rounded">
                          {mealTimeLabels[meal.meal_time]}
                        </span>
                        <h3 className="text-white font-semibold text-sm">{formatTime(meal.meal_time_hour)}</h3>
                      </div>

                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={() => editMeal(originalIndex)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-accent-primary/20 border border-accent-primary/30 text-accent-primary rounded-lg hover:bg-accent-primary/30 transition-all"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>

                        <motion.button
                          onClick={() => removeMeal(originalIndex)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <p className="text-sm text-slate-400 mb-2">
                        {meal.foods.length} alimento{meal.foods.length !== 1 ? 's' : ''}
                      </p>

                      {/* Macros if available */}
                      {(meal.calories > 0 || meal.protein_g > 0 || meal.carbs_g > 0 || meal.fats_g > 0) && (
                        <div className="flex items-center gap-3 mb-2">
                          {meal.calories > 0 && (
                            <span className="text-xs text-white">
                              <span className="font-semibold">{meal.calories}</span> kcal
                            </span>
                          )}
                          {meal.protein_g > 0 && (
                            <span className="text-xs text-blue-400">
                              <span className="font-semibold">{meal.protein_g}g</span> P
                            </span>
                          )}
                          {meal.carbs_g > 0 && (
                            <span className="text-xs text-orange-400">
                              <span className="font-semibold">{meal.carbs_g}g</span> C
                            </span>
                          )}
                          {meal.fats_g > 0 && (
                            <span className="text-xs text-yellow-400">
                              <span className="font-semibold">{meal.fats_g}g</span> G
                            </span>
                          )}
                        </div>
                      )}

                      {meal.foods.length > 0 && (
                        <div className="space-y-1">
                          {meal.foods.slice(0, 3).map((food, idx) => (
                            <p key={idx} className="text-xs text-slate-500">
                              • {food.name} - {food.quantity}
                            </p>
                          ))}
                          {meal.foods.length > 3 && (
                            <p className="text-xs text-slate-500">
                              ... y {meal.foods.length - 3} más
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {mealsInActiveDay.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed className="w-8 h-8 text-accent-primary" />
                </div>
                <p className="text-slate-400 mb-4">
                  No hay comidas para {activeDay === 'sabado' ? 'SÁBADO' : activeDay === 'miercoles' ? 'MIÉRCOLES' : activeDay.toUpperCase()}
                </p>
              </div>
            )}
          </div>

          {/* Botón Agregar Comida - dentro del tab */}
          <div className="mt-4 flex justify-center">
            {(() => {
              const totalMealTimes = 6 // desayuno, snack_am, almuerzo, merienda, cena, post_cena
              const usedMealTimesCount = getUsedMealTimesInDay(activeDay).length
              const canAddMore = usedMealTimesCount < totalMealTimes

              return (
                <motion.button
                  onClick={addMeal}
                  whileHover={canAddMore ? { scale: 1.05 } : {}}
                  whileTap={canAddMore ? { scale: 0.95 } : {}}
                  disabled={!canAddMore}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    canAddMore
                      ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/30 hover:shadow-accent-primary/50'
                      : 'bg-dark-200/50 border border-white/10 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>
                    {canAddMore
                      ? `Agregar Comida (${usedMealTimesCount}/${totalMealTimes})`
                      : `Día Completo (${totalMealTimes}/${totalMealTimes})`}
                  </span>
                </motion.button>
              )
            })()}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-dark-300/80 backdrop-blur-lg border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/nutrition-plans')}
              className="px-6 py-3 bg-dark-200/50 border border-white/10 text-slate-300 rounded-xl hover:bg-dark-200 transition-all"
            >
              Cancelar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold rounded-xl shadow-lg shadow-accent-primary/30 hover:shadow-accent-primary/50 transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Guardando...' : (isEditMode ? 'Actualizar Plan' : 'Guardar Plan')}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Meal Form Modal */}
      <MealFormModal
        isOpen={mealModalOpen}
        onClose={() => {
          setMealModalOpen(false)
          setEditingMealIndex(null)
        }}
        onSave={handleSaveMeal}
        initialData={editingMealIndex !== null ? meals[editingMealIndex] : undefined}
        selectedDay={activeDay}
        usedMealTimesInDay={getUsedMealTimesInDay(activeDay)}
      />
    </div>
  )
}
