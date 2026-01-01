import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Client, MeasurementRecord, CreateMeasurementData } from '@/types/client'
import { useMeasurements } from '@/hooks/useMeasurements'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import html2canvas from 'html2canvas'
import {
  X,
  Plus,
  History,
  Save,
  MessageCircle,
  Calendar,
  Target,
  Weight,
  Edit,
  Trash2,
  Download,
  TrendingUp,
  Camera
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FaWhatsapp } from 'react-icons/fa'
import { TbRulerMeasure2 } from 'react-icons/tb'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ConfirmDialog from './ConfirmDialog'

interface MeasurementsModalProps {
  isOpen: boolean
  client: Client | null
  onClose: () => void
}

// Helper para convertir strings vacías a undefined
const optionalNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
  z.number().optional()
)

const measurementSchema = z.object({
  date: z.string().min(1, 'La fecha es requerida'),
  objetivo: z.string().optional(),
  peso: optionalNumber,
  hombros: optionalNumber,
  pecho: optionalNumber,
  espalda: optionalNumber,
  biceps_der: optionalNumber,
  biceps_izq: optionalNumber,
  cintura: optionalNumber,
  gluteo: optionalNumber,
  pierna_der: optionalNumber,
  pierna_izq: optionalNumber,
  pantorrilla_der: optionalNumber,
  pantorrilla_izq: optionalNumber,
  notas: z.string().optional(),
})

type MeasurementForm = z.infer<typeof measurementSchema>

export default function MeasurementsModal({ isOpen, client, onClose }: MeasurementsModalProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'new' | 'compare'>('history')
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // FASE 1: Estados para comparación
  const [selectedStartId, setSelectedStartId] = useState<string>('')
  const [selectedEndId, setSelectedEndId] = useState<string>('')
  const [startPhotos, setStartPhotos] = useState<any[]>([])
  const [endPhotos, setEndPhotos] = useState<any[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  // FASE 1: Estados para fotos en el formulario
  const [pendingPhotos, setPendingPhotos] = useState<{ [key: string]: File }>({})
  const [photoPreview, setPhotoPreview] = useState<{ [key: string]: string }>({})
  const [currentMeasurementPhotos, setCurrentMeasurementPhotos] = useState<any[]>([])

  // Estado para modal de detalles del historial
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean
    measurement: MeasurementRecord | null
  }>({ isOpen: false, measurement: null })

  // Estados para diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  const { user } = useAuth()
  const { measurements, loading, createMeasurement, updateMeasurement, deleteMeasurement, uploadPhoto, fetchPhotos, deletePhoto } = useMeasurements(client?.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeasurementForm>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    }
  })

  // Reset tab to 'history' when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('history')
      setSelectedStartId('')
      setSelectedEndId('')
    }
  }, [isOpen])

  // FASE 1: Cargar fotos cuando cambian los selectores
  useEffect(() => {
    const loadPhotos = async () => {
      if (selectedStartId && selectedEndId) {
        setLoadingPhotos(true)
        try {
          const [start, end] = await Promise.all([
            fetchPhotos(selectedStartId),
            fetchPhotos(selectedEndId)
          ])
          setStartPhotos(start)
          setEndPhotos(end)
        } catch (error) {
          console.error('Error loading photos:', error)
        } finally {
          setLoadingPhotos(false)
        }
      }
    }
    loadPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStartId, selectedEndId])

  // FASE 1: Cargar fotos cuando se edita una medida
  useEffect(() => {
    const loadEditPhotos = async () => {
      if (editingMeasurement) {
        try {
          const photos = await fetchPhotos(editingMeasurement.id)
          setCurrentMeasurementPhotos(photos)
        } catch (error) {
          console.error('Error loading edit photos:', error)
        }
      } else {
        setCurrentMeasurementPhotos([])
        setPendingPhotos({})
        setPhotoPreview({})
      }
    }
    loadEditPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingMeasurement?.id])

  if (!client) return null

  const handleEdit = (measurement: MeasurementRecord) => {
    setEditingMeasurement(measurement)
    setActiveTab('new')
    reset({
      date: measurement.date,
      objetivo: measurement.objetivo || '',
      peso: measurement.peso,
      hombros: measurement.hombros,
      pecho: measurement.pecho,
      espalda: measurement.espalda,
      biceps_der: measurement.biceps_der,
      biceps_izq: measurement.biceps_izq,
      cintura: measurement.cintura,
      gluteo: measurement.gluteo,
      pierna_der: measurement.pierna_der,
      pierna_izq: measurement.pierna_izq,
      pantorrilla_der: measurement.pantorrilla_der,
      pantorrilla_izq: measurement.pantorrilla_izq,
      notas: measurement.notas || '',
    })
  }

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Medida',
      message: '¿Estás seguro de eliminar esta medida? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await deleteMeasurement(id)
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        } catch (error) {
          console.error('Error al eliminar medida:', error)
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      }
    })
  }

  const onSubmit = async (data: MeasurementForm) => {
    setIsLoading(true)

    try {
      const measurementData: CreateMeasurementData = {
        client_id: client.id,
        date: data.date,
        objetivo: data.objetivo,
        peso: data.peso,
        hombros: data.hombros,
        pecho: data.pecho,
        espalda: data.espalda,
        biceps_der: data.biceps_der,
        biceps_izq: data.biceps_izq,
        cintura: data.cintura,
        gluteo: data.gluteo,
        pierna_der: data.pierna_der,
        pierna_izq: data.pierna_izq,
        pantorrilla_der: data.pantorrilla_der,
        pantorrilla_izq: data.pantorrilla_izq,
        notas: data.notas,
      }

      let measurementId: string
      if (editingMeasurement) {
        await updateMeasurement(editingMeasurement.id, measurementData)
        measurementId = editingMeasurement.id
      } else {
        const newMeasurement = await createMeasurement(measurementData)
        measurementId = newMeasurement.id
      }

      // Subir fotos pendientes
      for (const [photoType, file] of Object.entries(pendingPhotos)) {
        try {
          await uploadPhoto(measurementId, file, photoType as any)
        } catch (error) {
          console.error(`Error uploading ${photoType}:`, error)
        }
      }

      // Limpiar estados
      reset()
      setEditingMeasurement(null)
      setPendingPhotos({})
      setPhotoPreview({})
      setCurrentMeasurementPhotos([])
      setActiveTab('history')
    } catch (error) {
      console.error('Error al guardar medida:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWhatsAppShare = async () => {
    if (!reportRef.current || measurements.length === 0 || !client) return

    setIsGeneratingImage(true)

    try {
      // Generar la imagen del reporte
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0B1426',
        scale: 2,
        logging: false,
        useCORS: true,
      })

      // Convertir a blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Error al generar la imagen')
          setIsGeneratingImage(false)
          return
        }

        // Crear un enlace de descarga
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `medidas-${client.full_name.toLowerCase().replace(/\s/g, '-')}-${format(new Date(), 'dd-MM-yyyy')}.png`

        // Descargar la imagen
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // Esperar un momento y abrir WhatsApp
        setTimeout(() => {
          const trainerName = user?.full_name || 'Tu entrenador'

          const message = `¡Hola ${client.full_name}! 👋

Adjunto encontrarás tu reporte actualizado de medidas y avances. 📊

¡Estás haciendo un gran trabajo! Sigue así y alcanzarás todas tus metas. 💪🏋️

Cualquier duda o consulta, estamos para ayudarte.

¡Sigamos entrenando juntos!

Att: ${trainerName}

---
_Powered by TecnoAcceso / ElectroShop_`
          const encodedMessage = encodeURIComponent(message)
          const phoneNumber = client.phone.replace(/\D/g, '')
          const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
          window.open(whatsappUrl, '_blank')
        }, 500)

        setIsGeneratingImage(false)
      }, 'image/png')
    } catch (error) {
      console.error('Error al generar la imagen:', error)
      setIsGeneratingImage(false)
    }
  }

  // FASE 1: Manejar selección de foto en formulario
  const handleFormPhotoSelect = (photoType: string, file: File) => {
    // Validar tamaño (max 5MB)
    if (file.size > 5242880) {
      alert('La imagen es muy grande. Máximo 5MB')
      return
    }

    // Validar tipo
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WEBP')
      return
    }

    // Guardar archivo pendiente
    setPendingPhotos(prev => ({ ...prev, [photoType]: file }))

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(prev => ({ ...prev, [photoType]: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // FASE 1: Remover foto pendiente del formulario
  const handleFormPhotoRemove = (photoType: string) => {
    setPendingPhotos(prev => {
      const newPhotos = { ...prev }
      delete newPhotos[photoType]
      return newPhotos
    })
    setPhotoPreview(prev => {
      const newPreviews = { ...prev }
      delete newPreviews[photoType]
      return newPreviews
    })
  }

  // FASE 1: Eliminar foto ya guardada en edición
  const handleFormPhotoDelete = (photoId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Foto',
      message: '¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await deletePhoto(photoId)
          if (editingMeasurement) {
            const photos = await fetchPhotos(editingMeasurement.id)
            setCurrentMeasurementPhotos(photos)
          }
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        } catch (error: any) {
          alert(error.message || 'Error al eliminar la foto')
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      }
    })
  }

  // FASE 1: Generar PDF de comparación
  const generateComparisonPDF = async () => {
    if (!selectedStartId || !selectedEndId || !client) return

    const startM = measurements.find(m => m.id === selectedStartId)
    const endM = measurements.find(m => m.id === selectedEndId)
    if (!startM || !endM) return

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // PÁGINA 1: COMPARACIÓN DE MEDIDAS
      // Header
      pdf.setFillColor(11, 20, 38) // dark-100
      pdf.rect(0, 0, pageWidth, 40, 'F')

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text('AccesoGym Coach', pageWidth / 2, 15, { align: 'center' })

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Comparación de Avances', pageWidth / 2, 27, { align: 'center' })

      // Información del cliente
      pdf.setTextColor(100, 116, 139) // slate-500
      pdf.setFontSize(10)
      pdf.text(`Cliente: ${client.full_name}`, pageWidth / 2, 35, { align: 'center' })

      // Fechas de comparación
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Período Inicial: ${formatDate(startM.date)}`, 20, 50)
      pdf.text(`Período Final: ${formatDate(endM.date)}`, pageWidth - 20, 50, { align: 'right' })

      // Tabla de comparación
      const tableData: any[] = []
      const fields = [
        { key: 'peso', label: 'Peso', unit: 'kg' },
        { key: 'hombros', label: 'Hombros', unit: 'cm' },
        { key: 'pecho', label: 'Pecho', unit: 'cm' },
        { key: 'espalda', label: 'Espalda', unit: 'cm' },
        { key: 'biceps_der', label: 'Bíceps Der', unit: 'cm' },
        { key: 'biceps_izq', label: 'Bíceps Izq', unit: 'cm' },
        { key: 'cintura', label: 'Cintura', unit: 'cm' },
        { key: 'gluteo', label: 'Glúteo', unit: 'cm' },
        { key: 'pierna_der', label: 'Pierna Der', unit: 'cm' },
        { key: 'pierna_izq', label: 'Pierna Izq', unit: 'cm' },
        { key: 'pantorrilla_der', label: 'Pantorrilla Der', unit: 'cm' },
        { key: 'pantorrilla_izq', label: 'Pantorrilla Izq', unit: 'cm' },
      ]

      fields.forEach(field => {
        const start = (startM as any)[field.key]
        const end = (endM as any)[field.key]
        if (start || end) {
          const diff = (end || 0) - (start || 0)
          const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
          const arrow = diff > 0 ? '^' : diff < 0 ? 'v' : '='

          tableData.push([
            field.label,
            start ? `${start} ${field.unit}` : '-',
            end ? `${end} ${field.unit}` : '-',
            `${arrow} ${diffStr} ${field.unit}`
          ])
        }
      })

      autoTable(pdf, {
        startY: 60,
        head: [['Medida', 'Inicial', 'Final', 'Cambio']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [99, 102, 241], // accent-primary
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [30, 41, 59] // slate-800
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 50 },
          1: { halign: 'center', cellWidth: 40 },
          2: { halign: 'center', cellWidth: 40 },
          3: { halign: 'center', cellWidth: 50, fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      })

      // Footer página 1
      const finalY = (pdf as any).lastAutoTable.finalY || 60
      pdf.setFontSize(8)
      pdf.setTextColor(148, 163, 184) // slate-400
      pdf.text(
        `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )

      // PÁGINA 2: COMPARACIÓN DE FOTOS (si hay fotos)
      if (startPhotos.length > 0 || endPhotos.length > 0) {
        pdf.addPage()

        // Header página 2
        pdf.setFillColor(11, 20, 38)
        pdf.rect(0, 0, pageWidth, 20, 'F')

        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Comparación de Fotos', pageWidth / 2, 13, { align: 'center' })

        // Layout de fotos: 3 filas (frontal, lateral, posterior) x 2 columnas (antes, después)
        const photoTypes = ['frontal', 'lateral', 'posterior']
        const photoTypeLabels = { frontal: 'Frontal', lateral: 'Lateral', posterior: 'Posterior' }

        let yPos = 28
        const photoWidth = 60
        const photoHeight = 68
        const spacing = 6
        const leftX = 25
        const rightX = pageWidth / 2 + 5

        photoTypes.forEach((type, index) => {
          const startPhoto = startPhotos.find(p => p.photo_type === type)
          const endPhoto = endPhotos.find(p => p.photo_type === type)

          // Título del tipo de foto
          pdf.setTextColor(0, 0, 0)
          pdf.setFontSize(11)
          pdf.setFont('helvetica', 'bold')
          pdf.text(photoTypeLabels[type as keyof typeof photoTypeLabels], pageWidth / 2, yPos, { align: 'center' })
          yPos += 6

          // Labels ANTES / DESPUÉS
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(100, 116, 139)
          pdf.text('ANTES', leftX + photoWidth / 2, yPos, { align: 'center' })
          pdf.text('DESPUÉS', rightX + photoWidth / 2, yPos, { align: 'center' })
          yPos += 4

          // Fotos
          if (startPhoto) {
            try {
              pdf.addImage(startPhoto.photo_url, 'JPEG', leftX, yPos, photoWidth, photoHeight)
            } catch (err) {
              console.error('Error adding start photo:', err)
              pdf.setFillColor(240, 240, 240)
              pdf.rect(leftX, yPos, photoWidth, photoHeight, 'F')
              pdf.setTextColor(150, 150, 150)
              pdf.setFontSize(8)
              pdf.text('Sin foto', leftX + photoWidth / 2, yPos + photoHeight / 2, { align: 'center' })
            }
          } else {
            pdf.setFillColor(240, 240, 240)
            pdf.rect(leftX, yPos, photoWidth, photoHeight, 'F')
            pdf.setTextColor(150, 150, 150)
            pdf.setFontSize(8)
            pdf.text('Sin foto', leftX + photoWidth / 2, yPos + photoHeight / 2, { align: 'center' })
          }

          if (endPhoto) {
            try {
              pdf.addImage(endPhoto.photo_url, 'JPEG', rightX, yPos, photoWidth, photoHeight)
            } catch (err) {
              console.error('Error adding end photo:', err)
              pdf.setFillColor(240, 240, 240)
              pdf.rect(rightX, yPos, photoWidth, photoHeight, 'F')
              pdf.setTextColor(150, 150, 150)
              pdf.setFontSize(8)
              pdf.text('Sin foto', rightX + photoWidth / 2, yPos + photoHeight / 2, { align: 'center' })
            }
          } else {
            pdf.setFillColor(240, 240, 240)
            pdf.rect(rightX, yPos, photoWidth, photoHeight, 'F')
            pdf.setTextColor(150, 150, 150)
            pdf.setFontSize(8)
            pdf.text('Sin foto', rightX + photoWidth / 2, yPos + photoHeight / 2, { align: 'center' })
          }

          yPos += photoHeight + spacing
        })

        // Footer página 2
        pdf.setFontSize(8)
        pdf.setTextColor(148, 163, 184)
        pdf.text(
          `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }

      // Guardar PDF
      const fileName = `comparacion_${client.full_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`
      pdf.save(fileName)

      return pdf
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF')
    }
  }

  // FASE 1: Enviar PDF por WhatsApp
  const handleSendWhatsAppPDF = async () => {
    if (!selectedStartId || !selectedEndId || !client) return

    try {
      // Generar PDF
      const pdf = await generateComparisonPDF()
      if (!pdf) return

      // Crear mensaje de WhatsApp
      const startM = measurements.find(m => m.id === selectedStartId)
      const endM = measurements.find(m => m.id === selectedEndId)

      const message = `¡Hola! 👋\n\nTe comparto tu reporte de avances:\n📅 Del ${formatDate(startM!.date)} al ${formatDate(endM!.date)}\n\n¡Sigue así! 💪`

      const encodedMessage = encodeURIComponent(message)
      const phoneNumber = client.phone.replace(/\D/g, '')
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

      window.open(whatsappUrl, '_blank')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar el PDF')
    }
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return format(localDate, 'dd MMM yyyy', { locale: es })
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={onClose}
            />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
                    <TbRulerMeasure2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Medidas y Avances</h3>
                    <p className="text-xs text-slate-400">{client.full_name}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-2 mb-6 border-b border-white/10">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'history'
                      ? 'text-accent-primary'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>Historial</span>
                  </div>
                  {activeTab === 'history' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                    />
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('new')
                    setEditingMeasurement(null)
                    reset({ date: new Date().toISOString().split('T')[0] })
                  }}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'new'
                      ? 'text-accent-primary'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>{editingMeasurement ? 'Editar' : 'Nueva'}</span>
                  </div>
                  {activeTab === 'new' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                    />
                  )}
                </button>
                {/* FASE 1: Tab de Comparación */}
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'compare'
                      ? 'text-accent-primary'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Comparar</span>
                  </div>
                  {activeTab === 'compare' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                    />
                  )}
                </button>
              </div>

              {/* Content */}
              {activeTab === 'history' ? (
                <div className="space-y-4">
                  {/* Measurements List */}
                  {loading ? (
                    <div className="text-center py-8 text-slate-400">Cargando...</div>
                  ) : measurements.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      No hay medidas registradas aún
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {measurements.map((measurement) => (
                        <motion.div
                          key={measurement.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-card p-3 border border-white/10 hover:border-accent-primary/30 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <Calendar className="w-4 h-4 text-accent-primary" />
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {formatDate(measurement.date)}
                                </p>
                                {measurement.objetivo && (
                                  <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                    {measurement.objetivo}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setDetailsModal({ isOpen: true, measurement })}
                                className="px-3 py-1.5 bg-accent-primary/20 text-accent-primary text-xs font-medium rounded-lg hover:bg-accent-primary/30 transition-all"
                              >
                                Ver detalles
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEdit(measurement)}
                                className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(measurement.id)}
                                className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'compare' ? (
                <div className="space-y-4">
                  {/* Mensaje si no hay mediciones */}
                  {measurements.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">Necesitas al menos una medición</p>
                    </div>
                  ) : measurements.length === 1 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="w-12 h-12 text-accent-primary mx-auto mb-3" />
                      <p className="text-slate-400 mb-6">Tienes 1 medición registrada</p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleWhatsAppShare}
                        disabled={isGeneratingImage}
                        className="py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 flex items-center justify-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingImage ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Generando imagen...</span>
                          </>
                        ) : (
                          <>
                            <FaWhatsapp className="w-5 h-5" />
                            <span>Enviar Medida</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  ) : (
                    <>
                      {/* Selectores de Período */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Período Inicial
                          </label>
                          <select
                            value={selectedStartId}
                            onChange={(e) => setSelectedStartId(e.target.value)}
                            className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                          >
                            <option value="">Seleccionar...</option>
                            {measurements.map((m) => {
                              // Si hay fecha final seleccionada, solo mostrar fechas anteriores o iguales
                              const endDate = selectedEndId ? measurements.find(ms => ms.id === selectedEndId)?.date : null
                              const isDisabled = !!(endDate && m.date > endDate)
                              return (
                                <option key={m.id} value={m.id} disabled={isDisabled}>
                                  {formatDate(m.date)}
                                </option>
                              )
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Período Final
                          </label>
                          <select
                            value={selectedEndId}
                            onChange={(e) => setSelectedEndId(e.target.value)}
                            className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                          >
                            <option value="">Seleccionar...</option>
                            {measurements.map((m) => {
                              // Si hay fecha inicial seleccionada, solo mostrar fechas posteriores o iguales
                              const startDate = selectedStartId ? measurements.find(ms => ms.id === selectedStartId)?.date : null
                              const isDisabled = !!(startDate && m.date < startDate)
                              return (
                                <option key={m.id} value={m.id} disabled={isDisabled}>
                                  {formatDate(m.date)}
                                </option>
                              )
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Tabla de Comparación */}
                      {selectedStartId && selectedEndId ? (
                        <>
                          <div className="glass-card border border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-dark-200/50">
                                  <tr>
                                    <th className="text-left px-4 py-3 text-slate-300 font-medium">Medida</th>
                                    <th className="text-center px-4 py-3 text-slate-300 font-medium">Inicial</th>
                                    <th className="text-center px-4 py-3 text-slate-300 font-medium">Final</th>
                                    <th className="text-center px-4 py-3 text-slate-300 font-medium">Cambio</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                  {(() => {
                                    const startM = measurements.find(m => m.id === selectedStartId)
                                    const endM = measurements.find(m => m.id === selectedEndId)
                                    if (!startM || !endM) return null

                                    const compareField = (field: keyof MeasurementRecord, label: string, unit: string) => {
                                      const start = startM[field] as number | undefined
                                      const end = endM[field] as number | undefined
                                      if (!start && !end) return null
                                      const diff = (end || 0) - (start || 0)
                                      const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
                                      const colorClass = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'
                                      const icon = diff > 0 ? '↑' : diff < 0 ? '↓' : '='

                                      return (
                                        <tr key={field}>
                                          <td className="px-4 py-3 text-slate-300">{label}</td>
                                          <td className="px-4 py-3 text-center text-white">{start ? `${start} ${unit}` : '-'}</td>
                                          <td className="px-4 py-3 text-center text-white">{end ? `${end} ${unit}` : '-'}</td>
                                          <td className={`px-4 py-3 text-center font-medium ${colorClass}`}>
                                            {icon} {diffStr} {unit}
                                          </td>
                                        </tr>
                                      )
                                    }

                                    return (
                                      <>
                                        {compareField('peso', 'Peso', 'kg')}
                                        {compareField('hombros', 'Hombros', 'cm')}
                                        {compareField('pecho', 'Pecho', 'cm')}
                                        {compareField('espalda', 'Espalda', 'cm')}
                                        {compareField('biceps_der', 'Bíceps Der', 'cm')}
                                        {compareField('biceps_izq', 'Bíceps Izq', 'cm')}
                                        {compareField('cintura', 'Cintura', 'cm')}
                                        {compareField('gluteo', 'Glúteo', 'cm')}
                                        {compareField('pierna_der', 'Pierna Der', 'cm')}
                                        {compareField('pierna_izq', 'Pierna Izq', 'cm')}
                                        {compareField('pantorrilla_der', 'Pantorrilla Der', 'cm')}
                                        {compareField('pantorrilla_izq', 'Pantorrilla Izq', 'cm')}
                                      </>
                                    )
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Sección de Fotos de Progreso - Solo visualización */}
                          <div className="glass-card border border-white/10 p-6">
                            <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                              <Camera className="w-5 h-5 text-accent-primary" />
                              <span>Fotos de Progreso</span>
                            </h3>

                            {loadingPhotos ? (
                              <div className="text-center py-8 text-slate-400">
                                <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p>Cargando fotos...</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-6">
                                {/* Columna ANTES */}
                                <div>
                                  <h4 className="text-sm font-medium text-slate-300 mb-3 text-center">ANTES</h4>
                                  {startPhotos.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                      {['frontal', 'lateral', 'posterior'].map((type) => {
                                        const photo = startPhotos.find(p => p.photo_type === type)
                                        return photo ? (
                                          <div key={type} className="space-y-1">
                                            <img
                                              src={photo.photo_url}
                                              alt={type}
                                              className="w-full h-24 object-cover rounded-lg border border-white/10"
                                            />
                                            <p className="text-xs text-slate-400 text-center capitalize">{type}</p>
                                          </div>
                                        ) : null
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-center py-6 text-slate-500 text-sm">
                                      Sin fotos
                                    </div>
                                  )}
                                </div>

                                {/* Columna DESPUÉS */}
                                <div>
                                  <h4 className="text-sm font-medium text-slate-300 mb-3 text-center">DESPUÉS</h4>
                                  {endPhotos.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                      {['frontal', 'lateral', 'posterior'].map((type) => {
                                        const photo = endPhotos.find(p => p.photo_type === type)
                                        return photo ? (
                                          <div key={type} className="space-y-1">
                                            <img
                                              src={photo.photo_url}
                                              alt={type}
                                              className="w-full h-24 object-cover rounded-lg border border-white/10"
                                            />
                                            <p className="text-xs text-slate-400 text-center capitalize">{type}</p>
                                          </div>
                                        ) : null
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-center py-6 text-slate-500 text-sm">
                                      Sin fotos
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Botón Enviar PDF por WhatsApp */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSendWhatsAppPDF}
                            className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 flex items-center justify-center space-x-3"
                          >
                            <FaWhatsapp className="w-6 h-6" />
                            <span className="text-lg">Enviar PDF por WhatsApp</span>
                          </motion.button>
                        </>
                      ) : (
                        <div className="text-center py-12 text-slate-400">
                          Selecciona ambos períodos para ver la comparación
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fecha
                    </label>
                    <input
                      {...register('date')}
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      className="max-w-[280px] w-full px-3 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 text-sm"
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-400">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Objetivo */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Objetivo (Opcional)
                    </label>
                    <input
                      {...register('objetivo')}
                      type="text"
                      placeholder="Ej: Reducir grasa corporal"
                      className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    />
                  </div>

                  {/* Peso */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      {...register('peso', { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    />
                  </div>

                  {/* Medidas en grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Hombros (cm)
                      </label>
                      <input
                        {...register('hombros', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="120"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pecho (cm)
                      </label>
                      <input
                        {...register('pecho', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="100"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Espalda (cm)
                      </label>
                      <input
                        {...register('espalda', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="105"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bíceps Der (cm)
                      </label>
                      <input
                        {...register('biceps_der', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="35"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bíceps Izq (cm)
                      </label>
                      <input
                        {...register('biceps_izq', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="35"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Cintura (cm)
                      </label>
                      <input
                        {...register('cintura', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="80"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Glúteo (cm)
                      </label>
                      <input
                        {...register('gluteo', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="95"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pierna Der (cm)
                      </label>
                      <input
                        {...register('pierna_der', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="55"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pierna Izq (cm)
                      </label>
                      <input
                        {...register('pierna_izq', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="55"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pantorrilla Der (cm)
                      </label>
                      <input
                        {...register('pantorrilla_der', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="38"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pantorrilla Izq (cm)
                      </label>
                      <input
                        {...register('pantorrilla_izq', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="38"
                        className="w-full px-4 py-2 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Notas (Opcional)
                    </label>
                    <textarea
                      {...register('notas')}
                      rows={3}
                      placeholder="Observaciones adicionales..."
                      className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 resize-none"
                    />
                  </div>

                  {/* Fotos de Progreso */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Fotos de Progreso (Opcional)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['frontal', 'lateral', 'posterior'].map((type) => {
                        const existingPhoto = currentMeasurementPhotos.find(p => p.photo_type === type)
                        const pendingPreview = photoPreview[type]

                        return (
                          <div key={type} className="space-y-2">
                            <label className="text-xs text-slate-400 capitalize block text-center">{type}</label>

                            {existingPhoto && !pendingPreview ? (
                              // Foto ya guardada
                              <div className="relative group">
                                <img
                                  src={existingPhoto.photo_url}
                                  alt={type}
                                  className="w-full h-32 object-cover rounded-lg border border-white/10"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleFormPhotoDelete(existingPhoto.id)}
                                  className="absolute top-1 right-1 p-1.5 bg-red-500/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ) : pendingPreview ? (
                              // Preview de foto pendiente
                              <div className="relative group">
                                <img
                                  src={pendingPreview}
                                  alt={type}
                                  className="w-full h-32 object-cover rounded-lg border border-accent-primary/30"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleFormPhotoRemove(type)}
                                  className="absolute top-1 right-1 p-1.5 bg-red-500/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3 text-white" />
                                </button>
                                <div className="absolute bottom-1 left-1 right-1 bg-accent-primary/80 text-white text-xs py-1 rounded text-center">
                                  Pendiente
                                </div>
                              </div>
                            ) : (
                              // Sin foto - mostrar botón de subida
                              <label className="block w-full h-32 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFormPhotoSelect(type, file)
                                  }}
                                />
                                <Camera className="w-6 h-6 text-slate-500 mb-1" />
                                <span className="text-xs text-slate-500">Subir</span>
                              </label>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Formatos: JPG, PNG | Máximo: 5MB</p>
                  </div>

                  {/* Botones */}
                  <div className="flex space-x-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setActiveTab('history')
                        setEditingMeasurement(null)
                        setPendingPhotos({})
                        setPhotoPreview({})
                        setCurrentMeasurementPhotos([])
                        reset()
                      }}
                      className="flex-1 py-3 px-4 bg-dark-200/50 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-dark-200/70 transition-all duration-300"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>{isLoading ? 'Guardando...' : editingMeasurement ? 'Actualizar' : 'Guardar'}</span>
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>

          {/* Reporte oculto para generar imagen */}
          <div
            ref={reportRef}
            className="fixed"
            style={{
              position: 'fixed',
              left: '-9999px',
              top: 0,
              width: '800px',
              backgroundColor: '#0B1426',
            }}
          >
            <div className="p-8 space-y-6">
              {/* Header del Reporte */}
              <div className="text-center border-b border-white/20 pb-6">
                <h1 className="text-3xl font-bold text-white mb-2">AccesoGym Coach</h1>
                <p className="text-xl text-accent-primary">Reporte de Medidas y Avances</p>
              </div>

              {/* Información del Cliente */}
              {client && (
                <div className="bg-dark-200/30 rounded-lg p-6 border border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Cliente</p>
                      <p className="text-lg font-semibold text-white">{client.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Cédula</p>
                      <p className="text-lg font-semibold text-white">{client.document_type}-{client.cedula}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Teléfono</p>
                      <p className="text-lg font-semibold text-white">{client.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Fecha de Reporte</p>
                      <p className="text-lg font-semibold text-white">{format(new Date(), 'dd MMM yyyy', { locale: es })}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Medidas Registradas */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Historial de Medidas</h2>
                <div className="space-y-4">
                  {measurements.map((measurement, index) => (
                    <div
                      key={measurement.id}
                      className="bg-dark-200/30 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                        <p className="text-lg font-semibold text-accent-primary">
                          {formatDate(measurement.date)}
                        </p>
                        {index === 0 && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                            Más reciente
                          </span>
                        )}
                      </div>

                      {measurement.objetivo && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-400">Objetivo:</p>
                          <p className="text-white">{measurement.objetivo}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        {measurement.peso && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Peso</p>
                            <p className="text-white font-semibold">{measurement.peso} kg</p>
                          </div>
                        )}
                        {measurement.hombros && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Hombros</p>
                            <p className="text-white font-semibold">{measurement.hombros} cm</p>
                          </div>
                        )}
                        {measurement.pecho && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Pecho</p>
                            <p className="text-white font-semibold">{measurement.pecho} cm</p>
                          </div>
                        )}
                        {measurement.espalda && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Espalda</p>
                            <p className="text-white font-semibold">{measurement.espalda} cm</p>
                          </div>
                        )}
                        {measurement.biceps_der && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Bíceps Der</p>
                            <p className="text-white font-semibold">{measurement.biceps_der} cm</p>
                          </div>
                        )}
                        {measurement.biceps_izq && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Bíceps Izq</p>
                            <p className="text-white font-semibold">{measurement.biceps_izq} cm</p>
                          </div>
                        )}
                        {measurement.cintura && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Cintura</p>
                            <p className="text-white font-semibold">{measurement.cintura} cm</p>
                          </div>
                        )}
                        {measurement.gluteo && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Glúteo</p>
                            <p className="text-white font-semibold">{measurement.gluteo} cm</p>
                          </div>
                        )}
                        {measurement.pierna_der && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Pierna Der</p>
                            <p className="text-white font-semibold">{measurement.pierna_der} cm</p>
                          </div>
                        )}
                        {measurement.pierna_izq && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Pierna Izq</p>
                            <p className="text-white font-semibold">{measurement.pierna_izq} cm</p>
                          </div>
                        )}
                        {measurement.pantorrilla_der && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Pantorrilla Der</p>
                            <p className="text-white font-semibold">{measurement.pantorrilla_der} cm</p>
                          </div>
                        )}
                        {measurement.pantorrilla_izq && (
                          <div className="bg-dark-200/50 rounded p-2">
                            <p className="text-slate-400">Pantorrilla Izq</p>
                            <p className="text-white font-semibold">{measurement.pantorrilla_izq} cm</p>
                          </div>
                        )}
                      </div>

                      {measurement.notas && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-sm text-slate-400">Notas:</p>
                          <p className="text-sm text-white">{measurement.notas}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t border-white/20">
                <p className="text-sm text-slate-400">
                  Generado por AccesoGym Coach - {format(new Date(), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Detalles */}
      <AnimatePresence>
        {detailsModal.isOpen && detailsModal.measurement && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setDetailsModal({ isOpen: false, measurement: null })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-accent-primary" />
                    <h3 className="text-lg font-semibold text-white">
                      {formatDate(detailsModal.measurement.date)}
                    </h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDetailsModal({ isOpen: false, measurement: null })}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {detailsModal.measurement.objetivo && (
                  <div className="mb-4 p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-accent-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400">Objetivo</p>
                        <p className="text-sm text-white">{detailsModal.measurement.objetivo}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {detailsModal.measurement.peso && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Peso</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.peso} kg</p>
                    </div>
                  )}
                  {detailsModal.measurement.hombros && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Hombros</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.hombros} cm</p>
                    </div>
                  )}
                  {detailsModal.measurement.pecho && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Pecho</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.pecho} cm</p>
                    </div>
                  )}
                  {detailsModal.measurement.espalda && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Espalda</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.espalda} cm</p>
                    </div>
                  )}
                  {detailsModal.measurement.biceps_der && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Bíceps Der</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.biceps_der} cm</p>
                    </div>
                  )}
                  {detailsModal.measurement.biceps_izq && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Bíceps Izq</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.biceps_izq} cm</p>
                    </div>
                  )}
                  {detailsModal.measurement.cintura && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Cintura</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.cintura} cm</p>
                    </div>
                  )}
                  {detailsModal.measurement.gluteo && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Glúteo</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.gluteo} cm</p>
                    </div>
                  )}
                  {detailsModal.measurement.pierna_der && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Pierna Der</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.pierna_der} cm</p>
                    </div>
                  )}
                  {detailsModal.measurement.pierna_izq && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Pierna Izq</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.pierna_izq} cm</p>
                    </div>
                  )}
                  {detailsModal.measurement.pantorrilla_der && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Pantorrilla Der</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.pantorrilla_der} cm</p>
                    </div>
                  )}
                  {detailsModal.measurement.pantorrilla_izq && (
                    <div className="bg-dark-200/50 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Pantorrilla Izq</p>
                      <p className="text-lg font-semibold text-white">{detailsModal.measurement.pantorrilla_izq} cm</p>
                    </div>
                  )}
                </div>

                {detailsModal.measurement.notas && (
                  <div className="mt-4 p-3 bg-dark-200/30 rounded-lg border border-white/10">
                    <p className="text-xs text-slate-400 mb-1">Notas</p>
                    <p className="text-sm text-white">{detailsModal.measurement.notas}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </>
  )
}
