import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLicense } from '@/hooks/useLicense'
import { supabase } from '@/lib/supabase'
import Toast, { ToastType } from '@/components/Toast'
import UserManagement from '@/components/UserManagement'
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldX,
  Key,
  Calendar,
  Clock,
  Settings,
  User,
  AlertTriangle,
  CheckCircle,
  Users,
  XCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, addMonths, addYears } from 'date-fns'
import { es } from 'date-fns/locale'

const licenseSchema = z.object({
  license_key: z.string().min(10, 'La clave debe tener al menos 10 caracteres'),
  expiry_date: z.string().min(1, 'Selecciona una fecha de expiración'),
  trainer_id: z.string().min(1, 'Selecciona un usuario'),
})

type LicenseForm = z.infer<typeof licenseSchema>


interface UserProfile {
  id: string
  auth_user_id: string
  username: string
  full_name: string
  role: 'trainer' | 'admin' | 'superuser'
  created_at: string
}

interface License {
  id: string
  license_key: string
  expiry_date: string
  status: 'active' | 'expired'
  trainer_id: string
  created_at: string
  user_profile?: UserProfile
}

export default function LicenseManagement() {
  const navigate = useNavigate()
  const { license } = useLicense()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: ToastType
  }>({ show: false, message: '', type: 'success' })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LicenseForm>({
    resolver: zodResolver(licenseSchema),
  })

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type })
  }

  const generateLicenseKey = () => {
    const prefix = 'AGC'
    const year = new Date().getFullYear()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}-${year}-${random}`
  }

  const quickSetExpiry = (period: 'month' | 'year' | '2years') => {
    const today = new Date()
    let expiryDate: Date

    switch (period) {
      case 'month':
        expiryDate = addMonths(today, 1)
        break
      case 'year':
        expiryDate = addYears(today, 1)
        break
      case '2years':
        expiryDate = addYears(today, 2)
        break
    }

    setValue('expiry_date', expiryDate.toISOString().split('T')[0])
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .neq('role', 'superuser')
        .order('full_name', { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      console.error('Error fetching users:', err)
      showToast('Error al cargar usuarios', 'error')
    }
  }

  const fetchLicenses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          user_profiles!fk_licenses_trainer_id (
            id,
            username,
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const licensesWithStatus = (data || []).map(license => ({
        ...license,
        status: new Date(license.expiry_date) > new Date() ? 'active' : 'expired',
        user_profile: license.user_profiles
      }))

      setLicenses(licensesWithStatus)
    } catch (err: any) {
      console.error('Error fetching licenses:', err)
      showToast('Error al cargar licencias', 'error')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: LicenseForm) => {
    setIsCreating(true)
    try {
      const { error } = await supabase
        .from('licenses')
        .insert({
          license_key: data.license_key,
          expiry_date: data.expiry_date,
          trainer_id: data.trainer_id,
          status: 'active'
        })

      if (error) throw error

      showToast('¡Licencia creada exitosamente!', 'success')
      reset()
      setShowCreateForm(false)
      await fetchLicenses()
    } catch (error: any) {
      showToast(error.message || 'Error al crear licencia', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  React.useEffect(() => {
    fetchUsers()
    fetchLicenses()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-status-active bg-status-active/10 border-status-active/20'
      case 'expiring': return 'text-status-warning bg-status-warning/10 border-status-warning/20'
      case 'expired': return 'text-status-expired bg-status-expired/10 border-status-expired/20'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ShieldCheck className="w-4 h-4" />
      case 'expiring': return <AlertTriangle className="w-4 h-4" />
      case 'expired': return <ShieldX className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  const calculateDaysRemaining = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg bg-dark-200/50 border border-white/10 text-slate-400 hover:text-accent-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Licencias</h1>
            <p className="text-sm text-slate-400">Panel de administración del superusuario</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUserManagement(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-md text-white text-sm font-medium shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-200 flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuarios</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-md text-white text-sm font-medium shadow-md shadow-accent-primary/20 hover:shadow-accent-primary/40 transition-all duration-200 flex items-center space-x-1.5"
          >
            {showCreateForm ? (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </>
            ) : (
              <>
                <Key className="w-3.5 h-3.5" />
                <span>Nueva Licencia</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total</p>
              <p className="text-xl font-bold text-white">{licenses.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Activas</p>
              <p className="text-xl font-bold text-white">
                {licenses.filter(l => l.status === 'active').length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Por Vencer</p>
              <p className="text-xl font-bold text-white">
                {licenses.filter(l => {
                  const daysRemaining = Math.ceil((new Date(l.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return daysRemaining > 0 && daysRemaining <= 30
                }).length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <ShieldX className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Vencidas</p>
              <p className="text-xl font-bold text-white">
                {licenses.filter(l => l.status === 'expired').length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Create License Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Crear Nueva Licencia</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Asignar Usuario */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Asignar Licencia a Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  {...register('trainer_id')}
                  className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                >
                  <option value="">Selecciona un usuario...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} (@{user.username}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>
              {errors.trainer_id && (
                <p className="mt-1 text-sm text-red-400">{errors.trainer_id.message}</p>
              )}
            </div>

            {/* License Key */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Clave de Licencia
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register('license_key')}
                    type="text"
                    placeholder="AGC-2024-XXXXXX"
                    className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setValue('license_key', generateLicenseKey())}
                  className="px-4 py-3 bg-accent-primary/20 border border-accent-primary/30 rounded-lg text-accent-primary hover:bg-accent-primary/30 transition-all duration-300"
                >
                  Generar
                </motion.button>
              </div>
              {errors.license_key && (
                <p className="mt-1 text-sm text-red-400">{errors.license_key.message}</p>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fecha de Expiración
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => quickSetExpiry('month')}
                    className="px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-slate-300 hover:bg-dark-200/70 transition-all text-sm"
                  >
                    +1 Mes
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => quickSetExpiry('year')}
                    className="px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-slate-300 hover:bg-dark-200/70 transition-all text-sm"
                  >
                    +1 Año
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => quickSetExpiry('2years')}
                    className="px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-slate-300 hover:bg-dark-200/70 transition-all text-sm"
                  >
                    +2 Años
                  </motion.button>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...register('expiry_date')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                  />
                </div>
              </div>
              {errors.expiry_date && (
                <p className="mt-1 text-sm text-red-400">{errors.expiry_date.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isCreating}
              className="w-full py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creando Licencia...' : 'Crear Licencia'}
            </motion.button>
          </form>
        </motion.div>
      )}

      {/* Licenses List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Licencias Registradas</h3>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Cargando licencias...</div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-dark-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No hay licencias registradas</h3>
            <p className="text-sm text-slate-400">Crea tu primera licencia para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {licenses.map((license, index) => {
              const daysRemaining = calculateDaysRemaining(license.expiry_date)

              return (
                <motion.div
                  key={license.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-dark-200/30 rounded-lg border border-white/5 hover:bg-dark-200/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">
                          {license.user_profile?.full_name || 'Usuario no encontrado'}
                        </h4>
                        <p className="text-xs text-slate-400">
                          @{license.user_profile?.username} • {license.user_profile?.role}
                        </p>
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(license.status)}`}>
                      {getStatusIcon(license.status)}
                      <span>
                        {license.status === 'active' ? 'Activa' : 'Vencida'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 mb-1">Clave de Licencia</p>
                      <p className="text-white font-mono">{license.license_key}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 mb-1">Expira</p>
                      <p className="text-white">
                        {format(new Date(license.expiry_date), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 mb-1">Días Restantes</p>
                      <p className={`font-medium ${
                        daysRemaining > 30 ? 'text-status-active' :
                        daysRemaining > 0 ? 'text-status-warning' : 'text-status-expired'
                      }`}>
                        {daysRemaining > 0 ? `${daysRemaining} días` : 'Vencida'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 mb-1">Creada</p>
                      <p className="text-white">
                        {format(new Date(license.created_at), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* User Management Modal */}
      {showUserManagement && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}

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