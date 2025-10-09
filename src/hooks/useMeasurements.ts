import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { MeasurementRecord, CreateMeasurementData } from '@/types/client'

export function useMeasurements(clientId?: string) {
  const { user } = useAuth()
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeasurements = useCallback(async () => {
    if (!user?.id || !clientId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })

      if (error) throw error

      setMeasurements(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching measurements:', err)
      setMeasurements([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, clientId])

  const createMeasurement = async (measurementData: CreateMeasurementData): Promise<MeasurementRecord> => {
    if (!user) throw new Error('Usuario no autenticado')

    try {
      setError(null)

      const { data, error } = await supabase
        .from('measurements')
        .insert(measurementData)
        .select()
        .single()

      if (error) throw error

      setMeasurements(prev => [data, ...prev])
      console.log('✅ Medida creada exitosamente')
      return data
    } catch (err: any) {
      console.error('❌ Error creating measurement:', err)
      setError(err.message)
      await fetchMeasurements()
      throw err
    }
  }

  const updateMeasurement = async (id: string, measurementData: Partial<CreateMeasurementData>): Promise<MeasurementRecord> => {
    if (!user) throw new Error('Usuario no autenticado')

    try {
      setError(null)

      const { data, error } = await supabase
        .from('measurements')
        .update({ ...measurementData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setMeasurements(prev => prev.map(m => m.id === id ? data : m))
      console.log('✅ Medida actualizada exitosamente')
      return data
    } catch (err: any) {
      console.error('❌ Error updating measurement:', err)
      setError(err.message)
      await fetchMeasurements()
      throw err
    }
  }

  const deleteMeasurement = async (id: string): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado')

    try {
      setError(null)

      const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMeasurements(prev => prev.filter(m => m.id !== id))
      console.log('✅ Medida eliminada exitosamente')
    } catch (err: any) {
      console.error('❌ Error deleting measurement:', err)
      setError(err.message)
      await fetchMeasurements()
      throw err
    }
  }

  const clearState = useCallback(() => {
    console.log('🧹 Limpiando estado de medidas...')
    setMeasurements([])
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user?.id && clientId) {
      fetchMeasurements()
    } else {
      clearState()
    }
  }, [user?.id, clientId, fetchMeasurements, clearState])

  useEffect(() => {
    return () => {
      console.log('🧹 Hook useMeasurements desmontando - limpiando estado')
      clearState()
    }
  }, [clearState])

  return {
    measurements,
    loading,
    error,
    fetchMeasurements,
    createMeasurement,
    updateMeasurement,
    deleteMeasurement,
    clearState,
  }
}
