import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLicense } from '@/hooks/useLicense'
import { useClients } from '@/hooks/useClients'
import { ArrowLeft, Key, Shield, User, LogOut, Calendar, CheckCircle, XCircle, ShieldX, Settings as SettingsIcon, Database, Download, Lock, Eye, EyeOff, Camera, Trash2, CreditCard, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Toast, { ToastType } from '@/components/Toast'
import PaymentModal from '@/components/PaymentModal'
import { supabase } from '@/lib/supabase'
import { exportClientsToExcel } from '@/utils/exportToExcel'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { license } = useLicense()
  const { clients, clearState } = useClients()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: ToastType
  }>({ show: false, message: '', type: 'success' })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  })

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type })
  }

  // Cargar avatar actual al montar
  React.useEffect(() => {
    const loadAvatar = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('auth_user_id', user.id)
        .single()
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    }
    loadAvatar()
  }, [user?.id])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    // Solo imágenes, max 2MB
    if (!file.type.startsWith('image/')) {
      showToast('Solo se permiten imágenes', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen no puede superar 2MB', 'error')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `avatars/${user.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('auth_user_id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      showToast('Foto de perfil actualizada', 'success')
    } catch (err: any) {
      showToast(err.message || 'Error al subir la foto', 'error')
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user?.id) return
    setIsUploadingAvatar(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('auth_user_id', user.id)
      if (error) throw error
      setAvatarUrl(null)
      showToast('Foto de perfil eliminada', 'success')
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar la foto', 'error')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const onChangePassword = async (data: ChangePasswordForm) => {
    if (!user) return

    setIsChangingPassword(true)
    try {
      // Construir el email basado en el username (igual que en signIn)
      const knownEmails: Record<string, string> = {
        'admin': 'tecnoacceso2025@gmail.com'
      }

      const email = knownEmails[user.username || ''] || `${user.username}@gmail.com`

      // Verificar contraseña actual intentando iniciar sesión
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: data.currentPassword,
      })

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta')
      }

      // Obtener el perfil del usuario para conseguir su ID
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, username, full_name, role, phone')
        .eq('auth_user_id', user.id)
        .single()

      if (profileError) throw profileError

      // Actualizar contraseña usando la función RPC
      const { data: result, error } = await supabase.rpc('update_user_profile', {
        profile_id: profileData.id,
        new_username: profileData.username,
        new_full_name: profileData.full_name,
        new_role: profileData.role,
        new_phone: profileData.phone || null,
        new_password: data.newPassword
      })

      if (error) throw error

      if (!result.success) {
        throw new Error(result.error || 'Error al cambiar contraseña')
      }

      resetForm()
      showToast('¡Contraseña actualizada exitosamente!', 'success')
    } catch (err: any) {
      console.error('Error changing password:', err)
      showToast(err.message || 'Error al cambiar contraseña', 'error')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    if (isLoggingOut) return // Prevenir múltiples clicks

    try {
      setIsLoggingOut(true)
      console.log('🚪 Iniciando proceso de logout...')

      // Limpiar estado de clientes inmediatamente
      clearState()

      // Ejecutar logout
      await signOut()

      // La navegación se maneja en el AuthContext o por el window.location
      console.log('✅ Logout completado')
    } catch (err: any) {
      console.error('❌ Error durante logout:', err)
      showToast('Error al cerrar sesión. Reintentando...', 'error')

      // Si falla, forzar limpieza y redirección
      clearState()
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })
  }

  const handleExportToExcel = async () => {
    if (!user?.id || clients.length === 0) {
      showToast('No hay clientes para exportar', 'error')
      return
    }

    setIsExporting(true)
    try {
      // Obtener todas las mediciones de todos los clientes
      const clientIds = clients.map(c => c.id)

      const { data: measurements, error: measurementsError } = await supabase
        .from('measurements')
        .select('*')
        .in('client_id', clientIds)
        .order('date', { ascending: false })

      if (measurementsError) throw measurementsError

      // Obtener todas las rutinas asignadas con sus ejercicios
      const { data: clientRoutines, error: routinesError } = await supabase
        .from('client_routines')
        .select(`
          *,
          routine_template:routine_templates(
            name,
            description,
            duration_weeks,
            exercises:routine_exercises(*)
          )
        `)
        .in('client_id', clientIds)
        .order('assigned_date', { ascending: false })

      if (routinesError) throw routinesError

      // Obtener todos los planes nutricionales asignados con sus comidas
      const { data: clientNutritionPlans, error: nutritionError } = await supabase
        .from('client_nutrition_plans')
        .select(`
          *,
          template:nutrition_plan_templates(
            name,
            calories,
            protein_g,
            carbs_g,
            fats_g,
            meals:plan_meals(*)
          )
        `)
        .in('client_id', clientIds)
        .order('assigned_date', { ascending: false })

      if (nutritionError) throw nutritionError

      // Transformar los datos para el export
      const routines = (clientRoutines || []).map(cr => ({
        client_id: cr.client_id,
        routine_name: cr.routine_template?.name || '',
        description: cr.routine_template?.description || '',
        duration_weeks: cr.routine_template?.duration_weeks || 0,
        exercises: cr.routine_template?.exercises || [],
        assigned_date: cr.assigned_date,
        status: cr.status
      }))

      const nutritionPlans = (clientNutritionPlans || []).map(np => ({
        client_id: np.client_id,
        plan_name: np.template?.name || '',
        target_calories: np.template?.calories || '',
        target_protein_g: np.template?.protein_g || '',
        target_carbs_g: np.template?.carbs_g || '',
        target_fats_g: np.template?.fats_g || '',
        meals_count: np.template?.meals?.length || 0,
        meals: np.template?.meals || [], // Incluir todas las comidas para el detalle
        assigned_date: np.assigned_date,
        status: np.status
      }))

      // Obtener todas las fotos de progreso
      const { data: progressPhotos, error: photosError } = await supabase
        .from('progress_photos')
        .select('*')
        .in('client_id', clientIds)
        .order('created_at', { ascending: false })

      if (photosError) throw photosError

      // Exportar a Excel
      await exportClientsToExcel(clients, {
        measurements: measurements || [],
        routines: routines || [],
        nutritionPlans: nutritionPlans || [],
        progressPhotos: progressPhotos || []
      })

      showToast('¡Backup exportado exitosamente!', 'success')
    } catch (error: any) {
      console.error('Error al exportar:', error)
      showToast(error.message || 'Error al exportar datos', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const isSuperUser = user?.role === 'superuser'

  // ── Datos de cobro (solo superuser) ──────────────────────────────────────
  const [paymentSettings, setPaymentSettings] = useState({
    pagomovil_bank: '',
    pagomovil_phone: '',
    pagomovil_cedula: '',
    zelle_email: '',
  })
  const [isSavingPayment, setIsSavingPayment] = useState(false)

  useEffect(() => {
    if (!isSuperUser) return
    const loadSettings = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['pagomovil_bank', 'pagomovil_phone', 'pagomovil_cedula', 'zelle_email'])
      if (data) {
        const mapped: Record<string, string> = {}
        data.forEach((row: { key: string; value: string }) => { mapped[row.key] = row.value || '' })
        setPaymentSettings(prev => ({ ...prev, ...mapped }))
      }
    }
    loadSettings()
  }, [isSuperUser])

  const handleSavePaymentSettings = async () => {
    setIsSavingPayment(true)
    try {
      const updates = Object.entries(paymentSettings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' })
      if (error) throw error
      showToast('Datos de cobro guardados', 'success')
    } catch (err: any) {
      showToast(err.message || 'Error al guardar', 'error')
    } finally {
      setIsSavingPayment(false)
    }
  }

  return (
    <div className="p-4 pb-20 max-w-md mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4 mb-6"
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg bg-dark-200/50 border border-white/10 text-slate-400 hover:text-accent-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">Configuración</h1>
      </motion.div>

      {/* User Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-4 mb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-r from-accent-primary to-accent-secondary flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white">{user?.full_name || 'Usuario'}</h3>
            <p className="text-sm text-slate-400">@{user?.username}</p>
          </div>
        </div>

        {/* Foto de perfil */}
        <div className="mb-4 p-4 bg-dark-200/30 rounded-lg border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-accent-primary" />
            <p className="text-sm font-medium text-white">Foto de perfil</p>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Se mostrara en el carrusel del Landing Page. Max 2MB.
          </p>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: isUploadingAvatar ? 1 : 1.02 }}
              whileTap={{ scale: isUploadingAvatar ? 1 : 0.98 }}
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="flex-1 py-2 px-3 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-sm font-medium rounded-lg hover:bg-accent-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" />
              {isUploadingAvatar ? 'Subiendo...' : avatarUrl ? 'Cambiar foto' : 'Subir foto'}
            </motion.button>
            {avatarUrl && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRemoveAvatar}
                disabled={isUploadingAvatar}
                className="py-2 px-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium rounded-lg hover:bg-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: isLoggingOut ? 1 : 1.02 }}
          whileTap={{ scale: isLoggingOut ? 1 : 0.98 }}
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className={`w-full py-3 px-4 bg-red-500/20 border border-red-500/30 text-red-400 font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
            isLoggingOut
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-red-500/30'
          }`}
        >
          <LogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
          <span>{isLoggingOut ? 'Cerrando Sesión...' : 'Cerrar Sesión'}</span>
        </motion.button>
      </motion.div>

      {/* Change Password Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Lock className="w-6 h-6 text-accent-primary" />
          <div>
            <h3 className="font-semibold text-white">Cambiar Contraseña</h3>
            <p className="text-xs text-slate-400">Actualiza tu contraseña de acceso</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Contraseña Actual
            </label>
            <div className="relative">
              <input
                {...register('currentPassword')}
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-accent-primary transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-accent-primary transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-accent-primary transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: isChangingPassword ? 1 : 1.02 }}
            whileTap={{ scale: isChangingPassword ? 1 : 0.98 }}
            type="submit"
            disabled={isChangingPassword}
            className={`w-full py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
              isChangingPassword
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-lg hover:shadow-accent-primary/30'
            }`}
          >
            <Lock className="w-5 h-5" />
            <span>{isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
          </motion.button>
        </form>
      </motion.div>

      {/* SuperUser Section */}
      {isSuperUser && (
        <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <SettingsIcon className="w-6 h-6 text-accent-primary" />
            <h3 className="font-semibold text-white">Panel de Administración</h3>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/license-management')}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 text-purple-400 font-medium rounded-lg hover:bg-purple-500/30 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Shield className="w-5 h-5" />
            <span>Licencias / Usuarios</span>
          </motion.button>

          <p className="text-xs text-slate-400 mt-3 text-center">
            Acceso exclusivo para superusuarios
          </p>
        </motion.div>

        {/* Datos de cobro — solo superuser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="glass-card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="w-6 h-6 text-accent-primary" />
            <div>
              <h3 className="font-semibold text-white">Datos de Cobro</h3>
              <p className="text-xs text-slate-400">PagoMovil y Zelle para recibir pagos</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Banco (PagoMovil)</label>
              <input
                type="text"
                value={paymentSettings.pagomovil_bank}
                onChange={e => setPaymentSettings(p => ({ ...p, pagomovil_bank: e.target.value }))}
                placeholder="Ej: Banesco"
                className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:border-accent-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Telefono (PagoMovil)</label>
              <input
                type="text"
                value={paymentSettings.pagomovil_phone}
                onChange={e => setPaymentSettings(p => ({ ...p, pagomovil_phone: e.target.value }))}
                placeholder="Ej: 04120557690"
                className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:border-accent-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Cedula (PagoMovil)</label>
              <input
                type="text"
                value={paymentSettings.pagomovil_cedula}
                onChange={e => setPaymentSettings(p => ({ ...p, pagomovil_cedula: e.target.value }))}
                placeholder="Ej: V-12345678"
                className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:border-accent-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Zelle (opcional)</label>
              <input
                type="text"
                value={paymentSettings.zelle_email}
                onChange={e => setPaymentSettings(p => ({ ...p, zelle_email: e.target.value }))}
                placeholder="Ej: correo@gmail.com o telefono"
                className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:border-accent-primary focus:outline-none"
              />
            </div>
            <motion.button
              whileHover={{ scale: isSavingPayment ? 1 : 1.02 }}
              whileTap={{ scale: isSavingPayment ? 1 : 0.98 }}
              onClick={handleSavePaymentSettings}
              disabled={isSavingPayment}
              className="w-full py-2.5 px-4 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-sm font-medium rounded-lg hover:bg-accent-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingPayment ? 'Guardando...' : 'Guardar datos de cobro'}
            </motion.button>
          </div>
        </motion.div>
        </>
      )}

      {/* License Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-accent-primary" />
          <h3 className="font-semibold text-white">Estado de Licencia</h3>
        </div>

        {/* Current License Status */}
        {license ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-lg border ${
              license.status === 'active'
                ? 'bg-status-active/10 border-status-active/20'
                : 'bg-status-expired/10 border-status-expired/20'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              {license.status === 'active' ? (
                <CheckCircle className="w-5 h-5 text-status-active" />
              ) : (
                <XCircle className="w-5 h-5 text-status-expired" />
              )}
              <span className={`font-medium ${
                license.status === 'active' ? 'text-status-active' : 'text-status-expired'
              }`}>
                Licencia {license.status === 'active' ? 'Activa' : 'Vencida'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Vence el: {formatDate(license.expiry_date)}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Key className="w-4 h-4" />
                <span>Clave: ****{license.license_key.slice(-4)}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-4 bg-slate-500/10 border border-slate-500/20 rounded-lg text-center">
            <ShieldX className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400">No hay licencia registrada</p>
          </div>
        )}

        {/* Botón renovar licencia — visible para todos los trainers */}
        {user?.role === 'trainer' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPaymentModal(true)}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30 text-accent-primary font-medium rounded-lg hover:bg-accent-primary/30 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-5 h-5" />
            <span>Renovar Licencia</span>
          </motion.button>
        )}

        {/* Contact Info */}
        <div className="mt-6 p-4 bg-dark-200/30 rounded-lg border border-white/5">
          <p className="text-xs text-slate-400 leading-relaxed text-center">
            Para renovar o actualizar tu licencia, contacta a
            <span className="text-accent-primary font-medium"> TecnoAcceso</span>
          </p>
          <p className="text-xs text-slate-400 leading-relaxed text-center">
            
            <span className="text-accent-primary font-medium">0412-0557690 / 0412-7364393</span>
          </p>
        </div>
      </motion.div>

      {/* Backup Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Database className="w-6 h-6 text-accent-primary" />
          <div>
            <h3 className="font-semibold text-white">Respaldo de Datos</h3>
            <p className="text-xs text-slate-400">Exporta todos tus clientes y mediciones</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-400 leading-relaxed">
              El backup incluye:
            </p>
            <ul className="text-xs text-blue-300 mt-2 space-y-1 ml-4">
              <li>• Información personal de clientes</li>
              <li>• Datos antropométricos (peso, altura)</li>
              <li>• Condiciones médicas</li>
              <li>• Historial de membresías</li>
              <li>• Todas las mediciones corporales</li>
              <li>• Rutinas de ejercicios asignadas</li>
              <li>• Planes nutricionales asignados</li>
              <li>• Detalle de comidas y alimentos</li>
              <li>• Fotos de progreso (URLs)</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: isExporting ? 1 : 1.02 }}
            whileTap={{ scale: isExporting ? 1 : 0.98 }}
            onClick={handleExportToExcel}
            disabled={isExporting || clients.length === 0}
            className={`w-full py-3 px-4 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 text-green-400 font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
              isExporting || clients.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-green-500/30'
            }`}
          >
            <Download className={`w-5 h-5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>
              {isExporting
                ? 'Exportando...'
                : clients.length === 0
                  ? 'No hay datos para exportar'
                  : `Descargar Backup (${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'})`
              }
            </span>
          </motion.button>

          <p className="text-xs text-slate-400 text-center leading-relaxed">
            El archivo Excel se descargará automáticamente con el nombre
            <span className="text-accent-primary font-medium"> Backup_Clientes_[fecha].xlsx</span>
          </p>
        </div>
      </motion.div>

      {/* Developer Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-slate-400"
      >
      </motion.div>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      {/* Modal de pago para renovar licencia */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false)
          showToast('Comprobante enviado. Espera la aprobación del administrador.', 'success')
        }}
      />
    </div>
  )
}