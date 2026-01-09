import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, CheckCircle } from 'lucide-react'

const CURRENT_VERSION = '2.0.1'
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
            {/* NUEVO EN v2.0.1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-4 border-2 border-accent-primary/50"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">✨</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                    Mejoras v2.0.1
                    <span className="ml-2 text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">NUEVO</span>
                  </h3>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Modal de Selección de Foto:</strong> Ahora al agregar fotos aparece un modal con 2 opciones: "Tomar foto" (abre cámara) o "Abrir galería" (selecciona imagen). Funciona igual en Android y iPhone</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Fotos en Detalles de Medidas:</strong> El modal "Ver detalles" en el historial de medidas ahora muestra las fotos de progreso (frontal, lateral, trasera) si fueron agregadas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Comparación de Medidas Mejorada:</strong> Nuevo flujo de descarga de PDF con 2 botones separados:</span>
                    </li>
                    <li className="ml-6 flex items-start">
                      <span className="mr-2">•</span>
                      <span>Botón "Descargar PDF" (azul) con estados: Generando → Descargando → Completado</span>
                    </li>
                    <li className="ml-6 flex items-start">
                      <span className="mr-2">•</span>
                      <span>Botón "Enviar por WhatsApp" (verde) solo se activa después de descargar el PDF</span>
                    </li>
                    <li className="ml-6 flex items-start">
                      <span className="mr-2">•</span>
                      <span>Mensaje mejorado para el cliente sin referencias técnicas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Optimizaciones móviles:</strong> Mejor experiencia en iPhone y Android con validación de formatos de imagen (JPG, PNG, WEBP)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Sistema de Rutinas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🏋️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Sistema Completo de Rutinas de Entrenamiento</h3>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Creación de rutinas personalizadas con múltiples días de entrenamiento</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Gestor de ejercicios con biblioteca completa (imágenes, descripciones)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Asignación y seguimiento de rutinas por cliente</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Generación automática de PDF con imágenes de ejercicios</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Envío directo por WhatsApp (PDF y texto formateado)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Organización por categorías y niveles de dificultad</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Planes Nutricionales */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🥗</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Gestión Completa de Planes Nutricionales</h3>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Creación de planes nutricionales detallados por comida</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Cálculo automático de calorías y macronutrientes</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Múltiples comidas por día (desayuno, almuerzo, merienda, cena)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Asignación personalizada por cliente</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Exportación a PDF profesional</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Envío automático por WhatsApp</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Sistema de Progreso */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📊</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Sistema de Progreso Mejorado</h3>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Registro completo de mediciones antropométricas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Fotos de progreso antes/durante/después</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Comparación visual entre fotos</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Exportación de reportes completos</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Compartir progreso por WhatsApp con imágenes</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Fotos de Perfil */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📸</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Fotos de Perfil de Clientes</h3>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Subida de fotos de perfil al crear o editar clientes</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Visualización de fotos en las tarjetas de clientes</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Formatos soportados: JPG, JPEG, PNG (máx. 5MB)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Vista previa antes de guardar</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Backup Mejorado */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💾</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Sistema de Backup Completo</h3>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Exportación completa a Excel con 6 hojas organizadas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Hoja 1: Información completa de clientes con fotos de perfil</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Hoja 2: Todas las mediciones corporales históricas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Hoja 3: Rutinas con ejercicios detallados (series, reps, descanso)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Hoja 4: Planes nutricionales con macros y objetivos</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Hoja 5: Detalle de comidas con alimentos, cantidades y valores nutricionales</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Hoja 6: Fotos de progreso con URLs de descarga</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Horarios en formato 12 horas (AM/PM) para mejor legibilidad</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Mejoras de Interfaz */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Mejoras de Interfaz y Experiencia</h3>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Tarjetas de clientes ahora son clickeables para acceso rápido</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Modal de acciones centralizado con todas las opciones del cliente</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Acciones disponibles: Ver detalles, Editar, Renovar, Asignar rutina/plan, Mediciones, Eliminar</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Botones de acción con iconos y estilos mejorados</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Diálogos de confirmación para acciones críticas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Inputs de fecha optimizados para dispositivos móviles (iPhone)</span>
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
