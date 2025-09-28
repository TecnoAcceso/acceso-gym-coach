import { useState } from 'react'

interface License {
  id: string
  license_key: string
  expiry_date: string
  status: 'active' | 'expired'
  trainer_id: string
  created_at: string
}

export function useLicense() {
  const [license, setLicense] = useState<License>({
    id: 'demo-license',
    license_key: 'DEMO-2024-ACCESO-GYM',
    expiry_date: '2025-12-31',
    status: 'active',
    trainer_id: 'demo-user-id',
    created_at: '2024-01-01T00:00:00Z'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLicense = async () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }

  const updateLicense = async (licenseKey: string): Promise<void> => {
    setLoading(true)
    setTimeout(() => {
      setLicense(prev => ({
        ...prev!,
        license_key: licenseKey,
        expiry_date: '2025-12-31',
        status: 'active'
      }))
      setLoading(false)
    }, 1000)
  }

  return {
    license,
    loading,
    error,
    fetchLicense,
    updateLicense,
  }
}