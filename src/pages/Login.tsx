import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Dumbbell, MessageCircle, X } from 'lucide-react'
import Toast, { ToastType } from '@/components/Toast'

const loginSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const forgotPasswordSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function Login() {
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: ToastType
  }>({ show: false, message: '', type: 'success' })

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type })
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: errorsForgot },
    reset: resetForgot,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    console.log('🎯 onSubmit iniciado')
    setIsLoading(true)
    setError('')

    try {
      console.log('🔑 Llamando a signIn...')
      await signIn(data.username, data.password)
      console.log('✅ signIn completado sin errores')
      // Si llegamos aquí, el login fue exitoso
    } catch (err: any) {
      console.error('❌ Error capturado en onSubmit:', err)
      console.error('❌ Error.message:', err?.message)
      console.error('❌ Error completo:', JSON.stringify(err, null, 2))

      const errorMessage = err?.message || 'Usuario o contraseña incorrectos'
      console.log('📢 Mostrando error:', errorMessage)

      // Asegurar que el error se muestre
      setIsLoading(false)
      setError(errorMessage)
      showToast(errorMessage, 'error')

      // Prevenir cualquier comportamiento por defecto
      return false
    }
  }

  const onForgotPasswordSubmit = async (data: ForgotPasswordForm) => {
    setIsResetting(true)
    setResetError('')
    setResetSuccess(false)

    try {
      const { data: result, error } = await supabase.rpc('reset_password_by_username', {
        user_username: data.username
      })

      if (error) throw error

      if (!result.success) {
        throw new Error(result.error || 'Error al resetear contraseña')
      }

      // Enviar contraseña temporal por WhatsApp
      const phoneNumber = result.phone.replace('+', '')
      const message = `Hola ${result.full_name},\n\nHas solicitado restablecer tu contraseña de AccesoGymCoach.\n\n🔐 Tu contraseña temporal es:\n*${result.temp_password}*\n\nPor seguridad, te recomendamos cambiarla después de iniciar sesión.\n\nPara iniciar sesión:\n1. Usa tu usuario: ${data.username}\n2. Usa la contraseña temporal mostrada arriba\n3. Cambia tu contraseña en tu perfil\n\n¡Gracias por usar AccesoGymCoach! 💪\n\nAtt: Soporte AccesoGymCoach\n\n---\n_Powered by TecnoAcceso / ElectroShop_`

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')

      setResetSuccess(true)
      showToast('¡Contraseña temporal enviada por WhatsApp!', 'success')

      setTimeout(() => {
        setShowForgotModal(false)
        setResetSuccess(false)
        resetForgot()
      }, 3000)
    } catch (err: any) {
      setResetError(err.message || 'Error al resetear contraseña')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-300 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="w-32 h-32 mb-6 mx-auto flex items-center justify-center">
              {/* Reemplaza con tu logo */}
              <img
                src="/logo.png"
                alt="AccesoGym Coach Logo"
                className="w-32 h-32 object-contain mx-auto"
                onError={(e) => {
                  // Fallback al ícono si no encuentra el logo
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'flex';
                    fallback.classList.remove('hidden');
                  }
                }}
              />
              <div className="hidden items-center justify-center w-32 h-32 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full shadow-lg shadow-accent-primary/30 mx-auto">
                <Dumbbell className="w-16 h-16 text-white" />
              </div>
            </div>

            <p className="text-xs text-slate-400">Sistema de gestión de membresías</p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Usuario
              </label>
              <input
                {...register('username')}
                type="text"
                id="username"
                className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                placeholder="Usuario"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full px-4 py-3 pr-12 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-accent-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </motion.button>

            {/* Botón Olvidé mi contraseña */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-accent-primary hover:text-accent-secondary transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        </div>

        {/* Modal Olvidé mi contraseña */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-dark-300 rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Recuperar Contraseña</h3>
                    <p className="text-sm text-slate-400">Te enviaremos una contraseña temporal por WhatsApp</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowForgotModal(false)
                    setResetError('')
                    setResetSuccess(false)
                    resetForgot()
                  }}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {resetSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center"
                >
                  <p className="text-green-400 mb-2">¡Contraseña temporal enviada!</p>
                  <p className="text-sm text-slate-400">Revisa tu WhatsApp y usa la contraseña temporal para iniciar sesión.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmitForgot(onForgotPasswordSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre de Usuario
                    </label>
                    <input
                      {...registerForgot('username')}
                      type="text"
                      placeholder="Ingresa tu usuario"
                      className="w-full px-4 py-3 bg-dark-200/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-300"
                    />
                    {errorsForgot.username && (
                      <p className="mt-1 text-sm text-red-400">{errorsForgot.username.message}</p>
                    )}
                  </div>

                  {resetError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                      <p className="text-sm text-red-400">{resetError}</p>
                    </motion.div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(false)
                        setResetError('')
                        resetForgot()
                      }}
                      className="flex-1 py-3 px-4 bg-dark-200/50 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-dark-200/70 transition-all duration-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-medium rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{isResetting ? 'Enviando...' : 'Enviar por WhatsApp'}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-6 text-sm text-slate-400"
        >
          Desarrollado por <span className="text-accent-primary font-medium">TecnoAcceso</span>
        </motion.div>
      </motion.div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}