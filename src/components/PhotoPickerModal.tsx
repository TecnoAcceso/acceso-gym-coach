import React, { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Image as ImageIcon, X } from 'lucide-react'

interface PhotoPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onPhotoSelect: (file: File) => void
  title?: string
}

export default function PhotoPickerModal({
  isOpen,
  onClose,
  onPhotoSelect,
  title = 'Seleccionar foto'
}: PhotoPickerModalProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onPhotoSelect(file)
      onClose()
    }
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card p-6 w-full max-w-sm border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                {/* Tomar foto */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-lg hover:shadow-lg hover:shadow-accent-primary/20 transition-all"
                >
                  <Camera className="w-6 h-6 text-white" />
                  <span className="text-white font-semibold">Tomar foto</span>
                </motion.button>

                {/* Abrir galería */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all"
                >
                  <ImageIcon className="w-6 h-6 text-white" />
                  <span className="text-white font-semibold">Abrir galería</span>
                </motion.button>
              </div>

              {/* Hidden inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
