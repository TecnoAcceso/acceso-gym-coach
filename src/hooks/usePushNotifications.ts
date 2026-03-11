import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string
// Incrementar este valor en cada deploy para forzar re-suscripción
const SW_VERSION = '3'
const SW_VERSION_KEY = 'push-sw-version'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer as ArrayBuffer
}

export function usePushNotifications() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (!VAPID_PUBLIC_KEY) return

    const subscribe = async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const storedVersion = localStorage.getItem(SW_VERSION_KEY)
        const existing = await reg.pushManager.getSubscription()

        // Si el SW cambió de versión, forzar re-suscripción
        if (storedVersion !== SW_VERSION && existing) {
          await existing.unsubscribe()
        }

        const currentSub = storedVersion !== SW_VERSION ? null : existing

        if (currentSub) {
          // Suscripción vigente y SW no cambió: solo sincronizar con Supabase
          await supabase.from('push_subscriptions').upsert({
            auth_user_id: user.id,
            subscription: currentSub.toJSON(),
          }, { onConflict: 'auth_user_id' })
          return
        }

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        await supabase.from('push_subscriptions').upsert({
          auth_user_id: user.id,
          subscription: subscription.toJSON(),
        }, { onConflict: 'auth_user_id' })

        localStorage.setItem(SW_VERSION_KEY, SW_VERSION)
      } catch (err) {
        console.error('Push subscription error:', err)
      }
    }

    subscribe()
  }, [user])
}
