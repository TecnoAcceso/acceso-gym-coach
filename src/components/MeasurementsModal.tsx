import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Client, MeasurementRecord, CreateMeasurementData } from '@/types/client'
import { useMeasurements } from '@/hooks/useMeasurements'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import html2canvas from 'html2canvas'
import {
  X,
  Ruler,
  Plus,
  History,
  Save,
  MessageCircle,
  Calendar,
  Target,
  Weight,
  Edit,
  Trash2,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MeasurementsModalProps {
  isOpen: boolean
  client: Client | null
  onClose: () => void
}

// Helper para convertir strings vacías a undefined
const optionalNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
  z.number().optional()
)

const measurementSchema = z.object({
  date: z.string().min(1, 'La fecha es requerida'),
  objetivo: z.string().optional(),
  peso: optionalNumber,
  hombros: optionalNumber,
  pecho: optionalNumber,
  espalda: optionalNumber,
  biceps_der: optionalNumber,
  biceps_izq: optionalNumber,
  cintura: optionalNumber,
  gluteo: optionalNumber,
  pierna_der: optionalNumber,
  pierna_izq: optionalNumber,
  pantorrilla_der: optionalNumber,
  pantorrilla_izq: optionalNumber,
  notas: z.string().optional(),
})

type MeasurementForm = z.infer<typeof measurementSchema>

export default function MeasurementsModal({ isOpen, client, onClose }: MeasurementsModalProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'new'>('history')
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const { user } = useAuth()
  const { measurements, loading, createMeasurement, updateMeasurement, deleteMeasurement } = useMeasurements(client?.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeasurementForm>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    }
  })

  if (!client) return null

  const handleEdit = (measurement: MeasurementRecord) => {
    setEditingMeasurement(measurement)
    setActiveTab('new')
    reset({
      date: measurement.date,
      objetivo: measurement.objetivo || '',
      peso: measurement.peso,
      hombros: measurement.hombros,
      pecho: measurement.pecho,
      espalda: measurement.espalda,
      biceps_der: measurement.biceps_der,
      biceps_izq: measurement.biceps_izq,
      cintura: measurement.cintura,
      gluteo: measurement.gluteo,
      pierna_der: measurement.pierna_der,
      pierna_izq: measurement.pierna_izq,
      pantorrilla_der: measurement.pantorrilla_der,
      pantorrilla_izq: measurement.pantorrilla_izq,
      notas: measurement.notas || '',
    })
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta medida?')) {
      try {
        await deleteMeasurement(id)
      } catch (error) {
        console.error('Error al eliminar medida:', error)
      }
    }
  }

  const onSubmit = async (data: MeasurementForm) => {
    setIsLoading(true)

    try {
      const measurementData: CreateMeasurementData = {
        client_id: client.id,
        date: data.date,
        objetivo: data.objetivo,
        peso: data.peso,
        hombros: data.hombros,
        pecho: data.pecho,
        espalda: data.espalda,
        biceps_der: data.biceps_der,
        biceps_izq: data.biceps_izq,
        cintura: data.cintura,
        gluteo: data.gluteo,
        pierna_der: data.pierna_der,
        pierna_izq: data.pierna_izq,
        pantorrilla_der: data.pantorrilla_der,
        pantorrilla_izq: data.pantorrilla_izq,
        notas: data.notas,
      }

      if (editingMeasurement) {
        await updateMeasurement(editingMeasurement.id, measurementData)
      } else {
        await createMeasurement(measurementData)
      }

      reset()
      setEditingMeasurement(null)
      setActiveTab('history')
    } catch (error) {
      console.error('Error al guardar medida:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWhatsAppShare = async () => {
    if (!reportRef.current || measurements.length === 0 || !client) return

    setIsGeneratingImage(true)

    try {
      // Generar la imagen del reporte
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0B1426',
        scale: 2,
        logging: false,
        useCORS: true,
      })

      // Convertir a blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Error al generar la imagen')
          setIsGeneratingImage(false)
          return
        }

        // Crear un enlace de descarga
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `medidas-${client.full_name.toLowerCase().replace(/\s/g, '-')}-${format(new Date(), 'dd-MM-yyyy')}.png`

        // Descargar la imagen
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // Esperar un momento y abrir WhatsApp
        setTimeout(() => {
          const trainerName = user?.full_name || 'Tu entrenador'

          const message = `¡Hola ${client.full_name}! 👋

Adjunto encontrarás tu reporte actualizado de medidas y avances. 📊

¡Estás haciendo un gran trabajo! Sigue así y alcanzarás todas tus metas. 💪🏋️

Cualquier duda o consulta, estamos para ayudarte.

¡Sigamos entrenando juntos!

Att: ${trainerName}

---
_Powered by TecnoAcceso / ElectroShop_`
          const encodedMessage = encodeURIComponent(message)
          const phoneNumber = client.phone.replace(/\D/g, '')
          const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
          window.open(whatsappUrl, '_blank')
        }, 500)

        setIsGeneratingImage(false)
      }, 'image/png')
    } catch (error) {
      console.error('Error al generar la imagen:', error)
      setIsGeneratingImage(false)
    }
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return format(localDate, 'dd MMM yyyy', { locale: es })
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Medidas y Avances</h3>
                    <p className="text-xs text-slate-400">{client.full_name}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-2 mb-6 border-b border-white/10">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'history'
                      ? 'text-accent-primary'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>Historial</span>
                  </div>
                  {activeTab === 'history' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                    />
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('new')
                    setEditingMeasurement(null)
                    reset({ date: new Date().toISOString().split('T')[0] })
                  }}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'new'
                      ? 'text-accent-primary'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>{editingMeasurement ? 'Editar' : 'Nueva'}</span>
                  </div>
                  {activeTab === 'new' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                    />
                  )}
                </button>
              </div>

              {/* Content */}
              {activeTab === 'history' ? (
                <div className="space-y-4">
                  {/* WhatsApp Share Button */}
                  {measurements.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWhatsAppShare}
                      disabled={isGeneratingImage}
                      className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingImage ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generando imagen...</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5" />
                          <span>Enviar Reporte por WhatsApp</span>
                        </>
                      )}
                    </motion.button>
                  )}

                  {/* Measurements List */}
                  {loading ? (
                    <div className="text-center py-8 text-slate-400">Cargando...</div>
                  ) : measurements.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      No hay medidas registradas aún
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {measurements.map((measurement) => (
                        <motion.div
                          key={measurement.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-card p-4 border border-white/10"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-accent-primary" />
                              <span className="text-sm font-medium text-white">
                                {formatDate(measurement.date)}
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEdit(measurement)}
                                className="p-1.5 rounded bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30"
                              >
                                <Edit className="w-3 h-3" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(measurement.id)}
                                className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              >
                                <Trash2 className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>

                          {measurement.objetivo && (
                            <div className="mb-2 flex items-start space-x-2">
                              <Target className="w-4 h-4 text-slate-400 mt-0.5" />
                              <span className="text-sm text-slate-300">{measurement.objetivo}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {measurement.peso && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Peso:</span>
                                <span className="text-white font-medium">{measurement.peso} kg</span>
                              </div>
                            )}
                            {measurement.hombros && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Hombros:</span>
                                <span className="text-white font-medium">{measurement.hombros} cm</span>
                              </div>
                            )}
                            {measurement.pecho && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Pecho:</span>
                                <span className="text-white font-medium">{measurement.pecho} cm</span>
                              </div>
                            )}
                            {measurement.espalda && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Espalda:</span>
                                <span className="text-white font-medium">{measurement.espalda} cm</span>
                              </div>
                            )}
                            {measurement.biceps_der && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Bíceps Der:</span>
                                <span className="text-white font-medium">{measurement.biceps_der} cm</span>
                              </div>
                            )}
                            {measurement.biceps_izq && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Bíceps Izq:</span>
                                <span className="text-white font-medium">{measurement.biceps_izq} cm</span>
                              </div>
                            )}
                            {measurement.cintura && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Cintura:</span>
                                <span className="text-white font-medium">{measurement.cintura} cm</span>
                              </div>
                            )}
                            {measurement.gluteo && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Glúteo:</span>
                                <span className="text-white font-medium">{measurement.gluteo} cm</span>
                              </div>
                            )}
                            {measurement.pierna_der && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Pierna Der:</span>
                                <span className="text-white font-medium">{measurement.pierna_der} cm</span>
                              </div>
                            )}
                            {measurement.pierna_izq && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Pierna Izq:</span>
                                <span className="text-white font-medium">{measurement.pierna_izq} cm</span>
                              </div>
                            )}
                            {measurement.pantorrilla_der && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Pantorrilla Der:</span>
                                <span className="text-white font-medium">{measurement.pantorrilla_der} cm</span>
                              </div>
                            )}
                            {measurement.pantorrilla_izq && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Pantorrilla Izq:</span>
                                <span className="text-white font-medium">{measurement.pantorrilla_izq} cm</span>
                              </div>
                            )}
                          </div>

                          {measurement.notas && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-xs text-slate-400">
                                <strong>Notas:</strong> {measurement.notas}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fecha
                    </label>
                    <input
                      {...register('date')}
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-400">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Objetivo */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Objetivo (Opcional)
                    </label>
                    <input
                      {...register('objetivo')}
                      type="text"
                      placeholder="Ej: Reducir grasa corporal"
                      className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    />
                  </div>

                  {/* Peso */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      {...register('peso', { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    />
                  </div>

                  {/* Medidas en grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Hombros (cm)
                      </label>
                      <input
                        {...register('hombros', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="120"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pecho (cm)
                      </label>
                      <input
                        {...register('pecho', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="100"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Espalda (cm)
                      </label>
                      <input
                        {...register('espalda', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="105"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bíceps Der (cm)
                      </label>
                      <input
                        {...register('biceps_der', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="35"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bíceps Izq (cm)
                      </label>
                      <input
                        {...register('biceps_izq', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="35"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Cintura (cm)
                      </label>
                      <input
                        {...register('cintura', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="80"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Glúteo (cm)
                      </label>
                      <input
                        {...register('gluteo', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="95"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pierna Der (cm)
                      </label>
                      <input
                        {...register('pierna_der', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="55"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pierna Izq (cm)
                      </label>
                      <input
                        {...register('pierna_izq', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="55"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pantorrilla Der (cm)
                      </label>
                      <input
                        {...register('pantorrilla_der', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="38"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pantorrilla Izq (cm)
                      </label>
                      <input
                        {...register('pantorrilla_izq', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="38"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Notas (Opcional)
                    </label>
                    <textarea
                      {...register('notas')}
                      rows={3}
                      placeholder="Observaciones adicionales..."
                      className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 resize-none"
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex space-x-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setActiveTab('history')
                        setEditingMeasurement(null)
                        reset()
                      }}
                      className="flex-1 py-3 px-4 bg-dark-200/50 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-dark-200/70 transition-all duration-300"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>{isLoading ? 'Guardando...' : editingMeasurement ? 'Actualizar' : 'Guardar'}</span>
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>

          {/* Reporte oculto para generar imagen */}
          <div
            ref={reportRef}
            className="fixed"
            style={{
              position: 'fixed',
              left: '-9999px',
              top: 0,
              width: '800px',
              backgroundColor: '#0B1426',
            }}
          >
            <div className="p-8 space-y-6">
              {/* Header del Reporte */}
              <div className="text-center border-b border-white/20 pb-6">
                <h1 className="text-3xl font-bold text-white mb-2">AccesoGym Coach</h1>
                <p className="text-xl text-accent-primary">Reporte de Medidas y Avances</p>
              </div>

              {/* Información del Cliente */}
              {client && (
                <div className="bg-dark-200/30 rounded-lg p-6 border border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Cliente</p>
                      <p className="text-lg font-semibold text-white">{client.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Cédula</p>
                      <p className="text-lg font-semibold text-white">{client.document_type}-{client.cedula}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Teléfono</p>
                      <p className="text-lg font-semibold text-white">{client.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Fecha de Reporte</p>
                      <p className="text-lg font-semibold text-white">{format(new Date(), 'dd MMM yyyy', { locale: es })}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Medidas Registradas */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Historial de Medidas</h2>
                <div className="space-y-4">
                  {measurements.map((measurement, index) => (
                    <div
                      key={measurement.id}
                      className="bg-dark-200/30 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                        <p className="text-lg font-semibold text-accent-primary">
                          {formatDate(measurement.date)}
                        </p>
                        {index === 0 && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                            Más reciente
                          </span>
                        )}
                      </div>

                      {measurement.objetivo && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-400">Objetivo:</p>
                          <p className="text-white">{measurement.objetivo}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        {measurement.peso && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Peso</p>
                            <p className="text-white font-semibold">{measurement.peso} kg</p>
                          </div>
                        )}
                        {measurement.hombros && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Hombros</p>
                            <p className="text-white font-semibold">{measurement.hombros} cm</p>
                          </div>
                        )}
                        {measurement.pecho && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Pecho</p>
                            <p className="text-white font-semibold">{measurement.pecho} cm</p>
                          </div>
                        )}
                        {measurement.espalda && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Espalda</p>
                            <p className="text-white font-semibold">{measurement.espalda} cm</p>
                          </div>
                        )}
                        {measurement.biceps_der && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Bíceps Der</p>
                            <p className="text-white font-semibold">{measurement.biceps_der} cm</p>
                          </div>
                        )}
                        {measurement.biceps_izq && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Bíceps Izq</p>
                            <p className="text-white font-semibold">{measurement.biceps_izq} cm</p>
                          </div>
                        )}
                        {measurement.cintura && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Cintura</p>
                            <p className="text-white font-semibold">{measurement.cintura} cm</p>
                          </div>
                        )}
                        {measurement.gluteo && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Glúteo</p>
                            <p className="text-white font-semibold">{measurement.gluteo} cm</p>
                          </div>
                        )}
                        {measurement.pierna_der && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Pierna Der</p>
                            <p className="text-white font-semibold">{measurement.pierna_der} cm</p>
                          </div>
                        )}
                        {measurement.pierna_izq && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Pierna Izq</p>
                            <p className="text-white font-semibold">{measurement.pierna_izq} cm</p>
                          </div>
                        )}
                        {measurement.pantorrilla_der && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Pantorrilla Der</p>
                            <p className="text-white font-semibold">{measurement.pantorrilla_der} cm</p>
                          </div>
                        )}
                        {measurement.pantorrilla_izq && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Pantorrilla Izq</p>
                            <p className="text-white font-semibold">{measurement.pantorrilla_izq} cm</p>
                          </div>
                        )}
                      </div>

                      {measurement.notas && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-sm text-slate-400">Notas:</p>
                          <p className="text-sm text-white">{measurement.notas}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t border-white/20">
                <p className="text-sm text-slate-400">
                  Generado por AccesoGym Coach - {format(new Date(), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
