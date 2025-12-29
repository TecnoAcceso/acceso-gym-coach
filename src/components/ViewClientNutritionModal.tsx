import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Trash2, Target, ChevronDown } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { TbClockHour4 } from 'react-icons/tb'
import type { Client } from '@/types/client'
import type { ClientNutritionPlan, NutritionPlanTemplateWithMeals, DayOfWeek } from '@/types/nutrition'
import { nutritionGoalLabels, mealTimeLabels, dayOfWeekFullLabels, daysOfWeek } from '@/types/nutrition'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { generateNutritionPlanPDF, sendNutritionPlanPDFViaWhatsApp } from '@/utils/generateNutritionPlanPDF'
import LoadingSpinner from './LoadingSpinner'
import Toast, { ToastType } from './Toast'
import ConfirmModal from './ConfirmModal'

interface ViewClientNutritionModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
  clientPlans: ClientNutritionPlan[]
  onFetchTemplate: (templateId: string) => Promise<NutritionPlanTemplateWithMeals | null>
  onUnassign: (planId: string) => Promise<void>
  trainerName: string
}

export default function ViewClientNutritionModal({
  isOpen,
  onClose,
  client,
  clientPlans,
  onFetchTemplate,
  onUnassign,
  trainerName
}: ViewClientNutritionModalProps) {
  const [loading, setLoading] = useState(true)
  const [planDetails, setPlanDetails] = useState<{
    clientPlan: ClientNutritionPlan
    template: NutritionPlanTemplateWithMeals
  } | null>(null)
  const [unassigning, setUnassigning] = useState(false)
  const [sendingPDF, setSendingPDF] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: ToastType
  }>({ show: false, message: '', type: 'success' })
  const [confirmUnassign, setConfirmUnassign] = useState(false)
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
    if (isOpen && clientPlans.length > 0) {
      loadPlanDetails()
    }
  }, [isOpen, clientPlans])

  const loadPlanDetails = async () => {
    setLoading(true)
    try {
      // Obtener el plan activo o el más reciente
      const activePlan = clientPlans.find(p => p.status === 'active') || clientPlans[0]

      if (activePlan) {
        const template = await onFetchTemplate(activePlan.plan_template_id)
        if (template) {
          setPlanDetails({
            clientPlan: activePlan,
            template
          })
        }
      }
    } catch (err) {
      console.error('Error loading plan details:', err)
      setToast({
        show: true,
        message: 'Error al cargar los detalles del plan',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return format(localDate, 'dd MMM yyyy', { locale: es })
  }

  // Filter meals by active day
  const mealsInActiveDay = useMemo(() => {
    if (!planDetails?.template.meals) return []
    return planDetails.template.meals
      .filter(meal => meal.day_of_week === activeDay)
      .sort((a, b) => a.order_index - b.order_index)
  }, [planDetails, activeDay])

  const handleSendWhatsApp = async () => {
    if (!planDetails) return

    setSendingPDF(true)
    try {
      const pdfBlob = await generateNutritionPlanPDF({
        plan: planDetails.template,
        clientName: client.full_name,
        trainerName: trainerName,
        startDate: formatDate(planDetails.clientPlan.start_date),
        endDate: formatDate(planDetails.clientPlan.end_date),
        notes: planDetails.clientPlan.notes
      })

      sendNutritionPlanPDFViaWhatsApp(
        pdfBlob,
        client.phone,
        client.full_name,
        planDetails.template.name,
        trainerName
      )

      setToast({
        show: true,
        message: 'PDF generado y listo para enviar por WhatsApp',
        type: 'success'
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      setToast({
        show: true,
        message: 'Error al generar el PDF',
        type: 'error'
      })
    } finally {
      setSendingPDF(false)
    }
  }

  const handleUnassign = async () => {
    if (!planDetails) return

    setUnassigning(true)
    try {
      await onUnassign(planDetails.clientPlan.id)
      setConfirmUnassign(false)
      onClose()
    } catch (error) {
      console.error('Error unassigning plan:', error)
      setToast({
        show: true,
        message: 'Error al desasignar el plan',
        type: 'error'
      })
    } finally {
      setUnassigning(false)
    }
  }

  const getGoalColor = (goal?: string) => {
    switch (goal) {
      case 'volumen':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
      case 'definicion':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-400'
      case 'perdida_peso':
        return 'bg-red-500/20 border-red-500/30 text-red-400'
      default:
        return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-dark-300 rounded-2xl shadow-2xl z-50 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10">
              <div>
                <h2 className="text-xl font-bold text-white">Plan Nutricional</h2>
                <p className="text-sm text-slate-400">{client.full_name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : !planDetails ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">No se encontró información del plan</p>
                </div>
              ) : (
                <>
                  {/* Plan Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{planDetails.template.name}</h3>
                      {planDetails.template.description && (
                        <p className="text-sm text-slate-400">{planDetails.template.description}</p>
                      )}
                    </div>
                    {planDetails.template.goal && (
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${getGoalColor(planDetails.template.goal)}`}>
                        <Target className="w-3.5 h-3.5 mr-1.5" />
                        {nutritionGoalLabels[planDetails.template.goal]}
                      </span>
                    )}
                  </div>

                  {/* Macros Grid */}
                  <div className="grid grid-cols-4 gap-3 p-4 bg-dark-200/50 rounded-xl border border-white/10">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Calorías</p>
                      <p className="text-2xl font-bold text-white">{planDetails.template.calories || 0}</p>
                      <p className="text-xs text-slate-500">kcal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Proteína</p>
                      <p className="text-2xl font-bold text-blue-400">{planDetails.template.protein_g || 0}g</p>
                      <p className="text-xs text-slate-500">P</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Carbos</p>
                      <p className="text-2xl font-bold text-orange-400">{planDetails.template.carbs_g || 0}g</p>
                      <p className="text-xs text-slate-500">C</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Grasas</p>
                      <p className="text-2xl font-bold text-yellow-400">{planDetails.template.fats_g || 0}g</p>
                      <p className="text-xs text-slate-500">G</p>
                    </div>
                  </div>

                  {/* Assignment Info */}
                  <div className="flex items-center gap-4 p-3 bg-dark-200/30 rounded-lg border border-white/5 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs text-slate-400">Inicio: </span>
                        <span className="font-medium">{formatDate(planDetails.clientPlan.start_date)}</span>
                      </div>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-red-400" />
                      <div>
                        <span className="text-xs text-slate-400">Fin: </span>
                        <span className="font-medium">{formatDate(planDetails.clientPlan.end_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {planDetails.clientPlan.notes && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                        Notas del Coach
                      </p>
                      <p className="text-sm text-slate-300">{planDetails.clientPlan.notes}</p>
                    </div>
                  )}

                  {/* Meals Section */}
                  {planDetails.template.meals && planDetails.template.meals.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TbClockHour4 className="w-5 h-5 text-accent-primary" />
                        <h3 className="text-lg font-bold text-white">Comidas por Día</h3>
                        <span className="text-xs text-slate-400 bg-dark-200/50 px-2 py-0.5 rounded-full">
                          {planDetails.template.meals.length} comidas totales
                        </span>
                      </div>

                      {/* Day Selector */}
                      <div className="mb-4 relative">
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
                              const mealsCount = planDetails.template.meals.filter(m => m.day_of_week === activeDay).length
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
                                const mealsCount = planDetails.template.meals.filter(m => m.day_of_week === day).length
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
                          <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TbClockHour4 className="w-8 h-8 text-accent-primary" />
                          </div>
                          <p className="text-slate-400">
                            No hay comidas para {dayOfWeekFullLabels[activeDay]}
                          </p>
                        </div>
                      ) : (
                        mealsInActiveDay.map((meal, index) => (
                          <div
                            key={meal.id}
                            className="p-4 bg-dark-200/40 border border-white/10 rounded-xl hover:border-accent-primary/30 transition-all"
                          >
                            {/* Meal Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-sm font-bold">{index + 1}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-accent-primary bg-accent-primary/10 px-2 py-1 rounded border border-accent-primary/20">
                                      {mealTimeLabels[meal.meal_time]}
                                    </span>
                                    <span className="text-white font-bold text-base">{formatTime(meal.meal_time_hour)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-white font-semibold">{meal.calories} kcal</span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-blue-400">P:{meal.protein_g}g</span>
                                    <span className="text-orange-400">C:{meal.carbs_g}g</span>
                                    <span className="text-yellow-400">G:{meal.fats_g}g</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Foods */}
                            {meal.foods && meal.foods.length > 0 && (
                              <div className="space-y-2 ml-11">
                                {meal.foods.map((food, foodIndex) => (
                                  <div key={foodIndex} className="flex items-start justify-between py-1.5">
                                    <div className="flex-1">
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-white font-medium text-sm">{food.name}</span>
                                        <span className="text-slate-400 text-xs">{food.quantity}</span>
                                      </div>
                                    </div>
                                    {(food.calories || food.protein_g || food.carbs_g || food.fats_g) && (
                                      <div className="flex items-center gap-1.5 text-xs ml-2">
                                        {food.calories && <span className="text-slate-400">{food.calories}kcal</span>}
                                        {food.protein_g && <span className="text-blue-400">P:{food.protein_g}g</span>}
                                        {food.carbs_g && <span className="text-orange-400">C:{food.carbs_g}g</span>}
                                        {food.fats_g && <span className="text-yellow-400">G:{food.fats_g}g</span>}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Meal Notes */}
                            {meal.notes && (
                              <div className="ml-11 mt-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-xs text-slate-300">
                                  <span className="text-blue-400 font-semibold">Nota: </span>
                                  {meal.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!loading && planDetails && (
              <div className="flex items-center justify-between gap-2 p-4 border-t border-white/10">
                <motion.button
                  type="button"
                  onClick={() => setConfirmUnassign(true)}
                  disabled={unassigning}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                >
                  {unassigning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      <span className="hidden sm:inline">Desasignando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Desasignar</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleSendWhatsApp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={sendingPDF || !client.phone}
                  className="px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/30 transition-all duration-300 flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <FaWhatsapp className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Confirm Unassign Modal */}
          <ConfirmModal
            isOpen={confirmUnassign}
            onClose={() => setConfirmUnassign(false)}
            onConfirm={handleUnassign}
            title="Desasignar Plan Nutricional"
            message={`¿Estás seguro de que deseas desasignar el plan "${planDetails?.template.name}" de ${client.full_name}?`}
            confirmText="Desasignar"
            cancelText="Cancelar"
            type="danger"
          />

          {/* Toast Notification */}
          <Toast
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        </>
      )}
    </AnimatePresence>
  )
}
