import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Settings, UtensilsCrossed } from 'lucide-react'
import { BsPersonFillAdd } from 'react-icons/bs'
import { GiWeightLiftingUp } from 'react-icons/gi'

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/clients/new', icon: BsPersonFillAdd, label: 'Nuevo' },
  { to: '/routines', icon: GiWeightLiftingUp, label: 'Rutinas' },
  { to: '/nutrition-plans', icon: UtensilsCrossed, label: 'Nutrición' },
  { to: '/settings', icon: Settings, label: 'Config' },
]

export default function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()

  // Mejorar detección de ruta activa
  const getActiveIndex = () => {
    // Primero buscar coincidencia exacta o que comience con la ruta
    const exactMatch = navItems.findIndex(item => location.pathname.startsWith(item.to))
    if (exactMatch >= 0) return exactMatch

    // Si no hay match exacto, detectar rutas relacionadas
    const pathname = location.pathname

    // Si estás en cualquier ruta de clientes (/clients/*), resaltar "Inicio"
    if (pathname.includes('/clients/')) return 0

    // Si estás en rutas de rutinas, resaltar "Rutinas"
    if (pathname.includes('/routine')) return 2

    // Si estás en rutas de nutrición, resaltar "Nutrición"  
    if (pathname.includes('/nutrition')) return 3

    // Default: resaltar "Inicio"
    return 0
  }

  const activeIndex = getActiveIndex()

  // Calcular posición del indicador (porcentaje basado en 5 items)
  const indicatorPositions = ['10%', '30%', '50%', '70%', '90%']

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="fixed bottom-16 left-4 right-4 z-10"
    >
      <div className="max-w-md mx-auto">
        <div className="relative flex justify-center items-center h-[70px] bg-dark-200/95 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl overflow-visible">
          {/* Indicator - El círculo mágico con mejor elevación */}
          <motion.div
            className="absolute w-[60px] h-[60px] rounded-full border-[6px] border-[#0B1426] z-0"
            style={{
              background: 'linear-gradient(135deg, #00D4FF 0%, #0EA5E9 100%)',
              top: '-25px',
              boxShadow: '0 8px 24px rgba(0, 212, 255, 0.4), 0 16px 48px rgba(14, 165, 233, 0.3)',
            }}
            animate={{
              left: indicatorPositions[activeIndex],
              x: '-50%'
            }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Curvas decorativas izquierda */}
            <span
              className="absolute top-1/2 -left-[18px] w-4 h-4 bg-transparent"
              style={{
                borderTopRightRadius: '16px',
                boxShadow: '1px -8px 0 0 #0B1426'
              }}
            />
            {/* Curvas decorativas derecha */}
            <span
              className="absolute top-1/2 -right-[18px] w-4 h-4 bg-transparent"
              style={{
                borderTopLeftRadius: '16px',
                boxShadow: '-1px -8px 0 0 #0B1426'
              }}
            />
          </motion.div>

          {/* Items */}
          <ul className="flex w-full justify-around relative z-10">
            {navItems.map((item, index) => {
              const isActive = activeIndex === index
              const Icon = item.icon

              return (
                <li
                  key={item.to}
                  className="relative list-none flex-1 h-[70px]"
                >
                  <button
                    onClick={() => navigate(item.to)}
                    className="relative flex justify-center items-center flex-col w-full h-full text-center"
                  >
                    {/* Icon con mejor efecto de elevación */}
                    <motion.span
                      className="relative block"
                      animate={{
                        y: isActive ? -28 : 0,
                        scale: isActive ? 1.1 : 1,
                        color: isActive ? '#fff' : 'rgba(148, 163, 184, 1)'
                      }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        filter: isActive ? 'drop-shadow(0 4px 8px rgba(255, 255, 255, 0.3))' : 'none'
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.span>

                    {/* Text */}
                    <motion.span
                      className="absolute text-slate-300 font-medium text-[10px] tracking-wide whitespace-nowrap"
                      animate={{
                        opacity: isActive ? 1 : 0,
                        y: isActive ? 12 : 20
                      }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {item.label}
                    </motion.span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </motion.nav>
  )
}
