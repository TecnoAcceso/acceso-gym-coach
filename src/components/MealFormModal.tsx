import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Save, Edit } from 'lucide-react'
import type { MealTime, DayOfWeek } from '@/types/nutrition'
import { mealTimeLabels, dayOfWeekFullLabels } from '@/types/nutrition'
import FoodItemModal from './FoodItemModal'

interface FoodItem {
  name: string
  quantity: string
}

interface MealFormData {
  day_of_week: DayOfWeek
  meal_time: MealTime
  meal_time_hour: string
  foods: FoodItem[]
  notes: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fats_g?: number
}

interface MealFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (meal: MealFormData) => void
  initialData?: MealFormData
  selectedDay?: DayOfWeek // Día actualmente seleccionado en el tab
  usedMealTimesInDay?: MealTime[] // Tiempos de comida ya usados en este día
}

export default function MealFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  selectedDay = 'lunes',
  usedMealTimesInDay = []
}: MealFormModalProps) {
  // Helper function to get first available meal time
  const getFirstAvailableMealTime = (): MealTime => {
    const allMealTimes: MealTime[] = ['desayuno', 'snack_am', 'almuerzo', 'merienda', 'cena', 'post_entreno']
    const availableTimes = allMealTimes.filter(time => !usedMealTimesInDay.includes(time))
    return availableTimes.length > 0 ? availableTimes[0] : 'desayuno'
  }

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('lunes')
  const [mealTime, setMealTime] = useState<MealTime>('desayuno')
  const [mealTimeHour, setMealTimeHour] = useState('')
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [notes, setNotes] = useState('')

  // Macros (optional)
  const [calories, setCalories] = useState<string>('')
  const [proteinG, setProteinG] = useState<string>('')
  const [carbsG, setCarbsG] = useState<string>('')
  const [fatsG, setFatsG] = useState<string>('')

  // Food modal state
  const [foodModalOpen, setFoodModalOpen] = useState(false)
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && initialData) {
      // Modo edición - cargar datos existentes
      setDayOfWeek(initialData.day_of_week)
      setMealTime(initialData.meal_time)
      setMealTimeHour(initialData.meal_time_hour || '')
      setFoods(initialData.foods)
      setNotes(initialData.notes)
      setCalories(initialData.calories && initialData.calories > 0 ? initialData.calories.toString() : '')
      setProteinG(initialData.protein_g && initialData.protein_g > 0 ? initialData.protein_g.toString() : '')
      setCarbsG(initialData.carbs_g && initialData.carbs_g > 0 ? initialData.carbs_g.toString() : '')
      setFatsG(initialData.fats_g && initialData.fats_g > 0 ? initialData.fats_g.toString() : '')
    } else if (isOpen) {
      // Modo agregar - reset form con día seleccionado y primer tiempo disponible
      setDayOfWeek(selectedDay)
      setMealTime(getFirstAvailableMealTime())
      setMealTimeHour('')
      setFoods([])
      setNotes('')
      setCalories('')
      setProteinG('')
      setCarbsG('')
      setFatsG('')
    }
  }, [isOpen, initialData, selectedDay, usedMealTimesInDay])

  const addFood = () => {
    setEditingFoodIndex(null)
    setFoodModalOpen(true)
  }

  const editFood = (index: number) => {
    setEditingFoodIndex(index)
    setFoodModalOpen(true)
  }

  const handleSaveFood = (food: FoodItem) => {
    if (editingFoodIndex !== null) {
      // Edit existing food
      const updatedFoods = [...foods]
      updatedFoods[editingFoodIndex] = food
      setFoods(updatedFoods)
    } else {
      // Add new food
      setFoods([...foods, food])
    }
    setFoodModalOpen(false)
    setEditingFoodIndex(null)
  }

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!mealTimeHour.trim()) {
      // TODO: Usar modal de confirmación en lugar de alert
      alert('Por favor ingresa la hora de la comida')
      return
    }

    onSave({
      day_of_week: dayOfWeek,
      meal_time: mealTime,
      meal_time_hour: mealTimeHour,
      foods,
      notes,
      calories: calories ? parseInt(calories) : 0,
      protein_g: proteinG ? parseInt(proteinG) : 0,
      carbs_g: carbsG ? parseInt(carbsG) : 0,
      fats_g: fatsG ? parseInt(fatsG) : 0
    })

    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
            <div className="glass-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {initialData ? 'Editar Comida' : 'Agregar Comida'}
                  </h2>
                  <p className="text-sm text-slate-400">Configura los detalles de la comida</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Day of Week - Display Only */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Día de la Semana
                  </label>
                  <div className="w-full px-4 py-3 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30 rounded-xl">
                    <p className="text-xl font-bold text-white text-center">
                      {dayOfWeekFullLabels[dayOfWeek]}
                    </p>
                  </div>
                </div>

                {/* Meal Time & Hour */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tiempo de Comida *
                    </label>
                    <select
                      value={mealTime}
                      onChange={(e) => setMealTime(e.target.value as MealTime)}
                      className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                    >
                      {Object.entries(mealTimeLabels).map(([key, label]) => {
                        // Si estamos editando, mostrar la opción actual aunque esté en uso
                        const isCurrentMeal = initialData?.meal_time === key
                        const isUsed = usedMealTimesInDay.includes(key as MealTime)

                        // Solo ocultar si está en uso y NO es la comida actual
                        if (isUsed && !isCurrentMeal) {
                          return null
                        }

                        return <option key={key} value={key}>{label}</option>
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Hora *
                    </label>
                    <input
                      type="time"
                      value={mealTimeHour}
                      onChange={(e) => setMealTimeHour(e.target.value)}
                      className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                    />
                  </div>
                </div>

                {/* Foods Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-slate-300">
                      Alimentos
                    </label>
                    <motion.button
                      onClick={addFood}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-accent-primary/20 border border-accent-primary/30 text-accent-primary text-sm font-medium rounded-lg hover:bg-accent-primary/30 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Alimento</span>
                    </motion.button>
                  </div>

                  {foods.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                      <p className="text-slate-400 text-sm mb-3">No hay alimentos agregados</p>
                      <motion.button
                        onClick={addFood}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-accent-primary/20 border border-accent-primary/30 text-accent-primary text-sm font-medium rounded-lg hover:bg-accent-primary/30 transition-all"
                      >
                        Agregar Primer Alimento
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {foods.map((food, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 p-3 bg-dark-200/30 border border-white/10 rounded-xl hover:border-accent-primary/30 transition-all"
                        >
                          {/* Food Name - 80% */}
                          <div className="flex-[0.8] min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {food.name}
                            </p>
                          </div>

                          {/* Quantity - 20% */}
                          <div className="flex-[0.2] min-w-0">
                            <p className="text-slate-400 text-sm text-right truncate">
                              {food.quantity}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <motion.button
                              onClick={() => editFood(index)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1.5 bg-accent-primary/20 border border-accent-primary/30 text-accent-primary rounded-lg hover:bg-accent-primary/30 transition-all"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </motion.button>

                            <motion.button
                              onClick={() => removeFood(index)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Macros (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Macronutrientes (Opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Calories */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">
                        Calorías
                      </label>
                      <input
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2.5 bg-dark-200/50 border border-white/10 rounded-lg text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                      />
                    </div>

                    {/* Protein */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">
                        Proteína (g)
                      </label>
                      <input
                        type="number"
                        value={proteinG}
                        onChange={(e) => setProteinG(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2.5 bg-dark-200/50 border border-white/10 rounded-lg text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                      />
                    </div>

                    {/* Carbs */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">
                        Carbohidratos (g)
                      </label>
                      <input
                        type="number"
                        value={carbsG}
                        onChange={(e) => setCarbsG(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2.5 bg-dark-200/50 border border-white/10 rounded-lg text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                      />
                    </div>

                    {/* Fats */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">
                        Grasas (g)
                      </label>
                      <input
                        type="number"
                        value={fatsG}
                        onChange={(e) => setFatsG(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2.5 bg-dark-200/50 border border-white/10 rounded-lg text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instrucciones especiales, sustituciones permitidas, etc..."
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/10">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-dark-200/50 border border-white/10 text-slate-300 rounded-lg hover:bg-dark-200 transition-all"
                >
                  Cancelar
                </motion.button>

                <motion.button
                  onClick={handleSave}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg shadow-lg shadow-accent-primary/30 hover:shadow-accent-primary/50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Comida</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
        )}
      </AnimatePresence>

      {/* Food Item Modal */}
      <FoodItemModal
        isOpen={foodModalOpen}
        onClose={() => {
          setFoodModalOpen(false)
          setEditingFoodIndex(null)
        }}
        onSave={handleSaveFood}
        initialData={editingFoodIndex !== null ? foods[editingFoodIndex] : undefined}
      />
    </>
  )
}
