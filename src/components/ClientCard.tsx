import { motion } from 'framer-motion'
import { Client } from '@/types/client'
import { User, Phone, CheckCircle2, AlertCircle, XCircle, ArrowRight } from 'lucide-react'
import { GiWeightLiftingUp } from 'react-icons/gi'
import { UtensilsCrossed } from 'lucide-react'
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
    icon: CheckCircle2,
    label: 'Activo',
    chipBg: 'bg-emerald-500/20',
    chipText: 'text-emerald-400',
    chipBorder: 'border-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'border-l-emerald-500',
  },
  expiring: {
    icon: AlertCircle,
    label: 'Por Vencer',
    chipBg: 'bg-amber-500/20',
    chipText: 'text-amber-400',
    chipBorder: 'border-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'border-l-amber-500',
  },
  expired: {
    icon: XCircle,
    label: 'Vencido',
    chipBg: 'bg-red-500/20',
    chipText: 'text-red-400',
    chipBorder: 'border-red-500/30',
    glowColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'border-l-red-500',
  }
}

export default function ClientCard({
  client,
  onClick,
  hasRoutine = false,
  hasNutritionPlan = false
}: ClientCardProps) {
  const status = statusConfig[client.status]
  const StatusIcon = status.icon

  const formatDateShort = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return format(localDate, 'dd MMM', { locale: es })
  }

  // Calcular días restantes
  const getDaysRemaining = () => {
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
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow: `0 12px 40px ${status.glowColor.replace('0.08', '0.25').replace('0.1', '0.3')}, 0 4px 12px rgba(0,0,0,0.4)`
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={() => onClick(client)}
      className={`relative overflow-hidden rounded-xl cursor-pointer border-l-4 ${status.borderColor}`}
      style={{
        background: `linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(11, 20, 38, 0.98) 100%)`,
        boxShadow: `0 4px 24px ${status.glowColor}, 0 1px 3px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Glow effect overlay */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${status.glowColor} 0%, transparent 60%)`
        }}
      />

      <div className="relative p-4">
        {/* Header Row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Profile Photo */}
          {client.profile_photo_url ? (
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0 shadow-lg">
              <img
                src={client.profile_photo_url}
                alt={client.full_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
          )}

          {/* Name & ID */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base truncate">{client.full_name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{client.document_type}-{client.cedula}</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span className="truncate">{client.phone}</span>
              </div>
            </div>
          </div>

          {/* Status Chip */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${status.chipBg} ${status.chipBorder} flex-shrink-0`}>
            <StatusIcon className={`w-3.5 h-3.5 ${status.chipText}`} />
            <span className={`text-xs font-medium ${status.chipText}`}>
              {client.status === 'expiring' && daysRemaining > 0
                ? `${daysRemaining}d`
                : client.status === 'active' ? '✓' : '✗'
              }
            </span>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between">
          {/* Dates */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">{formatDateShort(client.start_date)}</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-white font-medium">{formatDateShort(client.end_date)}</span>
            <span className="text-slate-500 ml-1">
              ({client.duration_months}{client.duration_months === 1 ? 'mes' : 'm'})
            </span>
          </div>

          {/* Activity Icons */}
          <div className="flex items-center gap-1.5">
            {hasRoutine && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center"
                title="Tiene rutina asignada"
              >
                <GiWeightLiftingUp className="w-3.5 h-3.5 text-orange-400" />
              </motion.div>
            )}
            {hasNutritionPlan && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"
                title="Tiene plan nutricional"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
