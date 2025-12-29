import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useNutritionPlans } from '@/hooks/useNutritionPlans'
import { UtensilsCrossed, Search, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { MdAddCircleOutline } from 'react-icons/md'
import { CgCopy } from 'react-icons/cg'
import type { NutritionPlanTemplate } from '@/types/nutrition'
import { nutritionGoalLabels } from '@/types/nutrition'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function NutritionPlanTemplates() {
  const navigate = useNavigate()
  const { templates, loading, deletePlanTemplate } = useNutritionPlans()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta plantilla?')) {
      try {
        await deletePlanTemplate(id)
      } catch (error) {
        console.error('Error deleting template:', error)
      }
    }
  }

  const getGoalColor = (goal?: string) => {
    switch (goal) {
      case 'volumen':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
      case 'definicion':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-400'
      case 'perdida_peso':
        return 'bg-red-500/20 border-red-500/30 text-red-400'
      default:
        return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-dark-300/80 backdrop-blur-lg border-b border-white/10 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg bg-dark-200/50 border border-white/10 text-slate-400 hover:text-accent-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-white">Planes Alimenticios</h1>
          </div>

          {/* Add Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/nutrition-plans/new')}
            className="p-3 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl text-white shadow-lg shadow-accent-primary/30 hover:shadow-accent-primary/50 transition-all duration-300"
          >
            <MdAddCircleOutline className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar planes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
          />
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {filteredTemplates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <UtensilsCrossed className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? 'No se encontraron planes' : 'No hay planes creados'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza creando tu primera plantilla de plan alimenticio'}
            </p>
            {!searchTerm && (
              <motion.button
                onClick={() => navigate('/nutrition-plans/new')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold rounded-xl shadow-lg shadow-accent-primary/30 hover:shadow-accent-primary/50 transition-all"
              >
                Crear Primer Plan
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredTemplates.map((template, index) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  index={index}
                  onDelete={handleDelete}
                  getGoalColor={getGoalColor}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: NutritionPlanTemplate
  index: number
  onDelete: (id: string) => void
  getGoalColor: (goal?: string) => string
}

function TemplateCard({ template, index, onDelete, getGoalColor }: TemplateCardProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card p-6 hover:shadow-lg hover:shadow-accent-primary/10 transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/nutrition-plans/${template.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-accent-primary transition-colors">
            {template.name}
          </h3>
          {template.description && (
            <p className="text-sm text-slate-400 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/nutrition-plans/${template.id}/edit`)
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-accent-primary/20 border border-accent-primary/30 text-accent-primary rounded-lg hover:bg-accent-primary/30 transition-all"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/nutrition-plans/new?duplicateFrom=${template.id}`)
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
            title="Duplicar"
          >
            <CgCopy className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(template.id)
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Goal Badge */}
      {template.goal && (
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getGoalColor(template.goal)}`}>
            {nutritionGoalLabels[template.goal]}
          </span>
        </div>
      )}

      {/* Macros Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-dark-200/30 rounded-lg border border-white/5">
        <div>
          <p className="text-xs text-slate-400 mb-1">Calorías</p>
          <p className="text-lg font-bold text-white">
            {template.calories || '-'} <span className="text-xs text-slate-400">kcal</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Proteína</p>
          <p className="text-lg font-bold text-blue-400">
            {template.protein_g || '-'} <span className="text-xs text-slate-400">g</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Carbohidratos</p>
          <p className="text-lg font-bold text-orange-400">
            {template.carbs_g || '-'} <span className="text-xs text-slate-400">g</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Grasas</p>
          <p className="text-lg font-bold text-yellow-400">
            {template.fats_g || '-'} <span className="text-xs text-slate-400">g</span>
          </p>
        </div>
      </div>

    </motion.div>
  )
}
