import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, UtensilsCrossed, Calendar, FileText } from 'lucide-react'
import { useNutritionPlans } from '@/hooks/useNutritionPlans'
import { generateNutritionPlanPDF, sendNutritionPlanPDFViaWhatsApp } from '@/utils/generateNutritionPlanPDF'
import type { Client } from '@/types/client'
import LoadingSpinner from './LoadingSpinner'
import Toast, { ToastType } from './Toast'
import ConfirmModal from './ConfirmModal'

interface AssignNutritionPlanModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
  trainerName?: string
  onSuccess?: () => void
}

export default function AssignNutritionPlanModal({
  isOpen,
  onClose,
  client,
  trainerName = 'Tu Coach',
  onSuccess
}: AssignNutritionPlanModalProps) {
  const { templates, fetchPlanTemplates, assignToClient, fetchPlanById } = useNutritionPlans()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  // Toast and confirm modal state
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: ToastType
  }>({ show: false, message: '', type: 'success' })
  const [confirmWhatsApp, setConfirmWhatsApp] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      // Set default dates: start today, end in 30 days
      const today = new Date()
      const in30Days = new Date(today)
      in30Days.setDate(today.getDate() + 30)

      setStartDate(today.toISOString().split('T')[0])
      setEndDate(in30Days.toISOString().split('T')[0])
      setSelectedPlanId('')
      setNotes('')
    }
  }, [isOpen])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      await fetchPlanTemplates()
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (sendWhatsApp: boolean = false) => {
    if (!selectedPlanId) {
      setToast({
        show: true,
        message: 'Por favor selecciona un plan nutricional',
        type: 'error'
      })
      return
    }

    if (!startDate || !endDate) {
      setToast({
        show: true,
        message: 'Por favor ingresa las fechas de inicio y fin',
        type: 'error'
      })
      return
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setToast({
        show: true,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio',
        type: 'error'
      })
      return
    }

    if (sendWhatsApp && (!client.phone || client.phone.trim() === '')) {
      setToast({
        show: true,
        message: 'El cliente no tiene un número de teléfono registrado',
        type: 'error'
      })
      return
    }

    setSaving(true)
    try {
      // Asignar el plan al cliente
      await assignToClient({
        client_id: client.id,
        plan_template_id: selectedPlanId,
        start_date: startDate,
        end_date: endDate,
        notes: notes || undefined
      })

      // Si se debe enviar por WhatsApp, generar PDF y enviar
      if (sendWhatsApp) {
        // Obtener el plan completo con comidas
        const planWithMeals = await fetchPlanById(selectedPlanId)

        if (!planWithMeals) {
          setToast({
            show: true,
            message: 'Error al obtener los detalles del plan',
            type: 'error'
          })
          setSaving(false)
          return
        }

        // Formatear fechas
        const formatDate = (dateStr: string) => {
          const [year, month, day] = dateStr.split('-').map(Number)
          const date = new Date(year, month - 1, day)
          return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).format(date)
        }

        // Generar PDF
        const pdfBlob = await generateNutritionPlanPDF({
          plan: planWithMeals,
          clientName: client.full_name,
          trainerName: trainerName,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          notes: notes || undefined
        })

        // Enviar por WhatsApp
        sendNutritionPlanPDFViaWhatsApp(
          pdfBlob,
          client.phone,
          client.full_name,
          planWithMeals.name,
          trainerName
        )
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error assigning plan:', error)
      setToast({
        show: true,
        message: 'Error al asignar el plan. Por favor intenta nuevamente.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAssignClick = () => {
    // Preguntar si desea enviar por WhatsApp
    if (client.phone && client.phone.trim() !== '') {
      setConfirmWhatsApp(true)
    } else {
      // Si no tiene teléfono, solo asignar
      handleAssign(false)
    }
  }

  const handleConfirmWhatsApp = () => {
    setConfirmWhatsApp(false)
    handleAssign(true)
  }

  const handleCancelWhatsApp = () => {
    setConfirmWhatsApp(false)
    handleAssign(false)
  }

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
            <div className="glass-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Asignar Plan Nutricional</h2>
                    <p className="text-sm text-slate-400">Para {client.full_name}</p>
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
              <div className="p-6 space-y-5">
                {loading ? (
                  <div className="py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <>
                    {/* Plan Selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Plan Nutricional *
                      </label>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                      >
                        <option value="">Selecciona un plan...</option>
                        {templates && templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} {template.calories ? `(${template.calories} kcal)` : ''}
                          </option>
                        ))}
                      </select>
                      {templates.length === 0 && (
                        <p className="text-xs text-slate-400 mt-2">
                          No hay planes disponibles. Crea uno primero en la sección de Nutrición.
                        </p>
                      )}
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
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Notas (Opcional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Instrucciones especiales, ajustes personalizados, etc..."
                        rows={3}
                        className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all resize-none"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/10">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-dark-200/50 border border-white/10 text-slate-300 rounded-lg hover:bg-dark-200 transition-all"
                  disabled={saving}
                >
                  Cancelar
                </motion.button>

                <motion.button
                  onClick={handleAssignClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={saving || loading || !selectedPlanId}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg shadow-lg shadow-accent-primary/30 hover:shadow-accent-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Asignando...' : 'Asignar Plan'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirm WhatsApp Modal - Outside main AnimatePresence */}
      <ConfirmModal
        isOpen={confirmWhatsApp}
        onClose={handleCancelWhatsApp}
        onConfirm={handleConfirmWhatsApp}
        title="Enviar por WhatsApp"
        message={`¿Deseas enviar el plan nutricional a ${client.full_name} por WhatsApp?`}
        confirmText="Sí, enviar"
        cancelText="No, solo asignar"
        type="info"
      />

      {/* Toast Notification - Outside main AnimatePresence */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </>
  )
}
