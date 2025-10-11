import * as XLSX from 'xlsx'
import { Client, MeasurementRecord } from '@/types/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export async function exportClientsToExcel(clients: Client[], measurements: MeasurementRecord[]) {
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
