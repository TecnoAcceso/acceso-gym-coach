import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useClients } from '@/hooks/useClients'
import { useRoutines } from '@/hooks/useRoutines'
import { useNutritionPlans } from '@/hooks/useNutritionPlans'
import { useAuth } from '@/contexts/AuthContext'
import { Client } from '@/types/client'
import ClientCard from '@/components/ClientCard'
import ClientActionsModal from '@/components/ClientActionsModal'
import StatsCard from '@/components/StatsCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import RenewModal from '@/components/RenewModal'
import MeasurementsModal from '@/components/MeasurementsModal'
import AssignRoutineModal from '@/components/AssignRoutineModal'
import ViewRoutineModal from '@/components/ViewRoutineModal'
import AssignNutritionPlanModal from '@/components/AssignNutritionPlanModal'
import ViewClientNutritionModal from '@/components/ViewClientNutritionModal'
import ViewPhotoModal from '@/components/ViewPhotoModal'
import Toast, { ToastType } from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'
import WhatsNewModal from '@/components/WhatsNewModal'
import { sendRoutineViaWhatsApp } from '@/utils/formatRoutineForWhatsApp'
import { generateRoutinePDF, sendPDFViaWhatsApp } from '@/utils/generateRoutinePDF'
import type { ClientRoutine } from '@/types/routine'
import { Users, AlertTriangle, XCircle, Search } from 'lucide-react'
import { BsPersonFillAdd } from 'react-icons/bs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type FilterType = 'all' | 'active' | 'expiring' | 'expired'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { clients, loading, renewClient, deleteClient } = useClients()
  const {
    templates,
    assignToClient,
    fetchTemplateById,
    fetchClientRoutines,
    unassignFromClient
  } = useRoutines()
  const {
    fetchClientPlans,
    fetchPlanById,
    unassignFromClient: unassignNutritionPlan
  } = useNutritionPlans()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const searchRef = React.useRef<HTMLDivElement>(null)
  const [clientsWithRoutines, setClientsWithRoutines] = useState<Set<string>>(new Set())
  const [clientsWithNutrition, setClientsWithNutrition] = useState<Set<string>>(new Set())
  const [renewModal, setRenewModal] = useState<{
    isOpen: boolean
    client: Client | null
  }>({ isOpen: false, client: null })
  const [measurementsModal, setMeasurementsModal] = useState<{
    isOpen: boolean
    client: Client | null
  }>({ isOpen: false, client: null })
  const [assignRoutineModal, setAssignRoutineModal] = useState<{
    isOpen: boolean
    client: Client | null
  }>({ isOpen: false, client: null })
  const [viewRoutineModal, setViewRoutineModal] = useState<{
    isOpen: boolean
    client: Client | null
    routines: ClientRoutine[]
  }>({ isOpen: false, client: null, routines: [] })
  const [assignNutritionModal, setAssignNutritionModal] = useState<{
    isOpen: boolean
    client: Client | null
  }>({ isOpen: false, client: null })
  const [viewNutritionModal, setViewNutritionModal] = useState<{
    isOpen: boolean
    client: Client | null
    plans: any[]
  }>({ isOpen: false, client: null, plans: [] })
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: ToastType
  }>({ show: false, message: '', type: 'success' })
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    client: Client | null
  }>({ isOpen: false, client: null })
  const [actionsModal, setActionsModal] = useState<{
    isOpen: boolean
    client: Client | null
  }>({ isOpen: false, client: null })
  const [viewPhotoModal, setViewPhotoModal] = useState<{
    isOpen: boolean
    client: Client | null
  }>({ isOpen: false, client: null })

  const stats = React.useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    expiring: clients.filter(c => c.status === 'expiring').length,
    expired: clients.filter(c => c.status === 'expired').length,
  }), [clients])

  const filteredClients = React.useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.cedula.includes(searchTerm) ||
                           client.phone.includes(searchTerm)

      const matchesFilter = filterType === 'all' || client.status === filterType

      return matchesSearch && matchesFilter
    })
  }, [clients, searchTerm, filterType])

  // Load client routines and nutrition plans - only once when component mounts
  React.useEffect(() => {
    const loadClientActivities = async () => {
      if (!clients.length) return

      const routinesSet = new Set<string>()
      const nutritionSet = new Set<string>()

      // Check each client for active routines and nutrition plans
      const promises = clients.map(async (client) => {
        try {
          // Check for routines
          const [routines, plans] = await Promise.all([
            fetchClientRoutines(client.id),
            fetchClientPlans(client.id)
          ])

          if (routines && routines.length > 0) {
            routinesSet.add(client.id)
          }

          if (plans && plans.length > 0) {
            nutritionSet.add(client.id)
          }
        } catch (error) {
          // Silent fail - just won't show indicators for this client
          console.error(`Error loading activities for client ${client.id}:`, error)
        }
      })

      await Promise.all(promises)

      setClientsWithRoutines(routinesSet)
      setClientsWithNutrition(nutritionSet)
    }

    loadClientActivities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients.length])

  if (loading) {
    return <LoadingSpinner />
  }

  const handleStatsCardClick = (filter: FilterType) => {
    setFilterType(filter)
    // Scroll suave al buscador
    setTimeout(() => {
      searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleEdit = (id: string) => {
    navigate(`/clients/edit/${id}`)
  }

  const handleWhatsApp = (client: Client) => {
    const trainerName = user?.full_name || 'Tu entrenador'

    // Calcular días que faltan para vencer (solo para clientes "expiring")
    let daysRemaining = 0
    if (client.status === 'expiring') {
      const today = new Date()
      const [year, month, day] = client.end_date.split('-').map(Number)
      const endDate = new Date(year, month - 1, day)
      const diffTime = endDate.getTime() - today.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const message = client.status === 'expired'
      ? `¡Hola ${client.full_name}! 👋

Esperamos que te encuentres muy bien. Queremos informarte que tu membresía de entrenamiento ha vencido.

No te preocupes, ¡aún estás a tiempo de retomar tu rutina y seguir alcanzando tus metas! 💪🏋️

¿Te gustaría renovar tu plan? Estamos aquí para ayudarte a continuar con tu progreso.

¡Esperamos verte pronto!

Att: ${trainerName}

---
_Powered by TecnoAcceso / ElectroShop_`
      : `¡Hola ${client.full_name}! 👋

Esperamos que estés disfrutando de tu entrenamiento. Te escribimos para recordarte que tu membresía está próxima a vencer en *${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}*. ⏰

Para que no pierdas el ritmo y continues avanzando hacia tus objetivos, te invitamos a renovar tu plan antes de la fecha de vencimiento. 💪🏋️

¿Te gustaría renovar? ¡Estamos aquí para asistirte!

¡Seguimos entrenando juntos!

Att: ${trainerName}

---
_Powered by TecnoAcceso / ElectroShop_`

    const encodedMessage = encodeURIComponent(message)
    const phoneNumber = client.phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const handleRenew = (client: Client) => {
    setRenewModal({ isOpen: true, client })
  }

  const handleMeasurements = (client: Client) => {
    setMeasurementsModal({ isOpen: true, client })
  }

  const handleRoutine = async (client: Client) => {
    // Verificar si el cliente ya tiene una rutina asignada
    const clientRoutines = await fetchClientRoutines(client.id)

    if (clientRoutines.length > 0) {
      // Mostrar modal de ver rutina
      setViewRoutineModal({ isOpen: true, client, routines: clientRoutines })
    } else {
      // Mostrar modal de asignar rutina
      setAssignRoutineModal({ isOpen: true, client })
    }
  }

  const handleNutrition = async (client: Client) => {
    // Verificar si el cliente ya tiene un plan nutricional asignado
    const clientNutritionPlans = await fetchClientPlans(client.id)

    if (clientNutritionPlans.length > 0) {
      // Mostrar modal de ver plan nutricional
      setViewNutritionModal({ isOpen: true, client, plans: clientNutritionPlans })
    } else {
      // Mostrar modal de asignar plan nutricional
      setActionsModal({ isOpen: false, client: null })
      setAssignNutritionModal({ isOpen: true, client })
    }
  }

  const handleViewPhoto = (client: Client) => {
    setViewPhotoModal({ isOpen: true, client })
  }

  const handleAssignRoutine = async (data: {
    routine_template_id: string
    start_date: string
    end_date: string
    notes?: string
    sendWhatsApp?: boolean
    includeImages?: boolean
  }) => {
    if (!assignRoutineModal.client) return

    try {
      await assignToClient({
        client_id: assignRoutineModal.client.id,
        routine_template_id: data.routine_template_id,
        start_date: data.start_date,
        end_date: data.end_date,
        notes: data.notes
      })

      // Si sendWhatsApp es true, formatear y enviar la rutina por WhatsApp
      if (data.sendWhatsApp) {
        const routineTemplate = await fetchTemplateById(data.routine_template_id)
        if (routineTemplate) {
          const trainerName = user?.full_name || 'Tu entrenador'

          // Formatear fechas
          const formatDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-').map(Number)
            const date = new Date(year, month - 1, day)
            return format(date, 'dd MMM yyyy', { locale: es })
          }

          // Si includeImages es true, generar PDF con imágenes
          if (data.includeImages) {
            try {
              const pdfBlob = await generateRoutinePDF({
                routine: routineTemplate,
                clientName: assignRoutineModal.client.full_name,
                trainerName,
                startDate: formatDate(data.start_date),
                endDate: formatDate(data.end_date),
                notes: data.notes
              })

              sendPDFViaWhatsApp(
                pdfBlob,
                assignRoutineModal.client.phone,
                assignRoutineModal.client.full_name,
                routineTemplate.name
              )
            } catch (pdfError) {
              console.error('Error generando PDF:', pdfError)
              setToast({
                show: true,
                message: 'Rutina asignada, pero hubo un error al generar el PDF',
                type: 'error'
              })
              return
            }
          } else {
            // Enviar solo texto sin imágenes
            sendRoutineViaWhatsApp(
              assignRoutineModal.client.phone,
              routineTemplate,
              assignRoutineModal.client.full_name,
              trainerName,
              formatDate(data.start_date),
              formatDate(data.end_date),
              data.notes
            )
          }
        }
      }

      setToast({
        show: true,
        message: data.sendWhatsApp
          ? data.includeImages
            ? '¡Rutina asignada! PDF generado y listo para enviar'
            : '¡Rutina asignada y enviada por WhatsApp!'
          : '¡Rutina asignada exitosamente!',
        type: 'success'
      })
      setAssignRoutineModal({ isOpen: false, client: null })
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || 'Error al asignar rutina',
        type: 'error'
      })
    }
  }

  const handleSendRoutineWhatsApp = (
    routineTemplate: any,
    clientRoutine: ClientRoutine
  ) => {
    if (!viewRoutineModal.client) return

    const trainerName = user?.full_name || 'Tu entrenador'

    // Formatear fechas
    const formatDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return format(date, 'dd MMM yyyy', { locale: es })
    }

    sendRoutineViaWhatsApp(
      viewRoutineModal.client.phone,
      routineTemplate,
      viewRoutineModal.client.full_name,
      trainerName,
      formatDate(clientRoutine.start_date),
      formatDate(clientRoutine.end_date),
      clientRoutine.notes || undefined
    )

    setToast({
      show: true,
      message: 'Rutina enviada por WhatsApp',
      type: 'success'
    })
  }

  const handleUnassignRoutine = async (routineId: string) => {
    try {
      await unassignFromClient(routineId)
      setToast({
        show: true,
        message: 'Rutina desasignada exitosamente',
        type: 'success'
      })
      setViewRoutineModal({ isOpen: false, client: null, routines: [] })
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || 'Error al desasignar rutina',
        type: 'error'
      })
      throw error
    }
  }

  const handleUnassignNutritionPlan = async (planId: string) => {
    try {
      await unassignNutritionPlan(planId)
      setToast({
        show: true,
        message: 'Plan nutricional desasignado exitosamente',
        type: 'success'
      })
      setViewNutritionModal({ isOpen: false, client: null, plans: [] })

      // Recargar la información de clientes con nutrición
      const nutritionSet = new Set<string>()
      for (const client of clients) {
        try {
          const plans = await fetchClientPlans(client.id)
          if (plans && plans.length > 0) {
            nutritionSet.add(client.id)
          }
        } catch (error) {
          console.error(`Error loading nutrition for client ${client.id}:`, error)
        }
      }
      setClientsWithNutrition(nutritionSet)
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || 'Error al desasignar plan nutricional',
        type: 'error'
      })
      throw error
    }
  }

  const handleRenewConfirm = async (clientId: string, duration: number, startDate?: string) => {
    try {
      await renewClient(clientId, duration, startDate)
      setToast({
        show: true,
        message: '¡Membresía renovada exitosamente!',
        type: 'success'
      })
      setRenewModal({ isOpen: false, client: null })
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || 'Error al renovar membresía',
        type: 'error'
      })
    }
  }

  const handleDelete = (clientId: string) => {
    // Buscar el cliente para mostrar su nombre en la confirmación
    const client = clients.find(c => c.id === clientId)
    if (!client) return

    // Abrir modal de confirmación
    setConfirmModal({ isOpen: true, client })
  }

  const handleConfirmDelete = async () => {
    if (!confirmModal.client) return

    try {
      await deleteClient(confirmModal.client.id)
      setToast({
        show: true,
        message: `Cliente ${confirmModal.client.full_name} eliminado exitosamente`,
        type: 'success'
      })
      // Cerrar modal después de eliminar exitosamente
      setConfirmModal({ isOpen: false, client: null })
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || 'Error al eliminar cliente',
        type: 'error'
      })
      // También cerrar modal en caso de error
      setConfirmModal({ isOpen: false, client: null })
    }
  }

  return (
    <div className="p-4 pb-20 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        {/* Logo */}
        <div className="w-14 h-14 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-14 h-14 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
                fallback.classList.remove('hidden');
              }
            }}
          />
          <div className="hidden w-14 h-14 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Centered Title */}
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-white">Inicio</h1>
          <p className="text-sm text-slate-400">Gestión de membresías</p>
        </div>

        {/* Add Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/clients/new')}
          className="p-3 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl text-white shadow-lg shadow-accent-primary/30 hover:shadow-accent-primary/50 transition-all duration-300"
        >
          <BsPersonFillAdd className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="Total"
          value={stats.total}
          icon={Users}
          color="from-blue-500 to-blue-600"
          delay={0.1}
          onClick={() => handleStatsCardClick('all')}
        />
        <StatsCard
          title="Activos"
          value={stats.active}
          icon={Users}
          color="from-green-500 to-green-600"
          delay={0.2}
          onClick={() => handleStatsCardClick('active')}
        />
        <StatsCard
          title="Por Vencer"
          value={stats.expiring}
          icon={AlertTriangle}
          color="from-yellow-500 to-yellow-600"
          delay={0.3}
          onClick={() => handleStatsCardClick('expiring')}
        />
        <StatsCard
          title="Vencidos"
          value={stats.expired}
          icon={XCircle}
          color="from-red-500 to-red-600"
          delay={0.4}
          onClick={() => handleStatsCardClick('expired')}
        />
      </div>

      {/* Search Bar */}
      <motion.div
        ref={searchRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative"
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          initial={{ scale: 1 }}
          animate={searchTerm ? { scale: 1.1, x: 2 } : { scale: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        </motion.div>
        <motion.input
          type="text"
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        />
        <AnimatePresence>
          {searchTerm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors"
            >
              <span className="text-white text-xs">✕</span>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Clients List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <AnimatePresence mode="wait">
          {filteredClients.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-dark-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {searchTerm || filterType !== 'all' ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                {searchTerm || filterType !== 'all'
                  ? 'Intenta con otros términos de búsqueda o filtros'
                  : 'Comienza agregando tu primer cliente'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/clients/new')}
                  className="px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300"
                >
                  Agregar Cliente
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ClientCard
                    client={client}
                    onClick={(client) => setActionsModal({ isOpen: true, client })}
                    hasRoutine={clientsWithRoutines.has(client.id)}
                    hasNutritionPlan={clientsWithNutrition.has(client.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Renew Modal */}
      <RenewModal
        isOpen={renewModal.isOpen}
        client={renewModal.client}
        onClose={() => setRenewModal({ isOpen: false, client: null })}
        onRenew={handleRenewConfirm}
      />

      {/* Measurements Modal */}
      <MeasurementsModal
        isOpen={measurementsModal.isOpen}
        client={measurementsModal.client}
        onClose={() => setMeasurementsModal({ isOpen: false, client: null })}
      />

      {/* Assign Routine Modal */}
      {assignRoutineModal.client && (
        <AssignRoutineModal
          isOpen={assignRoutineModal.isOpen}
          client={assignRoutineModal.client}
          templates={templates}
          onClose={() => setAssignRoutineModal({ isOpen: false, client: null })}
          onAssign={handleAssignRoutine}
          onFetchTemplate={fetchTemplateById}
        />
      )}

      {/* View Routine Modal */}
      {viewRoutineModal.client && (
        <ViewRoutineModal
          isOpen={viewRoutineModal.isOpen}
          client={viewRoutineModal.client}
          clientRoutines={viewRoutineModal.routines}
          onClose={() => setViewRoutineModal({ isOpen: false, client: null, routines: [] })}
          onFetchTemplate={fetchTemplateById}
          onSendWhatsApp={handleSendRoutineWhatsApp}
          onUnassign={handleUnassignRoutine}
          trainerName={user?.full_name || 'Tu entrenador'}
        />
      )}

      {/* Client Actions Modal */}
      {actionsModal.client && (
        <ClientActionsModal
          isOpen={actionsModal.isOpen}
          onClose={() => setActionsModal({ isOpen: false, client: null })}
          client={actionsModal.client}
          onEdit={handleEdit}
          onWhatsApp={handleWhatsApp}
          onRenew={handleRenew}
          onDelete={handleDelete}
          onMeasurements={handleMeasurements}
          onRoutine={handleRoutine}
          onNutrition={handleNutrition}
          onViewPhoto={handleViewPhoto}
        />
      )}

      {/* View Photo Modal */}
      {viewPhotoModal.client && (
        <ViewPhotoModal
          isOpen={viewPhotoModal.isOpen}
          onClose={() => setViewPhotoModal({ isOpen: false, client: null })}
          photoUrl={viewPhotoModal.client.profile_photo_url}
          clientName={viewPhotoModal.client.full_name}
        />
      )}

      {/* Assign Nutrition Plan Modal */}
      {assignNutritionModal.client && (
        <AssignNutritionPlanModal
          isOpen={assignNutritionModal.isOpen}
          onClose={() => setAssignNutritionModal({ isOpen: false, client: null })}
          client={assignNutritionModal.client}
          trainerName={user?.full_name || 'Tu Coach'}
          onSuccess={() => {
            setToast({
              show: true,
              message: 'Plan nutricional asignado exitosamente',
              type: 'success'
            })
            // Recargar badges
            const nutritionSet = new Set(clientsWithNutrition)
            nutritionSet.add(assignNutritionModal.client!.id)
            setClientsWithNutrition(nutritionSet)
          }}
        />
      )}

      {/* View Client Nutrition Plan Modal */}
      {viewNutritionModal.client && (
        <ViewClientNutritionModal
          isOpen={viewNutritionModal.isOpen}
          client={viewNutritionModal.client}
          clientPlans={viewNutritionModal.plans}
          onClose={() => setViewNutritionModal({ isOpen: false, client: null, plans: [] })}
          onFetchTemplate={fetchPlanById}
          onUnassign={handleUnassignNutritionPlan}
          trainerName={user?.full_name || 'Tu Coach'}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, client: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cliente"
        message={
          confirmModal.client
            ? `¿Estás seguro de que deseas eliminar a ${confirmModal.client.full_name}?\n\nEsta acción no se puede deshacer y se eliminarán todos los datos asociados al cliente.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* What's New Modal */}
      <WhatsNewModal />
    </div>
  )
}