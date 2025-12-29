import jsPDF from 'jspdf'
import type { RoutineTemplateWithExercises } from '@/types/routine'
import { groupExercisesByDay } from './formatRoutineForWhatsApp'

interface PDFOptions {
  routine: RoutineTemplateWithExercises
  clientName: string
  trainerName: string
  startDate: string
  endDate: string
  notes?: string
}

export async function generateRoutinePDF(options: PDFOptions): Promise<Blob> {
  const { routine, clientName, trainerName, startDate, endDate, notes } = options
  const doc = new jsPDF()

  let yPosition = 15
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)

  // Helper function to check if we need a new page
  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Header - Mas pequeño
  doc.setFillColor(124, 58, 237) // Purple gradient color
  doc.rect(0, 0, pageWidth, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RUTINA DE ENTRENAMIENTO', pageWidth / 2, 10, { align: 'center' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Coach: ' + trainerName, pageWidth / 2, 17, { align: 'center' })

  yPosition = 28

  // Client Info - Compacto
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Cliente: ' + clientName, margin, yPosition)
  yPosition += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Rutina: ' + routine.name, margin, yPosition)
  yPosition += 5

  // Metadata en una sola linea
  const metadata = routine.duration_weeks + ' semanas | ' + startDate + ' - ' + endDate
  doc.text(metadata, margin, yPosition)
  yPosition += 5

  if (routine.category || routine.difficulty) {
    const tags = []
    if (routine.category) tags.push(routine.category)
    if (routine.difficulty) tags.push('Nivel: ' + routine.difficulty)
    doc.text(tags.join(' | '), margin, yPosition)
    yPosition += 5
  }

  if (routine.description) {
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    const splitDescription = doc.splitTextToSize(routine.description, contentWidth)
    doc.text(splitDescription, margin, yPosition)
    yPosition += splitDescription.length * 3.5 + 2
  }

  if (notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    doc.text('Notas: ', margin, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    const splitNotes = doc.splitTextToSize(notes, contentWidth - 15)
    doc.text(splitNotes, margin + 12, yPosition)
    yPosition += splitNotes.length * 3.5 + 2
  }

  // Line separator
  yPosition += 2
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 6

  // Days and Exercises
  const days = groupExercisesByDay(routine)

  for (const day of days) {
    checkPageBreak(15)

    // Day Header - Mas compacto
    doc.setFillColor(124, 58, 237)
    doc.roundedRect(margin, yPosition - 3, contentWidth, 8, 1, 1, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('DIA ' + day.day_number + ' - ' + day.day_name.toUpperCase(), margin + 3, yPosition + 2)
    yPosition += 10

    // Exercises
    for (let i = 0; i < day.exercises.length; i++) {
      const exercise = day.exercises[i]

      // Calcular espacio necesario
      const hasImage = exercise.exercise_photo_url
      const hasNotes = exercise.notes && exercise.notes.trim() !== ''
      const neededSpace = hasImage ? 55 : (hasNotes ? 20 : 15)

      checkPageBreak(neededSpace)

      // Nombre del ejercicio
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text((i + 1) + '. ' + exercise.exercise_name, margin + 3, yPosition)
      yPosition += 5

      // Info en una linea compacta
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(60, 60, 60)

      let infoLine = 'Series: ' + exercise.sets + ' | Reps: ' + exercise.reps

      if (exercise.rest_seconds > 0) {
        const restTime = exercise.rest_seconds < 60
          ? exercise.rest_seconds + 's'
          : Math.floor(exercise.rest_seconds / 60) + 'm' + (exercise.rest_seconds % 60 > 0 ? ' ' + (exercise.rest_seconds % 60) + 's' : '')
        infoLine += ' | Descanso: ' + restTime
      }

      doc.text(infoLine, margin + 6, yPosition)
      yPosition += 4

      // Notas si existen
      if (hasNotes) {
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(7)
        const splitExerciseNotes = doc.splitTextToSize('Nota: ' + exercise.notes, contentWidth - 12)
        doc.text(splitExerciseNotes, margin + 6, yPosition)
        yPosition += splitExerciseNotes.length * 3 + 2
      }

      // Imagen si existe
      if (hasImage && exercise.exercise_photo_url) {
        try {
          const img = await loadImage(exercise.exercise_photo_url)
          const imgWidth = 50
          const imgHeight = 38

          doc.addImage(img, 'JPEG', margin + 6, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 3
        } catch (error) {
          console.error('Error loading exercise image:', error)
          doc.setTextColor(150, 150, 150)
          doc.setFontSize(7)
          doc.text('(Imagen no disponible)', margin + 6, yPosition)
          yPosition += 3
        }
      }

      yPosition += 3
    }

    yPosition += 4
  }

  // Footer - Compacto
  checkPageBreak(20)
  yPosition += 5
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(124, 58, 237)
  doc.text('Vamos con todo!', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Cualquier duda, no dudes en consultarme.', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 5

  doc.setFont('helvetica', 'bold')
  doc.text('Att: ' + trainerName, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 5

  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(150, 150, 150)
  doc.text('Powered by TecnoAcceso / ElectroShop', pageWidth / 2, yPosition, { align: 'center' })

  return doc.output('blob')
}

// Helper function to load images
function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// Function to open PDF in WhatsApp
export function sendPDFViaWhatsApp(
  pdfBlob: Blob,
  phone: string,
  clientName: string,
  routineName: string,
  trainerName: string = 'Tu Coach'
) {
  // Create a temporary download link
  const url = URL.createObjectURL(pdfBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Rutina_${clientName.replace(/\s+/g, '_')}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  // Open WhatsApp with message
  const phoneNumber = phone.replace(/\D/g, '')
  const message = encodeURIComponent(
    `Hola ${clientName}! 👋\n\n` +
    `🏋️ Te envio tu rutina personalizada: *${routineName}*\n\n` +
    `📄 He generado un PDF completo con imagenes de todos los ejercicios para que puedas seguirla facilmente.\n\n` +
    `📎 *Adjuntare el PDF en el siguiente mensaje*\n\n` +
    `Cualquier duda sobre los ejercicios, no dudes en consultarme.\n\n` +
    `💪 Vamos con todo!\n\n` +
    `Att. ${trainerName}\n` +
    `----------------------\n` +
    `AccesoGymCoach _POWERED BY_ *@tecnoacceso_*`
  )
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

  window.open(whatsappUrl, '_blank')
}
