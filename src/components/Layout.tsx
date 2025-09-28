import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLicense } from '@/hooks/useLicense'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, ShieldCheck, ShieldX } from 'lucide-react'
import Navigation from './Navigation'

export default function Layout() {
  const { license } = useLicense()
  const { user } = useAuth()

  const getLicenseStatus = () => {
    if (!license) return { text: 'Sin Licencia', icon: Shield, color: 'text-slate-400' }

    const today = new Date()
    const expiryDate = new Date(license.expiry_date)
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (license.status === 'active' && diffDays > 0) {
      return {
        text: `Licencia: ${diffDays} días restantes`,
        icon: ShieldCheck,
        color: 'text-status-active'
      }
    }

    return { text: 'Licencia Vencida', icon: ShieldX, color: 'text-status-expired' }
  }

  const licenseStatus = getLicenseStatus()
  const Icon = licenseStatus.icon

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 pb-32">
        <Outlet />
      </main>

      {/* Navigation */}
      <Navigation />

      {/* Fixed Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 bg-dark-200/95 backdrop-blur-md border-t border-white/10 p-4"
      >
        <div className="max-w-md mx-auto flex items-center justify-between text-xs">
          <div className={`flex items-center space-x-2 ${licenseStatus.color}`}>
            <Icon className="w-4 h-4" />
            <span className="font-medium">{licenseStatus.text}</span>
          </div>

          <div className="text-slate-400">
            <span>Desarrollado por </span>
            <span className="text-accent-primary font-medium">TecnoAcceso</span>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}