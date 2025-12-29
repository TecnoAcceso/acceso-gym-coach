import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useNutritionPlans } from '@/hooks/useNutritionPlans'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Target,
  UtensilsCrossed,
  ChevronDown
} from 'lucide-react'
import { CgCopy } from 'react-icons/cg'
import type { NutritionPlanTemplateWithMeals, DayOfWeek } from '@/types/nutrition'
import { nutritionGoalLabels, mealTimeLabels, dayOfWeekFullLabels, daysOfWeek } from '@/types/nutrition'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ViewNutritionPlan() {
  const navigate = useNavigate()
  const { planId } = useParams()
  const { fetchPlanById, deletePlanTemplate } = useNutritionPlans()

  const [plan, setPlan] = useState<NutritionPlanTemplateWithMeals | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState<DayOfWeek>('lunes')
  const [dayMenuOpen, setDayMenuOpen] = useState(false)

  // Helper para formatear hora de 24h a 12h con AM/PM
  const formatTime = (time24: string) => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'p.m.' : 'a.m.'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  useEffect(() => {
    if (planId) {
      loadPlan()
    }
  }, [planId])

  const loadPlan = async () => {
    if (!planId) return

    setLoading(true)
    try {
      const data = await fetchPlanById(planId)
      setPlan(data)
    } catch (error) {
      console.error('Error loading plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!planId || !window.confirm('¿Estás seguro de eliminar este plan?')) return

    try {
      await deletePlanTemplate(planId)
      navigate('/nutrition-plans')
    } catch (error) {
      console.error('Error deleting plan:', error)
    }
  }

  const handleDuplicate = () => {
    // Navegar a la página de nuevo plan con el ID del plan a duplicar
    navigate(`/nutrition-plans/new?duplicateFrom=${planId}`)
  }

  // Filter meals by active day
  const mealsInActiveDay = useMemo(() => {
    if (!plan) return []
    return plan.meals
      .filter(meal => meal.day_of_week === activeDay)
      .sort((a, b) => a.order_index - b.order_index)
  }, [plan, activeDay])

  const getGoalColor = (goal?: string) => {
    switch (goal) {
      case 'volumen':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
      case 'definicion':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-400'
      case 'perdida_peso':
        return 'bg-red-500/20 border-red-500/30 text-red-400'
      default:
        return 'bg-accent-primary/20 border-accent-primary/30 text-accent-primary'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!plan) {
    return (
      <div className="pb-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Plan no encontrado</p>
          <motion.button
            onClick={() => navigate('/nutrition-plans')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-xl shadow-lg shadow-accent-primary/30"
          >
            Volver a Planes
          </motion.button>
        </div>
      </div>
    )
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
          <h1 className="text-xl font-semibold text-white">{plan.name}</h1>
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Plan Info Card */}
        <div className="glass-card p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-2xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Información del Plan</h2>
                <p className="text-slate-400 text-sm">Resumen nutricional</p>
              </div>
            </div>

            {plan.goal && (
              <span className={`inline-block px-4 py-2 rounded-xl text-sm font-medium border ${getGoalColor(plan.goal)}`}>
                <Target className="w-4 h-4 inline mr-2" />
                {nutritionGoalLabels[plan.goal]}
              </span>
            )}
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-dark-200/30 rounded-xl border border-white/5 mb-6">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">Calorías Totales</p>
              <p className="text-3xl font-bold text-white">
                {plan.calories || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">kcal</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">Proteína</p>
              <p className="text-3xl font-bold text-blue-400">
                {plan.protein_g || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">gramos</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">Carbohidratos</p>
              <p className="text-3xl font-bold text-orange-400">
                {plan.carbs_g || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">gramos</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">Grasas</p>
              <p className="text-3xl font-bold text-yellow-400">
                {plan.fats_g || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">gramos</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              onClick={() => navigate(`/nutrition-plans/${planId}/edit`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-accent-primary/20 border border-accent-primary/30 text-accent-primary rounded-xl hover:bg-accent-primary/30 transition-all flex-1"
            >
              <Edit className="w-5 h-5" />
              <span className="font-medium">Editar</span>
            </motion.button>

            <motion.button
              onClick={handleDuplicate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center p-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all"
              title="Duplicar"
            >
              <CgCopy className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={handleDelete}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
              title="Eliminar"
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Meals by Day */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Comidas por Día</h2>
            <span className="text-sm text-slate-400">({plan.meals.length} comidas totales)</span>
          </div>

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
                  const mealsCount = plan.meals.filter(m => m.day_of_week === activeDay).length
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
                    const mealsCount = plan.meals.filter(m => m.day_of_week === day).length
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

          {/* Meals for selected day */}
          {mealsInActiveDay.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-slate-400">
                No hay comidas para {dayOfWeekFullLabels[activeDay]}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mealsInActiveDay.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-5 bg-dark-200/30 border border-white/10 rounded-xl hover:border-emerald-500/30 transition-all"
                >
                  {/* Meal Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-emerald-400 font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{formatTime(meal.meal_time_hour)}</h3>
                        <p className="text-sm text-slate-400">{mealTimeLabels[meal.meal_time]}</p>
                      </div>
                    </div>

                    {/* Meal Macros */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Calorías</p>
                        <p className="text-lg font-bold text-white">{meal.calories}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">P</p>
                        <p className="text-lg font-bold text-blue-400">{meal.protein_g}g</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">C</p>
                        <p className="text-lg font-bold text-orange-400">{meal.carbs_g}g</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">G</p>
                        <p className="text-lg font-bold text-yellow-400">{meal.fats_g}g</p>
                      </div>
                    </div>
                  </div>

                  {/* Foods */}
                  {meal.foods && meal.foods.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Alimentos
                      </p>
                      <div className="grid gap-2">
                        {meal.foods.map((food, foodIndex) => (
                          <div
                            key={foodIndex}
                            className="flex items-center justify-between p-3 bg-dark-100/50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{food.name}</p>
                              <p className="text-xs text-slate-400">{food.quantity}</p>
                            </div>
                            <div className="flex items-center space-x-3 text-xs">
                              {food.protein_g ? (
                                <span className="text-blue-400">{food.protein_g}g P</span>
                              ) : null}
                              {food.carbs_g ? (
                                <span className="text-orange-400">{food.carbs_g}g C</span>
                              ) : null}
                              {food.fats_g ? (
                                <span className="text-yellow-400">{food.fats_g}g G</span>
                              ) : null}
                              {food.calories ? (
                                <span className="text-white font-medium">{food.calories} kcal</span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {meal.notes && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                        Notas
                      </p>
                      <p className="text-sm text-slate-300">{meal.notes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
