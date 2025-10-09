import React from 'react'
import { motion } from 'framer-motion'
import { Client } from '@/types/client'
import { Edit, MessageCircle, User, Phone, Calendar, Clock, RefreshCcw, Trash2, Ruler } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientCardProps {
  client: Client
  onEdit: (id: string) => void
  onWhatsApp: (client: Client) => void
  onRenew: (client: Client) => void
  onDelete: (id: string) => void
  onMeasurements: (client: Client) => void
}

const statusConfig = {
  active: {
    color: 'text-status-active',
    bg: 'bg-status-active/10',
    border: 'border-status-active/20',
    label: 'Activo'
  },
  expiring: {
    color: 'text-status-warning',
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/20',
    label: 'Por Vencer'
  },
  expired: {
    color: 'text-status-expired',
    bg: 'bg-status-expired/10',
    border: 'border-status-expired/20',
    label: 'Vencido'
  }
}

export default function ClientCard({ client, onEdit, onWhatsApp, onRenew, onDelete, onMeasurements }: ClientCardProps) {
  const status = statusConfig[client.status]

  const formatDate = (dateString: string) => {
    // Crear fecha local para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return format(localDate, 'dd MMM yyyy', { locale: es })
  }

  // Calcular días restantes solo si está "por vencer"
  const getDaysRemaining = () => {
    if (client.status !== 'expiring') return null

    const today = new Date()
    const [year, month, day] = client.end_date.split('-').map(Number)
    const endDate = new Date(year, month - 1, day)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const daysRemaining = getDaysRemaining()
  const canSendWhatsApp = client.status === 'expired' || client.status === 'expiring'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="glass-card p-4 hover:shadow-lg hover:shadow-accent-primary/10 transition-all duration-300 relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{client.full_name}</h3>
            <p className="text-xs text-slate-400">
              {client.document_type}-{client.cedula}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.border} ${status.color} border`}>
          <div className={`w-2 h-2 rounded-full mr-1.5 ${status.color.replace('text-', 'bg-')}`} />
          {client.status === 'expiring' && daysRemaining !== null
            ? `${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`
            : status.label
          }
        </div>
      </div>

      {/* Contact Info */}
      <div className="mb-3">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Phone className="w-3.5 h-3.5" />
          <span>{client.phone}</span>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </div>
          <p className="text-white font-medium">{formatDate(client.start_date)}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Fin</span>
          </div>
          <p className="text-white font-medium">{formatDate(client.end_date)}</p>
        </div>
      </div>

      {/* Duration */}
      <div className="mb-4 pb-3 border-b border-white/10">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Duración</span>
          <span className="text-accent-primary font-semibold">
            {client.duration_months} {client.duration_months === 1 ? 'mes' : 'meses'}
          </span>
        </div>
      </div>

      {/* Action Buttons - Single Row */}
      <div className={`grid gap-1.5 ${canSendWhatsApp ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {/* Edit Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(client.id)}
          className="flex items-center justify-center p-2 bg-accent-primary/20 border border-accent-primary/30 rounded-lg text-accent-primary hover:bg-accent-primary/30 transition-all duration-200"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </motion.button>

        {/* Measurements Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onMeasurements(client)}
          className="flex items-center justify-center p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all duration-200"
          title="Medidas"
        >
          <Ruler className="w-4 h-4" />
        </motion.button>

        {/* Renew Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onRenew(client)}
          className="flex items-center justify-center p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-all duration-200"
          title="Renovar"
        >
          <RefreshCcw className="w-4 h-4" />
        </motion.button>

        {/* WhatsApp Button - Conditional */}
        {canSendWhatsApp && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onWhatsApp(client)}
            className="flex items-center justify-center p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-all duration-200"
            title="WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </motion.button>
        )}

        {/* Delete Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(client.id)}
          className="flex items-center justify-center p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-all duration-200"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}