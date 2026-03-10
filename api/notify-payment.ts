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
  if (req.method !== 'POST') return res.status(405).end()

  const { coachName, bank, reference } = req.body

  // Obtener suscripciones de superusers/admins
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('auth_user_id')
    .in('role', ['superuser', 'admin'])

  if (!profiles || profiles.length === 0) return res.status(200).json({ sent: 0 })

  const adminIds = profiles.map(p => p.auth_user_id)

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .in('auth_user_id', adminIds)

  if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 })

  const payload = JSON.stringify({
    title: 'Nuevo comprobante de pago',
    body: `${coachName} envió un comprobante. Banco: ${bank}, Ref: ${reference}. Verifica en Gestión de Licencias.`,
    url: '/license-management',
  })

  const results = await Promise.allSettled(
    subs.map(({ subscription }) =>
      webpush.sendNotification(subscription, payload)
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return res.status(200).json({ sent })
}
