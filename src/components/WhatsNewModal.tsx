import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, CheckCircle, Link } from 'lucide-react'

const CURRENT_VERSION = '2.3.0'
const STORAGE_KEY = 'whats-new-seen-version'

interface WhatsNewModalProps {
  onClose?: () => void
}

export default function WhatsNewModal({ onClose }: WhatsNewModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seenVersion = localStorage.getItem(STORAGE_KEY)
    if (seenVersion !== CURRENT_VERSION) {
      setShow(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION)
    setShow(false)
    onClose?.()
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-dark-200 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-accent-primary to-accent-secondary px-4 py-3">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2.5 pr-8">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">¡Novedades en AccesoGym Coach!</h2>
                <p className="text-white/80 text-xs">Versión {CURRENT_VERSION} · Nuevas funcionalidades</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-160px)] space-y-3">

            {/* Link compartible de comparación */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-4 border-2 border-accent-primary/50"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Link className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                    Link compartible de comparación
                    <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">NUEVO</span>
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Genera un link único para compartir la comparación de medidas de tu cliente por WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>El cliente debe ingresar su cédula para ver los datos — nadie más puede acceder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Muestra fotos de progreso, tabla de cambios y publicidades — el link expira en 30 días</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>El botón de WhatsApp ahora envía el link directamente — ya no es necesario descargar el PDF</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>


          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-dark-100/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClose}
              className="w-full py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300"
            >
              ¡Entendido, empecemos!
            </motion.button>
            <p className="text-xs text-slate-400 text-center mt-3">
              Desarrollado por TecnoAcceso / ElectroShop
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
