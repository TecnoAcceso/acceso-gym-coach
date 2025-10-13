import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/contexts/AuthContext'
import { Client } from '@/types/client'
import ClientCard from '@/components/ClientCard'
import StatsCard from '@/components/StatsCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import FilterMenu, { FilterType } from '@/components/FilterMenu'
import RenewModal from '@/components/RenewModal'
import MeasurementsModal from '@/components/MeasurementsModal'
import Toast, { ToastType } from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'
import WhatsNewModal from '@/components/WhatsNewModal'
import { Plus, Users, AlertTriangle, XCircle, Search } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { clients, loading, renewClient, deleteClient } = useClients()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [renewModal, setRenewModal] = useState<{
    isOpen: boolean
    client: Client | null
  }>({ isOpen: false, client: null })
  const [measurementsModal, setMeasurementsModal] = useState<{
    isOpen: boolean
    client: Client | null
  }>({ isOpen: false, client: null })
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: ToastType
  }>({ show: false, message: '', type: 'success' })
  const [confirmModal, setConfirmModal] = useState<{
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

  if (loading) {
    return <LoadingSpinner />
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
          <Plus className="w-6 h-6" />
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
        />
        <StatsCard
          title="Activos"
          value={stats.active}
          icon={Users}
          color="from-green-500 to-green-600"
          delay={0.2}
        />
        <StatsCard
          title="Por Vencer"
          value={stats.expiring}
          icon={AlertTriangle}
          color="from-yellow-500 to-yellow-600"
          delay={0.3}
        />
        <StatsCard
          title="Vencidos"
          value={stats.expired}
          icon={XCircle}
          color="from-red-500 to-red-600"
          delay={0.4}
        />
      </div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
          />
        </div>

        {/* Filter Menu */}
        <FilterMenu
          currentFilter={filterType}
          onFilterChange={setFilterType}
          stats={stats}
        />
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
                    onEdit={handleEdit}
                    onWhatsApp={handleWhatsApp}
                    onRenew={handleRenew}
                    onDelete={handleDelete}
                    onMeasurements={handleMeasurements}
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