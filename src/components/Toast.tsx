import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning'

interface ToastProps {
  show: boolean
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-status-active/10',
    border: 'border-status-active/20',
    color: 'text-status-active',
    iconColor: 'text-status-active'
  },
  error: {
    icon: XCircle,
    bg: 'bg-status-expired/10',
    border: 'border-status-expired/20',
    color: 'text-status-expired',
    iconColor: 'text-status-expired'
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/20',
    color: 'text-status-warning',
    iconColor: 'text-status-warning'
  }
}

export default function Toast({ show, message, type, onClose, duration = 4000 }: ToastProps) {
  const config = toastConfig[type]
  const Icon = config.icon

  React.useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 500, damping: 30 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className={`glass-card p-4 border ${config.bg} ${config.border} shadow-2xl`}>
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </motion.div>

              <div className="flex-1">
                <p className={`font-medium ${config.color}`}>{message}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Progress bar */}
            {duration > 0 && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                className={`h-1 ${config.color.replace('text-', 'bg-')} rounded-full mt-3 opacity-30`}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}