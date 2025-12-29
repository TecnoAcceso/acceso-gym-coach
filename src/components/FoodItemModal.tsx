import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'

interface FoodItem {
  name: string
  quantity: string
}

interface FoodItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (food: FoodItem) => void
  initialData?: FoodItem
}

export default function FoodItemModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: FoodItemModalProps) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name)
      setQuantity(initialData.quantity)
    } else if (isOpen) {
      // Reset form
      setName('')
      setQuantity('')
    }
  }, [isOpen, initialData])

  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor ingresa el nombre del alimento')
      return
    }

    if (!quantity.trim()) {
      alert('Por favor ingresa la cantidad')
      return
    }

    onSave({ name, quantity })
    onClose()
  }

  if (!isOpen) return null

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[111] flex items-center justify-center p-4"
          >
            <div className="glass-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {initialData ? 'Editar Alimento' : 'Agregar Alimento'}
                  </h2>
                  <p className="text-sm text-slate-400">Ingresa los detalles del alimento</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre del Alimento *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Huevos Revueltos, Arroz Integral..."
                    className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                    autoFocus
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ej: 4 unidades, 200g, 1 taza..."
                    className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/10">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-dark-200/50 border border-white/10 text-slate-300 rounded-lg hover:bg-dark-200 transition-all"
                >
                  Cancelar
                </motion.button>

                <motion.button
                  onClick={handleSave}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg shadow-lg shadow-accent-primary/30 hover:shadow-accent-primary/50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
