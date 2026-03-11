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

  const { coachAuthUserId, coachName, expiryDate } = req.body

  if (!coachAuthUserId) return res.status(400).json({ error: 'coachAuthUserId requerido' })

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('auth_user_id', coachAuthUserId)

  if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 })

  const payload = JSON.stringify({
    title: '✅ Licencia activada',
    body: `Hola ${coachName}, tu pago fue aprobado. Licencia activa hasta ${expiryDate}.`,
    url: '/dashboard',
  })

  const results = await Promise.allSettled(
    subs.map(({ subscription }) =>
      webpush.sendNotification(subscription, payload)
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return res.status(200).json({ sent })
}
