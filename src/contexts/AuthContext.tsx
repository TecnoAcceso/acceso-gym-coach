import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  auth_user_id: string
  username: string
  full_name: string
  role: 'trainer' | 'admin' | 'superuser'
  created_at: string
  updated_at: string
}

interface AuthUser extends User {
  username?: string
  full_name?: string
  role?: string
}

interface AuthContextType {
  user: AuthUser | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const setUserWithProfile = async (authUser: User | null, retryCount = 0, skipRetry = false) => {
    if (authUser) {
      try {
        console.log(`🔍 Loading profile for user: ${authUser.id} (Attempt ${retryCount + 1}/3)`)

        // Timeout de 30 segundos para la consulta
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile query timeout')), 30000)
        })

        const queryPromise = supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single()

        const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]) as any

        if (error || !profile) {
          console.error('❌ Profile not found:', error)

          // Si es error de timeout y tenemos intentos restantes (solo en init, no en refresh)
          if (error?.message === 'Profile query timeout' && retryCount < 2 && !skipRetry) {
            console.log(`🔄 Retrying profile load... (${retryCount + 1}/2)`)
            await new Promise(resolve => setTimeout(resolve, 1000))
            return setUserWithProfile(authUser, retryCount + 1, skipRetry)
          }

          // Si es timeout pero ya tenemos un perfil cargado previamente, mantenerlo
          if (error?.message === 'Profile query timeout' && userProfile) {
            console.log('⚠️ Profile timeout but using cached profile')
            return
          }

          // Solo si realmente no hay perfil (no es timeout), crear perfil temporal
          if (error?.code === 'PGRST116' || retryCount >= 2 || skipRetry) {
            console.warn('⚠️ Using temporary profile - profile not found in database')
            setUser({
              ...authUser,
              username: authUser.email?.split('@')[0] || 'user',
              full_name: authUser.email || 'Unknown User',
              role: 'trainer',
            })
            setUserProfile(null)
          }
          return
        }

        console.log('✅ Profile loaded:', profile)
        setUserProfile(profile)
        setUser({
          ...authUser,
          username: profile.username,
          full_name: profile.full_name,
          role: profile.role,
        })
      } catch (err) {
        console.error('❌ Error loading profile:', err)

        // Si es timeout pero ya tenemos un perfil cargado, mantenerlo
        if (userProfile) {
          console.log('⚠️ Error but using cached profile')
          return
        }

        // Retry en caso de error de red (solo en init, no en refresh)
        if (retryCount < 2 && !skipRetry) {
          console.log(`🔄 Retrying after error... (${retryCount + 1}/2)`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          return setUserWithProfile(authUser, retryCount + 1, skipRetry)
        }

        // Solo después de 3 intentos fallidos, usar perfil temporal
        console.warn('⚠️ Using temporary profile after 3 failed attempts')
        setUser({
          ...authUser,
          username: authUser.email?.split('@')[0] || 'user',
          full_name: authUser.email || 'Unknown User',
          role: 'trainer',
        })
        setUserProfile(null)
      }
    } else {
      setUser(null)
      setUserProfile(null)
    }
  }

  useEffect(() => {
    let isMounted = true
    let subscription: any = null

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...')

        // Verificar variables de entorno
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
          console.error('Missing environment variables')
          setLoading(false)
          return
        }

        // Timeout para toda la inicialización
        const initTimeout = setTimeout(() => {
          console.log('⏰ Auth initialization timeout - proceeding anyway')
          if (isMounted) {
            setLoading(false)
          }
        }, 15000)

        // Obtener sesión inicial
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!isMounted) return

        if (error) {
          console.error('❌ Error getting session:', error)

          // Si es un error de refresh token, limpiar el storage y recargar
          if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
            console.log('Clearing corrupted auth data...')
            localStorage.clear()
            sessionStorage.clear()
            window.location.reload()
            return
          }

          clearTimeout(initTimeout)
          setLoading(false)
          return
        }

        console.log('📋 Session status:', session ? 'Active' : 'None')
        setSession(session)
        if (session?.user) {
          await setUserWithProfile(session.user)
        }

        clearTimeout(initTimeout)
        setLoading(false)

        // Escuchar cambios de autenticación
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!isMounted) return
          setSession(session)
          if (session?.user) {
            await setUserWithProfile(session.user)
          } else {
            setUser(null)
            setUserProfile(null)
          }
          setLoading(false)
        })

        subscription = authSubscription
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // Refresh session on window focus/visibility (después de reposo)
  useEffect(() => {
    const handleWindowFocus = async () => {
      // Solo intentar refrescar si ya hay una sesión activa
      if (!user) {
        console.log('👁️ Window focused but no active session - skipping refresh')
        return
      }

      console.log('👁️ Window focused - refreshing session...')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Error refreshing session on focus:', error)

          // Si hay error de token, limpiar y recargar
          if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
            console.log('Clearing corrupted auth data...')
            localStorage.clear()
            sessionStorage.clear()
            window.location.reload()
          }
          return
        }

        if (session?.user) {
          console.log('✅ Session refreshed successfully')
          setSession(session)
          // En refresh, usar skipRetry=true para no hacer múltiples intentos
          await setUserWithProfile(session.user, 0, true)
        }
      } catch (error) {
        console.error('❌ Error in focus handler:', error)
      }
    }

    // Detectar cuando la página vuelve a ser visible (mejor para móviles)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('📱 Page became visible - refreshing session...')
        handleWindowFocus()
      }
    }

    // Agregar listeners para window focus y visibility
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  const signIn = async (username: string, password: string) => {
    setLoading(true)

    try {
      let email = ''

      // Primero buscar en el mapeo hardcodeado para usuarios especiales
      const knownEmails = {
        'admin': 'tecnoacceso2025@gmail.com'
      }

      if (knownEmails[username as keyof typeof knownEmails]) {
        email = knownEmails[username as keyof typeof knownEmails]
      } else {
        // Para usuarios que no están en el mapeo hardcodeado,
        // usar el username como email (esto funcionará si el email se guardó así)
        email = `${username}@gmail.com`
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 Iniciando logout...')

      // Limpiar estado local inmediatamente para evitar problemas de UI
      setUser(null)
      setUserProfile(null)
      setSession(null)
      setLoading(false)

      // Limpiar storage local para evitar estados inconsistentes
      localStorage.clear()
      sessionStorage.clear()

      // Ejecutar logout de Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ Error durante logout:', error)
        // Aún así forzar la limpieza completa
        window.location.href = '/login'
        return
      }

      console.log('✅ Logout exitoso')
    } catch (error) {
      console.error('❌ Error crítico durante logout:', error)
      // En caso de error crítico, forzar redirección
      setUser(null)
      setUserProfile(null)
      setSession(null)
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
    }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}