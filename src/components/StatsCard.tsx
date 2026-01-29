import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  color: string
  delay?: number
  onClick?: () => void
  isActive?: boolean
}

export default function StatsCard({ title, value, icon: Icon, color, delay = 0, onClick, isActive = false }: StatsCardProps) {
  // Extraer el color base para el glow effect
  const getGlowColor = (colorClass: string, intensity: number = 0.15) => {
    if (colorClass.includes('blue')) return `rgba(59, 130, 246, ${intensity})`
    if (colorClass.includes('green')) return `rgba(34, 197, 94, ${intensity})`
    if (colorClass.includes('yellow')) return `rgba(234, 179, 8, ${intensity})`
    if (colorClass.includes('red')) return `rgba(239, 68, 68, ${intensity})`
    return `rgba(59, 130, 246, ${intensity})`
  }

  const getBorderColor = (colorClass: string) => {
    if (colorClass.includes('blue')) return 'rgba(59, 130, 246, 0.5)'
    if (colorClass.includes('green')) return 'rgba(34, 197, 94, 0.5)'
    if (colorClass.includes('yellow')) return 'rgba(234, 179, 8, 0.5)'
    if (colorClass.includes('red')) return 'rgba(239, 68, 68, 0.5)'
    return 'rgba(59, 130, 246, 0.5)'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
      whileHover={{
        y: -4,
        scale: 1.03,
        boxShadow: `0 20px 40px ${getGlowColor(color, 0.25)}, 0 0 30px ${getGlowColor(color, 0.2)}`
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative glass-card p-4 group overflow-hidden transition-all duration-300 cursor-pointer"
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${getGlowColor(color, 0.15)} 0%, ${getGlowColor(color, 0.05)} 100%)`
          : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(10px)',
        border: isActive ? `2px solid ${getBorderColor(color)}` : '1px solid rgba(255,255,255,0.1)',
        boxShadow: isActive
          ? `0 8px 32px ${getGlowColor(color, 0.3)}, 0 0 20px ${getGlowColor(color, 0.15)}, inset 0 1px 0 ${getGlowColor(color, 0.2)}`
          : `0 8px 16px ${getGlowColor(color, 0.1)}`
      }}
    >
      {/* Glow overlay when active */}
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top left, ${getGlowColor(color, 0.2)} 0%, transparent 60%)`
          }}
        />
      )}

      {/* Shimmer effect on hover */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform-gpu"
        style={{ transition: 'transform 0.8s ease-in-out' }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">{title}</p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring", stiffness: 500, damping: 15 }}
            className="text-2xl font-bold text-white"
          >
            {value}
          </motion.p>
        </div>
        <motion.div
          initial={{ rotate: -180, opacity: 0, scale: 0 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
          whileHover={{ rotate: 5, scale: 1.1 }}
          className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300`}
          style={{
            boxShadow: isActive
              ? `0 8px 24px ${getGlowColor(color, 0.4)}`
              : `0 8px 16px ${getGlowColor(color, 0.2)}`
          }}
        >
          <Icon className="w-6 h-6 text-white drop-shadow-lg" />
        </motion.div>
      </div>
    </motion.div>
  )
}
