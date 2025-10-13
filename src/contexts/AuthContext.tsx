import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
  const [initialized, setInitialized] = useState(false)
  const lastProcessedUserId = useRef<string | null>(null)

  const setUserWithProfile = async (authUser: User | null) => {
    if (authUser) {
      try {
        // Si ya tenemos el perfil cargado para este usuario, usarlo
        if (userProfile && userProfile.auth_user_id === authUser.id) {
          console.log('✅ Using cached profile')
          setUser({
            ...authUser,
            username: userProfile.username,
            full_name: userProfile.full_name,
            role: userProfile.role,
          })
          return
        }

        console.log(`🔍 Loading profile for user: ${authUser.id}`)

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single()

        if (error || !profile) {
          console.error('❌ Profile not found:', error)
          setUser({
            ...authUser,
            username: authUser.email?.split('@')[0] || 'user',
            full_name: authUser.email || 'Unknown User',
            role: 'trainer',
          })
          setUserProfile(null)
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
        // Obtener sesión inicial
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!isMounted) return

        if (error) {
          console.error('❌ Error getting session:', error)
          if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
            localStorage.clear()
            sessionStorage.clear()
            window.location.reload()
            return
          }
          setLoading(false)
          return
        }

        setSession(session)
        if (session?.user) {
          lastProcessedUserId.current = session.user.id
          await setUserWithProfile(session.user)
        }

        setLoading(false)
        setInitialized(true)

        // Escuchar cambios de autenticación
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return

          console.log('🔔 Auth state change:', event)

          // IGNORAR INITIAL_SESSION - ya lo manejamos en el init
          if (event === 'INITIAL_SESSION') {
            console.log('ℹ️ Initial session - already handled in init')
            return
          }

          // IGNORAR TOKEN_REFRESHED - solo actualizar sesión sin recargar perfil
          if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Token refreshed - keeping current state')
            setSession(session)
            return
          }

          // SIGNED_IN = nuevo login (solo si NO lo hemos procesado ya)
          if (event === 'SIGNED_IN' && session?.user) {
            // Si ya procesamos este usuario, NO recargar
            if (lastProcessedUserId.current === session.user.id) {
              console.log('✅ Sign in for already processed user - keeping current state')
              setSession(session)
              return
            }

            console.log('✅ Sign in detected - loading profile')
            lastProcessedUserId.current = session.user.id
            setSession(session)
            await setUserWithProfile(session.user)
            setLoading(false)
            return
          }

          // SIGNED_OUT = logout
          if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out')
            lastProcessedUserId.current = null
            setUser(null)
            setUserProfile(null)
            setSession(null)
            setLoading(false)
            return
          }

          // Otros eventos - solo actualizar sesión
          console.log('ℹ️ Other auth event, updating session only')
          setSession(session)
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

  // Supabase maneja el refresh de tokens automáticamente
  // No necesitamos listeners adicionales

  const signIn = async (username: string, password: string) => {
    console.log('🔐 signIn llamado para username:', username)

    // NO establecer loading aquí, lo maneja el componente Login
    // setLoading(true)

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

      console.log('📧 Intentando login con email:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('📦 Respuesta de Supabase recibida')
      console.log('📦 Error:', error)
      console.log('📦 Data:', data)

      if (error) {
        console.error('❌ Error de Supabase:', error)
        console.error('❌ Error.message:', error.message)
        console.error('❌ Error.status:', error.status)

        // Mensaje más amigable para el usuario
        if (error.message.includes('Invalid login credentials')) {
          console.log('🚨 Lanzando error: Usuario o contraseña incorrectos')
          throw new Error('Usuario o contraseña incorrectos')
        }
        console.log('🚨 Lanzando error original')
        throw error
      }

      if (!data.session) {
        console.error('❌ No hay sesión en la respuesta')
        throw new Error('No se pudo iniciar sesión')
      }

      console.log('✅ Login exitoso, sesión creada')
      // El loading se manejará en el efecto de onAuthStateChange
    } catch (error) {
      console.error('❌ Error en catch de signIn:', error)
      console.error('❌ Tipo de error:', typeof error)
      console.error('❌ Error instanceof Error:', error instanceof Error)

      // Asegurarse de que el error se propague correctamente
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 Iniciando logout...')

      // Limpiar estado local inmediatamente para evitar problemas de UI
      lastProcessedUserId.current = null
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
      lastProcessedUserId.current = null
      setUser(null)
      setUserProfile(null)
      setSession(null)
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
    }
  }

  // Estabilizar el objeto user para evitar re-renders innecesarios
  const stableUser = useMemo(() => user, [user?.id, user?.username, user?.full_name, user?.role])

  const value = useMemo(() => ({
    user: stableUser,
    userProfile,
    session,
    loading,
    signIn,
    signOut,
  }), [stableUser, userProfile, session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}