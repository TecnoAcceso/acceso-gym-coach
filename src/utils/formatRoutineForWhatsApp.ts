import type { RoutineTemplateWithExercises, RoutineDay } from '@/types/routine'

// Agrupa los ejercicios por día
export function groupExercisesByDay(routine: RoutineTemplateWithExercises): RoutineDay[] {
  const daysMap = new Map<number, RoutineDay>()

  routine.exercises.forEach(exercise => {
    if (!daysMap.has(exercise.day_number)) {
      daysMap.set(exercise.day_number, {
        day_number: exercise.day_number,
        day_name: exercise.day_name,
        exercises: []
      })
    }
    daysMap.get(exercise.day_number)!.exercises.push(exercise)
  })

  return Array.from(daysMap.values()).sort((a, b) => a.day_number - b.day_number)
}

// Formatea el tiempo de descanso en un formato legible
function formatRestTime(restSeconds: number): string {
  if (restSeconds < 60) {
    return `${restSeconds}s`
  }
  const minutes = Math.floor(restSeconds / 60)
  const seconds = restSeconds % 60
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

// Formatea una rutina completa para enviar por WhatsApp
export function formatRoutineForWhatsApp(
  routine: RoutineTemplateWithExercises,
  clientName: string,
  trainerName: string,
  startDate: string,
  endDate: string,
  notes?: string
): string {
  const days = groupExercisesByDay(routine)

  // Header
  let message = `🏋️ *RUTINA DE ENTRENAMIENTO* 🏋️\n\n`
  message += `👤 Cliente: *${clientName}*\n`
  message += `📋 Rutina: *${routine.name}*\n`

  if (routine.description) {
    message += `📝 ${routine.description}\n`
  }

  if (routine.category) {
    message += `🎯 Categoría: ${routine.category}\n`
  }

  if (routine.difficulty) {
    message += `📊 Nivel: ${routine.difficulty}\n`
  }

  message += `⏱️ Duración: ${routine.duration_weeks} semanas\n`
  message += `📅 Inicio: ${startDate}\n`
  message += `📅 Fin: ${endDate}\n`

  if (notes) {
    message += `\n💡 *Notas:* ${notes}\n`
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━\n`

  // Days and exercises
  days.forEach((day, dayIndex) => {
    message += `\n*DÍA ${day.day_number} - ${day.day_name.toUpperCase()}*\n`
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`

    day.exercises.forEach((exercise, exIndex) => {
      message += `${exIndex + 1}. *${exercise.exercise_name}*\n`
      message += `   • Series: ${exercise.sets}\n`
      message += `   • Repeticiones: ${exercise.reps}\n`

      if (exercise.rest_seconds > 0) {
        message += `   • Descanso: ${formatRestTime(exercise.rest_seconds)}\n`
      }

      if (exercise.notes) {
        message += `   • Nota: ${exercise.notes}\n`
      }

      message += `\n`
    })

    // No agregar separador después del último día
    if (dayIndex < days.length - 1) {
      message += `━━━━━━━━━━━━━━━━━━━━\n`
    }
  })

  // Footer
  message += `\n━━━━━━━━━━━━━━━━━━━━\n`
  message += `\n💪 *¡Vamos con todo!* 💪\n\n`
  message += `Cualquier duda que tengas sobre los ejercicios, no dudes en consultarme.\n\n`
  message += `Att. ${trainerName}\n`
  message += `----------------------\n`
  message += `AccesoGymCoach _POWERED BY_ *@tecnoacceso_*`

  return message
}

// Envía la rutina por WhatsApp
export function sendRoutineViaWhatsApp(
  phone: string,
  routine: RoutineTemplateWithExercises,
  clientName: string,
  trainerName: string,
  startDate: string,
  endDate: string,
  notes?: string
): void {
  const message = formatRoutineForWhatsApp(
    routine,
    clientName,
    trainerName,
    startDate,
    endDate,
    notes
  )

  const encodedMessage = encodeURIComponent(message)
  const phoneNumber = phone.replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

  window.open(whatsappUrl, '_blank')
}
