import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Building2, Hash, Calendar, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface PaymentSettings {
  pagomovil_bank: string
  pagomovil_phone: string
  pagomovil_cedula: string
  zelle_email: string
}

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const BANKS = [
  '0102 - Banco de Venezuela',
  '0104 - Banco Venezolano de Crédito',
  '0105 - Banco Mercantil',
  '0108 - Banco Provincial (BBVA)',
  '0114 - Bancaribe',
  '0115 - Banco Exterior',
  '0128 - Banco Caroní',
  '0134 - Banesco',
  '0137 - Banco Sofitasa',
  '0138 - Banco Plaza',
  '0146 - Bangente',
  '0151 - Banco Fondo Común (BFC)',
  '0156 - 100% Banco',
  '0157 - DelSur Banco Universal',
  '0163 - Banco del Tesoro',
  '0166 - Banco Agrícola de Venezuela',
  '0168 - Bancrecer',
  '0169 - Mi Banco',
  '0171 - Banco Activo',
  '0172 - Bancamiga',
  '0173 - Banco Internacional de Desarrollo',
  '0174 - Banplus',
  '0175 - Banco Bicentenario',
  '0177 - BANFANB',
  '0191 - BNC / BOD',
  '0601 - IMCP',
]

export default function PaymentModal({ open, onClose, onSuccess }: PaymentModalProps) {
  const { user, userProfile } = useAuth()
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [eurToBs, setEurToBs] = useState<number | null>(null)
  const [form, setForm] = useState({ bank: '', reference: '', payment_date: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const load = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['pagomovil_bank', 'pagomovil_phone', 'pagomovil_cedula', 'zelle_email'])
      if (data) {
        const mapped: Record<string, string> = {}
        data.forEach((r: { key: string; value: string }) => { mapped[r.key] = r.value || '' })
        setSettings({
          pagomovil_bank: mapped.pagomovil_bank || '',
          pagomovil_phone: mapped.pagomovil_phone || '',
          pagomovil_cedula: mapped.pagomovil_cedula || '',
          zelle_email: mapped.zelle_email || '',
        })
      }
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
        const json = await res.json()
        if (json?.rates?.VES) setEurToBs(json.rates.VES)
      } catch { /* sin conversión */ }
    }
    load()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.bank || !form.reference || !form.payment_date) {
      setError('Completa todos los campos')
      return
    }
    if (!/^\d{6}$/.test(form.reference)) {
      setError('La referencia debe tener exactamente 6 dígitos numéricos')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const { error: insertError } = await supabase.from('payment_requests').insert({
        auth_user_id: user?.id ?? null,
        trainer_profile_id: userProfile?.id ?? null,
        full_name: user?.full_name || userProfile?.full_name || '',
        plan: 'monthly',
        amount_eur: 12,
        bank: form.bank,
        reference: form.reference,
        payment_date: form.payment_date,
        status: 'pending',
      })
      if (insertError) throw insertError

      // Notificar al admin via push
      try {
        await fetch('/api/notify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coachName: user?.full_name || userProfile?.full_name || 'Un coach',
            bank: form.bank,
            reference: form.reference,
          }),
        })
      } catch { /* notificación no crítica */ }

      setSuccess(true)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Error al enviar el comprobante')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setError('')
    setForm({ bank: '', reference: '', payment_date: '' })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#0d1b2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#00D4FF]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">Renovar licencia</h2>
                  <p className="text-slate-400 text-xs">Plan mensual — 12 EUR</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-5">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-lg mb-2">Comprobante recibido</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Tu solicitud de pago está siendo verificada. Recibirás una respuesta a la brevedad y se te notificará cuando tu licencia sea activada.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleClose}
                    className="mt-6 px-6 py-2.5 bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] rounded-xl text-sm font-medium"
                  >
                    Entendido
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  {/* Datos de PagoMovil */}
                  {settings && (settings.pagomovil_phone || settings.pagomovil_bank) && (
                    <div className="mb-5 p-4 bg-[#1A2332]/60 border border-[#00D4FF]/20 rounded-xl">
                      <p className="text-[#00D4FF] text-xs font-semibold uppercase tracking-wide mb-3">
                        Datos para PagoMovil
                      </p>
                      <div className="space-y-1.5 text-sm">
                        {settings.pagomovil_bank && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Banco</span>
                            <span className="text-white font-medium">{settings.pagomovil_bank}</span>
                          </div>
                        )}
                        {settings.pagomovil_phone && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Telefono</span>
                            <span className="text-white font-medium">{settings.pagomovil_phone}</span>
                          </div>
                        )}
                        {settings.pagomovil_cedula && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Cedula</span>
                            <span className="text-white font-medium">{settings.pagomovil_cedula}</span>
                          </div>
                        )}
                        <div className="border-t border-white/10 pt-3 mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-sm">Monto</span>
                            <span className="text-white font-bold text-base">12 EUR</span>
                          </div>
                          {eurToBs !== null && (
                            <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-xl px-4 py-2.5 text-center mt-2">
                              <p className="text-xs text-slate-400 mb-0.5">Equivalente en bolívares (tasa BCV)</p>
                              <p className="text-[#00D4FF] font-black text-2xl tracking-tight">
                                Bs. {(12 * eurToBs).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {settings.zelle_email && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-slate-400 text-xs">
                            Tambien puedes pagar por <span className="text-white font-medium">Zelle</span>:{' '}
                            <span className="text-[#00D4FF]">{settings.zelle_email}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulario comprobante */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Tu comprobante</p>

                    {/* Banco origen */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Banco origen
                      </label>
                      <select
                        value={form.bank}
                        onChange={e => setForm(p => ({ ...p, bank: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-[#1A2332]/60 border border-white/10 rounded-xl text-white text-sm focus:border-[#00D4FF] focus:outline-none appearance-none"
                      >
                        <option value="">Selecciona tu banco</option>
                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    {/* Referencia */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" /> Últimos 6 dígitos de la referencia
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={6}
                        value={form.reference}
                        onChange={e => setForm(p => ({ ...p, reference: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                        placeholder="Ej: 345678"
                        className="w-full px-3 py-2.5 bg-[#1A2332]/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:border-[#00D4FF] focus:outline-none"
                      />
                    </div>

                    {/* Fecha */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Fecha del pago
                      </label>
                      <input
                        type="date"
                        value={form.payment_date}
                        onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 bg-[#1A2332]/60 border border-white/10 rounded-xl text-white text-sm focus:border-[#00D4FF] focus:outline-none"
                      />
                    </div>

                    {error && (
                      <p className="text-rose-400 text-xs text-center">{error}</p>
                    )}

                    <motion.button
                      whileHover={{ scale: submitting ? 1 : 1.02 }}
                      whileTap={{ scale: submitting ? 1 : 0.97 }}
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-gradient-to-r from-[#00D4FF] to-[#0EA5E9] rounded-xl text-[#0B1426] font-bold text-sm shadow-lg shadow-[#00D4FF]/25 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                        : 'Enviar comprobante'
                      }
                    </motion.button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
