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
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
    accentColor: 'bg-emerald-500',
    label: 'Éxito'
  },
  error: {
    icon: XCircle,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/20',
    accentColor: 'bg-rose-500',
    label: 'Error'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    accentColor: 'bg-amber-500',
    label: 'Advertencia'
  }
}

export default function Toast({ show, message, type, onClose, duration = 4000 }: ToastProps) {
  const config = toastConfig[type]
  const Icon = config.icon
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  React.useEffect(() => {
    if (show) {
      // Reset to expanded when toast appears
      setIsCollapsed(false)

      // Collapse after 2 seconds
      const collapseTimer = setTimeout(() => {
        setIsCollapsed(true)
      }, 2000)

      // Close toast after full duration
      if (duration > 0) {
        const closeTimer = setTimeout(() => {
          onClose()
        }, duration)
        return () => {
          clearTimeout(collapseTimer)
          clearTimeout(closeTimer)
        }
      }

      return () => clearTimeout(collapseTimer)
    }
  }, [show, duration, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            mass: 0.8
          }}
          className="fixed top-4 left-0 right-0 z-[9999] flex justify-center"
        >
          {/* Main Toast Container - Sileo Style */}
          <motion.div
            animate={{
              paddingLeft: isCollapsed ? "12px" : "16px",
              paddingRight: isCollapsed ? "12px" : "16px"
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className={`relative bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden ${isCollapsed ? '' : 'w-full max-w-md mx-4'}`}
          >
            {/* Content */}
            <motion.div
              animate={{
                gap: isCollapsed ? "12px" : "16px",
                paddingTop: isCollapsed ? "10px" : "16px",
                paddingBottom: isCollapsed ? "10px" : "16px"
              }}
              className="flex items-center"
            >
              {/* Icon with colored background */}
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 500,
                  damping: 15
                }}
                className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={2.5} />
              </motion.div>

              {/* Message - Always centered */}
              <div className={isCollapsed ? "flex items-center justify-center whitespace-nowrap" : "flex-1 flex flex-col items-center justify-center"}>
                {/* Label/Title - Always visible and centered */}
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className={`text-xs font-semibold ${config.iconColor}`}
                >
                  {config.label}
                </motion.p>

                {/* Full message - Hides when collapsed */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.p
                      initial={{ opacity: 0, y: -5, height: "auto" }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        marginTop: 0,
                        transition: { duration: 0.3 }
                      }}
                      transition={{ delay: 0.2 }}
                      className="text-white font-medium text-sm leading-snug mt-1 text-center"
                    >
                      {message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </motion.button>
            </motion.div>

            {/* Animated Progress Bar */}
            {duration > 0 && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                className={`h-1 ${config.accentColor} origin-left`}
                style={{ transformOrigin: 'left' }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}