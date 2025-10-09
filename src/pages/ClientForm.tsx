import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useClients } from '@/hooks/useClients'
import Toast, { ToastType } from '@/components/Toast'
import { ArrowLeft, Save, User, Phone, Calendar, Clock, Weight, Ruler, Cake, Activity, ChevronDown, ChevronUp } from 'lucide-react'

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
  birth_date: z.string().optional(),
  initial_weight: z.number().positive('El peso debe ser positivo').optional().or(z.nan()).transform(val => isNaN(val as number) ? undefined : val),
  height: z.number().positive('La altura debe ser positiva').optional().or(z.nan()).transform(val => isNaN(val as number) ? undefined : val),
  has_pathology: z.boolean().optional(),
  pathology_detail: z.string().optional(),
  has_injury: z.boolean().optional(),
  injury_detail: z.string().optional(),
  has_allergies: z.boolean().optional(),
  allergies_detail: z.string().optional(),
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
  const [showMedicalCondition, setShowMedicalCondition] = useState(false)
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
  const watchBirthDate = watch('birth_date')
  const watchHasPathology = watch('has_pathology')
  const watchHasInjury = watch('has_injury')
  const watchHasAllergies = watch('has_allergies')

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

  // Calculate age automatically
  const age = React.useMemo(() => {
    if (watchBirthDate) {
      const [year, month, day] = watchBirthDate.split('-').map(Number)
      const birthDate = new Date(year, month - 1, day)
      const today = new Date()
      let calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--
      }
      return calculatedAge
    }
    return null
  }, [watchBirthDate])

  useEffect(() => {
    if (client) {
      setValue('document_type', client.document_type)
      setValue('cedula', client.cedula)
      setValue('full_name', client.full_name)
      setValue('phone', client.phone)
      if (client.birth_date) setValue('birth_date', client.birth_date)
      if (client.initial_weight) setValue('initial_weight', client.initial_weight)
      if (client.height) setValue('height', client.height)

      // Cargar condición médica si existe
      if (client.medical_condition) {
        setShowMedicalCondition(true)
        setValue('has_pathology', client.medical_condition.has_pathology)
        if (client.medical_condition.pathology_detail) {
          setValue('pathology_detail', client.medical_condition.pathology_detail)
        }
        setValue('has_injury', client.medical_condition.has_injury)
        if (client.medical_condition.injury_detail) {
          setValue('injury_detail', client.medical_condition.injury_detail)
        }
        setValue('has_allergies', client.medical_condition.has_allergies)
        if (client.medical_condition.allergies_detail) {
          setValue('allergies_detail', client.medical_condition.allergies_detail)
        }
      }

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

      // Construir objeto de condición médica si existe algún campo
      const medicalCondition = (data.has_pathology || data.has_injury || data.has_allergies) ? {
        has_pathology: data.has_pathology || false,
        pathology_detail: data.has_pathology ? data.pathology_detail : undefined,
        has_injury: data.has_injury || false,
        injury_detail: data.has_injury ? data.injury_detail : undefined,
        has_allergies: data.has_allergies || false,
        allergies_detail: data.has_allergies ? data.allergies_detail : undefined,
      } : undefined

      // Preparar datos del cliente
      const clientData = {
        document_type: data.document_type,
        cedula: data.cedula,
        full_name: data.full_name,
        phone: data.phone,
        birth_date: data.birth_date,
        initial_weight: data.initial_weight,
        height: data.height,
        medical_condition: medicalCondition,
        start_date: data.start_date,
        duration_months: data.duration_months,
      }

      if (isEditing && id) {
        await updateClient({ id, ...clientData })
        showToast('¡Cliente actualizado exitosamente!', 'success')
      } else {
        await createClient(clientData)
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
    <div className="p-4 pb-20 max-w-md mx-auto">
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
                    inputMode="numeric"
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

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fecha de Nacimiento (Opcional)
              </label>
              <div className="relative">
                <Cake className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('birth_date')}
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                />
              </div>
              {errors.birth_date && (
                <p className="mt-1 text-sm text-red-400">{errors.birth_date.message}</p>
              )}
            </div>

            {/* Age Display */}
            {age !== null && (
              <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
                <p className="text-sm text-accent-primary">
                  <strong>Edad:</strong> {age} años
                </p>
              </div>
            )}

            {/* Initial Weight and Height */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Peso Inicial (kg)
                </label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register('initial_weight', { valueAsNumber: true })}
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="70.5"
                    className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                  />
                </div>
                {errors.initial_weight && (
                  <p className="mt-1 text-sm text-red-400">{errors.initial_weight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Altura (cm)
                </label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register('height', { valueAsNumber: true })}
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="175"
                    className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                  />
                </div>
                {errors.height && (
                  <p className="mt-1 text-sm text-red-400">{errors.height.message}</p>
                )}
              </div>
            </div>

            {/* Medical Condition Section (Collapsible) */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMedicalCondition(!showMedicalCondition)}
                className="w-full px-4 py-3 bg-dark-200/30 flex items-center justify-between text-slate-300 hover:bg-dark-200/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-accent-primary" />
                  <span className="font-medium">Condición Médica (Opcional)</span>
                </div>
                {showMedicalCondition ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showMedicalCondition && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 space-y-4 bg-dark-200/10"
                >
                  {/* Patología */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-slate-300 mb-2">
                      <input
                        {...register('has_pathology')}
                        type="checkbox"
                        className="w-4 h-4 rounded bg-dark-200/50 border-white/10 text-accent-primary focus:ring-accent-primary/20"
                      />
                      <span>¿Tiene alguna patología?</span>
                    </label>
                    {watchHasPathology && (
                      <motion.input
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        {...register('pathology_detail')}
                        type="text"
                        placeholder="¿Cuál?"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                      />
                    )}
                  </div>

                  {/* Lesión */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-slate-300 mb-2">
                      <input
                        {...register('has_injury')}
                        type="checkbox"
                        className="w-4 h-4 rounded bg-dark-200/50 border-white/10 text-accent-primary focus:ring-accent-primary/20"
                      />
                      <span>¿Tiene alguna lesión?</span>
                    </label>
                    {watchHasInjury && (
                      <motion.input
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        {...register('injury_detail')}
                        type="text"
                        placeholder="¿Dónde?"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                      />
                    )}
                  </div>

                  {/* Alergias */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-slate-300 mb-2">
                      <input
                        {...register('has_allergies')}
                        type="checkbox"
                        className="w-4 h-4 rounded bg-dark-200/50 border-white/10 text-accent-primary focus:ring-accent-primary/20"
                      />
                      <span>¿Tiene alergias?</span>
                    </label>
                    {watchHasAllergies && (
                      <motion.input
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        {...register('allergies_detail')}
                        type="text"
                        placeholder="¿A qué?"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                      />
                    )}
                  </div>
                </motion.div>
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
                  min={isEditing ? undefined : new Date().toISOString().split('T')[0]}
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