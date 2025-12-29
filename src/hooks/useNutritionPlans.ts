import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  NutritionPlanTemplate,
  NutritionPlanTemplateWithMeals,
  PlanMeal,
  CreateNutritionPlanData,
  UpdateNutritionPlanData,
  CreateMealData,
  UpdateMealData,
  AssignNutritionPlanData,
  UpdateClientNutritionPlanData,
  ClientNutritionPlan
} from '@/types/nutrition'

export function useNutritionPlans() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<NutritionPlanTemplate[]>([])
  const [loading, setLoading] = useState(true)

  // Obtener todas las plantillas del trainer
  const fetchPlanTemplates = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('nutrition_plan_templates')
        .select('*')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error: any) {
      console.error('Error fetching nutrition plan templates:', error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Obtener una plantilla específica con todas sus comidas
  const fetchPlanById = async (planId: string): Promise<NutritionPlanTemplateWithMeals | null> => {
    try {
      // Obtener la plantilla
      const { data: planData, error: planError } = await supabase
        .from('nutrition_plan_templates')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError) throw planError
      if (!planData) return null

      // Obtener las comidas
      const { data: mealsData, error: mealsError } = await supabase
        .from('plan_meals')
        .select('*')
        .eq('plan_template_id', planId)
        .order('order_index', { ascending: true })

      if (mealsError) throw mealsError

      return {
        ...planData,
        meals: mealsData || []
      }
    } catch (error: any) {
      console.error('Error fetching nutrition plan by ID:', error.message)
      throw error
    }
  }

  // Crear nueva plantilla
  const createPlanTemplate = async (data: CreateNutritionPlanData): Promise<NutritionPlanTemplate> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data: newPlan, error } = await supabase
        .from('nutrition_plan_templates')
        .insert([{
          ...data,
          trainer_id: user.id
        }])
        .select()
        .single()

      if (error) throw error

      // Actualizar lista local
      setTemplates(prev => [newPlan, ...prev])
      return newPlan
    } catch (error: any) {
      console.error('Error creating nutrition plan template:', error.message)
      throw error
    }
  }

  // Actualizar plantilla
  const updatePlanTemplate = async (data: UpdateNutritionPlanData): Promise<void> => {
    const { id, ...updateData } = data

    try {
      const { error } = await supabase
        .from('nutrition_plan_templates')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      // Actualizar lista local
      setTemplates(prev =>
        prev.map(plan => plan.id === id ? { ...plan, ...updateData } : plan)
      )
    } catch (error: any) {
      console.error('Error updating nutrition plan template:', error.message)
      throw error
    }
  }

  // Eliminar plantilla
  const deletePlanTemplate = async (planId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('nutrition_plan_templates')
        .delete()
        .eq('id', planId)

      if (error) throw error

      // Actualizar lista local
      setTemplates(prev => prev.filter(plan => plan.id !== planId))
    } catch (error: any) {
      console.error('Error deleting nutrition plan template:', error.message)
      throw error
    }
  }

  // Crear comida
  const createMeal = async (data: CreateMealData): Promise<PlanMeal> => {
    try {
      const { data: newMeal, error } = await supabase
        .from('plan_meals')
        .insert([data])
        .select()
        .single()

      if (error) throw error
      return newMeal
    } catch (error: any) {
      console.error('Error creating meal:', error.message)
      throw error
    }
  }

  // Actualizar comida
  const updateMeal = async (data: UpdateMealData): Promise<void> => {
    const { id, ...updateData } = data

    try {
      const { error } = await supabase
        .from('plan_meals')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    } catch (error: any) {
      console.error('Error updating meal:', error.message)
      throw error
    }
  }

  // Eliminar comida
  const deleteMeal = async (mealId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('plan_meals')
        .delete()
        .eq('id', mealId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error deleting meal:', error.message)
      throw error
    }
  }

  // Asignar plan a cliente
  const assignToClient = async (data: AssignNutritionPlanData): Promise<ClientNutritionPlan> => {
    try {
      const { data: assignedPlan, error } = await supabase
        .from('client_nutrition_plans')
        .insert([data])
        .select()
        .single()

      if (error) throw error
      return assignedPlan
    } catch (error: any) {
      console.error('Error assigning nutrition plan to client:', error.message)
      throw error
    }
  }

  // Actualizar plan de cliente
  const updateClientPlan = async (data: UpdateClientNutritionPlanData): Promise<void> => {
    const { id, ...updateData } = data

    try {
      const { error } = await supabase
        .from('client_nutrition_plans')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    } catch (error: any) {
      console.error('Error updating client nutrition plan:', error.message)
      throw error
    }
  }

  // Desasignar plan de cliente
  const unassignFromClient = async (planId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('client_nutrition_plans')
        .delete()
        .eq('id', planId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error unassigning nutrition plan from client:', error.message)
      throw error
    }
  }

  // Obtener planes de un cliente
  const fetchClientPlans = async (clientId: string): Promise<ClientNutritionPlan[]> => {
    try {
      const { data, error } = await supabase
        .from('client_nutrition_plans')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error fetching client nutrition plans:', error.message)
      throw error
    }
  }

  // Cargar plantillas al montar
  useEffect(() => {
    if (user) {
      fetchPlanTemplates()
    }
  }, [user])

  return {
    templates,
    loading,
    fetchPlanTemplates,
    fetchPlanById,
    createPlanTemplate,
    updatePlanTemplate,
    deletePlanTemplate,
    createMeal,
    updateMeal,
    deleteMeal,
    assignToClient,
    updateClientPlan,
    unassignFromClient,
    fetchClientPlans
  }
}
