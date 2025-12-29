import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Calendar, ListOrdered, ChevronDown, ChevronUp } from 'lucide-react'
import { GiWeightLiftingUp } from 'react-icons/gi'
import { FaWhatsapp } from 'react-icons/fa'
import type { Client } from '@/types/client'
import type { RoutineTemplate, RoutineTemplateWithExercises, RoutineDay } from '@/types/routine'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface AssignRoutineModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (data: {
    routine_template_id: string
    start_date: string
    end_date: string
    notes?: string
    sendWhatsApp?: boolean
    includeImages?: boolean
  }) => Promise<void>
  client: Client
  templates: RoutineTemplate[]
  onFetchTemplate: (templateId: string) => Promise<RoutineTemplateWithExercises | null>
}

export default function AssignRoutineModal({
  isOpen,
  onClose,
  onAssign,
  client,
  templates,
  onFetchTemplate
}: AssignRoutineModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [sendWhatsApp, setSendWhatsApp] = useState(false)
  const [includeImages, setIncludeImages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<RoutineTemplateWithExercises | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Inicializar fecha de inicio con hoy
  useEffect(() => {
    if (isOpen) {
      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')
      setStartDate(todayStr)

      // Reset form
      setSelectedTemplateId('')
      setEndDate('')
      setNotes('')
      setSendWhatsApp(false)
      setIncludeImages(false)
      setError(null)
      setSelectedTemplate(null)
      setShowPreview(false)
    }
  }, [isOpen])

  // Calcular fecha de fin automáticamente cuando se selecciona una rutina
  useEffect(() => {
    if (selectedTemplateId && startDate) {
      const template = templates.find(t => t.id === selectedTemplateId)
      if (template) {
        const start = new Date(startDate + 'T00:00:00')
        const durationDays = template.duration_weeks * 7
        const end = addDays(start, durationDays)
        setEndDate(format(end, 'yyyy-MM-dd'))
      }
    }
  }, [selectedTemplateId, startDate, templates])

  // Cargar detalles de la rutina cuando se selecciona
  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId)
    setShowPreview(false)
    setSelectedTemplate(null)

    if (templateId) {
      setLoadingPreview(true)
      try {
        const template = await onFetchTemplate(templateId)
        setSelectedTemplate(template)
      } catch (err) {
        console.error('Error loading template:', err)
      } finally {
        setLoadingPreview(false)
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTemplateId) {
      setError('Debes seleccionar una rutina')
      return
    }

    if (!startDate) {
      setError('La fecha de inicio es requerida')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await onAssign({
        routine_template_id: selectedTemplateId,
        start_date: startDate,
        end_date: endDate,
        notes: notes.trim() || undefined,
        sendWhatsApp,
        includeImages
      })

      onClose()
    } catch (err: any) {
      console.error('Error assigning routine:', err)
      setError(err.message || 'Error al asignar la rutina')
    } finally {
      setLoading(false)
    }
  }

  const selectedTemplateMeta = templates.find(t => t.id === selectedTemplateId)
  const routineDays = selectedTemplate ? groupExercisesByDay(selectedTemplate) : []

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
                    <h2 className="text-xl font-bold text-white">Asignar Rutina</h2>
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Routine Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rutina *
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                    required
                  >
                    <option value="">Seleccionar rutina</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.duration_weeks} semanas)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="flex justify-between items-end">
                  <div className="w-[45%]">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Inicio *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-1 py-1 text-xs bg-dark-200/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                      required
                    />
                  </div>

                  <div className="w-[45%]">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Fin *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-1 py-1 text-xs bg-dark-200/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instrucciones especiales o comentarios..."
                    rows={2}
                    className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all resize-none"
                  />
                </div>

                {/* WhatsApp Options */}
                <div className="space-y-3">
                  {/* Enviar por WhatsApp */}
                  <div className="flex items-center space-x-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <input
                      type="checkbox"
                      id="sendWhatsApp"
                      checked={sendWhatsApp}
                      onChange={(e) => {
                        setSendWhatsApp(e.target.checked)
                        if (!e.target.checked) {
                          setIncludeImages(false)
                        }
                      }}
                      className="w-4 h-4 rounded border-white/10 bg-dark-200/50 text-accent-primary focus:ring-2 focus:ring-accent-primary/50"
                    />
                    <label htmlFor="sendWhatsApp" className="flex items-center space-x-2 text-sm text-white cursor-pointer">
                      <FaWhatsapp className="w-5 h-5 text-green-400" />
                      <span>Enviar rutina por WhatsApp</span>
                    </label>
                  </div>

                  {/* Incluir imágenes (solo si WhatsApp está activado) */}
                  <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-all ${
                    sendWhatsApp
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : 'bg-dark-200/20 border-white/5 opacity-50'
                  }`}>
                    <input
                      type="checkbox"
                      id="includeImages"
                      checked={includeImages}
                      disabled={!sendWhatsApp}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-dark-200/50 text-accent-primary focus:ring-2 focus:ring-accent-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label
                      htmlFor="includeImages"
                      className={`flex items-center space-x-2 text-sm ${
                        sendWhatsApp ? 'text-white cursor-pointer' : 'text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>📄 Incluir imágenes (PDF)</span>
                    </label>
                  </div>
                </div>

                {/* Preview Section */}
                {selectedTemplateId && (
                  <div className="border border-white/10 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="w-full flex items-center justify-between p-4 bg-dark-200/30 hover:bg-dark-200/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 text-slate-300">
                        <ListOrdered className="w-4 h-4" />
                        <span className="text-sm font-medium">Vista Previa de la Rutina</span>
                      </div>
                      {showPreview ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {showPreview && (
                      <div className="p-4 space-y-4 max-h-64 overflow-y-auto bg-dark-200/20">
                        {loadingPreview ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-2 border-white/30 border-t-accent-primary rounded-full animate-spin" />
                          </div>
                        ) : selectedTemplate ? (
                          <>
                            {/* Template Info */}
                            <div className="space-y-2 pb-3 border-b border-white/10">
                              {selectedTemplateMeta?.description && (
                                <p className="text-sm text-slate-300">{selectedTemplateMeta.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {selectedTemplateMeta?.category && (
                                  <span className="px-2 py-1 bg-accent-primary/20 border border-accent-primary/30 rounded text-xs text-accent-primary">
                                    {selectedTemplateMeta.category}
                                  </span>
                                )}
                                {selectedTemplateMeta?.difficulty && (
                                  <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400">
                                    {selectedTemplateMeta.difficulty}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Days and Exercises */}
                            {routineDays.map((day) => (
                              <div key={day.day_number} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">{day.day_number}</span>
                                  </div>
                                  <h4 className="text-sm font-semibold text-white">{day.day_name}</h4>
                                  <span className="text-xs text-slate-400">({day.exercises.length} ejercicios)</span>
                                </div>
                                <div className="ml-8 space-y-1">
                                  {day.exercises.map((exercise, idx) => (
                                    <div key={exercise.id} className="text-xs text-slate-400">
                                      {idx + 1}. {exercise.exercise_name} - {exercise.sets}x{exercise.reps}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <p className="text-sm text-slate-400 text-center py-4">
                            No se pudo cargar la rutina
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                  disabled={loading || !selectedTemplateId}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Asignando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Asignar Rutina</span>
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
