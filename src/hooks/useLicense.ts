import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface License {
  id: string
  license_key: string
  expiry_date: string
  status: 'active' | 'expired'
  trainer_id: string
  client_name?: string
  client_email?: string
  created_at: string
}

export function useLicense() {
  const { user, userProfile } = useAuth()
  const [license, setLicense] = useState<License | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLicense = async () => {
    // Si no hay usuario, NO hay licencia y terminar loading
    if (!user) {
      setLicense(null)
      setLoading(false)
      return
    }

    // Si es superuser o admin, NO necesitan licencia (sin necesidad de userProfile)
    if (user.role === 'superuser' || user.role === 'admin') {
      console.log(`✅ User role: ${user.role} - No license required`)
      setLicense(null)
      setLoading(false)
      return
    }

    // Si no hay userProfile después de que user está cargado, no hay licencia
    if (!userProfile) {
      console.log('⏳ No user profile - no license check needed')
      setLicense(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching license for trainer:', userProfile.id)

      // Solo usuarios normales (trainers) necesitan licencia
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('trainer_id', userProfile.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching license:', error)
      }

      setLicense(data || null)
      console.log(data ? '✅ License found' : '⚠️ No license found')
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching license:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateLicense = async (licenseKey: string): Promise<void> => {
    if (!user || !userProfile) throw new Error('Usuario no autenticado')

    // Verificar que la licencia existe y es válida
    const { data: validLicense, error: validateError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single()

    if (validateError || !validLicense) {
      throw new Error('Clave de licencia inválida')
    }

    // Verificar que la licencia no esté ya asignada a otro usuario
    if (validLicense.trainer_id && validLicense.trainer_id !== userProfile.id) {
      throw new Error('Esta licencia ya está asignada a otro usuario')
    }

    // Asignar la licencia al usuario actual
    const { data, error } = await supabase
      .from('licenses')
      .update({ trainer_id: userProfile.id })
      .eq('license_key', licenseKey)
      .select()
      .single()

    if (error) throw error

    setLicense(data)
  }

  useEffect(() => {
    fetchLicense()
  }, [user, userProfile])

  return {
    license,
    loading,
    error,
    fetchLicense,
    updateLicense,
  }
}