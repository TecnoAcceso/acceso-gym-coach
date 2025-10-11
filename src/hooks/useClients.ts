import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Client, CreateClientData, UpdateClientData } from '@/types/client'
import { addMonths, isAfter, isBefore } from 'date-fns'

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateEndDate = (startDate: string, durationMonths: number): string => {
    // Crear fecha local para evitar problemas de zona horaria
    const [year, month, day] = startDate.split('-').map(Number)
    const startLocalDate = new Date(year, month - 1, day)
    const endDate = new Date(startLocalDate)
    endDate.setMonth(endDate.getMonth() + durationMonths)

    // Formatear manualmente para evitar problemas de zona horaria
    const endYear = endDate.getFullYear()
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0')
    const endDay = String(endDate.getDate()).padStart(2, '0')
    return `${endYear}-${endMonth}-${endDay}`
  }

  const calculateClientStatus = (endDate: string): 'active' | 'expiring' | 'expired' => {
    const today = new Date()
    const [year, month, day] = endDate.split('-').map(Number)
    const end = new Date(year, month - 1, day)

    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'expired'
    if (diffDays <= 3) return 'expiring'
    return 'active'
  }

  const fetchClients = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calcular status para cada cliente
      const clientsWithStatus = (data || []).map(client => ({
        ...client,
        status: calculateClientStatus(client.end_date)
      }))

      setClients(clientsWithStatus)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching clients:', err)
      setClients([]) // Limpiar en caso de error
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const createClient = async (clientData: CreateClientData): Promise<Client> => {
    if (!user) throw new Error('Usuario no autenticado')

    try {
      setError(null)

      // Verificar duplicados
      const { data: existingClients } = await supabase
        .from('clients')
        .select('id')
        .eq('trainer_id', user.id)
        .eq('cedula', clientData.cedula)
        .eq('document_type', clientData.document_type)

      if (existingClients && existingClients.length > 0) {
        throw new Error(`Ya existe un cliente con cédula ${clientData.document_type}-${clientData.cedula}`)
      }

      const endDate = calculateEndDate(clientData.start_date, clientData.duration_months)

      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          end_date: endDate,
          trainer_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Agregar status al cliente creado
      const clientWithStatus = {
        ...data,
        status: calculateClientStatus(data.end_date)
      }

      setClients(prev => [clientWithStatus, ...prev])
      console.log('✅ Cliente creado exitosamente')
      return clientWithStatus
    } catch (err: any) {
      console.error('❌ Error creating client:', err)
      setError(err.message)
      // Refrescar la lista de clientes para mantener consistencia
      await fetchClients()
      throw err
    }
  }

  const updateClient = async (clientData: UpdateClientData): Promise<Client> => {
    if (!user) throw new Error('Usuario no autenticado')

    try {
      setError(null)

      const updates: any = { ...clientData }
      delete updates.id

      // Verificar duplicados al editar
      if (clientData.cedula || clientData.document_type) {
        const currentClient = clients.find(c => c.id === clientData.id)
        if (currentClient) {
          const cedula = clientData.cedula || currentClient.cedula
          const documentType = clientData.document_type || currentClient.document_type

          const { data: existingClients } = await supabase
            .from('clients')
            .select('id')
            .eq('trainer_id', user.id)
            .eq('cedula', cedula)
            .eq('document_type', documentType)
            .neq('id', clientData.id)

          if (existingClients && existingClients.length > 0) {
            throw new Error(`Ya existe otro cliente con cédula ${documentType}-${cedula}`)
          }
        }
      }

      // Recalcular end_date si es necesario
      if (clientData.start_date || clientData.duration_months) {
        const currentClient = clients.find(c => c.id === clientData.id)
        if (currentClient) {
          const startDate = clientData.start_date || currentClient.start_date
          const duration = clientData.duration_months || currentClient.duration_months
          updates.end_date = calculateEndDate(startDate, duration)
        }
      }

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientData.id)
        .eq('trainer_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Agregar status al cliente actualizado
      const clientWithStatus = {
        ...data,
        status: calculateClientStatus(data.end_date)
      }

      setClients(prev => prev.map(client =>
        client.id === clientData.id ? clientWithStatus : client
      ))

      console.log('✅ Cliente actualizado exitosamente')
      return clientWithStatus
    } catch (err: any) {
      console.error('❌ Error updating client:', err)
      setError(err.message)
      // Refrescar la lista de clientes para mantener consistencia
      await fetchClients()
      throw err
    }
  }

  const deleteClient = async (id: string): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado')

    try {
      setError(null)

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('trainer_id', user.id)

      if (error) throw error

      setClients(prev => prev.filter(client => client.id !== id))
      console.log('✅ Cliente eliminado exitosamente')
    } catch (err: any) {
      console.error('❌ Error deleting client:', err)
      setError(err.message)
      // Refrescar la lista de clientes para mantener consistencia
      await fetchClients()
      throw err
    }
  }

  const renewClient = async (id: string, durationMonths: number, startDate?: string): Promise<Client> => {
    if (!user) throw new Error('Usuario no autenticado')

    try {
      setError(null)

      // Usar la fecha proporcionada o la fecha actual
      let newStartDate: string
      let startDateObj: Date

      if (startDate) {
        newStartDate = startDate
        const [year, month, day] = startDate.split('-').map(Number)
        startDateObj = new Date(year, month - 1, day)
      } else {
        const today = new Date()
        const startYear = today.getFullYear()
        const startMonth = String(today.getMonth() + 1).padStart(2, '0')
        const startDay = String(today.getDate()).padStart(2, '0')
        newStartDate = `${startYear}-${startMonth}-${startDay}`
        startDateObj = today
      }

      // Calcular fecha final usando fechas locales
      const endDate = new Date(startDateObj)
      endDate.setMonth(endDate.getMonth() + durationMonths)

      // Formatear fecha final manualmente
      const endYear = endDate.getFullYear()
      const endMonth = String(endDate.getMonth() + 1).padStart(2, '0')
      const endDay = String(endDate.getDate()).padStart(2, '0')
      const newEndDate = `${endYear}-${endMonth}-${endDay}`

      const { data, error } = await supabase
        .from('clients')
        .update({
          start_date: newStartDate,
          end_date: newEndDate,
          duration_months: durationMonths,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('trainer_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Agregar status al cliente renovado
      const clientWithStatus = {
        ...data,
        status: calculateClientStatus(data.end_date)
      }

      setClients(prev => prev.map(c => c.id === id ? clientWithStatus : c))
      console.log('✅ Cliente renovado exitosamente')
      return clientWithStatus
    } catch (err: any) {
      console.error('❌ Error renewing client:', err)
      setError(err.message)
      // Refrescar la lista de clientes para mantener consistencia
      await fetchClients()
      throw err
    }
  }

  // Función para limpiar estado completamente
  const clearState = useCallback(() => {
    console.log('🧹 Limpiando estado de clientes...')
    setClients([])
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchClients()
    } else {
      clearState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    renewClient,
    clearState,
  }
}