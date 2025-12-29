import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useRoutines } from '@/hooks/useRoutines'
import LoadingSpinner from '@/components/LoadingSpinner'
import RoutineModal from '@/components/RoutineModal'
import ExerciseManager from '@/components/ExerciseManager'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Search, Edit, Trash2, ListOrdered, ArrowLeft } from 'lucide-react'
import { GiWeightLiftingUp } from 'react-icons/gi'
import { MdAddCircleOutline } from 'react-icons/md'
import type { RoutineTemplate, RoutineCategory } from '@/types/routine'

export default function Routines() {
  const navigate = useNavigate()
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useRoutines()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<RoutineCategory | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineTemplate | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [isExerciseManagerOpen, setIsExerciseManagerOpen] = useState(false)
  const [exerciseRoutine, setExerciseRoutine] = useState<RoutineTemplate | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    routineId: string | null
    routineName: string | null
  }>({ isOpen: false, routineId: null, routineName: null })
  const [deletingRoutine, setDeletingRoutine] = useState(false)

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleCreateRoutine = () => {
    setSelectedRoutine(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditRoutine = (routine: RoutineTemplate) => {
    setSelectedRoutine(routine)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDeleteRoutine = (routine: RoutineTemplate) => {
    setConfirmDialog({
      isOpen: true,
      routineId: routine.id,
      routineName: routine.name
    })
  }

  const confirmDelete = async () => {
    if (!confirmDialog.routineId) return

    try {
      setDeletingRoutine(true)
      await deleteTemplate(confirmDialog.routineId)
      setConfirmDialog({ isOpen: false, routineId: null, routineName: null })
    } catch (err) {
      console.error('Error deleting routine:', err)
    } finally {
      setDeletingRoutine(false)
    }
  }

  const handleSaveRoutine = async (data: any) => {
    if (modalMode === 'create') {
      await createTemplate(data)
    } else if (selectedRoutine) {
      await updateTemplate(selectedRoutine.id, data)
    }
  }

  const handleManageExercises = (routine: RoutineTemplate) => {
    setExerciseRoutine(routine)
    setIsExerciseManagerOpen(true)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const categoryColors = {
    hipertrofia: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    fuerza: 'bg-red-500/20 text-red-400 border-red-500/30',
    resistencia: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    perdida_peso: 'bg-green-500/20 text-green-400 border-green-500/30',
    otro: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }

  const difficultyColors = {
    principiante: 'bg-green-500/20 text-green-400',
    intermedio: 'bg-yellow-500/20 text-yellow-400',
    avanzado: 'bg-red-500/20 text-red-400'
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
            <h1 className="text-xl font-semibold text-white">Rutinas</h1>
          </div>

          {/* Add Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateRoutine}
            className="p-3 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl text-white shadow-lg shadow-accent-primary/30 hover:shadow-accent-primary/50 transition-all duration-300"
          >
            <MdAddCircleOutline className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Search and Filter */}
        <div className="mt-4 flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar rutina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
          >
            <option value="all">Todas</option>
            <option value="hipertrofia">Hipertrofia</option>
            <option value="fuerza">Fuerza</option>
            <option value="resistencia">Resistencia</option>
            <option value="perdida_peso">Pérdida de Peso</option>
            <option value="otro">Otro</option>
          </select>
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
            <GiWeightLiftingUp className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || filterCategory !== 'all'
                ? 'No se encontraron rutinas'
                : 'No hay rutinas creadas'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || filterCategory !== 'all'
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza creando tu primera plantilla de rutina'}
            </p>
            {!searchTerm && filterCategory === 'all' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateRoutine}
                className="px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300"
              >
                Crear Primera Rutina
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-4 hover:shadow-lg hover:shadow-accent-primary/10 transition-all duration-300 cursor-pointer"
                onClick={() => handleManageExercises(template)}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  {/* Header con título, descripción y botones */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-sm text-slate-400 mb-3">
                          {template.description}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1.5 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleManageExercises(template)
                        }}
                        className="flex items-center justify-center p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all duration-200"
                        title="Gestionar ejercicios"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditRoutine(template)
                        }}
                        className="flex items-center justify-center p-2 bg-accent-primary/20 border border-accent-primary/30 rounded-lg text-accent-primary hover:bg-accent-primary/30 transition-all duration-200"
                        title="Editar rutina"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRoutine(template)
                        }}
                        className="flex items-center justify-center p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-all duration-200"
                        title="Eliminar rutina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Badges debajo del título/descripción */}
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {template.category && (
                      <span className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${categoryColors[template.category]}`}>
                        {template.category.replace('_', ' ')}
                      </span>
                    )}
                    {template.difficulty && (
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${difficultyColors[template.difficulty]}`}>
                        {template.difficulty}
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-500/20 text-slate-400 whitespace-nowrap">
                      {template.duration_weeks} {template.duration_weeks === 1 ? 'semana' : 'semanas'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 whitespace-nowrap">
                      {template.exercise_count || 0} {template.exercise_count === 1 ? 'ejercicio' : 'ejercicios'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Routine Modal */}
      <RoutineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRoutine}
        routine={selectedRoutine}
        mode={modalMode}
      />

      {/* Exercise Manager */}
      {exerciseRoutine && (
        <ExerciseManager
          isOpen={isExerciseManagerOpen}
          onClose={() => setIsExerciseManagerOpen(false)}
          routineId={exerciseRoutine.id}
          routineName={exerciseRoutine.name}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Eliminar Rutina"
        message={`¿Estás seguro de eliminar la rutina "${confirmDialog.routineName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={deletingRoutine}
        loadingText="Eliminando..."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, routineId: null, routineName: null })}
      />
    </div>
  )
}
