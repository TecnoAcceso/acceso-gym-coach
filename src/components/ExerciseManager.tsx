import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit, Trash2, Camera, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { GiWeightLiftingUp } from 'react-icons/gi'
import { MdAddCircleOutline } from 'react-icons/md'
import { useRoutines } from '@/hooks/useRoutines'
import ConfirmDialog from '@/components/ConfirmDialog'
import type { RoutineExercise, RoutineDay } from '@/types/routine'

interface ExerciseManagerProps {
  isOpen: boolean
  onClose: () => void
  routineId: string
  routineName: string
}

export default function ExerciseManager({ isOpen, onClose, routineId, routineName }: ExerciseManagerProps) {
  const {
    fetchTemplateById,
    createExercise,
    updateExercise,
    deleteExercise,
    uploadExercisePhoto,
    deleteExercisePhoto
  } = useRoutines()

  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]))
  const [editingExercise, setEditingExercise] = useState<RoutineExercise | null>(null)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)

  // Form states
  const [exerciseName, setExerciseName] = useState('')
  const [sets, setSets] = useState<number | ''>(3)
  const [reps, setReps] = useState('10')
  const [restSeconds, setRestSeconds] = useState<number | ''>(60)
  const [notes, setNotes] = useState('')
  const [dayNumber, setDayNumber] = useState(1)
  const [dayName, setDayName] = useState('Día 1')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    exercise: RoutineExercise | null
  }>({ isOpen: false, exercise: null })

  useEffect(() => {
    if (isOpen) {
      loadExercises()
    }
  }, [isOpen, routineId])

  const loadExercises = async () => {
    try {
      setLoading(true)
      setError(null)
      const template = await fetchTemplateById(routineId)
      if (template) {
        setExercises(template.exercises)
      }
    } catch (err: any) {
      console.error('Error loading exercises:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const groupExercisesByDay = (): RoutineDay[] => {
    const grouped = exercises.reduce((acc, exercise) => {
      const existing = acc.find(d => d.day_number === exercise.day_number)
      if (existing) {
        existing.exercises.push(exercise)
      } else {
        acc.push({
          day_number: exercise.day_number,
          day_name: exercise.day_name,
          exercises: [exercise]
        })
      }
      return acc
    }, [] as RoutineDay[])

    return grouped.sort((a, b) => a.day_number - b.day_number)
  }

  const toggleDay = (dayNumber: number) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber)
    } else {
      newExpanded.add(dayNumber)
    }
    setExpandedDays(newExpanded)
  }

  const resetForm = () => {
    setExerciseName('')
    setSets(3)
    setReps('10')
    setRestSeconds(60)
    setNotes('')
    setDayNumber(1)
    setDayName('Día 1')
    setPhotoFile(null)
    setPhotoPreview(null)
    setEditingExercise(null)
    setIsAddingExercise(false)
  }

  const handleAddNew = () => {
    resetForm()
    setIsAddingExercise(true)
  }

  const handleEdit = (exercise: RoutineExercise) => {
    setExerciseName(exercise.exercise_name)
    setSets(exercise.sets)
    setReps(exercise.reps)
    setRestSeconds(exercise.rest_seconds)
    setNotes(exercise.notes || '')
    setDayNumber(exercise.day_number)
    setDayName(exercise.day_name)
    setPhotoPreview(exercise.exercise_photo_url)
    setPhotoFile(null)
    setEditingExercise(exercise)
    setIsAddingExercise(true)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('La foto debe ser menor a 3MB')
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handleSaveExercise = async () => {
    if (!exerciseName.trim()) {
      setError('El nombre del ejercicio es requerido')
      return
    }

    try {
      setLoading(true)
      setError(null)

      let photoUrl = photoPreview

      // Upload photo if a new file was selected
      if (photoFile) {
        setUploadingPhoto(true)
        const tempId = editingExercise?.id || `temp-${Date.now()}`
        photoUrl = await uploadExercisePhoto(photoFile, tempId)
        setUploadingPhoto(false)
      }

      // Asegurar que sets y restSeconds sean números válidos
      const finalSets = typeof sets === 'number' ? sets : 1
      const finalRestSeconds = typeof restSeconds === 'number' ? restSeconds : 0

      const exerciseData = {
        routine_template_id: routineId,
        day_number: dayNumber,
        day_name: dayName,
        exercise_name: exerciseName.trim(),
        sets: finalSets,
        reps,
        rest_seconds: finalRestSeconds,
        notes: notes.trim() || undefined,
        exercise_photo_url: photoUrl || undefined,
        order_index: editingExercise?.order_index || exercises.filter(e => e.day_number === dayNumber).length
      }

      if (editingExercise) {
        // Update existing exercise
        await updateExercise(editingExercise.id, exerciseData)
      } else {
        // Create new exercise
        await createExercise(exerciseData)
      }

      await loadExercises()
      resetForm()
    } catch (err: any) {
      console.error('Error saving exercise:', err)
      setError(err.message)
      setUploadingPhoto(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExercise = (exercise: RoutineExercise) => {
    setConfirmDialog({
      isOpen: true,
      exercise: exercise
    })
  }

  const confirmDeleteExercise = async () => {
    const exercise = confirmDialog.exercise
    if (!exercise) return

    try {
      setLoading(true)
      setError(null)

      // Delete photo if exists
      if (exercise.exercise_photo_url) {
        await deleteExercisePhoto(exercise.exercise_photo_url)
      }

      await deleteExercise(exercise.id)
      await loadExercises()
      setConfirmDialog({ isOpen: false, exercise: null })
    } catch (err: any) {
      console.error('Error deleting exercise:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const days = groupExercisesByDay()

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
            <div className="glass-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
                    <GiWeightLiftingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Ejercicios</h2>
                    <p className="text-sm text-slate-400">{routineName}</p>
                  </div>
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
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Add New Exercise Button */}
                {!isAddingExercise && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddNew}
                    className="w-full p-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <MdAddCircleOutline className="w-5 h-5" />
                    <span>Agregar Ejercicio</span>
                  </motion.button>
                )}

                {/* Exercise Form */}
                {isAddingExercise && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card p-4 border border-accent-primary/30 rounded-lg space-y-3"
                  >
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                    </h3>

                    {/* Day Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Día #
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={dayNumber === 0 ? '' : dayNumber}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '') {
                              setDayNumber(0)
                            } else if (/^\d+$/.test(value)) {
                              const numValue = parseInt(value)
                              if (numValue >= 0) {
                                setDayNumber(numValue)
                              }
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || parseInt(e.target.value) < 1) {
                              setDayNumber(1)
                            }
                          }}
                          className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Nombre del Día
                        </label>
                        <input
                          type="text"
                          value={dayName}
                          onChange={(e) => setDayName(e.target.value)}
                          placeholder="Ej: Pecho/Tríceps"
                          className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                        />
                      </div>
                    </div>

                    {/* Exercise Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Nombre del Ejercicio *
                      </label>
                      <input
                        type="text"
                        value={exerciseName}
                        onChange={(e) => setExerciseName(e.target.value)}
                        placeholder="Ej: Press de banca"
                        className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                      />
                    </div>

                    {/* Sets, Reps, Rest */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Series
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={sets}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '') {
                              setSets('' as any)
                            } else if (/^\d+$/.test(value)) {
                              const numValue = parseInt(value)
                              if (numValue > 0) {
                                setSets(numValue)
                              }
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || parseInt(e.target.value) < 1) {
                              setSets(1)
                            }
                          }}
                          className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Reps
                        </label>
                        <input
                          type="text"
                          value={reps}
                          onChange={(e) => setReps(e.target.value)}
                          placeholder="10-12"
                          className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Descanso (s)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={restSeconds}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '') {
                              setRestSeconds('' as any)
                            } else if (/^\d+$/.test(value)) {
                              const numValue = parseInt(value)
                              if (numValue >= 0) {
                                setRestSeconds(numValue)
                              }
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || parseInt(e.target.value) < 0) {
                              setRestSeconds(0)
                            }
                          }}
                          className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Notas
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Técnica, tips, variaciones..."
                        rows={2}
                        className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 resize-none"
                      />
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Foto del Ejercicio (Opcional)
                      </label>
                      {photoPreview ? (
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            onClick={handleRemovePhoto}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent-primary/50 transition-colors">
                          <Camera className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-400">Click para agregar foto</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={resetForm}
                        className="flex-1 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveExercise}
                        disabled={loading || uploadingPhoto}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {uploadingPhoto ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Subiendo foto...</span>
                          </>
                        ) : loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Guardar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Exercise List by Day */}
                {loading && exercises.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
                  </div>
                ) : days.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <GiWeightLiftingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay ejercicios agregados</p>
                  </div>
                ) : (
                  days.map((day) => (
                    <div key={day.day_number} className="glass-card border border-white/10 rounded-lg overflow-hidden">
                      {/* Day Header */}
                      <button
                        onClick={() => toggleDay(day.day_number)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-accent-primary/20 rounded-lg flex items-center justify-center">
                            <span className="text-accent-primary font-bold">{day.day_number}</span>
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-white">{day.day_name}</h3>
                            <p className="text-xs text-slate-400">{day.exercises.length} ejercicios</p>
                          </div>
                        </div>
                        {expandedDays.has(day.day_number) ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      {/* Exercises */}
                      <AnimatePresence>
                        {expandedDays.has(day.day_number) && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="border-t border-white/10"
                          >
                            {day.exercises.map((exercise, idx) => (
                              <div
                                key={exercise.id}
                                className="p-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-start space-x-3">
                                      {exercise.exercise_photo_url && (
                                        <img
                                          src={exercise.exercise_photo_url}
                                          alt={exercise.exercise_name}
                                          className="w-16 h-16 object-cover rounded-lg"
                                        />
                                      )}
                                      <div className="flex-1">
                                        <h4 className="font-medium text-white">{exercise.exercise_name}</h4>
                                        <p className="text-sm text-slate-400 mt-1">
                                          {exercise.sets} series × {exercise.reps} reps • {exercise.rest_seconds}s descanso
                                        </p>
                                        {exercise.notes && (
                                          <p className="text-xs text-slate-500 mt-1">{exercise.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1.5 ml-2">
                                    <button
                                      onClick={() => handleEdit(exercise)}
                                      className="flex items-center justify-center p-2 bg-accent-primary/20 border border-accent-primary/30 rounded-lg text-accent-primary hover:bg-accent-primary/30 transition-all duration-200"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteExercise(exercise)}
                                      className="flex items-center justify-center p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-all duration-200"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Confirm Dialog */}
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title="Eliminar Ejercicio"
            message={`¿Estás seguro de eliminar el ejercicio "${confirmDialog.exercise?.exercise_name}"? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            cancelText="Cancelar"
            type="danger"
            loading={loading}
            loadingText="Eliminando..."
            onConfirm={confirmDeleteExercise}
            onCancel={() => setConfirmDialog({ isOpen: false, exercise: null })}
          />
        </>
      )}
    </AnimatePresence>
  )
}
