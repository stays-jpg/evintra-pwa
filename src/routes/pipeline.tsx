import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { X, ExternalLink, MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { fetchLeads, type Lead } from '../api/leads'

export const Route = createFileRoute('/pipeline')({
  component: PipelinePage,
})

const STAGES = [
  { id: 'new', label: 'Nuevo', color: 'from-blue-500 to-cyan-400', dotColor: 'bg-blue-400' },
  { id: 'contacted', label: 'Contactado', color: 'from-amber-500 to-orange-400', dotColor: 'bg-amber-400' },
  { id: 'demo', label: 'Demo', color: 'from-purple-500 to-pink-500', dotColor: 'bg-purple-400' },
  { id: 'negotiation', label: 'Negociación', color: 'from-emerald-500 to-teal-400', dotColor: 'bg-emerald-400' },
  { id: 'won', label: 'Ganado', color: 'from-green-500 to-lime-400', dotColor: 'bg-green-400' },
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function PipelinePage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
    retry: 1,
    staleTime: 30_000,
  })

  const leadsByStage = leads.reduce<Record<string, Lead[]>>((acc, lead) => {
    const stage = lead.stage || 'new'
    if (!acc[stage]) acc[stage] = []
    acc[stage].push(lead)
    return acc
  }, {})

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-14 pb-28 min-h-[100dvh]"
    >
      {/* Header */}
      <div className="px-6 mb-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold tracking-tight text-gradient"
        >
          Pipeline de Ventas
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 mt-2"
        >
          <span className="text-xs glass rounded-full px-3 py-1 text-zinc-400 font-medium">
            {leads.length} leads
          </span>
        </motion.div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 size={22} className="animate-spin mr-2" />
          <span className="text-sm">Cargando pipeline...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="px-6">
          <div className="flex items-center gap-2.5 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-sm text-red-400">
            <AlertCircle size={15} className="shrink-0" />
            No se pudo cargar el pipeline. Verifica la conexión con la API.
          </div>
        </div>
      )}

      {/* Horizontal Kanban */}
      {!isLoading && !isError && (
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-6 pb-4" style={{ width: 'max-content' }}>
            {STAGES.map((stage, stageIdx) => {
              const stageLeads = leadsByStage[stage.id] || []
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stageIdx * 0.07 }}
                  className="w-72 shrink-0"
                >
                  {/* Column Header */}
                  <div className="flex items-center gap-2.5 mb-3 px-1">
                    <div className={cn('w-2 h-2 rounded-full', stage.dotColor)} />
                    <span className="text-sm font-semibold">{stage.label}</span>
                    <span className="text-[10px] text-zinc-600 ml-auto glass rounded-full px-2 py-0.5 font-medium">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {stageLeads.map((lead, i) => (
                      <motion.button
                        key={lead.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: stageIdx * 0.07 + i * 0.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedLead(lead); setSelectedStage(stage.id) }}
                        className="w-full text-left glass rounded-2xl p-4 hover:border-white/10 transition-all duration-300 group relative overflow-hidden"
                      >
                        <div className={cn('absolute top-0 left-0 right-0 h-px bg-gradient-to-r opacity-40', stage.color)} />

                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold',
                            stage.color
                          )}>
                            {initials(lead.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{lead.name}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{lead.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500 truncate">{lead.email}</span>
                          <ScoreRing score={lead.score} size={30} />
                        </div>
                      </motion.button>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="glass rounded-2xl p-4 border-dashed text-center text-xs text-zinc-600">
                        Sin leads
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lead Detail Sheet */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass-strong rounded-t-3xl p-6 pb-10"
            >
              <div className="w-12 h-1 rounded-full bg-white/10 mx-auto mb-6" />

              <button
                onClick={() => setSelectedLead(null)}
                className="absolute top-5 right-5 p-2 rounded-full glass text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold shadow-lg',
                  STAGES.find(s => s.id === selectedStage)?.color || 'from-indigo-500 to-purple-600'
                )}>
                  {initials(selectedLead.name)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedLead.name}</h2>
                  <p className="text-sm text-zinc-500">{selectedLead.company}</p>
                  <p className="text-xs text-indigo-400 mt-0.5">{selectedLead.email}</p>
                </div>
                <div className="ml-auto">
                  <ScoreRing score={selectedLead.score} size={52} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-zinc-300">{selectedLead.stage}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Etapa</p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-lg font-bold" style={{ color: selectedLead.score >= 80 ? '#22c55e' : '#f59e0b' }}>
                    {selectedLead.score}%
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">Lead Score</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <button className="w-full py-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform">
                  <MessageSquare size={16} /> Pedir Demo con SalesPro
                </button>
                <button className="w-full py-3 rounded-xl glass text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/[0.05] transition-colors text-zinc-300">
                  <ExternalLink size={14} /> Ver en HubSpot
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ScoreRing({ score, size = 30 }: { score: number; size?: number }) {
  const strokeWidth = size > 40 ? 3 : 2.5
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ color, fontSize: size > 40 ? 14 : 10 }}>
        {score}
      </span>
    </div>
  )
}
