import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  color: string
  delay?: number
}

export default function StatsCard({ title, value, icon: Icon, color, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, scale: 1.02 }}
      className="glass-card p-3 hover:shadow-lg hover:shadow-accent-primary/10 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{title}</p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring", stiffness: 500 }}
            className="text-xl font-bold text-white mt-0.5"
          >
            {value}
          </motion.p>
        </div>
        <motion.div
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.5 }}
          className={`w-10 h-10 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
      </div>
    </motion.div>
  )
}