import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, User, Shield, Key, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface UserProfile {
  id: string
  auth_user_id: string
  username: string
  full_name: string
  role: 'trainer' | 'admin' | 'superuser'
  email: string
  phone?: string
  created_at: string
}

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  role: z.enum(['trainer', 'admin', 'superuser']),
  phone: z.string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Formato: +código_país + número (ej: +584123456789)')
    .optional()
    .or(z.literal('')),
})

type UserForm = z.infer<typeof userSchema>

interface UserManagementProps {
  onClose: () => void
}

export default function UserManagement({ onClose }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // Usar la función RPC para obtener usuarios con emails
      const { data, error } = await supabase.rpc('get_users_with_emails')

      if (error) throw error

      setUsers(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: UserForm) => {
    try {
      // Usar la función PostgreSQL para crear usuario completo
      const { data, error } = await supabase.rpc('create_user_with_profile', {
        user_email: userData.email,
        user_password: userData.password,
        user_username: userData.username,
        user_full_name: userData.full_name,
        user_role: userData.role,
        user_phone: userData.phone || null
      })

      if (error) {
        console.error('RPC error:', error)
        throw new Error(`Error llamando función: ${error.message}`)
      }

      if (!data.success) {
        throw new Error(`Error creando usuario: ${data.error}`)
      }

      await fetchUsers()
      setShowForm(false)
      reset()
      setError('Usuario creado exitosamente.')
    } catch (err: any) {
      console.error('Create user error:', err)
      setError(err.message || 'Error desconocido al crear usuario')
    }
  }

  const updateUser = async (userData: UserForm) => {
    if (!editingUser) return

    try {
      const { data, error} = await supabase.rpc('update_user_profile', {
        profile_id: editingUser.id,
        new_username: userData.username,
        new_full_name: userData.full_name,
        new_role: userData.role,
        new_phone: userData.phone || null,
        new_password: userData.password || null // Solo se actualiza si se proporciona
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(`Error actualizando usuario: ${data.error}`)
      }

      await fetchUsers()
      setShowForm(false)
      setEditingUser(null)
      reset()
      setError('Usuario actualizado exitosamente.')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteUser = async (userId: string, authUserId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return

    try {
      // Usar función RPC segura para eliminar usuario
      const { data, error } = await supabase.rpc('delete_user_safe', {
        user_auth_id: authUserId
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Error eliminando usuario')
      }

      setError('Usuario eliminado exitosamente.')
      await fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user)
    reset({
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || '',
      password: '', // No mostrar password actual
    })
    setShowForm(true)

    // Scroll suave al formulario
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const onSubmit = async (data: UserForm) => {
    setError(null)
    if (editingUser) {
      await updateUser(data)
    } else {
      await createUser(data)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superuser': return 'text-purple-400 bg-purple-500/20'
      case 'admin': return 'text-blue-400 bg-blue-500/20'
      default: return 'text-green-400 bg-green-500/20'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superuser': return <Shield className="w-4 h-4" />
      case 'admin': return <Key className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-300 rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Gestión de Usuarios</h2>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm rounded-md hover:shadow-md hover:shadow-accent-primary/30 transition-all duration-200 flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Usuario</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-600 text-white text-sm rounded-md hover:bg-slate-500 hover:shadow-md transition-all duration-200 flex items-center space-x-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cerrar</span>
            </motion.button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Formulario */}
          {showForm && (
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-dark-200/50 rounded-lg border border-white/10"
            >
              <h3 className="text-lg font-medium text-white mb-4">
                {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    disabled={!!editingUser}
                    className="w-full px-3 py-2 bg-dark-200 border border-white/10 rounded-lg text-white disabled:opacity-50"
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full px-3 py-2 bg-dark-200 border border-white/10 rounded-lg text-white"
                  />
                  {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    {...register('username')}
                    type="text"
                    className="w-full px-3 py-2 bg-dark-200 border border-white/10 rounded-lg text-white"
                  />
                  {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    {...register('full_name')}
                    type="text"
                    className="w-full px-3 py-2 bg-dark-200 border border-white/10 rounded-lg text-white"
                  />
                  {errors.full_name && <p className="text-red-400 text-sm mt-1">{errors.full_name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Teléfono (Opcional)
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="+584123456789"
                    onInput={(e) => {
                      // Asegurar que comience con + y solo contenga números después
                      let value = e.currentTarget.value
                      if (!value.startsWith('+')) {
                        value = '+' + value.replace(/[^0-9]/g, '')
                      } else {
                        value = '+' + value.slice(1).replace(/[^0-9]/g, '')
                      }
                      e.currentTarget.value = value
                    }}
                    className="w-full px-3 py-2 bg-dark-200 border border-white/10 rounded-lg text-white"
                  />
                  {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Rol
                  </label>
                  <select
                    {...register('role')}
                    className="w-full px-3 py-2 bg-dark-200 border border-white/10 rounded-lg text-white"
                  >
                    <option value="trainer">Entrenador</option>
                    <option value="admin">Administrador</option>
                    <option value="superuser">Superusuario</option>
                  </select>
                  {errors.role && <p className="text-red-400 text-sm mt-1">{errors.role.message}</p>}
                </div>

                <div className="md:col-span-2 flex space-x-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingUser(null)
                      reset()
                    }}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Lista de usuarios */}
          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando usuarios...</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-dark-200/30 rounded-lg border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{user.full_name}</h4>
                      <p className="text-sm text-slate-400">@{user.username} • {user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-slate-500">📱 {user.phone}</p>
                      )}
                      <span className={`inline-block px-2 py-1 rounded text-xs ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-slate-400 hover:text-accent-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id, user.auth_user_id)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}