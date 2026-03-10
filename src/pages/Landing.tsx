import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Dumbbell, Users, BarChart3, Zap, Shield,
  ArrowRight, ChevronDown, Flame,
  Apple, Clipboard, TrendingUp, Award, Smartphone,
  Camera, FileText, Search, Bell, Lock, ChevronLeft, ChevronRight,
  Gift, Star, CheckCircle2
} from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface CoachPublic {
  full_name: string
  avatar_url: string | null
  specialty: string | null
}

// ── Features reales de la app ────────────────────────────────────────────────
const features = [
  {
    icon: Users,
    color: 'from-[#00D4FF] to-[#0EA5E9]',
    glow: 'rgba(0,212,255,0.25)',
    title: 'Gestion de Clientes',
    desc: 'Perfiles completos con cedula (V/E), telefono, fecha de inicio y duracion de membresia. Busqueda instantanea por nombre, cedula o telefono.',
  },
  {
    icon: Shield,
    color: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.25)',
    title: 'Control de Membresias',
    desc: 'Estados automaticos: Activo, Por Vencer (menos de 7 dias) y Vencido. Alertas visuales y notificaciones directas por WhatsApp para renovar.',
  },
  {
    icon: Clipboard,
    color: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59,130,246,0.25)',
    title: 'Rutinas de Entrenamiento',
    desc: 'Crea plantillas reutilizables con ejercicios, series, repeticiones, peso y notas. Asigna rutinas a tus clientes con un solo toque.',
  },
  {
    icon: Apple,
    color: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.25)',
    title: 'Planes Nutricionales',
    desc: 'Disena planes por tiempo de comida (desayuno, almuerzo, cena, snacks) con alimentos, porciones y macronutrientes. Plantillas reutilizables.',
  },
  {
    icon: Camera,
    color: 'from-rose-500 to-pink-500',
    glow: 'rgba(244,63,94,0.25)',
    title: 'Progreso con Fotos',
    desc: 'Registra medidas corporales con historial completo. Compara fotos antes/despues por periodos y exporta reportes visuales en PDF.',
  },
  {
    icon: FaWhatsapp,
    color: 'from-green-500 to-emerald-600',
    glow: 'rgba(34,197,94,0.25)',
    title: 'Notificaciones WhatsApp',
    desc: 'Avisa a clientes con membresia vencida o por vencer directamente por WhatsApp con mensaje profesional predefinido listo para enviar.',
  },
  {
    icon: BarChart3,
    color: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.25)',
    title: 'Dashboard en Tiempo Real',
    desc: 'Estadisticas al instante: total, activos, por vencer y vencidos. Toca cualquier tarjeta para filtrar y ver solo ese grupo de clientes.',
  },
  {
    icon: FileText,
    color: 'from-orange-500 to-red-500',
    glow: 'rgba(249,115,22,0.25)',
    title: 'Exportacion a PDF',
    desc: 'Genera reportes profesionales de progreso fisico, rutinas asignadas y planes nutricionales en PDF para compartir con tus clientes.',
  },
  {
    icon: Smartphone,
    color: 'from-slate-400 to-slate-600',
    glow: 'rgba(100,116,139,0.25)',
    title: 'PWA Instalable',
    desc: 'Instala la app en tu iPhone o Android como una app nativa. Funciona perfectamente desde cualquier dispositivo sin necesidad de tienda de apps.',
  },
  {
    icon: FileText,
    color: 'from-teal-500 to-cyan-600',
    glow: 'rgba(20,184,166,0.25)',
    title: 'Respaldo Completo en Excel',
    desc: 'Exporta toda tu informacion con un solo toque: clientes, medidas, rutinas, planes nutricionales y fotos de progreso en un archivo Excel organizado.',
  },
]

// ── Ventajas reales ──────────────────────────────────────────────────────────
const advantages = [
  { icon: Bell, text: 'Alertas automaticas de vencimiento — nunca mas pierdas un cliente por no avisarle a tiempo' },
  { icon: Search, text: 'Busqueda instantanea por nombre, cedula o telefono entre todos tus clientes' },
  { icon: Camera, text: 'Comparacion de fotos antes/despues exportable en PDF y enviable por WhatsApp' },
  { icon: Lock, text: 'Exporta un backup completo en Excel con todos tus clientes, medidas, rutinas, planes nutricionales y fotos de progreso con un solo toque' },
  { icon: TrendingUp, text: 'Historial completo de medidas corporales con evolucion del progreso fisico' },
  { icon: Clipboard, text: 'Plantillas reutilizables de rutinas y planes nutricionales: crea una vez, usala siempre' },
  { icon: Zap, text: 'PWA instalable en iOS y Android — gestiona tus clientes desde dentro del gimnasio' },
  { icon: FaWhatsapp, text: 'Integracion directa con WhatsApp para renovaciones y envio de reportes' },
]

// ── Stats del producto ───────────────────────────────────────────────────────
const stats = [
  { value: 'PWA', label: 'Instalable en iOS y Android', icon: Smartphone, isWhatsapp: false },
  { value: 'PDF', label: 'Exportacion de reportes', icon: FileText, isWhatsapp: false },
  { value: 'WA', label: 'Integracion WhatsApp', icon: null, isWhatsapp: true },
  { value: '100%', label: 'Mobile-first', icon: Award, isWhatsapp: false },
]

// ── Helper FadeIn ────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const [coaches, setCoaches] = useState<CoachPublic[]>([])
  const [coachIndex, setCoachIndex] = useState(0)
  const [coachDirection, setCoachDirection] = useState(1)
  const [coachesLoading, setCoachesLoading] = useState(true)
  const [eurToBs, setEurToBs] = useState<number | null>(null)

  useEffect(() => {
    document.title = 'AccesoGym Coach - La herramienta del coach moderno'
  }, [])

  // Tasa EUR → VES desde BCV via exchangerate-api
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
        const data = await res.json()
        const ves = data?.rates?.VES
        if (ves) setEurToBs(ves)
      } catch {
        // silencioso
      }
    }
    fetchRate()
  }, [])

  // Cargar coaches reales desde Supabase
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_coaches')
        if (!error && data && data.length > 0) {
          const sorted = [...data].sort((a, b) => {
            if (a.avatar_url && !b.avatar_url) return -1
            if (!a.avatar_url && b.avatar_url) return 1
            return 0
          })
          setCoaches(sorted)
        }
      } catch {
        // silencioso si no hay coaches disponibles
      } finally {
        setCoachesLoading(false)
      }
    }
    fetchCoaches()
  }, [])

  // Auto-avance del carrusel
  useEffect(() => {
    if (coaches.length <= 4) return
    const interval = setInterval(() => {
      setCoachDirection(1)
      setCoachIndex(prev => (prev + 4) % coaches.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [coaches.length])

  const prevCoachPage = () => {
    setCoachDirection(-1)
    setCoachIndex(prev => (prev - 4 + coaches.length) % coaches.length)
  }

  const nextCoachPage = () => {
    setCoachDirection(1)
    setCoachIndex(prev => (prev + 4) % coaches.length)
  }

  const visibleCoaches = coaches.slice(coachIndex, coachIndex + 4).concat(
    coachIndex + 4 > coaches.length ? coaches.slice(0, (coachIndex + 4) % coaches.length) : []
  ).slice(0, 4)

  const totalPages = Math.ceil(coaches.length / 4)
  const currentPage = Math.floor(coachIndex / 4)

  return (
    <div className="min-h-screen bg-[#0B1426] text-white overflow-x-hidden">

      {/* Orbs de fondo */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#00D4FF]/6 blur-[130px]" />
        <div className="absolute top-[40%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#0EA5E9]/6 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full bg-[#00D4FF]/4 blur-[150px]" />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0B1426]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png" alt="AccesoGym Coach"
              className="w-9 h-9 object-contain"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
            <span className="font-bold text-lg text-white">
              AccesoGym <span className="text-[#00D4FF]">Coach</span>
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#00D4FF] to-[#0EA5E9] rounded-full text-[#0B1426] text-sm font-bold shadow-lg shadow-[#00D4FF]/25 hover:shadow-[#00D4FF]/40 transition-shadow"
          >
            Iniciar Sesion <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF] text-sm font-medium mb-8"
        >
          <Flame className="w-4 h-4" /> La herramienta del coach personal moderno
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black leading-tight mb-6 max-w-4xl"
        >
          Gestiona tus{' '}
          <span className="text-[#00D4FF]">clientes</span>{' '}
          como un profesional
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
        >
          La plataforma todo-en-uno para coaches personales. Membresias, rutinas,
          nutricion, progreso fisico y notificaciones WhatsApp desde tu telefono,
          dentro del gimnasio.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#0EA5E9] rounded-2xl text-[#0B1426] font-bold text-lg shadow-2xl shadow-[#00D4FF]/30 hover:shadow-[#00D4FF]/50 transition-shadow flex items-center gap-2"
          >
            Acceder ahora <ArrowRight className="w-5 h-5" />
          </motion.button>
          <a
            href="#features"
            className="px-8 py-4 border border-white/10 rounded-2xl text-slate-300 font-medium hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            Ver funcionalidades <ChevronDown className="w-5 h-5" />
          </a>
        </motion.div>

        {/* Preview del dashboard — replica UI real con datos ficticios */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 w-full max-w-xs"
        >
          {/* Phone frame */}
          <div className="relative bg-[#0d1b2e] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-[#00D4FF]/10">

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-5 pb-3 bg-[#0d1b2e]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1a2a3a] border border-white/10 flex items-center justify-center">
                  <img src="/logo.png" alt="" className="w-5 h-5 object-contain" onError={e => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div>
                  <p className="text-white font-bold text-xs leading-none">Inicio</p>
                  <p className="text-[#00D4FF] text-[10px]">Gestion de membresias</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#00D4FF]" />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 px-3 mb-3">
              {[
                { label: 'TOTAL', value: '24', icon: '👥', iconBg: 'bg-blue-500', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
                { label: 'ACTIVOS', value: '17', icon: '✓', iconBg: 'bg-emerald-500', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20', text: 'text-emerald-400' },
                { label: 'POR VENCER', value: '4', icon: '⚠', iconBg: 'bg-amber-500', border: 'border-amber-500/30', glow: 'shadow-amber-500/20', text: 'text-amber-400' },
                { label: 'VENCIDOS', value: '3', icon: '✗', iconBg: 'bg-rose-500', border: 'border-rose-500/30', glow: 'shadow-rose-500/20', text: 'text-rose-400' },
              ].map(s => (
                <div key={s.label} className={`bg-[#1a2a3a] border ${s.border} rounded-2xl p-3 shadow-lg ${s.glow}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-[9px] text-slate-400 font-semibold tracking-wider">{s.label}</p>
                    <div className={`w-7 h-7 rounded-xl ${s.iconBg} flex items-center justify-center text-white text-xs font-bold`}>{s.icon}</div>
                  </div>
                  <p className={`text-2xl font-black ${s.text || 'text-white'}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Search bar */}
            <div className="px-3 mb-3">
              <div className="flex items-center gap-2 bg-[#1a2a3a] border border-white/8 rounded-xl px-3 py-2">
                <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-slate-500 text-xs">Buscar clientes...</span>
              </div>
            </div>

            {/* Client cards */}
            <div className="px-3 space-y-2 mb-3">
              {[
                {
                  name: 'Carlos Mendoza', cedula: 'V-18432071', phone: '+58 412-1234567',
                  from: '05 feb', to: '05 mar', duration: '1mes',
                  borderColor: 'border-l-rose-500', status: 'expired', badge: null
                },
                {
                  name: 'Patricia Gomez', cedula: 'V-20001234', phone: '+58 414-7654321',
                  from: '25 ene', to: '25 feb', duration: '1mes',
                  borderColor: 'border-l-amber-500', status: 'expiring', badge: '2d'
                },
                {
                  name: 'Diego Herrera', cedula: 'V-22345678', phone: '+58 424-9876543',
                  from: '10 feb', to: '10 mar', duration: '1mes',
                  borderColor: 'border-l-emerald-500', status: 'active', badge: null
                },
              ].map((c, i) => (
                <div key={i} className={`bg-[#1a2a3a] border border-white/5 border-l-4 ${c.borderColor} rounded-2xl p-3`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#0d1b2e] border border-white/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{c.name}</p>
                        <p className="text-slate-400 text-[10px]">{c.cedula} &bull; {c.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {c.status === 'expiring' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-lg font-bold">{c.badge}</span>
                      )}
                      {c.status === 'expired' && (
                        <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded-lg font-bold">X</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-11">
                    <span className="text-[10px] text-slate-400">{c.from}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                    <span className="text-[10px] text-white font-semibold">{c.to}</span>
                    <span className="text-[10px] text-slate-500 ml-1">({c.duration})</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom nav */}
            <div className="mx-3 mb-4 bg-[#1a2a3a] border border-white/8 rounded-2xl px-4 py-2 flex items-center justify-around">
              {[
                { icon: Dumbbell, label: 'Inicio', active: true },
                { icon: Users, label: 'Clientes', active: false },
                { icon: Clipboard, label: 'Rutinas', active: false },
                { icon: Apple, label: 'Nutricion', active: false },
                { icon: Shield, label: 'Config', active: false },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${item.active ? 'bg-[#00D4FF]/20' : ''}`}>
                    <item.icon className={`w-3.5 h-3.5 ${item.active ? 'text-[#00D4FF]' : 'text-slate-500'}`} />
                  </div>
                  <span className={`text-[8px] ${item.active ? 'text-[#00D4FF]' : 'text-slate-600'}`}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Footer sin licencia */}
            <div className="flex items-center justify-between px-4 pb-4 text-[9px] text-slate-600">
              <span>Sin Licencia</span>
              <span>Desarrollado por <span className="text-[#00D4FF]">TecnoAcceso</span></span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1}>
              <div className="h-[140px] flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-[#1A2332]/60 border border-white/8">
                {stat.isWhatsapp ? (
                  <FaWhatsapp className="w-6 h-6 text-[#00D4FF] mx-auto mb-3" />
                ) : stat.icon ? (
                  <stat.icon className="w-6 h-6 text-[#00D4FF] mx-auto mb-3" />
                ) : null}
                <p className="text-3xl font-black text-[#00D4FF]">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-[#00D4FF] text-sm font-semibold uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Todo lo que necesita un coach</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Cada herramienta fue pensada para el flujo real de trabajo de un entrenador personal.
              Sin complicaciones, sin excesos.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <FadeIn key={f.title} delay={i * 0.06}>
                  <motion.div
                    whileHover={{ y: -5, boxShadow: `0 20px 50px ${f.glow}` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="p-6 rounded-2xl bg-[#1A2332]/60 border border-white/8 h-full"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}
                      style={{ boxShadow: `0 6px 20px ${f.glow}` }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-bold mb-2 text-white">{f.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                  </motion.div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── COACHES CARRUSEL (datos reales de Supabase) ── */}
      {!coachesLoading && coaches.length > 0 && (
        <section id="coaches" className="relative z-10 py-24 px-6 bg-[#1A2332]/20">
          <div className="max-w-6xl mx-auto">
            <FadeIn className="text-center mb-16">
              <p className="text-[#00D4FF] text-sm font-semibold uppercase tracking-widest mb-3">Nuestra comunidad</p>
              <h2 className="text-4xl md:text-5xl font-black mb-4">Coaches que ya confian en nosotros</h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Profesionales que usan AccesoGymCoach dia a dia para gestionar a sus clientes.
              </p>
            </FadeIn>

            <div className="relative">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={coachIndex}
                  initial={{ opacity: 0, x: coachDirection * 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -coachDirection * 60 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {visibleCoaches.map((coach, i) => (
                    <div key={i} className="rounded-2xl border border-white/8 bg-[#1A2332]/60 overflow-hidden relative h-56">
                      {coach.avatar_url ? (
                        <img src={coach.avatar_url} alt={coach.full_name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#00D4FF]/20 to-[#7C3AED]/20 flex items-center justify-center">
                          <span className="text-5xl font-black text-white/20">
                            {coach.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2 pt-6 pb-2 text-center">
                        <h3 className="font-bold text-white text-xs leading-tight">{coach.full_name}</h3>
                        {coach.specialty && (
                          <p className="text-[#00D4FF] text-[10px] mt-0.5">{coach.specialty}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Controles de navegacion */}
              {coaches.length > 4 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={prevCoachPage}
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCoachDirection(i > currentPage ? 1 : -1)
                          setCoachIndex(i * 4)
                        }}
                        className={`w-2 h-2 rounded-full transition-colors ${currentPage === i ? 'bg-[#00D4FF]' : 'bg-white/20'}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={nextCoachPage}
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── VENTAJAS ── */}
      <section className="relative z-10 py-24 px-6 bg-[#1A2332]/20">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-[#00D4FF] text-sm font-semibold uppercase tracking-widest mb-3">Por que AccesoGym Coach?</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Hecho para coaches reales</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              No es un software generico. Cada detalle fue disenado para el dia a dia de un coach personal.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {advantages.map((item, i) => {
              const Icon = item.icon
              return (
                <FadeIn key={i} delay={i * 0.06}>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-[#1A2332]/60 border border-white/8">
                    <div className="w-9 h-9 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-[#00D4FF]" />
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{item.text}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" className="relative z-10 py-24 px-6">
        <div className="max-w-xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-[#00D4FF] text-sm font-semibold uppercase tracking-widest mb-3">Precio</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Simple y transparente</h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Sin sorpresas. Un solo plan con todo incluido.
            </p>
          </FadeIn>

          <FadeIn>
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-[#00D4FF]/8 blur-3xl rounded-3xl" />
              <div className="relative bg-[#1A2332]/80 border border-[#00D4FF]/30 rounded-3xl p-8 backdrop-blur-xl">

                {/* Badge 15 días gratis */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00D4FF]/20 to-emerald-500/20 border border-[#00D4FF]/30 text-[#00D4FF] text-sm font-bold">
                    <Gift className="w-4 h-4" />
                    15 días GRATIS al registrarte
                  </div>
                </div>

                {/* Precio */}
                <div className="text-center mb-8">
                  <div className="flex items-end justify-center gap-2 mb-1">
                    <span className="text-6xl font-black text-white">12</span>
                    <span className="text-2xl font-bold text-[#00D4FF] mb-2">EUR</span>
                    <span className="text-slate-400 mb-2">/ mes</span>
                  </div>
                  {eurToBs !== null && (
                    <p className="text-slate-500 text-sm">
                      ≈ Bs. {(12 * eurToBs).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-slate-600">(tasa BCV)</span>
                    </p>
                  )}
                </div>

                {/* Features incluidos */}
                <ul className="space-y-3 mb-8">
                  {[
                    'Clientes ilimitados',
                    'Rutinas y planes nutricionales',
                    'Progreso con fotos y medidas',
                    'Notificaciones WhatsApp',
                    'Exportacion PDF y Excel',
                    'PWA instalable en iOS y Android',
                    'Soporte directo por WhatsApp',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#00D4FF] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    const msg = encodeURIComponent('Hola, me interesa AccesoGym Coach y quisiera solicitar acceso.')
                    window.open(`https://wa.me/+584120557690?text=${msg}`, '_blank')
                  }}
                  className="w-full py-4 bg-gradient-to-r from-[#00D4FF] to-[#0EA5E9] rounded-2xl text-[#0B1426] font-bold text-lg shadow-2xl shadow-[#00D4FF]/30 hover:shadow-[#00D4FF]/50 transition-shadow flex items-center justify-center gap-2"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  Solicita acceso
                </motion.button>

                <p className="text-center text-xs text-slate-500 mt-4">
                  Sin tarjeta de credito. Sin compromiso.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative z-10 py-24 px-6">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center relative">
            <div className="absolute inset-0 bg-[#00D4FF]/8 blur-3xl rounded-3xl" />
            <div className="relative bg-[#1A2332]/80 border border-[#00D4FF]/20 rounded-3xl p-12 backdrop-blur-xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#0EA5E9] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#00D4FF]/30">
                <Dumbbell className="w-8 h-8 text-[#0B1426]" />
              </div>
              <h2 className="text-4xl font-black mb-4">Listo para empezar?</h2>
              <p className="text-slate-400 text-lg mb-8">
                Accede a la plataforma y lleva el control total de tus clientes desde el primer dia.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-[#00D4FF] to-[#0EA5E9] rounded-2xl text-[#0B1426] font-bold text-lg shadow-2xl shadow-[#00D4FF]/40 hover:shadow-[#00D4FF]/60 transition-shadow"
              >
                Acceder a la plataforma <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img
            src="/logo.png" alt="Logo"
            className="w-6 h-6 object-contain"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <span className="font-bold text-sm text-white">
            AccesoGym <span className="text-[#00D4FF]">Coach</span>
          </span>
        </div>
        <p className="text-xs text-slate-600">
          {new Date().getFullYear()} Desarrollado por{' '}
          <span className="text-[#00D4FF] font-medium">TecnoAcceso</span>. Todos los derechos reservados.
        </p>
      </footer>

    </div>
  )
}
