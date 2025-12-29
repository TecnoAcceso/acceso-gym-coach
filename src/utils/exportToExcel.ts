import * as XLSX from 'xlsx'
import { Client, MeasurementRecord, ProgressPhoto } from '@/types/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ExportData {
  measurements: MeasurementRecord[]
  routines?: any[]
  nutritionPlans?: any[]
  progressPhotos?: ProgressPhoto[]
}

export async function exportClientsToExcel(clients: Client[], data: ExportData) {
  const { measurements, routines = [], nutritionPlans = [], progressPhotos = [] } = data
  try {
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new()

    // ==================== HOJA 1: CLIENTES ====================
    const clientsData = clients.map(client => {
      // Calcular edad si tiene fecha de nacimiento
      let age = ''
      if (client.birth_date) {
        const birthDate = new Date(client.birth_date)
        const today = new Date()
        let calculatedAge = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--
        }
        age = `${calculatedAge} años`
      }

      return {
        'Tipo Doc': client.document_type,
        'Cédula': client.cedula,
        'Nombre Completo': client.full_name,
        'Teléfono': client.phone,
        'Fecha Nacimiento': client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy', { locale: es }) : '',
        'Edad': age,
        'Peso Inicial (kg)': client.initial_weight || '',
        'Altura (cm)': client.height || '',
        'Tiene Patología': client.medical_condition?.has_pathology ? 'Sí' : 'No',
        'Detalle Patología': client.medical_condition?.pathology_detail || '',
        'Tiene Lesión': client.medical_condition?.has_injury ? 'Sí' : 'No',
        'Detalle Lesión': client.medical_condition?.injury_detail || '',
        'Tiene Alergias': client.medical_condition?.has_allergies ? 'Sí' : 'No',
        'Detalle Alergias': client.medical_condition?.allergies_detail || '',
        'Fecha Inicio': format(new Date(client.start_date), 'dd/MM/yyyy', { locale: es }),
        'Duración (meses)': client.duration_months,
        'Fecha Fin': format(new Date(client.end_date), 'dd/MM/yyyy', { locale: es }),
        'Estado': client.status === 'active' ? 'Activo' : client.status === 'expiring' ? 'Por Vencer' : 'Vencido',
        'Fecha Registro': format(new Date(client.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
        'Última Actualización': format(new Date(client.updated_at), 'dd/MM/yyyy HH:mm', { locale: es }),
      }
    })

    const clientsWorksheet = XLSX.utils.json_to_sheet(clientsData)

    // Ajustar ancho de columnas para la hoja de clientes
    const clientsColWidths = [
      { wch: 8 },  // Tipo Doc
      { wch: 10 }, // Cédula
      { wch: 25 }, // Nombre
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Fecha Nacimiento
      { wch: 10 }, // Edad
      { wch: 12 }, // Peso Inicial
      { wch: 12 }, // Altura
      { wch: 15 }, // Tiene Patología
      { wch: 30 }, // Detalle Patología
      { wch: 15 }, // Tiene Lesión
      { wch: 30 }, // Detalle Lesión
      { wch: 15 }, // Tiene Alergias
      { wch: 30 }, // Detalle Alergias
      { wch: 15 }, // Fecha Inicio
      { wch: 15 }, // Duración
      { wch: 15 }, // Fecha Fin
      { wch: 12 }, // Estado
      { wch: 18 }, // Fecha Registro
      { wch: 18 }, // Última Actualización
    ]
    clientsWorksheet['!cols'] = clientsColWidths

    XLSX.utils.book_append_sheet(workbook, clientsWorksheet, 'Clientes')

    // ==================== HOJA 2: MEDICIONES ====================
    const measurementsData = measurements.map(measurement => {
      // Buscar el cliente correspondiente
      const client = clients.find(c => c.id === measurement.client_id)

      return {
        'Cliente': client ? client.full_name : 'Desconocido',
        'Cédula': client ? `${client.document_type}-${client.cedula}` : '',
        'Fecha Medición': format(new Date(measurement.date), 'dd/MM/yyyy', { locale: es }),
        'Objetivo': measurement.objetivo || '',
        'Peso (kg)': measurement.peso || '',
        'Hombros (cm)': measurement.hombros || '',
        'Pecho (cm)': measurement.pecho || '',
        'Espalda (cm)': measurement.espalda || '',
        'Bíceps Der (cm)': measurement.biceps_der || '',
        'Bíceps Izq (cm)': measurement.biceps_izq || '',
        'Cintura (cm)': measurement.cintura || '',
        'Glúteo (cm)': measurement.gluteo || '',
        'Pierna Der (cm)': measurement.pierna_der || '',
        'Pierna Izq (cm)': measurement.pierna_izq || '',
        'Pantorrilla Der (cm)': measurement.pantorrilla_der || '',
        'Pantorrilla Izq (cm)': measurement.pantorrilla_izq || '',
        'Notas': measurement.notas || '',
        'Fecha Registro': format(new Date(measurement.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
      }
    })

    if (measurementsData.length > 0) {
      const measurementsWorksheet = XLSX.utils.json_to_sheet(measurementsData)

      // Ajustar ancho de columnas para la hoja de mediciones
      const measurementsColWidths = [
        { wch: 25 }, // Cliente
        { wch: 12 }, // Cédula
        { wch: 15 }, // Fecha Medición
        { wch: 20 }, // Objetivo
        { wch: 10 }, // Peso
        { wch: 12 }, // Hombros
        { wch: 12 }, // Pecho
        { wch: 12 }, // Espalda
        { wch: 14 }, // Bíceps Der
        { wch: 14 }, // Bíceps Izq
        { wch: 12 }, // Cintura
        { wch: 12 }, // Glúteo
        { wch: 14 }, // Pierna Der
        { wch: 14 }, // Pierna Izq
        { wch: 16 }, // Pantorrilla Der
        { wch: 16 }, // Pantorrilla Izq
        { wch: 40 }, // Notas
        { wch: 18 }, // Fecha Registro
      ]
      measurementsWorksheet['!cols'] = measurementsColWidths

      XLSX.utils.book_append_sheet(workbook, measurementsWorksheet, 'Mediciones')
    }

    // ==================== HOJA 3: RUTINAS ====================
    if (routines.length > 0) {
      const routinesData = routines.map(routine => {
        const client = clients.find(c => c.id === routine.client_id)

        // Formatear ejercicios de manera legible
        let exercisesText = ''
        if (routine.exercises && routine.exercises.length > 0) {
          exercisesText = routine.exercises.map((ex: any) =>
            `Día ${ex.day_number} (${ex.day_name}): ${ex.exercise_name} - ${ex.sets}x${ex.reps}, ${ex.rest_seconds}s descanso`
          ).join(' | ')
        }

        return {
          'Cliente': client ? client.full_name : 'Desconocido',
          'Cédula': client ? `${client.document_type}-${client.cedula}` : '',
          'Nombre Rutina': routine.routine_name || '',
          'Descripción': routine.description || '',
          'Duración (semanas)': routine.duration_weeks || '',
          'Ejercicios': exercisesText,
          'Fecha Asignación': routine.assigned_date ? format(new Date(routine.assigned_date), 'dd/MM/yyyy HH:mm', { locale: es }) : '',
          'Estado': routine.status === 'active' ? 'Activa' : routine.status === 'completed' ? 'Completada' : 'Pausada',
        }
      })

      const routinesWorksheet = XLSX.utils.json_to_sheet(routinesData)
      const routinesColWidths = [
        { wch: 25 }, // Cliente
        { wch: 12 }, // Cédula
        { wch: 30 }, // Nombre Rutina
        { wch: 40 }, // Descripción
        { wch: 18 }, // Duración
        { wch: 80 }, // Ejercicios
        { wch: 18 }, // Fecha Asignación
        { wch: 12 }, // Estado
      ]
      routinesWorksheet['!cols'] = routinesColWidths
      XLSX.utils.book_append_sheet(workbook, routinesWorksheet, 'Rutinas')
    }

    // ==================== HOJA 4: PLANES NUTRICIONALES ====================
    if (nutritionPlans.length > 0) {
      const nutritionData = nutritionPlans.map(plan => {
        const client = clients.find(c => c.id === plan.client_id)

        return {
          'Cliente': client ? client.full_name : 'Desconocido',
          'Cédula': client ? `${client.document_type}-${client.cedula}` : '',
          'Nombre Plan': plan.plan_name || '',
          'Calorías Objetivo': plan.target_calories || '',
          'Proteínas (g)': plan.target_protein_g || '',
          'Carbohidratos (g)': plan.target_carbs_g || '',
          'Grasas (g)': plan.target_fats_g || '',
          'Comidas': plan.meals_count || '',
          'Fecha Asignación': plan.assigned_date ? format(new Date(plan.assigned_date), 'dd/MM/yyyy HH:mm', { locale: es }) : '',
          'Estado': plan.status === 'active' ? 'Activo' : plan.status === 'completed' ? 'Completado' : 'Pausado',
        }
      })

      const nutritionWorksheet = XLSX.utils.json_to_sheet(nutritionData)
      const nutritionColWidths = [
        { wch: 25 }, // Cliente
        { wch: 12 }, // Cédula
        { wch: 30 }, // Nombre Plan
        { wch: 16 }, // Calorías
        { wch: 14 }, // Proteínas
        { wch: 18 }, // Carbohidratos
        { wch: 12 }, // Grasas
        { wch: 10 }, // Comidas
        { wch: 18 }, // Fecha Asignación
        { wch: 12 }, // Estado
      ]
      nutritionWorksheet['!cols'] = nutritionColWidths
      XLSX.utils.book_append_sheet(workbook, nutritionWorksheet, 'Planes Nutricionales')
    }

    // ==================== HOJA 5: DETALLE DE COMIDAS ====================
    if (nutritionPlans.length > 0) {
      const mealsData: any[] = []

      nutritionPlans.forEach(plan => {
        const client = clients.find(c => c.id === plan.client_id)

        // Iterar sobre las comidas del plan
        if (plan.meals && Array.isArray(plan.meals)) {
          plan.meals.forEach((meal: any) => {
            // Formatear los alimentos
            let foodsText = ''
            let totalProtein = 0
            let totalCarbs = 0
            let totalFats = 0
            let totalCalories = 0

            if (meal.foods && Array.isArray(meal.foods)) {
              foodsText = meal.foods.map((food: any) => {
                const foodStr = `${food.name} (${food.quantity})`
                const nutrients: string[] = []

                if (food.protein_g) {
                  nutrients.push(`${food.protein_g}g prot`)
                  totalProtein += food.protein_g
                }
                if (food.carbs_g) {
                  nutrients.push(`${food.carbs_g}g carb`)
                  totalCarbs += food.carbs_g
                }
                if (food.fats_g) {
                  nutrients.push(`${food.fats_g}g gras`)
                  totalFats += food.fats_g
                }
                if (food.calories) {
                  nutrients.push(`${food.calories} cal`)
                  totalCalories += food.calories
                }

                return nutrients.length > 0 ? `${foodStr}: ${nutrients.join(', ')}` : foodStr
              }).join(' | ')
            }

            // Formatear hora a formato 12 horas
            let formattedTime = ''
            if (meal.meal_time_hour) {
              try {
                const [hours, minutes] = meal.meal_time_hour.split(':')
                const hour = parseInt(hours, 10)
                const minute = minutes || '00'
                const period = hour >= 12 ? 'PM' : 'AM'
                const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                formattedTime = `${hour12}:${minute} ${period}`
              } catch (e) {
                formattedTime = meal.meal_time_hour
              }
            }

            mealsData.push({
              'Cliente': client ? client.full_name : 'Desconocido',
              'Cédula': client ? `${client.document_type}-${client.cedula}` : '',
              'Plan': plan.plan_name || '',
              'Día': meal.day_of_week || '',
              'Tiempo Comida': meal.meal_time || '',
              'Hora': formattedTime,
              'Alimentos': foodsText,
              'Proteínas (g)': totalProtein || meal.protein_g || '',
              'Carbohidratos (g)': totalCarbs || meal.carbs_g || '',
              'Grasas (g)': totalFats || meal.fats_g || '',
              'Calorías': totalCalories || meal.calories || '',
              'Notas': meal.notes || ''
            })
          })
        }
      })

      if (mealsData.length > 0) {
        const mealsWorksheet = XLSX.utils.json_to_sheet(mealsData)
        const mealsColWidths = [
          { wch: 25 }, // Cliente
          { wch: 12 }, // Cédula
          { wch: 25 }, // Plan
          { wch: 12 }, // Día
          { wch: 15 }, // Tiempo Comida
          { wch: 8 },  // Hora
          { wch: 80 }, // Alimentos
          { wch: 14 }, // Proteínas
          { wch: 18 }, // Carbohidratos
          { wch: 12 }, // Grasas
          { wch: 10 }, // Calorías
          { wch: 40 }, // Notas
        ]
        mealsWorksheet['!cols'] = mealsColWidths
        XLSX.utils.book_append_sheet(workbook, mealsWorksheet, 'Detalle de Comidas')
      }
    }

    // ==================== HOJA 6: FOTOS DE PROGRESO ====================
    if (progressPhotos.length > 0) {
      const photosData = progressPhotos.map(photo => {
        const client = clients.find(c => c.id === photo.client_id)
        const measurement = measurements.find(m => m.id === photo.measurement_id)

        // Extraer nombre del archivo de la URL
        let fileName = 'sin_archivo'
        try {
          const urlParts = photo.photo_url.split('/')
          const fileNamePart = urlParts[urlParts.length - 1]
          fileName = fileNamePart.split('?')[0] // Remover query params
        } catch (e) {
          console.warn('Error extrayendo nombre de archivo:', e)
        }

        return {
          'Cliente': client ? client.full_name : 'Desconocido',
          'Cédula': client ? `${client.document_type}-${client.cedula}` : '',
          'Fecha Medición': measurement ? format(new Date(measurement.date), 'dd/MM/yyyy', { locale: es }) : '',
          'Tipo Foto': photo.photo_type === 'frontal' ? 'Frontal' : photo.photo_type === 'lateral' ? 'Lateral' : 'Posterior',
          'Nombre Archivo': fileName,
          'URL Descarga': photo.photo_url,
          'Fecha Registro': format(new Date(photo.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
          'Nota': 'Descargue las fotos desde las URLs proporcionadas antes de que expiren los enlaces firmados'
        }
      })

      const photosWorksheet = XLSX.utils.json_to_sheet(photosData)
      const photosColWidths = [
        { wch: 25 }, // Cliente
        { wch: 12 }, // Cédula
        { wch: 15 }, // Fecha Medición
        { wch: 12 }, // Tipo Foto
        { wch: 40 }, // Nombre Archivo
        { wch: 70 }, // URL Descarga
        { wch: 18 }, // Fecha Registro
        { wch: 60 }, // Nota
      ]
      photosWorksheet['!cols'] = photosColWidths
      XLSX.utils.book_append_sheet(workbook, photosWorksheet, 'Fotos de Progreso')
    }

    // Generar el archivo y descargarlo
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
    const fileName = `Backup_Clientes_${timestamp}.xlsx`

    XLSX.writeFile(workbook, fileName)

    return { success: true, fileName }
  } catch (error) {
    console.error('Error al exportar a Excel:', error)
    throw error
  }
}
