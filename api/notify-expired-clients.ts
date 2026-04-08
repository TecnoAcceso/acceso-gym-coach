import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir GET para cron de Vercel y POST para llamadas manuales
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  const today = new Date().toISOString().split('T')[0]

  // Obtener clientes vencidos hoy agrupados por trainer_id
  const { data: clients, error } = await supabase
    .from('clients')
    .select('full_name, trainer_id, end_date')
    .eq('end_date', today)

  if (error) return res.status(500).json({ error: error.message })
  if (!clients || clients.length === 0) return res.status(200).json({ sent: 0, debug_today: today, debug_clients_found: 0 })

  // Agrupar por trainer_id
  const byTrainer: Record<string, string[]> = {}
  for (const c of clients) {
    if (!c.trainer_id) continue
    if (!byTrainer[c.trainer_id]) byTrainer[c.trainer_id] = []
    byTrainer[c.trainer_id].push(c.full_name)
  }

  const trainerAuthIds = Object.keys(byTrainer)
  if (trainerAuthIds.length === 0) return res.status(200).json({ sent: 0 })

  // Obtener auth_user_id de los trainers afectados
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('auth_user_id')
    .in('auth_user_id', trainerAuthIds)

  if (!profiles || profiles.length === 0) return res.status(200).json({ sent: 0 })

  // Obtener suscripciones push de esos trainers
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('auth_user_id, subscription')
    .in('auth_user_id', trainerAuthIds)

  if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 })

  const results = await Promise.allSettled(
    subs.map(({ auth_user_id, subscription }) => {
      const names = byTrainer[auth_user_id] || []
      const count = names.length
      const body = count === 1
        ? `${names[0]} tiene la membresía vencida hoy. Toca para enviarle un recordatorio.`
        : `${count} clientes tienen la membresía vencida hoy: ${names.slice(0, 3).join(', ')}${count > 3 ? '...' : ''}.`

      return webpush.sendNotification(subscription, JSON.stringify({
        title: count === 1 ? '⚠️ Membresía Vencida ⚠️' : `⚠️ ${count} Membresías Vencidas ⚠️`,
        body,
        url: '/dashboard',
      }))
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return res.status(200).json({ sent, total: subs.length })
}
