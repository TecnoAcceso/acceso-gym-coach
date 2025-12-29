import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { GiWeightLiftingUp } from 'react-icons/gi'
import type { RoutineTemplate, RoutineCategory, RoutineDifficulty } from '@/types/routine'

interface RoutineModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    description?: string
    category?: RoutineCategory
    difficulty?: RoutineDifficulty
    duration_weeks?: number
  }) => Promise<void>
  routine?: RoutineTemplate | null
  mode: 'create' | 'edit'
}

export default function RoutineModal({ isOpen, onClose, onSave, routine, mode }: RoutineModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<RoutineCategory | ''>('')
  const [difficulty, setDifficulty] = useState<RoutineDifficulty | ''>('')
  const [durationWeeks, setDurationWeeks] = useState<number | ''>(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (routine && mode === 'edit') {
      setName(routine.name)
      setDescription(routine.description || '')
      setCategory(routine.category || '')
      setDifficulty(routine.difficulty || '')
      setDurationWeeks(routine.duration_weeks)
    } else {
      // Reset form for create mode
      setName('')
      setDescription('')
      setCategory('')
      setDifficulty('')
      setDurationWeeks(4)
    }
    setError(null)
  }, [routine, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }

    // Asegurar que durationWeeks sea un número válido
    const finalDuration = typeof durationWeeks === 'number' ? durationWeeks : 1

    try {
      setLoading(true)
      setError(null)

      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        difficulty: difficulty || undefined,
        duration_weeks: finalDuration
      })

      onClose()
    } catch (err: any) {
      console.error('Error saving routine:', err)
      setError(err.message || 'Error al guardar la rutina')
    } finally {
      setLoading(false)
    }
  }

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="glass-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
                    <GiWeightLiftingUp className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {mode === 'create' ? 'Nueva Rutina' : 'Editar Rutina'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre de la Rutina *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Rutina de Hipertrofia 12 semanas"
                    className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el objetivo y características de esta rutina..."
                    rows={3}
                    className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all resize-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RoutineCategory | '')}
                    className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="hipertrofia">Hipertrofia</option>
                    <option value="fuerza">Fuerza</option>
                    <option value="resistencia">Resistencia</option>
                    <option value="perdida_peso">Pérdida de Peso</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dificultad
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as RoutineDifficulty | '')}
                    className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                  >
                    <option value="">Seleccionar dificultad</option>
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duración (semanas)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    max="52"
                    value={durationWeeks}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setDurationWeeks('' as any)
                      } else if (/^\d+$/.test(value)) {
                        const numValue = parseInt(value)
                        if (numValue > 0 && numValue <= 52) {
                          setDurationWeeks(numValue)
                        }
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        setDurationWeeks(1)
                      }
                    }}
                    className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                  />
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <motion.button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{mode === 'create' ? 'Crear Rutina' : 'Guardar Cambios'}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
