import React from 'react'
import { motion } from 'framer-motion'
import { ShieldX, Phone, Users, LogOut } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'

interface LicenseExpiredProps {
  onContactSupport?: () => void
}

export default function LicenseExpired({ onContactSupport }: LicenseExpiredProps) {
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleWhatsApp = () => {
    const message = 'Hola, necesito renovar mi licencia para acceder al sistema de gestión de membresías. Por favor, ayúdeme con el proceso.'
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/+584120557690?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const handlePhone = () => {
    window.location.href = 'tel:04120557690'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-100 to-dark-200 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-dark-300 rounded-2xl border border-white/10 p-8 text-center shadow-2xl"
      >
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-4"
        >
          Licencia Vencida
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-300 mb-8 leading-relaxed"
        >
          Tu licencia ha vencido o no está activa. Para continuar usando el sistema de gestión de membresías, necesitas renovar tu licencia.
        </motion.p>

        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Contacta Soporte</h3>

          {/* WhatsApp Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <FaWhatsapp className="w-5 h-5" />
            <span>WhatsApp</span>
          </motion.button>

          {/* Phone Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePhone}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Phone className="w-5 h-5" />
            <span>Teléfono</span>
          </motion.button>

          {/* Custom Contact Button */}
          {onContactSupport && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContactSupport}
              className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Users className="w-5 h-5" />
              <span>Contactar Soporte</span>
            </motion.button>
          )}
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pt-6 border-t border-white/10"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </motion.button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 bg-dark-200/50 rounded-lg border border-white/5"
        >
          <p className="text-sm text-slate-400">
            Una vez renovada tu licencia, podrás acceder nuevamente al sistema completo de gestión de membresías.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}