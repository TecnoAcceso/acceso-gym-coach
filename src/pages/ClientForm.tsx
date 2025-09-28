import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useClients } from '@/hooks/useClients'
import Toast, { ToastType } from '@/components/Toast'
import { ArrowLeft, Save, User, Phone, Calendar, Clock } from 'lucide-react'

const clientSchema = z.object({
  document_type: z.enum(['V', 'E'], { required_error: 'Selecciona el tipo de documento' }),
  cedula: z.string()
    .min(7, 'La cédula debe tener al menos 7 dígitos')
    .max(8, 'La cédula no puede tener más de 8 dígitos')
    .regex(/^\d+$/, 'La cédula solo puede contener números'),
  full_name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .regex(/^[A-ZÁÉÍÓÚÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .transform(val => val.toUpperCase()),
  phone: z.string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Formato: +código_país + número (ej: +584123456789)'),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  duration_months: z.number().min(1, 'La duración debe ser al menos 1 mes').max(12, 'La duración máxima es 12 meses'),
})

type ClientForm = z.infer<typeof clientSchema>

export default function ClientFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { clients, createClient, updateClient } = useClients()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: ToastType
  }>({ show: false, message: '', type: 'success' })

  const isEditing = Boolean(id)
  const client = isEditing ? clients.find(c => c.id === id) : null

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type })
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      document_type: 'V',
      duration_months: 1,
    }
  })

  const watchStartDate = watch('start_date')
  const watchDuration = watch('duration_months')

  // Calculate end date automatically
  const endDate = React.useMemo(() => {
    if (watchStartDate && watchDuration) {
      const [year, month, day] = watchStartDate.split('-').map(Number)
      const start = new Date(year, month - 1, day)
      const end = new Date(start)
      end.setMonth(end.getMonth() + watchDuration)
      return end.toLocaleDateString('es-ES')
    }
    return ''
  }, [watchStartDate, watchDuration])

  useEffect(() => {
    if (client) {
      setValue('document_type', client.document_type)
      setValue('cedula', client.cedula)
      setValue('full_name', client.full_name)
      setValue('phone', client.phone)
      setValue('start_date', client.start_date)
      setValue('duration_months', client.duration_months)
    }
  }, [client, setValue])

  const onSubmit = async (data: ClientForm) => {
    setIsLoading(true)
    setError('')

    try {
      // Validar cédula duplicada
      if (!isEditing) {
        const existingClient = clients.find(
          c => c.cedula === data.cedula && c.document_type === data.document_type
        )
        if (existingClient) {
          throw new Error(`Ya existe un cliente con cédula ${data.document_type}-${data.cedula}`)
        }
      } else if (id) {
        const existingClient = clients.find(
          c => c.cedula === data.cedula &&
               c.document_type === data.document_type &&
               c.id !== id
        )
        if (existingClient) {
          throw new Error(`Ya existe otro cliente con cédula ${data.document_type}-${data.cedula}`)
        }
      }

      if (isEditing && id) {
        await updateClient({ id, ...data })
        showToast('¡Cliente actualizado exitosamente!', 'success')
      } else {
        await createClient(data)
        showToast('¡Cliente registrado exitosamente!', 'success')
      }

      // Navegar después de un breve delay para mostrar el toast
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Error al guardar el cliente')
      showToast(err.message || 'Error al guardar el cliente', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-dark-200/50 border border-white/10 text-slate-400 hover:text-accent-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-white">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Document Type and Cedula */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Cédula de Identidad
              </label>
              <div className="flex space-x-2">
                <select
                  {...register('document_type')}
                  className="w-20 px-3 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                >
                  <option value="V">V</option>
                  <option value="E">E</option>
                </select>
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register('cedula')}
                    type="text"
                    placeholder="Solo números (12345678)"
                    onInput={(e) => {
                      // Solo permitir números
                      e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                  />
                </div>
              </div>
              {errors.cedula && (
                <p className="mt-1 text-sm text-red-400">{errors.cedula.message}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('full_name')}
                  type="text"
                  placeholder="Solo letras (JUAN PÉREZ)"
                  onInput={(e) => {
                    // Solo permitir letras, espacios y tildes, convertir a mayúsculas
                    let value = e.currentTarget.value.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, '')
                    e.currentTarget.value = value.toUpperCase()
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                />
              </div>
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-400">{errors.full_name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="+584123456789 (incluir código país)"
                  onInput={(e) => {
                    // Asegurar que comience con + y solo contenga números después
                    let value = e.currentTarget.value
                    if (!value.startsWith('+')) {
                      value = '+' + value.replace(/[^0-9]/g, '')
                    } else {
                      value = '+' + value.slice(1).replace(/[^0-9]/g, '')
                    }
                    e.currentTarget.value = value
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fecha de Inicio
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('start_date')}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                />
              </div>
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-400">{errors.start_date.message}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Duración (meses)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  {...register('duration_months', { valueAsNumber: true })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                    <option key={month} value={month}>
                      {month} {month === 1 ? 'mes' : 'meses'}
                    </option>
                  ))}
                </select>
              </div>
              {errors.duration_months && (
                <p className="mt-1 text-sm text-red-400">{errors.duration_months.message}</p>
              )}
            </div>

            {/* End Date Display */}
            {endDate && (
              <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
                <p className="text-sm text-accent-primary">
                  <strong>Fecha de Fin:</strong> {endDate}
                </p>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{isLoading ? 'Guardando...' : 'Guardar Cliente'}</span>
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}