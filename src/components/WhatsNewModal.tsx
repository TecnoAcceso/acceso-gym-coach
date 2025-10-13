import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Shield, Lock, Download, CheckCircle, Smartphone } from 'lucide-react'

const CURRENT_VERSION = '1.2.0'
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
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] space-y-6">
            {/* Recuperación de Contraseña */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Recuperación de Contraseña</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    ¿Olvidaste tu contraseña? Ahora puedes recuperarla fácilmente:
                  </p>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Botón "¿Olvidaste tu contraseña?" en el login</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Contraseña temporal enviada automáticamente por WhatsApp</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Proceso simple y seguro sin necesidad de contactar soporte</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Cambio de Contraseña */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Cambio de Contraseña en Configuración</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    Ahora puedes cambiar tu contraseña directamente desde tu perfil:
                  </p>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Accede a Configuración → Cambiar Contraseña</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Verifica tu contraseña actual antes de cambiarla</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Visualización opcional de contraseñas para mayor comodidad</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Exportación a Excel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Exportación de Datos a Excel</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    Respalda toda tu información de forma completa:
                  </p>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Backup completo de clientes y mediciones en un click</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Archivo Excel con formato profesional y organizado</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Incluye información personal, antropométrica y membresías</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Accesible desde Configuración → Respaldo de Datos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Mejoras Adicionales */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Optimizaciones Generales</h3>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Validación de cédulas duplicadas al crear/editar clientes</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Filtro "Por Vencer" optimizado (3 días de antelación)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Manejo mejorado de sesiones (no pierde datos al navegar)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Notificaciones toast para todas las acciones importantes</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Mejor rendimiento y velocidad en toda la aplicación</span>
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
              Desarrollado con 💪 por TecnoAcceso / ElectroShop
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
