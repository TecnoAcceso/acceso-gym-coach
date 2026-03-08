import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, CheckCircle } from 'lucide-react'

const CURRENT_VERSION = '2.1.0'
const STORAGE_KEY = 'whats-new-seen-version'

interface WhatsNewModalProps {
  onClose?: () => void
}

export default function WhatsNewModal({ onClose }: WhatsNewModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Verificar si ya vio esta versión
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
          <div className="relative bg-gradient-to-r from-accent-primary to-accent-secondary p-6">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">¡Novedades en AccesoGym Coach!</h2>
                <p className="text-white/80 text-sm">Versión {CURRENT_VERSION}</p>
              </div>
            </div>
            <p className="text-white/90 text-sm mt-2">
              Hemos mejorado tu experiencia con nuevas funcionalidades y optimizaciones
            </p>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] space-y-4">

            {/* Landing Page */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-4 border-2 border-accent-primary/50"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#00D4FF] to-[#0EA5E9] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                    Landing Page publica
                    <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">NUEVO</span>
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Pagina de presentacion de la app accesible sin iniciar sesion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Preview interactivo del dashboard con diseño identico a la app real</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Carrusel de coaches reales conectado a la base de datos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Seccion de funcionalidades, ventajas y CTA</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Foto de perfil del coach */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4 border-2 border-accent-primary/50"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                    Foto de perfil del Coach
                    <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">NUEVO</span>
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Sube tu foto de perfil desde Configuracion para aparecer en el Landing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Tu foto se muestra en el carrusel publico de coaches</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Formato JPG/PNG, maximo 2MB</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Rediseno UI */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-4 border-2 border-accent-primary/50"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                    Rediseno visual de la interfaz
                    <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">NUEVO</span>
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Nuevo sistema de navegacion animado con indicador de posicion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Tarjetas de clientes y estadisticas con efecto glow y gradientes modernos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Toast de notificaciones centrado y con animacion tipo Sileo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Vista de Rutinas con layout compacto y mejorado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Boton volver en Login con icono circular acorde al estilo</span>
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
