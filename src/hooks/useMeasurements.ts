import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { MeasurementRecord, CreateMeasurementData, ProgressPhoto, PhotoType } from '@/types/client'

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

  // ============================================
  // FASE 1: Funciones para Fotos de Progreso
  // ============================================

  /**
   * Sube una foto de progreso a Supabase Storage y crea el registro en la BD
   * @param measurementId - ID de la medición asociada
   * @param file - Archivo de imagen (File object)
   * @param photoType - Tipo de foto: 'frontal', 'lateral' o 'posterior'
   * @returns ProgressPhoto creada
   */
  const uploadPhoto = async (
    measurementId: string,
    file: File,
    photoType: PhotoType
  ): Promise<ProgressPhoto> => {
    if (!user || !clientId) throw new Error('Usuario no autenticado o cliente no especificado')

    try {
      setError(null)

      // Validaciones
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('La imagen no debe superar los 5MB')
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Solo se permiten archivos JPG y PNG')
      }

      // Construir path: {client_id}/{measurement_id}/{photo_type}.jpg
      const fileExtension = file.type === 'image/png' ? 'png' : 'jpg'
      const filePath = `${clientId}/${measurementId}/${photoType}.${fileExtension}`

      console.log('📤 Subiendo foto a Storage:', filePath)

      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, file, {
          upsert: true, // Sobrescribir si ya existe
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      console.log('✅ Foto subida exitosamente:', uploadData.path)

      // Obtener URL pública del bucket
      const { data: urlData } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(uploadData.path)

      // Crear registro en la tabla progress_photos
      const { data: photoData, error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          client_id: clientId,
          measurement_id: measurementId,
          photo_type: photoType,
          photo_url: urlData.publicUrl,
          file_extension: fileExtension,
        })
        .select()
        .single()

      if (dbError) throw dbError

      console.log('✅ Registro de foto creado en BD')
      return photoData
    } catch (err: any) {
      console.error('❌ Error uploading photo:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Obtiene todas las fotos de una medición específica
   * @param measurementId - ID de la medición
   * @returns Array de ProgressPhoto
   */
  const fetchPhotos = async (measurementId: string): Promise<ProgressPhoto[]> => {
    if (!user || !clientId) throw new Error('Usuario no autenticado')

    try {
      setError(null)

      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('measurement_id', measurementId)
        .order('created_at', { ascending: true })

      if (error) throw error

      console.log(`📥 Fotos obtenidas de BD: ${data?.length || 0}`)

      // Regenerar URLs públicas para cada foto
      if (data && data.length > 0) {
        const photosWithPublicUrls = data.map((photo) => {
          // Usar extensión guardada o jpg por defecto
          const extension = photo.file_extension || 'jpg'
          const storagePath = `${clientId}/${measurementId}/${photo.photo_type}.${extension}`

          const { data: urlData } = supabase.storage
            .from('progress-photos')
            .getPublicUrl(storagePath)

          console.log(`🔗 URL generada para ${photo.photo_type}:`, urlData.publicUrl)

          return {
            ...photo,
            photo_url: urlData.publicUrl
          }
        })

        console.log(`✅ URLs públicas generadas para ${photosWithPublicUrls.length} fotos`)
        return photosWithPublicUrls
      }

      return data || []
    } catch (err: any) {
      console.error('❌ Error fetching photos:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Elimina una foto de progreso (Storage + BD)
   * @param photoId - ID de la foto a eliminar
   */
  const deletePhoto = async (photoId: string): Promise<void> => {
    if (!user || !clientId) throw new Error('Usuario no autenticado')

    try {
      setError(null)

      // Primero obtener info de la foto para saber qué archivo eliminar
      const { data: photo, error: fetchError } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('id', photoId)
        .single()

      if (fetchError) throw fetchError

      // Construir path del archivo en Storage usando file_extension
      const extension = photo.file_extension || 'jpg'
      const filePath = `${photo.client_id}/${photo.measurement_id}/${photo.photo_type}.${extension}`

      console.log('🗑️ Eliminando foto de Storage:', filePath)

      // Eliminar de Storage
      const { error: storageError } = await supabase.storage
        .from('progress-photos')
        .remove([filePath])

      if (storageError) {
        console.warn('⚠️ Error eliminando de Storage (puede que ya no exista):', storageError)
      }

      // Eliminar registro de BD
      const { error: dbError } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      console.log('✅ Foto eliminada exitosamente')
    } catch (err: any) {
      console.error('❌ Error deleting photo:', err)
      setError(err.message)
      throw err
    }
  }

  // ============================================
  // Effects
  // ============================================

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
    // FASE 1: Funciones de fotos
    uploadPhoto,
    fetchPhotos,
    deletePhoto,
  }
}
