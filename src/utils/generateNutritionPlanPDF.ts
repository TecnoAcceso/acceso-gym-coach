import jsPDF from 'jspdf'
import type { NutritionPlanTemplateWithMeals, FoodItem, DayOfWeek } from '@/types/nutrition'
import { mealTimeLabels, daysOfWeek, dayOfWeekFullLabels } from '@/types/nutrition'

interface PDFOptions {
  plan: NutritionPlanTemplateWithMeals
  clientName: string
  trainerName: string
  startDate: string
  endDate: string
  notes?: string
}

export async function generateNutritionPlanPDF(options: PDFOptions): Promise<Blob> {
  const { plan, clientName, trainerName, startDate, endDate, notes } = options
  const doc = new jsPDF()

  let yPosition = 15
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)

  // Helper para formatear hora de 24h a 12h con AM/PM
  const formatTime = (time24: string) => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'p.m.' : 'a.m.'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Helper function to check if we need a new page
  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Header - Igual al de rutina
  doc.setFillColor(124, 58, 237) // Purple gradient color
  doc.rect(0, 0, pageWidth, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PLAN NUTRICIONAL', pageWidth / 2, 10, { align: 'center' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Coach: ' + trainerName, pageWidth / 2, 17, { align: 'center' })

  yPosition = 28

  // Client Info - Compacto
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Cliente:', margin, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(clientName, margin + 20, yPosition)

  doc.setFont('helvetica', 'bold')
  doc.text('Plan:', pageWidth / 2 + 10, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(plan.name, pageWidth / 2 + 23, yPosition)

  yPosition += 6

  doc.setFont('helvetica', 'bold')
  doc.text('Inicio:', margin, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(startDate, margin + 20, yPosition)

  doc.setFont('helvetica', 'bold')
  doc.text('Fin:', pageWidth / 2 + 10, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(endDate, pageWidth / 2 + 23, yPosition)

  yPosition += 8

  // Separator line
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  // Plan Description
  if (plan.description) {
    checkPageBreak(15)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Descripción:', margin, yPosition)
    yPosition += 5
    doc.setFont('helvetica', 'normal')
    const descLines = doc.splitTextToSize(plan.description, contentWidth)
    doc.text(descLines, margin, yPosition)
    yPosition += (descLines.length * 4) + 5
  }

  // Daily Totals
  if (plan.calories || plan.protein_g || plan.carbs_g || plan.fats_g) {
    checkPageBreak(25)
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(margin, yPosition, contentWidth, 20, 2, 2, 'F')

    yPosition += 6
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTALES DIARIOS', margin + 3, yPosition)

    yPosition += 7
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')

    const totalsText = []
    if (plan.calories) totalsText.push(`Calorías: ${plan.calories} kcal`)
    if (plan.protein_g) totalsText.push(`Proteína: ${plan.protein_g}g`)
    if (plan.carbs_g) totalsText.push(`Carbohidratos: ${plan.carbs_g}g`)
    if (plan.fats_g) totalsText.push(`Grasas: ${plan.fats_g}g`)

    doc.text(totalsText.join('  |  '), margin + 3, yPosition)
    yPosition += 10
  }

  // Group meals by day of week
  const mealsByDay: Record<string, typeof plan.meals> = {}

  plan.meals.forEach(meal => {
    const day = meal.day_of_week
    if (!mealsByDay[day]) {
      mealsByDay[day] = []
    }
    mealsByDay[day].push(meal)
  })

  // Get all days with meals
  const daysWithMeals = daysOfWeek.filter(day => mealsByDay[day] && mealsByDay[day].length > 0)

  // Column width (2 columns layout)
  const columnWidth = (contentWidth - 5) / 2 // 5mm gap between columns
  const columnGap = 5

  // Helper to render a single meal in a column
  const renderMeal = (meal: typeof plan.meals[0], x: number, y: number, maxWidth: number): number => {
    let currentY = y

    // Meal Header
    doc.setFillColor(220, 220, 220)
    doc.roundedRect(x, currentY, maxWidth, 7, 1, 1, 'F')

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `${mealTimeLabels[meal.meal_time]} - ${formatTime(meal.meal_time_hour)}`,
      x + 2,
      currentY + 4.5
    )

    currentY += 8

    // Meal Macros
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')

    const macrosText = []
    if (meal.calories) macrosText.push(`${meal.calories} kcal`)
    if (meal.protein_g) macrosText.push(`P: ${meal.protein_g}g`)
    if (meal.carbs_g) macrosText.push(`C: ${meal.carbs_g}g`)
    if (meal.fats_g) macrosText.push(`G: ${meal.fats_g}g`)

    if (macrosText.length > 0) {
      doc.setTextColor(100, 100, 100)
      doc.text(macrosText.join(' | '), x + 2, currentY)
      currentY += 4
    }

    // Foods
    if (meal.foods && meal.foods.length > 0) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)

      meal.foods.forEach((food: FoodItem) => {
        const bullet = '•'
        const foodText = `${food.name} - ${food.quantity}`

        doc.text(bullet, x + 3, currentY)
        const lines = doc.splitTextToSize(foodText, maxWidth - 8)
        doc.text(lines, x + 6, currentY)
        currentY += (lines.length * 3)

        // Food macros (if available)
        const foodMacros = []
        if (food.calories) foodMacros.push(`${food.calories}kcal`)
        if (food.protein_g) foodMacros.push(`P:${food.protein_g}g`)
        if (food.carbs_g) foodMacros.push(`C:${food.carbs_g}g`)
        if (food.fats_g) foodMacros.push(`G:${food.fats_g}g`)

        if (foodMacros.length > 0) {
          doc.setTextColor(120, 120, 120)
          doc.setFontSize(6)
          const macroLines = doc.splitTextToSize(`(${foodMacros.join(', ')})`, maxWidth - 10)
          doc.text(macroLines, x + 8, currentY)
          currentY += (macroLines.length * 2.5)
          doc.setFontSize(7)
          doc.setTextColor(0, 0, 0)
        }
        currentY += 1
      })
    }

    // Meal notes
    if (meal.notes) {
      doc.setFontSize(6)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'italic')
      const noteLines = doc.splitTextToSize(`Nota: ${meal.notes}`, maxWidth - 6)
      doc.text(noteLines, x + 3, currentY)
      currentY += (noteLines.length * 2.5) + 2
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
    }

    return currentY - y // Return height used
  }

  // Iterate through each day
  let isFirstDay = true

  for (const day of daysWithMeals) {
    const dayMeals = mealsByDay[day]
    if (!dayMeals || dayMeals.length === 0) continue

    // Sort meals by order_index
    const sortedDayMeals = [...dayMeals].sort((a, b) => a.order_index - b.order_index)

    // Add new page for each day (except the first one which goes with totals)
    if (!isFirstDay) {
      doc.addPage()
      yPosition = 20
    }
    isFirstDay = false

    // Day Header
    doc.setFillColor(124, 58, 237)
    doc.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(dayOfWeekFullLabels[day].toUpperCase(), pageWidth / 2, yPosition + 7, { align: 'center' })

    yPosition += 14

    // Render meals in 2-column layout
    let mealIndex = 0
    while (mealIndex < sortedDayMeals.length) {
      // Check if we need a new page (leave space for at least 2 rows)
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      const leftMeal = sortedDayMeals[mealIndex]
      const rightMeal = mealIndex + 1 < sortedDayMeals.length ? sortedDayMeals[mealIndex + 1] : null

      const startY = yPosition

      // Render left column meal
      const leftHeight = renderMeal(leftMeal, margin, startY, columnWidth)

      // Render right column meal (if exists)
      let rightHeight = 0
      if (rightMeal) {
        rightHeight = renderMeal(rightMeal, margin + columnWidth + columnGap, startY, columnWidth)
      }

      // Move Y position to the tallest column
      yPosition = startY + Math.max(leftHeight, rightHeight) + 5

      mealIndex += 2 // Move to next pair of meals
    }

    yPosition += 5 // Extra space after each day
  }

  // General Notes
  if (notes) {
    checkPageBreak(20)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Notas del Coach:', margin, yPosition)
    yPosition += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const noteLines = doc.splitTextToSize(notes, contentWidth)
    doc.text(noteLines, margin, yPosition)
    yPosition += (noteLines.length * 4) + 5
  }

  // Footer
  const footerY = pageHeight - 15
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'italic')
  doc.text(
    'Plan nutricional personalizado - Sigue las indicaciones de tu coach',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc.output('blob')
}

export function sendNutritionPlanPDFViaWhatsApp(
  pdfBlob: Blob,
  phone: string,
  clientName: string,
  planName: string,
  trainerName: string = 'Tu Coach'
) {
  // Create a temporary download link
  const url = URL.createObjectURL(pdfBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Plan_Nutricional_${clientName.replace(/\s+/g, '_')}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  // Open WhatsApp with message
  const phoneNumber = phone.replace(/\D/g, '')
  const message = encodeURIComponent(
    `Hola ${clientName}! 👋\n\n` +
    `🥗 Te envío tu plan nutricional personalizado: *${planName}*\n\n` +
    `📋 Descarga el PDF adjunto con todos los detalles de tu plan de alimentación.\n\n` +
    `💪 Recuerda seguir las indicaciones y mantener la constancia para lograr tus objetivos.\n\n` +
    `Si tienes alguna duda, no dudes en consultarme. ¡Vamos por esos resultados! 🔥\n\n` +
    `Att. ${trainerName}\n` +
    `----------------------\n` +
    `AccesoGymCoach _POWERED BY_ *@tecnoacceso_*`
  )

  window.open(
    `https://wa.me/${phoneNumber}?text=${message}`,
    '_blank'
  )
}
