import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User } from 'lucide-react'

interface ViewPhotoModalProps {
  isOpen: boolean
  onClose: () => void
  photoUrl?: string
  clientName: string
}

export default function ViewPhotoModal({
  isOpen,
  onClose,
  photoUrl,
  clientName
}: ViewPhotoModalProps) {
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-2xl">
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute -top-12 right-0 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm border border-white/20"
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>

              {/* Photo Container */}
              <div className="glass-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-accent-primary/30 to-accent-secondary/30 border-b border-white/10 px-6 py-4">
                  <h2 className="text-xl font-bold text-white text-center">
                    Foto de Perfil - {clientName}
                  </h2>
                </div>

                {/* Photo */}
                <div className="p-6 flex items-center justify-center bg-dark-300/50">
                  {photoUrl ? (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      src={photoUrl}
                      alt={`Foto de perfil de ${clientName}`}
                      className="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain"
                      onError={(e) => {
                        // Fallback en caso de error al cargar la imagen
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}

                  {/* Fallback - No photo available */}
                  <div
                    className={`flex flex-col items-center justify-center space-y-4 p-12 ${photoUrl ? 'hidden' : 'flex'}`}
                  >
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center border-2 border-white/10">
                      <User className="w-16 h-16 text-white/40" />
                    </div>
                    <p className="text-slate-400 text-center">
                      No hay foto de perfil disponible
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-6 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg transition-all"
                  >
                    Cerrar
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
