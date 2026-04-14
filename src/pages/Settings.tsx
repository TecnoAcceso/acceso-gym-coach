import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLicense } from '@/hooks/useLicense'
import { useClients } from '@/hooks/useClients'
import { Key, Shield, User, LogOut, Calendar, CheckCircle, XCircle, ShieldX, ShieldCheck, AlertTriangle, Settings as SettingsIcon, Database, Download, Lock, Eye, EyeOff, Camera, Trash2, CreditCard, Save, Ban, CheckCircle2, X, RefreshCw, Edit } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { format, addMonths, addYears } from 'date-fns'
import { es } from 'date-fns/locale'
import Toast, { ToastType } from '@/components/Toast'
import PaymentModal from '@/components/PaymentModal'
import UserManagement from '@/components/UserManagement'
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

  // ── Panel Admin: tabs ─────────────────────────────────────────────────────
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [adminLicenses, setAdminLicenses] = useState<any[]>([])
  const [adminPayments, setAdminPayments] = useState<any[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null)

  const fetchAdminData = async () => {
    setAdminLoading(true)
    try {
      const [usersRes, licensesRes, paymentsRes] = await Promise.all([
        supabase.from('user_profiles').select('*').neq('role', 'superuser').order('full_name'),
        supabase.from('licenses').select(`*, user_profiles!fk_licenses_trainer_id(full_name, username, role, phone)`).order('created_at', { ascending: false }),
        supabase.from('payment_requests').select('*').order('created_at', { ascending: false }),
      ])
      setAdminUsers(usersRes.data || [])
      setAdminLicenses((licensesRes.data || []).map((l: any) => ({
        ...l,
        user_profile: l.user_profiles,
        daysRemaining: Math.ceil((new Date(l.expiry_date).getTime() - new Date().getTime()) / 86400000),
      })))
      setAdminPayments(paymentsRes.data || [])
    } finally {
      setAdminLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperUser) fetchAdminData()
  }, [isSuperUser])

  const handleApprovePayment = async (payment: any) => {
    setIsProcessing(true)
    try {
      const { data: existingLicense } = await supabase.from('licenses').select('*').eq('trainer_id', payment.trainer_profile_id).single()
      const baseDate = existingLicense?.expiry_date && new Date(existingLicense.expiry_date) > new Date()
        ? new Date(existingLicense.expiry_date) : new Date()
      const newExpiry = addMonths(baseDate, 1).toISOString().split('T')[0]
      if (existingLicense) {
        await supabase.from('licenses').update({ expiry_date: newExpiry, status: 'active' }).eq('id', existingLicense.id)
      } else {
        await supabase.from('licenses').insert({ license_key: `PAY-${payment.id.slice(0, 8).toUpperCase()}`, trainer_id: payment.trainer_profile_id, expiry_date: newExpiry, status: 'active' })
      }
      await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', payment.id)
      if (payment.auth_user_id) {
        const expiryFormatted = format(new Date(newExpiry), "d 'de' MMMM yyyy", { locale: es })
        fetch('/api/notify-approval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coachAuthUserId: payment.auth_user_id, coachName: payment.full_name || 'Coach', expiryDate: expiryFormatted }) }).catch(() => {})
      }
      showToast('Licencia activada correctamente', 'success')
      setSelectedPayment(null)
      fetchAdminData()
    } catch (err: any) {
      showToast(err.message || 'Error al aprobar', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    setIsProcessing(true)
    try {
      await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', paymentId)
      showToast('Solicitud rechazada', 'success')
      setSelectedPayment(null)
      fetchAdminData()
    } catch (err: any) {
      showToast(err.message || 'Error al rechazar', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Licencias: filtro, crear, renovar, editar, eliminar
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<any | null>(null)
  const [renewDate, setRenewDate] = useState('')
  const [editDate, setEditDate] = useState('')
  const [isCreatingLicense, setIsCreatingLicense] = useState(false)

  const licenseSchema = z.object({
    license_key: z.string().min(10, 'La clave debe tener al menos 10 caracteres'),
    expiry_date: z.string().min(1, 'Selecciona una fecha de expiración'),
    trainer_id: z.string().min(1, 'Selecciona un usuario'),
  })
  const { register: regLic, handleSubmit: handleLic, reset: resetLic, setValue: setLicValue, formState: { errors: licErrors } } = useForm({ resolver: zodResolver(licenseSchema) })

  const generateLicenseKey = () => `AGC-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const quickSetExpiry = (period: 'month' | 'year' | '2years') => {
    const base = new Date()
    const d = period === 'month' ? addMonths(base, 1) : period === 'year' ? addYears(base, 1) : addYears(base, 2)
    setLicValue('expiry_date', d.toISOString().split('T')[0])
  }

  const onCreateLicense = async (data: any) => {
    setIsCreatingLicense(true)
    try {
      if (adminLicenses.some((l: any) => l.trainer_id === data.trainer_id)) {
        showToast('Este usuario ya tiene una licencia asignada', 'error'); setIsCreatingLicense(false); return
      }
      const { error } = await supabase.from('licenses').insert({ license_key: data.license_key, expiry_date: data.expiry_date, trainer_id: data.trainer_id, status: 'active' })
      if (error) throw error
      showToast('¡Licencia creada exitosamente!', 'success')
      resetLic(); setShowCreateForm(false); fetchAdminData()
    } catch (err: any) { showToast(err.message || 'Error al crear licencia', 'error') }
    finally { setIsCreatingLicense(false) }
  }

  const handleRenewLicense = async () => {
    if (!selectedLicense || !renewDate) { showToast('Selecciona una fecha', 'error'); return }
    setIsProcessing(true)
    try {
      const { error } = await supabase.from('licenses').update({ expiry_date: renewDate }).eq('id', selectedLicense.id)
      if (error) throw error
      showToast('¡Licencia renovada!', 'success')
      setShowRenewModal(false); setSelectedLicense(null); setRenewDate(''); fetchAdminData()
    } catch (err: any) { showToast(err.message || 'Error al renovar', 'error') }
    finally { setIsProcessing(false) }
  }

  const handleEditLicense = async () => {
    if (!selectedLicense || !editDate) { showToast('Selecciona una fecha', 'error'); return }
    setIsProcessing(true)
    try {
      const { error } = await supabase.from('licenses').update({ expiry_date: editDate }).eq('id', selectedLicense.id)
      if (error) throw error
      showToast('¡Licencia actualizada!', 'success')
      setShowEditModal(false); setSelectedLicense(null); setEditDate(''); fetchAdminData()
    } catch (err: any) { showToast(err.message || 'Error al editar', 'error') }
    finally { setIsProcessing(false) }
  }

  const handleDeleteLicense = async () => {
    if (!selectedLicense) return
    setIsProcessing(true)
    try {
      const { error } = await supabase.from('licenses').delete().eq('id', selectedLicense.id)
      if (error) throw error
      showToast('Licencia eliminada', 'success')
      setShowDeleteModal(false); setSelectedLicense(null); fetchAdminData()
    } catch (err: any) { showToast(err.message || 'Error al eliminar', 'error') }
    finally { setIsProcessing(false) }
  }

  const calcDays = (expiry: string) => Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / 86400000)

  const filteredLicenses = adminLicenses.filter((l: any) => {
    const d = calcDays(l.expiry_date)
    if (statusFilter === 'active') return d > 3
    if (statusFilter === 'expiring') return d > 0 && d <= 3
    if (statusFilter === 'expired') return d <= 0
    return true
  })

  const sendWhatsApp = (lic: any) => {
    const phone = lic.user_profile?.phone
    if (!phone) { showToast('Este usuario no tiene teléfono registrado', 'error'); return }
    const days = calcDays(lic.expiry_date)
    const name = lic.user_profile?.full_name || 'Usuario'
    let msg = ''
    if (days <= 0) msg = `Hola ${name},\n\n⚠️ Tu licencia de AccesoGymCoach ha *vencido*.\n\nRenueva lo antes posible.\n\n💪 Att: Soporte AccesoGymCoach`
    else if (days <= 3) msg = `Hola ${name},\n\n⏰ Tu licencia está *por vencer* en *${days} ${days === 1 ? 'día' : 'días'}*.\n\nRenueva ahora para continuar sin interrupciones.\n\n💪 Att: Soporte AccesoGymCoach`
    else msg = `Hola ${name},\n\n✅ Tu licencia está activa.\n\n📅 Vence el ${format(new Date(lic.expiry_date), 'dd/MM/yyyy')} (${days} días restantes).\n\n💪 Att: Soporte AccesoGymCoach`
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Tab principal de la página
  const [mainTab, setMainTab] = useState<'config' | 'users' | 'licenses' | 'payments' | 'cobro'>('config')

  return (
    <div className="pb-20 max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 flex items-center justify-between"
      >
        <div className="w-14 h-14 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-14 h-14 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling as HTMLElement
              if (fallback) { fallback.style.display = 'flex'; fallback.classList.remove('hidden') }
            }}
          />
          <div className="hidden w-14 h-14 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full items-center justify-center">
            <SettingsIcon className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
          <p className="text-sm text-slate-400">Ajustes de tu cuenta</p>
        </div>
        <div className="w-14" />
      </motion.div>

      {/* Tab bar — solo visible para superuser */}
      {isSuperUser && (
        <div className="flex border-b border-white/10 px-2 mb-2 overflow-x-auto">
          {(['config', 'users', 'licenses', 'payments', 'cobro'] as const).map((tab) => {
            const labels = { config: 'Config', users: 'Usuarios', licenses: 'Licencias', payments: 'Pagos', cobro: 'Cobro' }
            const isActive = mainTab === tab
            return (
              <button
                key={tab}
                onClick={() => setMainTab(tab)}
                className={`flex-shrink-0 px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-accent-primary border-b-2 border-accent-primary'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>
      )}

      <div className="p-4 space-y-6">

        {/* ══════════════ TAB: CONFIGURACIÓN (todos) ══════════════ */}
        {mainTab === 'config' && (
          <>
            {/* Perfil */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center space-x-4 mb-4">
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
                  isLoggingOut ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500/30'
                }`}
              >
                <LogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
                <span>{isLoggingOut ? 'Cerrando Sesión...' : 'Cerrar Sesión'}</span>
              </motion.button>
            </motion.div>

            {/* Cambiar contraseña */}
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña Actual</label>
                  <div className="relative">
                    <input
                      {...register('currentPassword')}
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-accent-primary transition-colors">
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.currentPassword && <p className="mt-1 text-sm text-red-400">{errors.currentPassword.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      {...register('newPassword')}
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-accent-primary transition-colors">
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="mt-1 text-sm text-red-400">{errors.newPassword.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-accent-primary transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>}
                </div>

                <motion.button
                  whileHover={{ scale: isChangingPassword ? 1 : 1.02 }}
                  whileTap={{ scale: isChangingPassword ? 1 : 0.98 }}
                  type="submit"
                  disabled={isChangingPassword}
                  className={`w-full py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                    isChangingPassword ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-accent-primary/30'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span>{isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
                </motion.button>
              </form>
            </motion.div>

            {/* Licencia */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="w-6 h-6 text-accent-primary" />
                <h3 className="font-semibold text-white">Estado de Licencia</h3>
              </div>

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
                    <span className={`font-medium ${license.status === 'active' ? 'text-status-active' : 'text-status-expired'}`}>
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
            </motion.div>

            {/* Respaldo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
                  <p className="text-xs text-blue-400 leading-relaxed">El backup incluye:</p>
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
                    isExporting || clients.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500/30'
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
          </>
        )}

        {/* ══════════════ TAB: USUARIOS (superuser) ══════════════ */}
        {mainTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <UserManagement inline onRefresh={fetchAdminData} />
          </motion.div>
        )}

        {/* ══════════════ TAB: LICENCIAS (superuser) ══════════════ */}
        {mainTab === 'licenses' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Tarjetas filtro */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'all', label: 'Total', color: 'from-blue-500 to-blue-600', icon: Shield, count: adminLicenses.length },
                { id: 'active', label: 'Activas', color: 'from-green-500 to-green-600', icon: ShieldCheck, count: adminLicenses.filter((l: any) => calcDays(l.expiry_date) > 3).length },
                { id: 'expiring', label: 'Por Vencer', color: 'from-yellow-500 to-yellow-600', icon: AlertTriangle, count: adminLicenses.filter((l: any) => { const d = calcDays(l.expiry_date); return d > 0 && d <= 3 }).length },
                { id: 'expired', label: 'Vencidas', color: 'from-red-500 to-red-600', icon: ShieldX, count: adminLicenses.filter((l: any) => calcDays(l.expiry_date) <= 0).length },
              ].map(card => (
                <motion.button key={card.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setStatusFilter(statusFilter === card.id as any ? 'all' : card.id as any)}
                  className={`glass-card p-3 text-left transition-all ${statusFilter === card.id ? 'ring-2 ring-accent-primary' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 bg-gradient-to-r ${card.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <card.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{card.label}</p>
                      <p className="text-lg font-bold text-white">{card.count}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Botón Nueva Licencia */}
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-3 py-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-lg text-white text-sm font-medium flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                {showCreateForm ? 'Cancelar' : 'Nueva Licencia'}
              </motion.button>
            </div>

            {/* Formulario crear licencia */}
            {showCreateForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white">Crear Nueva Licencia</h3>
                <form onSubmit={handleLic(onCreateLicense)} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Usuario</label>
                    <select {...regLic('trainer_id')} className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white text-sm focus:border-accent-primary focus:outline-none">
                      <option value="">Selecciona un usuario...</option>
                      {adminUsers.filter((u: any) => !adminLicenses.some((l: any) => l.trainer_id === u.id)).map((u: any) => (
                        <option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>
                      ))}
                    </select>
                    {licErrors.trainer_id && <p className="text-xs text-red-400 mt-1">{licErrors.trainer_id.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Clave de Licencia</label>
                    <div className="flex gap-2">
                      <input {...regLic('license_key')} placeholder="AGC-2025-XXXXXX" className="flex-1 px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white text-sm focus:border-accent-primary focus:outline-none" />
                      <button type="button" onClick={() => setLicValue('license_key', generateLicenseKey())} className="px-3 py-2 bg-accent-primary/20 border border-accent-primary/30 rounded-lg text-accent-primary text-sm">Generar</button>
                    </div>
                    {licErrors.license_key && <p className="text-xs text-red-400 mt-1">{licErrors.license_key.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Fecha de Expiración</label>
                    <div className="flex gap-2 mb-2">
                      {(['month', 'year', '2years'] as const).map(p => (
                        <button key={p} type="button" onClick={() => quickSetExpiry(p)} className="px-2 py-1 bg-dark-200/50 border border-white/10 rounded text-slate-300 text-xs">
                          {p === 'month' ? '+1 Mes' : p === 'year' ? '+1 Año' : '+2 Años'}
                        </button>
                      ))}
                    </div>
                    <input {...regLic('expiry_date')} type="date" min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white text-sm focus:border-accent-primary focus:outline-none" />
                    {licErrors.expiry_date && <p className="text-xs text-red-400 mt-1">{licErrors.expiry_date.message as string}</p>}
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isCreatingLicense} className="w-full py-2.5 bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-medium rounded-lg disabled:opacity-50">
                    {isCreatingLicense ? 'Creando...' : 'Crear Licencia'}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Lista de licencias */}
            {adminLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-2">
                {statusFilter !== 'all' && (
                  <div className="flex items-center justify-between p-2 bg-dark-200/50 rounded-lg border border-white/10 text-xs">
                    <span className="text-slate-300">Mostrando: <span className="text-white font-medium">{statusFilter === 'active' ? 'Activas' : statusFilter === 'expiring' ? 'Por Vencer' : 'Vencidas'}</span> ({filteredLicenses.length} de {adminLicenses.length})</span>
                    <button onClick={() => setStatusFilter('all')} className="text-accent-primary">Ver todas</button>
                  </div>
                )}
                {filteredLicenses.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No hay licencias en esta categoría.</p>}
                {filteredLicenses.map((lic: any) => {
                  const days = calcDays(lic.expiry_date)
                  const isActive = days > 3
                  const isExpiring = days > 0 && days <= 3
                  const statusColor = isActive ? 'text-green-400' : isExpiring ? 'text-yellow-400' : 'text-red-400'
                  const statusBg = isActive ? 'bg-green-500/10 border-green-500/20' : isExpiring ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'
                  const StatusIcon = isActive ? ShieldCheck : isExpiring ? AlertTriangle : ShieldX
                  return (
                    <div key={lic.id} className={`p-3 rounded-xl border ${statusBg}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{lic.user_profile?.full_name || '—'}</p>
                          <p className="text-xs text-slate-400">@{lic.user_profile?.username}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Vence: {format(new Date(lic.expiry_date), 'dd/MM/yyyy')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className={`text-xs font-semibold ${statusColor}`}>{days > 0 ? `${days}d` : 'Vencida'}</p>
                          <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setSelectedLicense(lic); setRenewDate(lic.expiry_date); setShowRenewModal(true) }} className="flex-1 py-1 text-xs bg-accent-primary/10 border border-accent-primary/20 text-accent-primary rounded-lg flex items-center justify-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Renovar
                        </button>
                        <button onClick={() => { setSelectedLicense(lic); setEditDate(lic.expiry_date); setShowEditModal(true) }} className="flex-1 py-1 text-xs bg-slate-500/10 border border-slate-500/20 text-slate-300 rounded-lg flex items-center justify-center gap-1">
                          <Edit className="w-3 h-3" /> Editar
                        </button>
                        {lic.user_profile?.phone && (
                          <button onClick={() => sendWhatsApp(lic)} className="py-1 px-2 text-xs bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
                            <FaWhatsapp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => { setSelectedLicense(lic); setShowDeleteModal(true) }} className="py-1 px-2 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Modal Renovar */}
            <AnimatePresence>
              {showRenewModal && selectedLicense && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowRenewModal(false) }}>
                  <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} className="w-full max-w-md glass-card p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">Renovar Licencia</h3>
                      <button onClick={() => setShowRenewModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <p className="text-sm text-slate-400">{selectedLicense.user_profile?.full_name}</p>
                    <div className="flex gap-2">
                      {(['month', 'year', '2years'] as const).map(p => (
                        <button key={p} type="button" onClick={() => { const base = new Date(); const d = p === 'month' ? addMonths(base, 1) : p === 'year' ? addYears(base, 1) : addYears(base, 2); setRenewDate(d.toISOString().split('T')[0]) }} className="px-2 py-1 bg-dark-200/50 border border-white/10 rounded text-slate-300 text-xs">
                          {p === 'month' ? '+1 Mes' : p === 'year' ? '+1 Año' : '+2 Años'}
                        </button>
                      ))}
                    </div>
                    <input type="date" value={renewDate} onChange={e => setRenewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white text-sm focus:border-accent-primary focus:outline-none" />
                    <div className="flex gap-3">
                      <button onClick={() => setShowRenewModal(false)} className="flex-1 py-2.5 bg-slate-500/20 border border-slate-500/30 text-slate-300 text-sm rounded-lg">Cancelar</button>
                      <button onClick={handleRenewLicense} disabled={isProcessing} className="flex-1 py-2.5 bg-accent-primary/20 border border-accent-primary/30 text-accent-primary text-sm rounded-lg disabled:opacity-50">{isProcessing ? 'Renovando...' : 'Renovar'}</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal Editar */}
            <AnimatePresence>
              {showEditModal && selectedLicense && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false) }}>
                  <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} className="w-full max-w-md glass-card p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">Editar Licencia</h3>
                      <button onClick={() => setShowEditModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <p className="text-sm text-slate-400">{selectedLicense.user_profile?.full_name}</p>
                    <div className="flex gap-2">
                      {(['month', 'year', '2years'] as const).map(p => (
                        <button key={p} type="button" onClick={() => { const base = new Date(); const d = p === 'month' ? addMonths(base, 1) : p === 'year' ? addYears(base, 1) : addYears(base, 2); setEditDate(d.toISOString().split('T')[0]) }} className="px-2 py-1 bg-dark-200/50 border border-white/10 rounded text-slate-300 text-xs">
                          {p === 'month' ? '+1 Mes' : p === 'year' ? '+1 Año' : '+2 Años'}
                        </button>
                      ))}
                    </div>
                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white text-sm focus:border-accent-primary focus:outline-none" />
                    <div className="flex gap-3">
                      <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-slate-500/20 border border-slate-500/30 text-slate-300 text-sm rounded-lg">Cancelar</button>
                      <button onClick={handleEditLicense} disabled={isProcessing} className="flex-1 py-2.5 bg-accent-primary/20 border border-accent-primary/30 text-accent-primary text-sm rounded-lg disabled:opacity-50">{isProcessing ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal Eliminar */}
            <AnimatePresence>
              {showDeleteModal && selectedLicense && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}>
                  <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} className="w-full max-w-md glass-card p-6 rounded-2xl space-y-4">
                    <h3 className="font-semibold text-white">¿Eliminar licencia?</h3>
                    <p className="text-sm text-slate-400">Se eliminará la licencia de <span className="text-white font-medium">{selectedLicense.user_profile?.full_name}</span>. Esta acción no se puede deshacer.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-slate-500/20 border border-slate-500/30 text-slate-300 text-sm rounded-lg">Cancelar</button>
                      <button onClick={handleDeleteLicense} disabled={isProcessing} className="flex-1 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-lg disabled:opacity-50">{isProcessing ? 'Eliminando...' : 'Eliminar'}</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}

        {/* ══════════════ TAB: PAGOS (superuser) ══════════════ */}
        {mainTab === 'payments' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {adminLoading ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-2">
                {adminPayments.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No hay solicitudes de pago.</p>}
                {adminPayments.map((pay: any) => {
                  const isPending = pay.status === 'pending'
                  const isApproved = pay.status === 'approved'
                  const statusColor = isPending ? 'text-yellow-400' : isApproved ? 'text-green-400' : 'text-red-400'
                  const statusBg = isPending ? 'bg-yellow-500/10 border-yellow-500/20' : isApproved ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                  const statusLabel = isPending ? 'Pendiente' : isApproved ? 'Aprobado' : 'Rechazado'
                  return (
                    <button
                      key={pay.id}
                      onClick={() => setSelectedPayment(pay)}
                      className={`w-full text-left p-3 rounded-xl border ${statusBg} hover:brightness-110 transition-all`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{pay.full_name || '—'}</p>
                          <p className="text-xs text-slate-400">{format(new Date(pay.created_at), 'dd/MM/yyyy HH:mm')}</p>
                          {pay.amount_eur && <p className="text-xs text-accent-primary font-medium mt-0.5">{pay.amount_eur} EUR/mes</p>}
                        </div>
                        <span className={`text-xs font-semibold flex-shrink-0 ${statusColor}`}>{statusLabel}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ TAB: COBRO (superuser) ══════════════ */}
        {mainTab === 'cobro' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-accent-primary" />
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
        )}

      </div>

      {/* Modal detalle de pago */}
      <AnimatePresence>
        {selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedPayment(null) }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="w-full max-w-md glass-card p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Detalle del Pago</h3>
                <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Coach</span>
                  <span className="text-white font-medium">{selectedPayment.full_name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fecha</span>
                  <span className="text-white">{format(new Date(selectedPayment.created_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                {selectedPayment.amount_eur && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Plan</span>
                    <span className="text-accent-primary font-semibold">{selectedPayment.amount_eur} EUR/mes</span>
                  </div>
                )}
                {selectedPayment.amount_bs && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Monto transferido</span>
                    <span className="text-white font-semibold">Bs. {Number(selectedPayment.amount_bs).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {selectedPayment.payment_method && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Método</span>
                    <span className="text-white">{selectedPayment.payment_method}</span>
                  </div>
                )}
                {selectedPayment.reference && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Referencia</span>
                    <span className="text-white">{selectedPayment.reference}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Estado</span>
                  <span className={selectedPayment.status === 'pending' ? 'text-yellow-400' : selectedPayment.status === 'approved' ? 'text-green-400' : 'text-red-400'}>
                    {selectedPayment.status === 'pending' ? 'Pendiente' : selectedPayment.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                  </span>
                </div>
                {selectedPayment.notes && (
                  <div className="text-sm">
                    <span className="text-slate-400 block mb-1">Notas</span>
                    <p className="text-white bg-dark-200/50 rounded-lg p-2 text-xs">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>

              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleRejectPayment(selectedPayment.id)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    Rechazar
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleApprovePayment(selectedPayment)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isProcessing ? 'Procesando...' : 'Aprobar'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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