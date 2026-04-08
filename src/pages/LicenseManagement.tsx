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
  Shield,
  ShieldCheck,
  ShieldX,
  Key,
  Calendar,
  User,
  AlertTriangle,
  Users,
  XCircle,
  Edit,
  Trash2,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  Ban,
} from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { format, addMonths, addYears } from 'date-fns'
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
  phone?: string
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all')
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [renewDate, setRenewDate] = useState('')
  const [editDate, setEditDate] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'licenses' | 'payments'>('licenses')
  const [paymentRequests, setPaymentRequests] = useState<any[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
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
            role,
            phone
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
      // Verificar que el usuario no tenga ya una licencia
      const existingLicense = licenses.find(l => l.trainer_id === data.trainer_id)
      if (existingLicense) {
        showToast('Este usuario ya tiene una licencia asignada', 'error')
        setIsCreating(false)
        return
      }

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

  const handleRenewLicense = async () => {
    if (!selectedLicense || !renewDate) {
      showToast('Por favor selecciona una fecha', 'error')
      return
    }

    setIsProcessing(true)
    try {
      const { error } = await supabase
        .from('licenses')
        .update({ expiry_date: renewDate })
        .eq('id', selectedLicense.id)

      if (error) throw error

      showToast('¡Licencia renovada exitosamente!', 'success')
      setShowRenewModal(false)
      setSelectedLicense(null)
      setRenewDate('')
      await fetchLicenses()
    } catch (error: any) {
      showToast(error.message || 'Error al renovar licencia', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditLicense = async () => {
    if (!selectedLicense || !editDate) {
      showToast('Por favor selecciona una fecha', 'error')
      return
    }

    setIsProcessing(true)
    try {
      const { error } = await supabase
        .from('licenses')
        .update({ expiry_date: editDate })
        .eq('id', selectedLicense.id)

      if (error) throw error

      showToast('¡Licencia editada exitosamente!', 'success')
      setShowEditModal(false)
      setSelectedLicense(null)
      setEditDate('')
      await fetchLicenses()
    } catch (error: any) {
      showToast(error.message || 'Error al editar licencia', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const openDeleteModal = (license: License) => {
    setSelectedLicense(license)
    setShowDeleteModal(true)
  }

  const handleDeleteLicense = async () => {
    if (!selectedLicense) return

    setIsProcessing(true)
    try {
      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', selectedLicense.id)

      if (error) throw error

      showToast('¡Licencia eliminada exitosamente!', 'success')
      setShowDeleteModal(false)
      setSelectedLicense(null)
      await fetchLicenses()
    } catch (error: any) {
      showToast(error.message || 'Error al eliminar licencia', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const openRenewModal = (license: License) => {
    setSelectedLicense(license)
    setRenewDate(license.expiry_date)
    setShowRenewModal(true)
  }

  const openEditModal = (license: License) => {
    setSelectedLicense(license)
    setEditDate(license.expiry_date)
    setShowEditModal(true)
  }

  const quickSetRenewDate = (period: 'month' | 'year' | '2years') => {
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

    setRenewDate(expiryDate.toISOString().split('T')[0])
  }

  const quickSetEditDate = (period: 'month' | 'year' | '2years') => {
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

    setEditDate(expiryDate.toISOString().split('T')[0])
  }

  const fetchPayments = async () => {
    setPaymentsLoading(true)
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) setPaymentRequests(data)
    } finally {
      setPaymentsLoading(false)
    }
  }

  const handleApprovePayment = async (payment: any) => {
    setIsProcessing(true)
    try {
      // Buscar la licencia existente del trainer
      const { data: existingLicense } = await supabase
        .from('licenses')
        .select('*')
        .eq('trainer_id', payment.trainer_profile_id)
        .single()

      const baseDate = existingLicense?.expiry_date
        ? new Date(existingLicense.expiry_date) > new Date()
          ? new Date(existingLicense.expiry_date)
          : new Date()
        : new Date()

      const newExpiry = addMonths(baseDate, 1).toISOString().split('T')[0]

      if (existingLicense) {
        await supabase
          .from('licenses')
          .update({ expiry_date: newExpiry, status: 'active' })
          .eq('id', existingLicense.id)
      } else {
        await supabase.from('licenses').insert({
          license_key: `PAY-${payment.id.slice(0, 8).toUpperCase()}`,
          trainer_id: payment.trainer_profile_id,
          expiry_date: newExpiry,
          status: 'active',
        })
      }

      await supabase
        .from('payment_requests')
        .update({ status: 'approved' })
        .eq('id', payment.id)

      // Notificar al coach por push
      if (payment.auth_user_id) {
        const expiryFormatted = format(new Date(newExpiry), "d 'de' MMMM yyyy", { locale: es })
        fetch('/api/notify-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coachAuthUserId: payment.auth_user_id,
            coachName: payment.full_name || 'Coach',
            expiryDate: expiryFormatted,
          }),
        }).catch(() => {})
      }

      showToast('Licencia activada correctamente', 'success')
      fetchPayments()
    } catch (err: any) {
      showToast(err.message || 'Error al aprobar', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    setIsProcessing(true)
    try {
      await supabase
        .from('payment_requests')
        .update({ status: 'rejected' })
        .eq('id', paymentId)
      showToast('Solicitud rechazada', 'success')
      fetchPayments()
    } catch (err: any) {
      showToast(err.message || 'Error al rechazar', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  React.useEffect(() => {
    fetchUsers()
    fetchLicenses()
    fetchPayments()
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

  // Filtrar licencias según el estado seleccionado
  const filteredLicenses = licenses.filter(license => {
    if (statusFilter === 'all') return true

    const daysRemaining = calculateDaysRemaining(license.expiry_date)

    switch (statusFilter) {
      case 'active':
        return daysRemaining > 3
      case 'expiring':
        return daysRemaining > 0 && daysRemaining <= 3
      case 'expired':
        return daysRemaining <= 0
      default:
        return true
    }
  })

  const sendWhatsAppReminder = (license: License) => {
    const daysRemaining = calculateDaysRemaining(license.expiry_date)
    const userName = license.user_profile?.full_name || 'Usuario'
    const userPhone = license.user_profile?.phone

    if (!userPhone) {
      showToast('Este usuario no tiene número de teléfono registrado', 'error')
      return
    }

    // Remover el + del número para WhatsApp
    const phoneNumber = userPhone.replace('+', '')

    let message = ''
    if (daysRemaining <= 0) {
      message = `Hola ${userName},\n\n⚠️ Tu licencia de AccesoGymCoach ha *vencido*.\n\nPara seguir disfrutando de nuestros servicios, por favor renueva tu licencia lo antes posible.\n\n¡Gracias por confiar en nosotros! 💪\n\nAtt: Soporte AccesoGymCoach\n\n---\n_Powered by TecnoAcceso / ElectroShop_`
    } else if (daysRemaining <= 3) {
      message = `Hola ${userName},\n\n⏰ Tu licencia de AccesoGymCoach está *por vencer*.\n\n📅 Te quedan *${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}* para renovar.\n\nRenueva ahora para continuar sin interrupciones.\n\n¡Gracias por confiar en nosotros! 💪\n\nAtt: Soporte AccesoGymCoach\n\n---\n_Powered by TecnoAcceso / ElectroShop_`
    } else {
      message = `Hola ${userName},\n\n✅ Tu licencia de AccesoGymCoach está activa.\n\n📅 Te quedan *${daysRemaining} días* hasta su vencimiento (${format(new Date(license.expiry_date), 'dd/MM/yyyy')}).\n\nSi tienes alguna duda, no dudes en contactarnos.\n\n¡Gracias por confiar en nosotros! 💪\n\nAtt: Soporte AccesoGymCoach\n\n---\n_Powered by TecnoAcceso / ElectroShop_`
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
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
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Usuarios y Licencias</h1>
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/8 pb-0">
        <button
          onClick={() => setActiveTab('licenses')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'licenses'
              ? 'bg-[#1A2332] text-[#00D4FF] border border-b-0 border-white/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          Licencias
        </button>
        <button
          onClick={() => { setActiveTab('payments'); fetchPayments() }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
            activeTab === 'payments'
              ? 'bg-[#1A2332] text-[#00D4FF] border border-b-0 border-white/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Pagos
          {paymentRequests.filter(p => p.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {paymentRequests.filter(p => p.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB: PAGOS ── */}
      {activeTab === 'payments' && (
        <div className="space-y-3">
          {paymentsLoading ? (
            <div className="text-center py-12 text-slate-400">Cargando pagos...</div>
          ) : paymentRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No hay solicitudes de pago</p>
            </div>
          ) : (
            paymentRequests.map(payment => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold text-sm truncate">{payment.full_name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                        payment.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : payment.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {payment.status === 'pending' ? 'Pendiente' : payment.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-400">
                      <span>Banco: <span className="text-white">{payment.bank}</span></span>
                      <span>Ref: <span className="text-white">{payment.reference}</span></span>
                      <span>Fecha: <span className="text-white">{format(new Date(payment.payment_date), 'dd/MM/yyyy')}</span></span>
                      <span>Plan: <span className="text-[#00D4FF]">{payment.amount_eur} EUR/mes</span></span>
                    </div>
                  </div>

                  {payment.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApprovePayment(payment)}
                        disabled={isProcessing}
                        className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
                        title="Aprobar"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRejectPayment(payment.id)}
                        disabled={isProcessing}
                        className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-400 hover:bg-rose-500/30 disabled:opacity-50"
                        title="Rechazar"
                      >
                        <Ban className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 mt-2">
                  {format(new Date(payment.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: LICENCIAS ── */}
      {activeTab === 'licenses' && (
        <div className="space-y-6">

      {/* Stats Cards - Clickeables para filtrar */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStatusFilter(statusFilter === 'all' ? 'all' : 'all')}
          className={`glass-card p-4 text-left transition-all duration-300 ${
            statusFilter === 'all'
              ? 'ring-2 ring-blue-500 bg-blue-500/10'
              : 'hover:bg-white/5'
          }`}
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
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          className={`glass-card p-4 text-left transition-all duration-300 ${
            statusFilter === 'active'
              ? 'ring-2 ring-green-500 bg-green-500/10'
              : 'hover:bg-white/5'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Activas</p>
              <p className="text-xl font-bold text-white">
                {licenses.filter(l => {
                  const daysRemaining = Math.ceil((new Date(l.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return daysRemaining > 3
                }).length}
              </p>
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStatusFilter(statusFilter === 'expiring' ? 'all' : 'expiring')}
          className={`glass-card p-4 text-left transition-all duration-300 ${
            statusFilter === 'expiring'
              ? 'ring-2 ring-yellow-500 bg-yellow-500/10'
              : 'hover:bg-white/5'
          }`}
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
                  return daysRemaining > 0 && daysRemaining <= 3
                }).length}
              </p>
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
          className={`glass-card p-4 text-left transition-all duration-300 ${
            statusFilter === 'expired'
              ? 'ring-2 ring-red-500 bg-red-500/10'
              : 'hover:bg-white/5'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <ShieldX className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Vencidas</p>
              <p className="text-xl font-bold text-white">
                {licenses.filter(l => calculateDaysRemaining(l.expiry_date) <= 0).length}
              </p>
            </div>
          </div>
        </motion.button>
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
                  {users
                    .filter(user => !licenses.some(license => license.trainer_id === user.id))
                    .map((user) => (
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

        {/* Indicador de filtro activo */}
        {statusFilter !== 'all' && (
          <div className="mb-4 flex items-center justify-between p-3 bg-dark-200/50 rounded-lg border border-white/10">
            <span className="text-sm text-slate-300">
              Mostrando: <span className="font-medium text-white">
                {statusFilter === 'active' ? 'Activas' : statusFilter === 'expiring' ? 'Por Vencer' : 'Vencidas'}
              </span>
              {' '}({filteredLicenses.length} de {licenses.length})
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className="text-xs text-accent-primary hover:text-accent-secondary transition-colors"
            >
              Ver todas
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-slate-400">Cargando licencias...</div>
        ) : filteredLicenses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-dark-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {licenses.length === 0 ? 'No hay licencias registradas' : 'No hay licencias con este filtro'}
            </h3>
            <p className="text-sm text-slate-400">
              {licenses.length === 0 ? 'Crea tu primera licencia para comenzar' : 'Prueba con otro filtro'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLicenses.map((license, index) => {
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

                    <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${
                      daysRemaining <= 0 ? getStatusColor('expired') :
                      daysRemaining <= 3 ? getStatusColor('expiring') :
                      getStatusColor('active')
                    }`}>
                      {daysRemaining <= 0 ? getStatusIcon('expired') :
                       daysRemaining <= 3 ? getStatusIcon('expiring') :
                       getStatusIcon('active')}
                      <span>
                        {daysRemaining <= 0 ? 'Vencida' :
                         daysRemaining <= 3 ? 'Por Vencer' :
                         'Activa'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
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
                        daysRemaining > 3 ? 'text-status-active' :
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

                  {/* Action Buttons */}
                  <div className={`grid gap-1.5 pt-3 border-t border-white/5 ${license.user_profile?.phone ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    {/* Botón de WhatsApp */}
                    {license.user_profile?.phone && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => sendWhatsAppReminder(license)}
                        className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                          daysRemaining <= 3 && daysRemaining > 0
                            ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 animate-pulse'
                            : 'bg-slate-600/20 border border-slate-600/30 text-slate-400 hover:bg-slate-600/30'
                        }`}
                        title={`Enviar recordatorio por WhatsApp a ${license.user_profile?.phone}`}
                      >
                        <FaWhatsapp className="w-4 h-4" />
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openRenewModal(license)}
                      className="flex items-center justify-center p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-all duration-200"
                      title="Renovar licencia"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditModal(license)}
                      className="flex items-center justify-center p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-all duration-200"
                      title="Editar licencia"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openDeleteModal(license)}
                      className="flex items-center justify-center p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-all duration-200"
                      title="Eliminar licencia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Renew License Modal */}
      {showRenewModal && selectedLicense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-dark-300 rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Renovar Licencia</h3>
                <p className="text-sm text-slate-400">{selectedLicense.user_profile?.full_name}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fecha de Expiración Actual
                </label>
                <div className="px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-slate-400">
                  {format(new Date(selectedLicense.expiry_date), 'dd MMM yyyy', { locale: es })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nueva Fecha de Expiración
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => quickSetRenewDate('month')}
                      className="px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-slate-300 hover:bg-dark-200/70 transition-all text-sm"
                    >
                      +1 Mes
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => quickSetRenewDate('year')}
                      className="px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-slate-300 hover:bg-dark-200/70 transition-all text-sm"
                    >
                      +1 Año
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => quickSetRenewDate('2years')}
                      className="px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-slate-300 hover:bg-dark-200/70 transition-all text-sm"
                    >
                      +2 Años
                    </motion.button>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      value={renewDate}
                      onChange={(e) => setRenewDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowRenewModal(false)
                  setSelectedLicense(null)
                  setRenewDate('')
                }}
                className="flex-1 py-3 px-4 bg-dark-200/50 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-dark-200/70 transition-all duration-300"
                disabled={isProcessing}
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRenewLicense}
                disabled={isProcessing || !renewDate}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Renovando...' : 'Renovar Licencia'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit License Modal */}
      {showEditModal && selectedLicense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-dark-300 rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Editar Licencia</h3>
                <p className="text-sm text-slate-400">{selectedLicense.user_profile?.full_name}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Clave de Licencia
                </label>
                <div className="px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-slate-400 font-mono">
                  {selectedLicense.license_key}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fecha de Expiración Actual
                </label>
                <div className="px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-slate-400">
                  {format(new Date(selectedLicense.expiry_date), 'dd MMM yyyy', { locale: es })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nueva Fecha de Expiración
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => quickSetEditDate('month')}
                      className="px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-slate-300 hover:bg-dark-200/70 transition-all text-sm"
                    >
                      +1 Mes
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => quickSetEditDate('year')}
                      className="px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-slate-300 hover:bg-dark-200/70 transition-all text-sm"
                    >
                      +1 Año
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => quickSetEditDate('2years')}
                      className="px-3 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-slate-300 hover:bg-dark-200/70 transition-all text-sm"
                    >
                      +2 Años
                    </motion.button>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedLicense(null)
                  setEditDate('')
                }}
                className="flex-1 py-3 px-4 bg-dark-200/50 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-dark-200/70 transition-all duration-300"
                disabled={isProcessing}
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditLicense}
                disabled={isProcessing || !editDate}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Guardando...' : 'Guardar Cambios'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLicense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-dark-300 rounded-2xl border border-red-500/20 p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Confirmar Eliminación</h3>
                <p className="text-sm text-slate-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-white mb-2">
                  ¿Estás seguro de eliminar la licencia de:
                </p>
                <p className="text-lg font-semibold text-red-400">
                  {selectedLicense.user_profile?.full_name}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  @{selectedLicense.user_profile?.username}
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span>Se eliminará permanentemente de la base de datos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span>El usuario podrá recibir una nueva licencia</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span>Esta acción no se puede revertir</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedLicense(null)
                }}
                className="flex-1 py-3 px-4 bg-dark-200/50 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-dark-200/70 transition-all duration-300"
                disabled={isProcessing}
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteLicense}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isProcessing ? 'Eliminando...' : 'Eliminar Licencia'}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <UserManagement
          onClose={() => setShowUserManagement(false)}
          onRefresh={() => {
            fetchUsers()
            fetchLicenses()
          }}
        />
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