import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLicense } from '@/hooks/useLicense'
import { ArrowLeft, Key, Shield, User, LogOut, Calendar, CheckCircle, XCircle, ShieldX, Settings as SettingsIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { license } = useLicense()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err: any) {
      console.error('Error signing out:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })
  }

  // Simular verificación de superusuario
  const isSuperUser = user?.username === 'admin' || user?.username === 'superuser'

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          className="w-full py-3 px-4 bg-red-500/20 border border-red-500/30 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
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

      {/* Developer Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center text-sm text-slate-400"
      >
      </motion.div>
    </div>
  )
}