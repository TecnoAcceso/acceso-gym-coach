import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Client } from '@/types/client'
import { X, RefreshCcw, Calendar, Clock } from 'lucide-react'

interface RenewModalProps {
  isOpen: boolean
  client: Client | null
  onClose: () => void
  onRenew: (clientId: string, duration: number) => Promise<void>
}

export default function RenewModal({ isOpen, client, onClose, onRenew }: RenewModalProps) {
  const [selectedDuration, setSelectedDuration] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  if (!client) return null

  const handleRenew = async () => {
    setIsLoading(true)
    try {
      await onRenew(client.id, selectedDuration)
      onClose()
    } catch (error) {
      console.error('Error renovando membresía:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateNewEndDate = () => {
    const today = new Date()
    const newEndDate = new Date(today)
    newEndDate.setMonth(newEndDate.getMonth() + selectedDuration)
    return newEndDate.toLocaleDateString('es-ES')
  }

  const formatDate = (dateString: string) => {
    // Crear fecha local para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return localDate.toLocaleDateString('es-ES')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card p-6 w-full max-w-sm border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <RefreshCcw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Renovar Membresía</h3>
                    <p className="text-xs text-slate-400">{client.full_name}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Current Status */}
              <div className="mb-6 p-3 bg-dark-200/30 rounded-lg border border-white/5">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Estado Actual</span>
                </div>
                <p className="text-sm text-white">
                  Vence: {formatDate(client.end_date)}
                </p>
                <p className={`text-xs font-medium ${
                  client.status === 'expired' ? 'text-status-expired' :
                  client.status === 'expiring' ? 'text-status-warning' :
                  'text-status-active'
                }`}>
                  {client.status === 'expired' ? 'Vencido' :
                   client.status === 'expiring' ? 'Por Vencer' : 'Activo'}
                </p>
              </div>

              {/* Duration Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Nueva Duración
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((duration) => (
                    <motion.button
                      key={duration}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDuration(duration)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        selectedDuration === duration
                          ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                          : 'bg-dark-200/30 border-white/10 text-slate-300 hover:bg-dark-200/50'
                      }`}
                    >
                      {duration} {duration === 1 ? 'mes' : 'meses'}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* New End Date Preview */}
              <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-400">Nueva Fecha de Vencimiento</span>
                </div>
                <p className="text-sm text-white font-medium">{calculateNewEndDate()}</p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-dark-200/50 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-dark-200/70 transition-all duration-300"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRenew}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Renovando...' : 'Renovar'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}