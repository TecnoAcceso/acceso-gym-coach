import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-client-info': 'acceso-gym-coach@1.0.0'
    }
  },
  db: {
    schema: 'public'
  }
})

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          cedula: string
          document_type: 'V' | 'E'
          full_name: string
          phone: string
          start_date: string
          duration_months: number
          end_date: string
          status: 'active' | 'expiring' | 'expired'
          created_at: string
          updated_at: string
          trainer_id: string
        }
        Insert: {
          id?: string
          cedula: string
          document_type: 'V' | 'E'
          full_name: string
          phone: string
          start_date: string
          duration_months: number
          end_date: string
          status?: 'active' | 'expiring' | 'expired'
          created_at?: string
          updated_at?: string
          trainer_id: string
        }
        Update: {
          id?: string
          cedula?: string
          document_type?: 'V' | 'E'
          full_name?: string
          phone?: string
          start_date?: string
          duration_months?: number
          end_date?: string
          status?: 'active' | 'expiring' | 'expired'
          created_at?: string
          updated_at?: string
          trainer_id?: string
        }
      }
      licenses: {
        Row: {
          id: string
          license_key: string
          expiry_date: string
          status: 'active' | 'expired'
          trainer_id: string
          created_at: string
        }
        Insert: {
          id?: string
          license_key: string
          expiry_date: string
          status?: 'active' | 'expired'
          trainer_id: string
          created_at?: string
        }
        Update: {
          id?: string
          license_key?: string
          expiry_date?: string
          status?: 'active' | 'expired'
          trainer_id?: string
          created_at?: string
        }
      }
    }
  }
}