import React from 'react'
import { motion } from 'framer-motion'
import { Client } from '@/types/client'
import { Edit, MessageCircle, User, Phone, Calendar, Clock, RefreshCcw, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientCardProps {
  client: Client
  onEdit: (id: string) => void
  onWhatsApp: (client: Client) => void
  onRenew: (client: Client) => void
  onDelete: (id: string) => void
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

export default function ClientCard({ client, onEdit, onWhatsApp, onRenew, onDelete }: ClientCardProps) {
  const status = statusConfig[client.status]

  const formatDate = (dateString: string) => {
    // Crear fecha local para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return format(localDate, 'dd MMM yyyy', { locale: es })
  }

  const canSendWhatsApp = client.status === 'expired' || client.status === 'expiring'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="glass-card p-3 hover:shadow-lg hover:shadow-accent-primary/10 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs">{client.full_name}</h3>
            <p className="text-[10px] text-slate-400">
              {client.document_type}-{client.cedula}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {canSendWhatsApp && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onWhatsApp(client)}
              className="p-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-all duration-200"
            >
              <MessageCircle className="w-3 h-3" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onRenew(client)}
            className="p-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-all duration-200"
          >
            <RefreshCcw className="w-3 h-3" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(client.id)}
            className="p-1.5 bg-accent-primary/20 border border-accent-primary/30 rounded-lg text-accent-primary hover:bg-accent-primary/30 transition-all duration-200"
          >
            <Edit className="w-3 h-3" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(client.id)}
            className="p-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-all duration-200"
          >
            <Trash2 className="w-3 h-3" />
          </motion.button>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 ${status.bg} ${status.border} ${status.color} border`}>
        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.color.replace('text-', 'bg-')}`} />
        {status.label}
      </div>

      {/* Contact Info */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center space-x-1 text-[10px] text-slate-400">
          <Phone className="w-2.5 h-2.5" />
          <span>{client.phone}</span>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-1 text-slate-400">
            <Calendar className="w-2.5 h-2.5" />
            <span>Inicio</span>
          </div>
          <p className="text-white font-medium">{formatDate(client.start_date)}</p>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center space-x-1 text-slate-400">
            <Clock className="w-2.5 h-2.5" />
            <span>Fin</span>
          </div>
          <p className="text-white font-medium">{formatDate(client.end_date)}</p>
        </div>
      </div>

      {/* Duration */}
      <div className="mt-2 pt-2 border-t border-white/10">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-slate-400">Duración</span>
          <span className="text-accent-primary font-medium">
            {client.duration_months} {client.duration_months === 1 ? 'mes' : 'meses'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}