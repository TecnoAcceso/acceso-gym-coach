import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
  loading?: boolean
  loadingText?: string
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning',
  loading = false,
  loadingText = 'Procesando...'
}: ConfirmDialogProps) {
  const typeStyles = {
    danger: {
      icon: 'text-red-400',
      button: 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/30'
    },
    warning: {
      icon: 'text-yellow-400',
      button: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:shadow-yellow-500/30'
    },
    info: {
      icon: 'text-blue-400',
      button: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-blue-500/30'
    }
  }

  const style = typeStyles[type]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-dark-200/50 ${style.icon}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <button
                  onClick={onCancel}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Message */}
              <p className="text-slate-300 mb-6 ml-14">{message}</p>

              {/* Actions */}
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-dark-200/50 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-dark-200/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 ${style.button} text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? loadingText : confirmText}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
