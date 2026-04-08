import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, CheckCircle, BarChart2, Bell, Layout } from 'lucide-react'

const CURRENT_VERSION = '2.2.0'
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

            {/* Notificaciones Push */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-4 border-2 border-accent-primary/50"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                    Notificaciones Push
                    <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">NUEVO</span>
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Aviso diario a las 8AM cuando un cliente tiene la membresía vencida ese día</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Notificación cuando el administrador aprueba tu pago de licencia</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Aviso 1 día antes de que tu licencia venza para que puedas renovar a tiempo</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Reportes */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4 border-2 border-accent-primary/50"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                    Reportes y estadísticas
                    <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">NUEVO</span>
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Gráfica de renovaciones por mes (últimos 6 meses)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Estado actual de clientes en gráfica tipo dona</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Tasa de retención mensual — cuántos clientes renuevan vs se van</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Mejoras UI */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-4 border-2 border-accent-primary/50"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Layout className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                    Mejoras de interfaz
                    <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">MEJORADO</span>
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Todas las pantallas con header uniforme: logo + título centrado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Renovar licencia disponible en Configuración sin esperar a que venza</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Campo de referencia de pago ahora solo acepta 6 dígitos numéricos</span>
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
