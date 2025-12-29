import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit, RefreshCcw, Trash2, UtensilsCrossed, Image } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { TbRulerMeasure2 } from 'react-icons/tb'
import { GiWeightLiftingUp } from 'react-icons/gi'
import type { Client } from '@/types/client'

interface ClientActionsModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
  onEdit: (id: string) => void
  onWhatsApp: (client: Client) => void
  onRenew: (client: Client) => void
  onDelete: (id: string) => void
  onMeasurements: (client: Client) => void
  onRoutine: (client: Client) => void
  onNutrition: (client: Client) => void
  onViewPhoto: (client: Client) => void
}

export default function ClientActionsModal({
  isOpen,
  onClose,
  client,
  onEdit,
  onWhatsApp,
  onRenew,
  onDelete,
  onMeasurements,
  onRoutine,
  onNutrition,
  onViewPhoto
}: ClientActionsModalProps) {
  // WhatsApp solo si tiene teléfono Y está por vencer o vencido
  const canSendWhatsApp = client.phone && client.phone.trim() !== '' &&
                          (client.status === 'expired' || client.status === 'expiring')

  const handleAction = (action: () => void) => {
    action()
    onClose()
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="glass-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold text-white">{client.full_name}</h2>
                  <p className="text-sm text-slate-400">Selecciona una acción</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Actions Grid */}
              <div className="p-6 grid grid-cols-2 gap-3">
                {/* Ver Foto */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(() => onViewPhoto(client))}
                  className="flex flex-col items-center justify-center p-4 bg-pink-500/20 border border-pink-500/30 rounded-xl text-pink-400 hover:bg-pink-500/30 transition-all duration-200 space-y-2"
                >
                  <Image className="w-6 h-6" />
                  <span className="text-sm font-medium">Ver Foto</span>
                </motion.button>

                {/* WhatsApp - If available */}
                {canSendWhatsApp && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(() => onWhatsApp(client))}
                    className="flex flex-col items-center justify-center p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-all duration-200 space-y-2"
                  >
                    <FaWhatsapp className="w-6 h-6" />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </motion.button>
                )}

                {/* Edit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(() => onEdit(client.id))}
                  className="flex flex-col items-center justify-center p-4 bg-accent-primary/20 border border-accent-primary/30 rounded-xl text-accent-primary hover:bg-accent-primary/30 transition-all duration-200 space-y-2"
                >
                  <Edit className="w-6 h-6" />
                  <span className="text-sm font-medium">Editar</span>
                </motion.button>

                {/* Routine */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(() => onRoutine(client))}
                  className="flex flex-col items-center justify-center p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl text-orange-400 hover:bg-orange-500/30 transition-all duration-200 space-y-2"
                >
                  <GiWeightLiftingUp className="w-6 h-6" />
                  <span className="text-sm font-medium">Rutina</span>
                </motion.button>

                {/* Measurements */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(() => onMeasurements(client))}
                  className="flex flex-col items-center justify-center p-4 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/30 transition-all duration-200 space-y-2"
                >
                  <TbRulerMeasure2 className="w-6 h-6" />
                  <span className="text-sm font-medium">Medidas</span>
                </motion.button>

                {/* Nutrition */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(() => onNutrition(client))}
                  className="flex flex-col items-center justify-center p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 hover:bg-emerald-500/30 transition-all duration-200 space-y-2"
                >
                  <UtensilsCrossed className="w-6 h-6" />
                  <span className="text-sm font-medium">Nutrición</span>
                </motion.button>

                {/* Renew */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(() => onRenew(client))}
                  className="flex flex-col items-center justify-center p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-all duration-200 space-y-2"
                >
                  <RefreshCcw className="w-6 h-6" />
                  <span className="text-sm font-medium">Renovar</span>
                </motion.button>

                {/* Delete */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(() => onDelete(client.id))}
                  className="flex flex-col items-center justify-center p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition-all duration-200 space-y-2"
                >
                  <Trash2 className="w-6 h-6" />
                  <span className="text-sm font-medium">Eliminar</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
