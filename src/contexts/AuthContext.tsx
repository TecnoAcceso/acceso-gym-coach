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

  const setUserWithProfile = async (authUser: User | null) => {
    if (authUser) {
      try {
        console.log('🔍 Loading profile for user:', authUser.id)

        // Timeout de 10 segundos para la consulta
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile query timeout')), 10000)
        })

        const queryPromise = supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single()

        const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]) as any

        if (error || !profile) {
          console.error('❌ Profile not found:', error)
          // En lugar de setear null, crear un perfil temporal
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
        // En lugar de setear null, crear un perfil temporal
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

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...')

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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

        return () => {
          isMounted = false
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [])

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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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