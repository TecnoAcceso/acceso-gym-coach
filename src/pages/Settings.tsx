import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLicense } from '@/hooks/useLicense'
import { useClients } from '@/hooks/useClients'
import { ArrowLeft, Key, Shield, User, LogOut, Calendar, CheckCircle, XCircle, ShieldX, Settings as SettingsIcon, Database, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Toast, { ToastType } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import { exportClientsToExcel } from '@/utils/exportToExcel'

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { license } = useLicense()
  const { clients, clearState } = useClients()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: ToastType
  }>({ show: false, message: '', type: 'success' })

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type })
  }

  const handleSignOut = async () => {
    if (isLoggingOut) return // Prevenir múltiples clicks

    try {
      setIsLoggingOut(true)
      console.log('🚪 Iniciando proceso de logout...')

      // Limpiar estado de clientes inmediatamente
      clearState()

      // Ejecutar logout
      await signOut()

      // La navegación se maneja en el AuthContext o por el window.location
      console.log('✅ Logout completado')
    } catch (err: any) {
      console.error('❌ Error durante logout:', err)
      showToast('Error al cerrar sesión. Reintentando...', 'error')

      // Si falla, forzar limpieza y redirección
      clearState()
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })
  }

  const handleExportToExcel = async () => {
    if (!user?.id || clients.length === 0) {
      showToast('No hay clientes para exportar', 'error')
      return
    }

    setIsExporting(true)
    try {
      // Obtener todas las mediciones de todos los clientes
      const clientIds = clients.map(c => c.id)

      const { data: measurements, error } = await supabase
        .from('measurements')
        .select('*')
        .in('client_id', clientIds)
        .order('date', { ascending: false })

      if (error) throw error

      // Exportar a Excel
      await exportClientsToExcel(clients, measurements || [])

      showToast('¡Backup exportado exitosamente!', 'success')
    } catch (error: any) {
      console.error('Error al exportar:', error)
      showToast(error.message || 'Error al exportar datos', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // Simular verificación de superusuario
  const isSuperUser = user?.username === 'admin' || user?.username === 'superuser'

  return (
    <div className="p-4 pb-20 max-w-md mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4 mb-6"
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg bg-dark-200/50 border border-white/10 text-slate-400 hover:text-accent-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">Configuración</h1>
      </motion.div>

      {/* User Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Perfil de Usuario</h3>
            <p className="text-sm text-slate-400">@{user?.username}</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: isLoggingOut ? 1 : 1.02 }}
          whileTap={{ scale: isLoggingOut ? 1 : 0.98 }}
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className={`w-full py-3 px-4 bg-red-500/20 border border-red-500/30 text-red-400 font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
            isLoggingOut
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-red-500/30'
          }`}
        >
          <LogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
          <span>{isLoggingOut ? 'Cerrando Sesión...' : 'Cerrar Sesión'}</span>
        </motion.button>
      </motion.div>

      {/* SuperUser Section */}
      {isSuperUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <SettingsIcon className="w-6 h-6 text-accent-primary" />
            <h3 className="font-semibold text-white">Panel de Administración</h3>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/license-management')}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 text-purple-400 font-medium rounded-lg hover:bg-purple-500/30 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Shield className="w-5 h-5" />
            <span>Gestión de Licencias</span>
          </motion.button>

          <p className="text-xs text-slate-400 mt-3 text-center">
            Acceso exclusivo para superusuarios
          </p>
        </motion.div>
      )}

      {/* License Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-accent-primary" />
          <h3 className="font-semibold text-white">Estado de Licencia</h3>
        </div>

        {/* Current License Status */}
        {license ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-lg border ${
              license.status === 'active'
                ? 'bg-status-active/10 border-status-active/20'
                : 'bg-status-expired/10 border-status-expired/20'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              {license.status === 'active' ? (
                <CheckCircle className="w-5 h-5 text-status-active" />
              ) : (
                <XCircle className="w-5 h-5 text-status-expired" />
              )}
              <span className={`font-medium ${
                license.status === 'active' ? 'text-status-active' : 'text-status-expired'
              }`}>
                Licencia {license.status === 'active' ? 'Activa' : 'Vencida'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Vence el: {formatDate(license.expiry_date)}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Key className="w-4 h-4" />
                <span>Clave: ****{license.license_key.slice(-4)}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-4 bg-slate-500/10 border border-slate-500/20 rounded-lg text-center">
            <ShieldX className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400">No hay licencia registrada</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-6 p-4 bg-dark-200/30 rounded-lg border border-white/5">
          <p className="text-xs text-slate-400 leading-relaxed text-center">
            Para renovar o actualizar tu licencia, contacta a
            <span className="text-accent-primary font-medium"> TecnoAcceso</span>
          </p>
          <p className="text-xs text-slate-400 leading-relaxed text-center">
            
            <span className="text-accent-primary font-medium">0412-0557690 / 0412-7364393</span>
          </p>
        </div>
      </motion.div>

      {/* Backup Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Database className="w-6 h-6 text-accent-primary" />
          <div>
            <h3 className="font-semibold text-white">Respaldo de Datos</h3>
            <p className="text-xs text-slate-400">Exporta todos tus clientes y mediciones</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-400 leading-relaxed">
              El backup incluye:
            </p>
            <ul className="text-xs text-blue-300 mt-2 space-y-1 ml-4">
              <li>• Información personal de clientes</li>
              <li>• Datos antropométricos (peso, altura)</li>
              <li>• Condiciones médicas</li>
              <li>• Historial de membresías</li>
              <li>• Todas las mediciones corporales</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: isExporting ? 1 : 1.02 }}
            whileTap={{ scale: isExporting ? 1 : 0.98 }}
            onClick={handleExportToExcel}
            disabled={isExporting || clients.length === 0}
            className={`w-full py-3 px-4 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 text-green-400 font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
              isExporting || clients.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-green-500/30'
            }`}
          >
            <Download className={`w-5 h-5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>
              {isExporting
                ? 'Exportando...'
                : clients.length === 0
                  ? 'No hay datos para exportar'
                  : `Descargar Backup (${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'})`
              }
            </span>
          </motion.button>

          <p className="text-xs text-slate-400 text-center leading-relaxed">
            El archivo Excel se descargará automáticamente con el nombre
            <span className="text-accent-primary font-medium"> Backup_Clientes_[fecha].xlsx</span>
          </p>
        </div>
      </motion.div>

      {/* Developer Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-slate-400"
      >
      </motion.div>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  )
}