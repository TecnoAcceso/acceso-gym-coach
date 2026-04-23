import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Shield, TrendingUp, Camera, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ShareData {
  id: string
  client_id: string
  trainer_id: string
  start_measurement_id: string
  end_measurement_id: string
  expires_at: string
  clients: { full_name: string; cedula: string }
  user_profiles: { full_name: string }
}

interface Measurement {
  id: string
  date: string
  objetivo?: string
  peso?: number
  hombros?: number
  pecho?: number
  espalda?: number
  biceps_der?: number
  biceps_izq?: number
  cintura?: number
  gluteo?: number
  pierna_der?: number
  pierna_izq?: number
  pantorrilla_der?: number
  pantorrilla_izq?: number
}

interface Photo {
  id: string
  photo_type: string
  photo_url: string
}

interface Ad {
  id: string
  image_url?: string
  title: string
  subtitle?: string
  link_url?: string
}

const FIELDS: { key: keyof Measurement; label: string; unit: string }[] = [
  { key: 'peso', label: 'Peso', unit: 'kg' },
  { key: 'hombros', label: 'Hombros', unit: 'cm' },
  { key: 'pecho', label: 'Pecho', unit: 'cm' },
  { key: 'espalda', label: 'Espalda', unit: 'cm' },
  { key: 'biceps_der', label: 'Bíceps Der.', unit: 'cm' },
  { key: 'biceps_izq', label: 'Bíceps Izq.', unit: 'cm' },
  { key: 'cintura', label: 'Cintura', unit: 'cm' },
  { key: 'gluteo', label: 'Glúteo', unit: 'cm' },
  { key: 'pierna_der', label: 'Pierna Der.', unit: 'cm' },
  { key: 'pierna_izq', label: 'Pierna Izq.', unit: 'cm' },
  { key: 'pantorrilla_der', label: 'Pantorrilla Der.', unit: 'cm' },
  { key: 'pantorrilla_izq', label: 'Pantorrilla Izq.', unit: 'cm' },
]

export default function PublicComparison() {
  const { shareId } = useParams<{ shareId: string }>()
  const [step, setStep] = useState<'verify' | 'loading' | 'result' | 'error'>('verify')
  const [cedula, setCedula] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [startM, setStartM] = useState<Measurement | null>(null)
  const [endM, setEndM] = useState<Measurement | null>(null)
  const [startPhotos, setStartPhotos] = useState<Photo[]>([])
  const [endPhotos, setEndPhotos] = useState<Photo[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [adIndex, setAdIndex] = useState(0)
  const [pdfStatus, setPdfStatus] = useState('')

  // Cargar anuncios activos
  useEffect(() => {
    supabase.from('ads').select('*').eq('active', true).order('display_order').then(({ data }) => {
      if (data) setAds(data)
    })
  }, [])

  // Auto-avance del carrusel de anuncios
  useEffect(() => {
    if (ads.length <= 1) return
    const t = setInterval(() => setAdIndex(i => (i + 1) % ads.length), 5000)
    return () => clearInterval(t)
  }, [ads.length])

  const handleVerify = async () => {
    if (!cedula.trim()) { setErrorMsg('Ingresa tu cédula'); return }
    setStep('loading')
    setErrorMsg('')

    // Cargar el share
    const { data: share, error } = await supabase
      .from('comparison_shares')
      .select('*, clients(full_name, cedula), user_profiles(full_name)')
      .eq('id', shareId)
      .single()

    if (error || !share) {
      setStep('error'); setErrorMsg('El link no existe o ha expirado.'); return
    }

    // Verificar expiración
    if (new Date(share.expires_at) < new Date()) {
      setStep('error'); setErrorMsg('Este link ha expirado (válido por 30 días).'); return
    }

    // Verificar cédula
    const clientCedula = share.clients?.cedula?.toString().trim()
    if (clientCedula !== cedula.trim()) {
      setStep('verify'); setErrorMsg('Cédula incorrecta. Verifica e intenta de nuevo.'); return
    }

    setShareData(share)

    // Cargar mediciones
    const [startRes, endRes] = await Promise.all([
      supabase.from('measurements').select('*').eq('id', share.start_measurement_id).single(),
      supabase.from('measurements').select('*').eq('id', share.end_measurement_id).single(),
    ])
    setStartM(startRes.data)
    setEndM(endRes.data)

    // Cargar fotos
    const [startPhotosRes, endPhotosRes] = await Promise.all([
      supabase.from('progress_photos').select('*').eq('measurement_id', share.start_measurement_id),
      supabase.from('progress_photos').select('*').eq('measurement_id', share.end_measurement_id),
    ])
    setStartPhotos(startPhotosRes.data || [])
    setEndPhotos(endPhotosRes.data || [])

    setStep('result')
  }

  const formatDate = (d: string) => format(new Date(d), "d 'de' MMMM yyyy", { locale: es })

  const handleDownloadPDF = async () => {
    if (!shareData || !startM || !endM) return
    try {
      setPdfStatus('Generando PDF...')
      await new Promise(r => setTimeout(r, 300))

      const coachName = shareData.user_profiles?.full_name || 'Tu coach'
      const clientName = shareData.clients?.full_name || ''
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Header
      pdf.setFillColor(11, 20, 38)
      pdf.rect(0, 0, pageWidth, 40, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Coach: ${coachName}`, pageWidth / 2, 13, { align: 'center' })
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Comparación de Avances', pageWidth / 2, 24, { align: 'center' })
      pdf.setTextColor(100, 116, 139)
      pdf.setFontSize(10)
      pdf.text(`Cliente: ${clientName}`, pageWidth / 2, 35, { align: 'center' })

      // Fechas
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Período Inicial: ${formatDate(startM.date)}`, 20, 50)
      pdf.text(`Período Final: ${formatDate(endM.date)}`, pageWidth - 20, 50, { align: 'right' })

      // Tabla
      const tableData: any[] = []
      FIELDS.forEach(({ key, label, unit }) => {
        const s = startM[key] as number | undefined
        const e = endM[key] as number | undefined
        if (s || e) {
          const diff = (e || 0) - (s || 0)
          const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
          const arrow = diff > 0 ? '^' : diff < 0 ? 'v' : '='
          tableData.push([label, s ? `${s} ${unit}` : '-', e ? `${e} ${unit}` : '-', `${arrow} ${diffStr} ${unit}`])
        }
      })

      autoTable(pdf, {
        startY: 60,
        head: [['Medida', 'Inicial', 'Final', 'Cambio']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontSize: 11, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 10, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { halign: 'left', cellWidth: 50 }, 1: { halign: 'center', cellWidth: 40 }, 2: { halign: 'center', cellWidth: 40 }, 3: { halign: 'center', cellWidth: 50, fontStyle: 'bold' } },
        margin: { left: 20, right: 20 }
      })

      pdf.setFontSize(8)
      pdf.setTextColor(148, 163, 184)
      pdf.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, pageHeight - 14, { align: 'center' })
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 212, 255)
      pdf.text('AccesoGym Coach', pageWidth / 2, pageHeight - 7, { align: 'center' })

      // Página 2: fotos
      if (startPhotos.length > 0 || endPhotos.length > 0) {
        pdf.addPage()
        pdf.setFillColor(11, 20, 38)
        pdf.rect(0, 0, pageWidth, 20, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Comparación de Fotos', pageWidth / 2, 13, { align: 'center' })

        const photoTypes = ['frontal', 'lateral', 'posterior']
        const photoLabels: Record<string, string> = { frontal: 'Frontal', lateral: 'Lateral', posterior: 'Posterior' }
        let yPos = 28
        const photoWidth = 60, photoHeight = 68, spacing = 6
        const leftX = 25, rightX = pageWidth / 2 + 5

        photoTypes.forEach(type => {
          const sp = startPhotos.find(p => p.photo_type === type)
          const ep = endPhotos.find(p => p.photo_type === type)
          pdf.setTextColor(0, 0, 0); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
          pdf.text(photoLabels[type], pageWidth / 2, yPos, { align: 'center' })
          yPos += 6
          pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139)
          pdf.text('ANTES', leftX + photoWidth / 2, yPos, { align: 'center' })
          pdf.text('DESPUÉS', rightX + photoWidth / 2, yPos, { align: 'center' })
          yPos += 4

          const drawPhoto = (photo: Photo | undefined, x: number) => {
            if (photo) {
              try { pdf.addImage(photo.photo_url, 'JPEG', x, yPos, photoWidth, photoHeight) }
              catch { pdf.setFillColor(240, 240, 240); pdf.rect(x, yPos, photoWidth, photoHeight, 'F') }
            } else {
              pdf.setFillColor(240, 240, 240); pdf.rect(x, yPos, photoWidth, photoHeight, 'F')
              pdf.setTextColor(150, 150, 150); pdf.setFontSize(8)
              pdf.text('Sin foto', x + photoWidth / 2, yPos + photoHeight / 2, { align: 'center' })
            }
          }
          drawPhoto(sp, leftX); drawPhoto(ep, rightX)
          yPos += photoHeight + spacing
        })

        pdf.setFontSize(8); pdf.setTextColor(148, 163, 184)
        pdf.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      }

      const fileName = `comparacion_${clientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`
      pdf.save(fileName)
      setPdfStatus('')
    } catch (err) {
      console.error(err)
      setPdfStatus('')
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1426] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 py-4 border-b border-white/10 px-4">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain"
          onError={e => { e.currentTarget.style.display = 'none' }} />
        <div>
          <h1 className="text-white font-bold text-base leading-tight">AccesoGymCoach</h1>
          <p className="text-slate-400 text-xs">Comparación de mediciones</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6 pb-24">

        {/* STEP: Verificar cédula */}
        {(step === 'verify' || step === 'loading') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#00D4FF]" />
            </div>
            <div className="text-center">
              <h2 className="text-white font-bold text-xl mb-1">Verificación</h2>
              <p className="text-slate-400 text-sm">Ingresa tu número de cédula para ver tu comparación</p>
            </div>
            <div className="w-full max-w-xs space-y-3">
              <input
                type="tel"
                inputMode="numeric"
                value={cedula}
                onChange={e => { setCedula(e.target.value.replace(/\D/g, '')); setErrorMsg('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="Ej: 12345678"
                className="w-full px-4 py-3 bg-[#1A2332] border border-white/10 rounded-xl text-white text-center text-lg tracking-widest placeholder-slate-500 focus:border-[#00D4FF] focus:outline-none"
                autoFocus
              />
              {errorMsg && <p className="text-rose-400 text-sm text-center">{errorMsg}</p>}
              <motion.button
                whileHover={{ scale: step === 'loading' ? 1 : 1.02 }}
                whileTap={{ scale: step === 'loading' ? 1 : 0.97 }}
                onClick={handleVerify}
                disabled={step === 'loading'}
                className="w-full py-3 bg-gradient-to-r from-[#00D4FF] to-[#0EA5E9] rounded-xl text-[#0B1426] font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {step === 'loading'
                  ? <><div className="w-4 h-4 border-2 border-[#0B1426] border-t-transparent rounded-full animate-spin" /> Verificando...</>
                  : 'Ver mi comparación'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STEP: Error */}
        {step === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-white font-bold text-lg">Link no disponible</h2>
            <p className="text-slate-400 text-sm">{errorMsg}</p>
          </motion.div>
        )}

        {/* STEP: Resultado */}
        {step === 'result' && shareData && startM && endM && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Info coach y cliente */}
            <div className="bg-[#1A2332]/60 border border-white/10 rounded-xl p-4 space-y-1">
              <p className="text-xs text-slate-400">Coach</p>
              <p className="text-white font-semibold">{shareData.user_profiles?.full_name}</p>
              <div className="border-t border-white/10 mt-2 pt-2">
                <p className="text-xs text-slate-400">Cliente</p>
                <p className="text-white font-semibold">{shareData.clients?.full_name}</p>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1A2332]/60 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Inicial</p>
                <p className="text-white text-sm font-medium">{formatDate(startM.date)}</p>
                {startM.objetivo && <p className="text-xs text-[#00D4FF] mt-1 truncate">{startM.objetivo}</p>}
              </div>
              <div className="bg-[#1A2332]/60 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Final</p>
                <p className="text-white text-sm font-medium">{formatDate(endM.date)}</p>
                {endM.objetivo && <p className="text-xs text-[#00D4FF] mt-1 truncate">{endM.objetivo}</p>}
              </div>
            </div>

            {/* Tabla de comparación */}
            <div className="bg-[#1A2332]/60 border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
                <h3 className="text-white font-semibold text-sm">Comparación de medidas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#0B1426]/60">
                    <tr>
                      <th className="text-left px-4 py-2 text-slate-400 font-medium text-xs">Medida</th>
                      <th className="text-center px-3 py-2 text-slate-400 font-medium text-xs">Inicial</th>
                      <th className="text-center px-3 py-2 text-slate-400 font-medium text-xs">Final</th>
                      <th className="text-center px-3 py-2 text-slate-400 font-medium text-xs">Cambio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {FIELDS.map(({ key, label, unit }) => {
                      const s = startM[key] as number | undefined
                      const e = endM[key] as number | undefined
                      if (!s && !e) return null
                      const diff = (e || 0) - (s || 0)
                      const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
                      const color = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'
                      const icon = diff > 0 ? '↑' : diff < 0 ? '↓' : '='
                      return (
                        <tr key={key}>
                          <td className="px-4 py-2.5 text-slate-300 text-xs">{label}</td>
                          <td className="px-3 py-2.5 text-center text-white text-xs">{s ? `${s} ${unit}` : '-'}</td>
                          <td className="px-3 py-2.5 text-center text-white text-xs">{e ? `${e} ${unit}` : '-'}</td>
                          <td className={`px-3 py-2.5 text-center font-semibold text-xs ${color}`}>{icon} {diffStr} {unit}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fotos de progreso */}
            {(startPhotos.length > 0 || endPhotos.length > 0) && (
              <div className="bg-[#1A2332]/60 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="w-4 h-4 text-[#00D4FF]" />
                  <h3 className="text-white font-semibold text-sm">Fotos de progreso</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 text-center mb-2 font-medium uppercase tracking-wide">Antes</p>
                    <div className="grid grid-cols-3 gap-1">
                      {['frontal', 'lateral', 'posterior'].map(type => {
                        const photo = startPhotos.find(p => p.photo_type === type)
                        return photo ? (
                          <div key={type} className="space-y-0.5">
                            <img src={photo.photo_url} alt={type}
                              className="w-full h-20 object-cover rounded-lg border border-white/10" />
                            <p className="text-xs text-slate-500 text-center capitalize">{type}</p>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 text-center mb-2 font-medium uppercase tracking-wide">Después</p>
                    <div className="grid grid-cols-3 gap-1">
                      {['frontal', 'lateral', 'posterior'].map(type => {
                        const photo = endPhotos.find(p => p.photo_type === type)
                        return photo ? (
                          <div key={type} className="space-y-0.5">
                            <img src={photo.photo_url} alt={type}
                              className="w-full h-20 object-cover rounded-lg border border-white/10" />
                            <p className="text-xs text-slate-500 text-center capitalize">{type}</p>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Carrusel de publicidades */}
            {ads.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500 uppercase tracking-widest text-center">Publicidad</p>
                <div className="relative rounded-xl overflow-hidden border border-[#00D4FF]/20 bg-[#1A2332]/60">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={adIndex}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.3 }}
                    >
                      {(() => {
                        const ad = ads[adIndex]
                        const inner = (
                          <div className="flex items-center gap-3 p-3">
                            {ad.image_url && (
                              <img src={ad.image_url} alt={ad.title}
                                className="w-16 h-16 object-contain rounded-lg flex-shrink-0 bg-white/5 border border-white/10 p-1" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm leading-tight">{ad.title}</p>
                              {ad.subtitle && <p className="text-[#00D4FF] text-xs mt-0.5 truncate">{ad.subtitle}</p>}
                              {ad.link_url && <p className="text-slate-500 text-xs mt-0.5 truncate">{ad.link_url}</p>}
                            </div>
                            {ads.length > 1 && (
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={e => { e.preventDefault(); setAdIndex(i => (i - 1 + ads.length) % ads.length) }}
                                  className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20">
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={e => { e.preventDefault(); setAdIndex(i => (i + 1) % ads.length) }}
                                  className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20">
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )
                        return ad.link_url
                          ? <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block active:opacity-80">{inner}</a>
                          : inner
                      })()}
                    </motion.div>
                  </AnimatePresence>

                  {ads.length > 1 && (
                    <div className="flex justify-center gap-1 pb-2">
                      {ads.map((_, i) => (
                        <button key={i} onClick={() => setAdIndex(i)}
                          className={`h-1 rounded-full transition-all ${i === adIndex ? 'bg-[#00D4FF] w-4' : 'bg-white/20 w-1'}`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Botón descargar PDF */}
            <motion.button
              whileHover={{ scale: pdfStatus ? 1 : 1.02 }}
              whileTap={{ scale: pdfStatus ? 1 : 0.98 }}
              onClick={handleDownloadPDF}
              disabled={!!pdfStatus}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {pdfStatus ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{pdfStatus}</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Descargar PDF</span>
                </>
              )}
            </motion.button>

          </motion.div>
        )}
      </div>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1426]/95 border-t border-white/10 py-2.5 text-center backdrop-blur-sm">
        <p className="text-slate-500 text-xs">
          <span className="text-[#00D4FF] font-semibold">AccesoGymCoach</span> · Desarrollado por{' '}
          <span className="text-white font-medium">TecnoAcceso</span>
        </p>
      </div>
    </div>
  )
}
