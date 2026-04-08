import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts'
import { BarChart2, Users, RefreshCcw, TrendingUp, AlertTriangle, XCircle } from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORS = ['#22C55E', '#F59E0B', '#EF4444']

interface Renewal {
  created_at: string
  duration_months: number
}

export default function Reports() {
  const { user } = useAuth()
  const { clients } = useClients()
  const [renewals, setRenewals] = useState<Renewal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchRenewals = async () => {
      const sixMonthsAgo = subMonths(new Date(), 5)
      const { data } = await supabase
        .from('client_renewals')
        .select('created_at, duration_months')
        .eq('trainer_id', user.id)
        .gte('created_at', startOfMonth(sixMonthsAgo).toISOString())
        .order('created_at', { ascending: true })
      setRenewals(data || [])
      setLoading(false)
    }
    fetchRenewals()
  }, [user])

  // Renovaciones por mes (últimos 6 meses)
  const renewalsByMonth = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i)
    const label = format(date, 'MMM', { locale: es })
    const start = startOfMonth(date).toISOString()
    const end = endOfMonth(date).toISOString()
    const count = renewals.filter(r => r.created_at >= start && r.created_at <= end).length
    return { month: label.charAt(0).toUpperCase() + label.slice(1), count }
  })

  // Estado actual de clientes
  const activeCount = clients.filter(c => c.status === 'active').length
  const expiringCount = clients.filter(c => c.status === 'expiring').length
  const expiredCount = clients.filter(c => c.status === 'expired').length

  const pieData = [
    { name: 'Activos', value: activeCount },
    { name: 'Por vencer', value: expiringCount },
    { name: 'Vencidos', value: expiredCount },
  ].filter(d => d.value > 0)

  // Tasa de retención por mes — renovaciones ese mes / clientes que vencieron ese mes, máx 100%
  const retentionData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i)
    const label = format(date, 'MMM', { locale: es })
    const startStr = format(startOfMonth(date), 'yyyy-MM-dd')
    const endStr = format(endOfMonth(date), 'yyyy-MM-dd')
    const start = startOfMonth(date).toISOString()
    const end = endOfMonth(date).toISOString()
    // Clientes que vencieron ese mes
    const expired = clients.filter(c => c.end_date >= startStr && c.end_date <= endStr).length
    // Renovaciones registradas ese mes
    const renewed = renewals.filter(r => r.created_at >= start && r.created_at <= end).length
    const rate = expired > 0 ? Math.min(100, Math.round((renewed / expired) * 100)) : 0
    return { month: label.charAt(0).toUpperCase() + label.slice(1), rate, renewed, expired }
  })

  const totalRenewalsThisMonth = renewalsByMonth[5]?.count || 0
  const totalRenewalsLastMonth = renewalsByMonth[4]?.count || 0
  const trend = totalRenewalsThisMonth - totalRenewalsLastMonth

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 flex items-center justify-between"
      >
        <div className="w-14 h-14 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-14 h-14 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling as HTMLElement
              if (fallback) { fallback.style.display = 'flex'; fallback.classList.remove('hidden') }
            }}
          />
          <div className="hidden w-14 h-14 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full items-center justify-center">
            <BarChart2 className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-sm text-slate-400">Estadísticas de tu negocio</p>
        </div>
        <div className="w-14" />
      </motion.div>

      <div className="p-4 space-y-4">

        {/* Tarjetas resumen — igual que Dashboard */}
        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            title="Total clientes"
            value={clients.length}
            icon={Users}
            color="from-blue-500 to-blue-600"
            delay={0.1}
          />
          <StatsCard
            title="Renov. este mes"
            value={totalRenewalsThisMonth}
            icon={RefreshCcw}
            color="from-accent-primary to-accent-secondary"
            delay={0.15}
          />
          <StatsCard
            title="Por vencer"
            value={expiringCount}
            icon={AlertTriangle}
            color="from-yellow-500 to-yellow-600"
            delay={0.2}
          />
          <StatsCard
            title={`vs mes anterior`}
            value={Math.abs(trend)}
            icon={trend >= 0 ? TrendingUp : XCircle}
            color={trend >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'}
            delay={0.25}
          />
        </div>

        {/* Renovaciones por mes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <RefreshCcw className="w-5 h-5 text-accent-primary" />
            <h2 className="font-semibold text-white">Renovaciones por mes</h2>
          </div>
          {renewals.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Aún no hay renovaciones registradas.<br />Las próximas aparecerán aquí.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={renewalsByMonth} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1A2332', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  formatter={(value) => [value, 'Renovaciones']}
                  cursor={{ fill: 'rgba(0,212,255,0.05)' }}
                />
                <Bar dataKey="count" fill="#00D4FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Estado actual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-accent-primary" />
            <h2 className="font-semibold text-white">Estado actual de clientes</h2>
          </div>
          {clients.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No hay clientes registrados.</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1A2332', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm text-slate-300">{entry.name}</span>
                    <span className="ml-auto text-sm font-bold text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Tasa de retención */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-accent-primary" />
            <h2 className="font-semibold text-white">Tasa de retención</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">% de clientes vencidos que renovaron ese mes</p>
          {renewals.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Se irá llenando con el tiempo conforme los clientes renueven.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1A2332', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  formatter={(value) => [`${value}%`, 'Retención']}
                />
                <Line type="monotone" dataKey="rate" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Tendencia renovaciones */}
        {renewals.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-accent-primary" />
              <h2 className="font-semibold text-white">Tendencia de renovaciones</h2>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={renewalsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1A2332', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  formatter={(value) => [value, 'Renovaciones']}
                />
                <Line type="monotone" dataKey="count" stroke="#00D4FF" strokeWidth={2} dot={{ fill: '#00D4FF', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

      </div>
    </div>
  )
}
