import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Users, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react'

export type FilterType = 'all' | 'active' | 'expiring' | 'expired'

interface FilterMenuProps {
  currentFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  stats: {
    total: number
    active: number
    expiring: number
    expired: number
  }
}

const filterOptions = [
  {
    value: 'all' as FilterType,
    label: 'Todos los Clientes',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  {
    value: 'active' as FilterType,
    label: 'Activos',
    icon: CheckCircle,
    color: 'text-status-active',
    bgColor: 'bg-status-active/10',
    borderColor: 'border-status-active/20'
  },
  {
    value: 'expiring' as FilterType,
    label: 'Por Vencer',
    icon: AlertTriangle,
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/10',
    borderColor: 'border-status-warning/20'
  },
  {
    value: 'expired' as FilterType,
    label: 'Vencidos',
    icon: XCircle,
    color: 'text-status-expired',
    bgColor: 'bg-status-expired/10',
    borderColor: 'border-status-expired/20'
  },
]

export default function FilterMenu({ currentFilter, onFilterChange, stats }: FilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentOption = filterOptions.find(option => option.value === currentFilter)
  const CurrentIcon = currentOption?.icon || Filter

  const getCount = (filter: FilterType) => {
    switch (filter) {
      case 'all': return stats.total
      case 'active': return stats.active
      case 'expiring': return stats.expiring
      case 'expired': return stats.expired
      default: return 0
    }
  }

  const handleFilterSelect = (filter: FilterType) => {
    onFilterChange(filter)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-300 ${
          currentOption
            ? `${currentOption.bgColor} ${currentOption.borderColor} ${currentOption.color}`
            : 'bg-dark-200/30 border-white/10 text-slate-400'
        }`}
      >
        <div className="flex items-center space-x-3">
          <CurrentIcon className="w-5 h-5" />
          <span className="font-medium">{currentOption?.label || 'Filtrar'}</span>
          <span className="px-2 py-1 bg-white/10 rounded-full text-xs font-medium">
            {getCount(currentFilter)}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Filter className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 glass-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 mb-2">
                  <h3 className="text-sm font-semibold text-white">Filtrar Clientes</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Filter Options */}
                <div className="space-y-1">
                  {filterOptions.map((option, index) => {
                    const Icon = option.icon
                    const count = getCount(option.value)
                    const isSelected = currentFilter === option.value

                    return (
                      <motion.button
                        key={option.value}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleFilterSelect(option.value)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 ${
                          isSelected
                            ? `${option.bgColor} ${option.borderColor} ${option.color} border`
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 ${isSelected ? option.color : 'text-slate-400'}`} />
                          <span className="font-medium">{option.label}</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isSelected
                            ? 'bg-white/20'
                            : 'bg-white/10 text-slate-400'
                        }`}>
                          {count}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}