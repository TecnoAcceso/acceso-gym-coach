import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, FileText, ChevronDown, ChevronUp, Trash2, Image as ImageIcon } from 'lucide-react'
import { GiWeightLiftingUp } from 'react-icons/gi'
import { FaWhatsapp } from 'react-icons/fa'
import type { Client } from '@/types/client'
import type { ClientRoutine, RoutineTemplateWithExercises, RoutineDay } from '@/types/routine'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { generateRoutinePDF, sendPDFViaWhatsApp } from '@/utils/generateRoutinePDF'
import { sendRoutineViaWhatsApp } from '@/utils/formatRoutineForWhatsApp'

interface ViewRoutineModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
  clientRoutines: ClientRoutine[]
  onFetchTemplate: (templateId: string) => Promise<RoutineTemplateWithExercises | null>
  onSendWhatsApp: (routine: RoutineTemplateWithExercises, clientRoutine: ClientRoutine) => void
  onUnassign: (routineId: string) => Promise<void>
  trainerName: string
}

export default function ViewRoutineModal({
  isOpen,
  onClose,
  client,
  clientRoutines,
  onFetchTemplate,
  onSendWhatsApp,
  onUnassign,
  trainerName
}: ViewRoutineModalProps) {
  const [loading, setLoading] = useState(true)
  const [routineDetails, setRoutineDetails] = useState<{
    clientRoutine: ClientRoutine
    template: RoutineTemplateWithExercises
  } | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]))
  const [unassigning, setUnassigning] = useState(false)
  const [showImageConfirm, setShowImageConfirm] = useState(false)
  const [sendingPDF, setSendingPDF] = useState(false)

  useEffect(() => {
    if (isOpen && clientRoutines.length > 0) {
      loadRoutineDetails()
    }
  }, [isOpen, clientRoutines])

  const loadRoutineDetails = async () => {
    setLoading(true)
    try {
      // Obtener la rutina activa o la más reciente
      const activeRoutine = clientRoutines.find(r => r.status === 'active') || clientRoutines[0]

      if (activeRoutine) {
        const template = await onFetchTemplate(activeRoutine.routine_template_id)
        if (template) {
          setRoutineDetails({
            clientRoutine: activeRoutine,
            template
          })
        }
      }
    } catch (err) {
      console.error('Error loading routine details:', err)
    } finally {
      setLoading(false)
    }
  }

  // Agrupar ejercicios por día
  const groupExercisesByDay = (template: RoutineTemplateWithExercises): RoutineDay[] => {
    const daysMap = new Map<number, RoutineDay>()

    template.exercises.forEach(exercise => {
      if (!daysMap.has(exercise.day_number)) {
        daysMap.set(exercise.day_number, {
          day_number: exercise.day_number,
          day_name: exercise.day_name,
          exercises: []
        })
      }
      daysMap.get(exercise.day_number)!.exercises.push(exercise)
    })

    return Array.from(daysMap.values()).sort((a, b) => a.day_number - b.day_number)
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return format(localDate, 'dd MMM yyyy', { locale: es })
  }

  const formatRestTime = (restSeconds: number): string => {
    if (restSeconds < 60) {
      return `${restSeconds}s`
    }
    const minutes = Math.floor(restSeconds / 60)
    const seconds = restSeconds % 60
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  }

  const toggleDay = (dayNumber: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(dayNumber)) {
        next.delete(dayNumber)
      } else {
        next.add(dayNumber)
      }
      return next
    })
  }

  const handleSendWhatsApp = () => {
    setShowImageConfirm(true)
  }

  const handleSendWithImages = async () => {
    if (!routineDetails) return

    setSendingPDF(true)
    try {
      const pdfBlob = await generateRoutinePDF({
        routine: routineDetails.template,
        clientName: client.full_name,
        trainerName,
        startDate: formatDate(routineDetails.clientRoutine.start_date),
        endDate: formatDate(routineDetails.clientRoutine.end_date),
        notes: routineDetails.clientRoutine.notes || ''
      })

      sendPDFViaWhatsApp(
        pdfBlob,
        client.phone,
        client.full_name,
        routineDetails.template.name,
        trainerName
      )

      setShowImageConfirm(false)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF. Por favor, intenta de nuevo.')
    } finally {
      setSendingPDF(false)
    }
  }

  const handleSendTextOnly = () => {
    if (!routineDetails) return

    onSendWhatsApp(routineDetails.template, routineDetails.clientRoutine)
    setShowImageConfirm(false)
  }

  const handleUnassign = async () => {
    if (!routineDetails) return

    setUnassigning(true)
    try {
      await onUnassign(routineDetails.clientRoutine.id)
      onClose()
    } catch (err) {
      console.error('Error unassigning routine:', err)
    } finally {
      setUnassigning(false)
    }
  }

  const statusConfig = {
    active: { color: 'text-status-active', bg: 'bg-status-active/20', label: 'Activa' },
    completed: { color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'Completada' },
    paused: { color: 'text-yellow-400', bg: 'bg-yellow-400/20', label: 'Pausada' }
  }

  const routineDays = routineDetails ? groupExercisesByDay(routineDetails.template) : []

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
            <div className="glass-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
                    <GiWeightLiftingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Rutina Asignada</h2>
                    <p className="text-sm text-slate-400">{client.full_name}</p>
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
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-accent-primary rounded-full animate-spin" />
                  </div>
                ) : !routineDetails ? (
                  <div className="text-center py-12">
                    <GiWeightLiftingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Sin rutina asignada</h3>
                    <p className="text-sm text-slate-400">
                      Este cliente aún no tiene una rutina asignada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Routine Info */}
                    <div className="glass-card p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-bold text-white">
                          {routineDetails.template.name}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[routineDetails.clientRoutine.status].bg} ${statusConfig[routineDetails.clientRoutine.status].color}`}>
                          {statusConfig[routineDetails.clientRoutine.status].label}
                        </span>
                      </div>

                      {routineDetails.template.description && (
                        <p className="text-sm text-slate-300">
                          {routineDetails.template.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {routineDetails.template.category && (
                          <span className="px-2 py-1 bg-accent-primary/20 border border-accent-primary/30 rounded text-xs text-accent-primary">
                            {routineDetails.template.category}
                          </span>
                        )}
                        {routineDetails.template.difficulty && (
                          <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400">
                            {routineDetails.template.difficulty}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400">
                          {routineDetails.template.duration_weeks} semanas
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Inicio</span>
                          </div>
                          <p className="text-white font-medium text-sm">
                            {formatDate(routineDetails.clientRoutine.start_date)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Fin</span>
                          </div>
                          <p className="text-white font-medium text-sm">
                            {formatDate(routineDetails.clientRoutine.end_date)}
                          </p>
                        </div>
                      </div>

                      {routineDetails.clientRoutine.notes && (
                        <div className="pt-2 border-t border-white/10">
                          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Notas</span>
                          </div>
                          <p className="text-sm text-slate-300">
                            {routineDetails.clientRoutine.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Days and Exercises */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white">Plan de Entrenamiento</h4>

                      {routineDays.map((day) => (
                        <div key={day.day_number} className="glass-card overflow-hidden">
                          <button
                            onClick={() => toggleDay(day.day_number)}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{day.day_number}</span>
                              </div>
                              <div className="text-left">
                                <h5 className="text-sm font-semibold text-white">{day.day_name}</h5>
                                <p className="text-xs text-slate-400">{day.exercises.length} ejercicios</p>
                              </div>
                            </div>
                            {expandedDays.has(day.day_number) ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          <AnimatePresence>
                            {expandedDays.has(day.day_number) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-white/10"
                              >
                                <div className="p-4 space-y-3 bg-dark-200/30">
                                  {day.exercises.map((exercise, idx) => (
                                    <div key={exercise.id} className="flex items-start space-x-3">
                                      <div className="flex-shrink-0 w-6 h-6 bg-accent-primary/20 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-bold text-accent-primary">{idx + 1}</span>
                                      </div>
                                      <div className="flex-1 space-y-1">
                                        <h6 className="text-sm font-semibold text-white">
                                          {exercise.exercise_name}
                                        </h6>
                                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                                          <span>{exercise.sets} series</span>
                                          <span>•</span>
                                          <span>{exercise.reps} reps</span>
                                          {exercise.rest_seconds > 0 && (
                                            <>
                                              <span>•</span>
                                              <span>{formatRestTime(exercise.rest_seconds)} descanso</span>
                                            </>
                                          )}
                                        </div>
                                        {exercise.notes && (
                                          <p className="text-xs text-slate-400 italic">
                                            {exercise.notes}
                                          </p>
                                        )}
                                        {exercise.exercise_photo_url && (
                                          <img
                                            src={exercise.exercise_photo_url}
                                            alt={exercise.exercise_name}
                                            className="mt-2 w-full max-w-xs rounded-lg border border-white/10"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {routineDetails && (
                <div className="flex items-center justify-between gap-2 p-4 border-t border-white/10">
                  <motion.button
                    type="button"
                    onClick={handleUnassign}
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
                    className="px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/30 transition-all duration-300 flex items-center space-x-1.5"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Confirmation Modal for Images */}
          <AnimatePresence>
            {showImageConfirm && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !sendingPDF && setShowImageConfirm(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[102]"
                />

                {/* Confirmation Modal */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-[103] flex items-center justify-center p-4"
                >
                  <div className="glass-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <FaWhatsapp className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Enviar Rutina</h3>
                      </div>
                      <p className="text-sm text-slate-400">
                        ¿Desea incluir imágenes de los ejercicios?
                      </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-3">
                      <div className="glass-card p-4 border border-blue-500/20">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                            <FileText className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-1">Con imágenes (PDF)</h4>
                            <p className="text-xs text-slate-400">
                              Se generará un PDF completo con todas las imágenes de los ejercicios
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="glass-card p-4 border border-green-500/20">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                            <FaWhatsapp className="w-4 h-4 text-green-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-1">Solo texto</h4>
                            <p className="text-xs text-slate-400">
                              Se enviará la rutina en formato de texto sin imágenes
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 space-y-3 border-t border-white/10">
                      {/* Cancelar */}
                      <motion.button
                        type="button"
                        onClick={() => setShowImageConfirm(false)}
                        disabled={sendingPDF}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 text-slate-300 text-sm font-medium rounded-xl hover:bg-dark-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancelar
                      </motion.button>

                      {/* Solo texto */}
                      <motion.button
                        type="button"
                        onClick={handleSendTextOnly}
                        disabled={sendingPDF}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-green-500/20"
                      >
                        <FaWhatsapp className="w-5 h-5" />
                        <span>Solo texto</span>
                      </motion.button>

                      {/* Con PDF */}
                      <motion.button
                        type="button"
                        onClick={handleSendWithImages}
                        disabled={sendingPDF}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
                      >
                        {sendingPDF ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Generando PDF...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5" />
                            <span>Con PDF</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
