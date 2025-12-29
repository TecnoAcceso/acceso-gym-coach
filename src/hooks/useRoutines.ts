import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  RoutineTemplate,
  RoutineExercise,
  ClientRoutine,
  CreateRoutineTemplateData,
  UpdateRoutineTemplateData,
  CreateExerciseData,
  UpdateExerciseData,
  AssignRoutineData,
  RoutineTemplateWithExercises
} from '@/types/routine'

export function useRoutines() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<RoutineTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch templates del trainer
  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('trainer_id', user?.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Obtener conteo de ejercicios para cada rutina
      const templatesWithCount = await Promise.all(
        (data || []).map(async (template) => {
          const { count } = await supabase
            .from('routine_exercises')
            .select('*', { count: 'exact', head: true })
            .eq('routine_template_id', template.id)

          return {
            ...template,
            exercise_count: count || 0
          }
        })
      )

      setTemplates(templatesWithCount)
    } catch (err: any) {
      console.error('Error fetching templates:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch template específico con ejercicios
  const fetchTemplateById = async (templateId: string): Promise<RoutineTemplateWithExercises | null> => {
    try {
      const { data: template, error: templateError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError) throw templateError

      const { data: exercises, error: exercisesError } = await supabase
        .from('routine_exercises')
        .select('*')
        .eq('routine_template_id', templateId)
        .order('day_number', { ascending: true })
        .order('order_index', { ascending: true })

      if (exercisesError) throw exercisesError

      return {
        ...template,
        exercises: exercises || []
      }
    } catch (err: any) {
      console.error('Error fetching template:', err)
      setError(err.message)
      return null
    }
  }

  // Crear plantilla de rutina
  const createTemplate = async (data: CreateRoutineTemplateData): Promise<RoutineTemplate> => {
    try {
      const { data: newTemplate, error: createError } = await supabase
        .from('routine_templates')
        .insert({
          ...data,
          trainer_id: user?.id
        })
        .select()
        .single()

      if (createError) throw createError

      setTemplates(prev => [newTemplate, ...prev])
      return newTemplate
    } catch (err: any) {
      console.error('Error creating template:', err)
      setError(err.message)
      throw err
    }
  }

  // Actualizar plantilla de rutina
  const updateTemplate = async (templateId: string, data: UpdateRoutineTemplateData): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('routine_templates')
        .update(data)
        .eq('id', templateId)

      if (updateError) throw updateError

      setTemplates(prev =>
        prev.map(t => (t.id === templateId ? { ...t, ...data, updated_at: new Date().toISOString() } : t))
      )
    } catch (err: any) {
      console.error('Error updating template:', err)
      setError(err.message)
      throw err
    }
  }

  // Eliminar plantilla de rutina
  const deleteTemplate = async (templateId: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('routine_templates')
        .delete()
        .eq('id', templateId)

      if (deleteError) throw deleteError

      setTemplates(prev => prev.filter(t => t.id !== templateId))
    } catch (err: any) {
      console.error('Error deleting template:', err)
      setError(err.message)
      throw err
    }
  }

  // Crear ejercicio
  const createExercise = async (data: CreateExerciseData): Promise<RoutineExercise> => {
    try {
      const { data: newExercise, error: createError } = await supabase
        .from('routine_exercises')
        .insert(data)
        .select()
        .single()

      if (createError) throw createError

      return newExercise
    } catch (err: any) {
      console.error('Error creating exercise:', err)
      setError(err.message)
      throw err
    }
  }

  // Actualizar ejercicio
  const updateExercise = async (exerciseId: string, data: UpdateExerciseData): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('routine_exercises')
        .update(data)
        .eq('id', exerciseId)

      if (updateError) throw updateError
    } catch (err: any) {
      console.error('Error updating exercise:', err)
      setError(err.message)
      throw err
    }
  }

  // Eliminar ejercicio
  const deleteExercise = async (exerciseId: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('id', exerciseId)

      if (deleteError) throw deleteError
    } catch (err: any) {
      console.error('Error deleting exercise:', err)
      setError(err.message)
      throw err
    }
  }

  // Subir foto de ejercicio
  const uploadExercisePhoto = async (file: File, exerciseId: string): Promise<string> => {
    try {
      const fileExtension = file.name.split('.').pop()
      const fileName = `${exerciseId}.${fileExtension}`
      const filePath = `${user?.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exercise-photos')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('exercise-photos')
        .getPublicUrl(uploadData.path)

      return urlData.publicUrl
    } catch (err: any) {
      console.error('Error uploading exercise photo:', err)
      setError(err.message)
      throw err
    }
  }

  // Eliminar foto de ejercicio
  const deleteExercisePhoto = async (photoUrl: string): Promise<void> => {
    try {
      // Extraer el path del URL
      const urlParts = photoUrl.split('/exercise-photos/')
      if (urlParts.length < 2) return

      const filePath = urlParts[1]

      const { error: deleteError } = await supabase.storage
        .from('exercise-photos')
        .remove([filePath])

      if (deleteError) throw deleteError
    } catch (err: any) {
      console.error('Error deleting exercise photo:', err)
      setError(err.message)
      throw err
    }
  }

  // Asignar rutina a cliente
  const assignToClient = async (data: AssignRoutineData): Promise<ClientRoutine> => {
    try {
      const { data: newAssignment, error: assignError } = await supabase
        .from('client_routines')
        .insert(data)
        .select()
        .single()

      if (assignError) throw assignError

      return newAssignment
    } catch (err: any) {
      console.error('Error assigning routine:', err)
      setError(err.message)
      throw err
    }
  }

  // Actualizar rutina asignada
  const updateClientRoutine = async (
    routineId: string,
    data: { status?: string; notes?: string; end_date?: string }
  ): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('client_routines')
        .update(data)
        .eq('id', routineId)

      if (updateError) throw updateError
    } catch (err: any) {
      console.error('Error updating client routine:', err)
      setError(err.message)
      throw err
    }
  }

  // Desasignar rutina de cliente
  const unassignFromClient = async (routineId: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('client_routines')
        .delete()
        .eq('id', routineId)

      if (deleteError) throw deleteError
    } catch (err: any) {
      console.error('Error unassigning routine:', err)
      setError(err.message)
      throw err
    }
  }

  // Fetch rutinas de un cliente
  const fetchClientRoutines = async (clientId: string): Promise<ClientRoutine[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('client_routines')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return data || []
    } catch (err: any) {
      console.error('Error fetching client routines:', err)
      setError(err.message)
      return []
    }
  }

  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [user])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    fetchTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createExercise,
    updateExercise,
    deleteExercise,
    uploadExercisePhoto,
    deleteExercisePhoto,
    assignToClient,
    updateClientRoutine,
    unassignFromClient,
    fetchClientRoutines
  }
}
