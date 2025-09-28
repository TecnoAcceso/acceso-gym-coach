import React from 'react'
import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { Home, Plus, Settings, Users } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/clients/new', icon: Plus, label: 'Nuevo' },
  { to: '/settings', icon: Settings, label: 'Config' },
]

export default function Navigation() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="fixed bottom-20 left-4 right-4 z-10"
    >
      <div className="max-w-md mx-auto">
        <div className="glass-card p-3">
          <div className="flex items-center justify-around">
            {navItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'text-slate-400 hover:text-accent-primary hover:bg-accent-primary/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center space-y-1"
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-accent-primary' : ''}`} />
                    <span className="text-xs font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="w-1 h-1 bg-accent-primary rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}