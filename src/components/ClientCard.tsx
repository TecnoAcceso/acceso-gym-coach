import React from 'react'
import { motion } from 'framer-motion'
import { Client } from '@/types/client'
import { User, Phone, Calendar, Clock, UtensilsCrossed } from 'lucide-react'
import { GiWeightLiftingUp } from 'react-icons/gi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientCardProps {
  client: Client
  onClick: (client: Client) => void
  hasRoutine?: boolean
  hasNutritionPlan?: boolean
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

export default function ClientCard({
  client,
  onClick,
  hasRoutine = false,
  hasNutritionPlan = false
}: ClientCardProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(client)}
      className="glass-card p-4 hover:shadow-lg hover:shadow-accent-primary/10 transition-all duration-300 relative cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Profile Photo or Icon */}
          {client.profile_photo_url ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent-primary/50 flex-shrink-0">
              <img
                src={client.profile_photo_url}
                alt={`Foto de ${client.full_name}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback al icono si hay error al cargar la imagen
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.parentElement?.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
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

      {/* Activity Badges */}
      {(hasRoutine || hasNutritionPlan) && (
        <div className="flex items-center gap-2 mb-3">
          {hasRoutine && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <GiWeightLiftingUp className="w-3 h-3 text-orange-400" />
              <span className="text-[10px] text-orange-400 font-medium">Rutina</span>
            </div>
          )}
          {hasNutritionPlan && (
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <UtensilsCrossed className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">Plan Nutricional</span>
            </div>
          )}
        </div>
      )}

      {/* Dates and Duration - Single Row */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-slate-400">
            <Calendar className="w-3 h-3" />
            <span className="text-[10px]">Inicio</span>
          </div>
          <p className="text-white font-medium text-[11px]">{formatDate(client.start_date)}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-slate-400">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">Fin</span>
          </div>
          <p className="text-white font-medium text-[11px]">{formatDate(client.end_date)}</p>
        </div>

        <div className="space-y-1">
          <span className="text-slate-400 text-[10px]">Duración</span>
          <p className="text-accent-primary font-semibold text-[11px]">
            {client.duration_months} {client.duration_months === 1 ? 'mes' : 'meses'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}