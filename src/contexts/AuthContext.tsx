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
        // Buscar perfil real en la base de datos
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single()

        if (error || !profile) {
          console.error('Profile not found:', error)
          setUser(null)
          setUserProfile(null)
          return
        }

        setUserProfile(profile)
        setUser({
          ...authUser,
          username: profile.username,
          full_name: profile.full_name,
          role: profile.role,
        })
      } catch (err) {
        console.error('Error loading profile:', err)
        setUser(null)
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
        // Obtener sesión inicial
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!isMounted) return

        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        setSession(session)
        if (session?.user) {
          await setUserWithProfile(session.user)
        }
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