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
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  // Fecha de mañana en UTC
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  // Buscar coaches cuya licencia vence mañana
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('auth_user_id, full_name, license_expiry')
    .eq('license_expiry', tomorrowStr)
    .eq('role', 'trainer')

  if (error) return res.status(500).json({ error: error.message })
  if (!profiles || profiles.length === 0) return res.status(200).json({ sent: 0 })

  // Obtener suscripciones push de esos coaches
  const authIds = profiles.map(p => p.auth_user_id).filter(Boolean)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('auth_user_id, subscription')
    .in('auth_user_id', authIds)

  if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 })

  const results = await Promise.allSettled(
    subs.map(({ auth_user_id, subscription }) => {
      const profile = profiles.find(p => p.auth_user_id === auth_user_id)
      const name = profile?.full_name || 'Coach'

      return webpush.sendNotification(subscription, JSON.stringify({
        title: '🔔 Licencia por Vencer 🔔',
        body: `Hola ${name}, tu licencia de AccesoGymCoach vence mañana. Renuévala para no perder el acceso.`,
        url: '/settings',
      }))
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return res.status(200).json({ sent, total: subs.length })
}
