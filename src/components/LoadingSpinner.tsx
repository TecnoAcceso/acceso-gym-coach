import React from 'react'
import { motion } from 'framer-motion'

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-dark-300 flex items-center justify-center">
      <motion.div
        className="w-16 h-16 border-4 border-accent-primary/20 border-t-accent-primary rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )
}