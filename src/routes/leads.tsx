import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Search, Flame, Users, MessageSquare, Calendar, Zap, ChevronRight, X, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { fetchLeads, type Lead } from '../api/leads'

export const Route = createFileRoute('/leads')({
  component: LeadsPage,
})

const STAGE_STYLES: Record<string, { bg: string; text: string }> = {
  demo: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  negotiation: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  contacted: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  new: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  won: { bg: 'bg-green-500/15', text: 'text-green-400' },
  lost: { bg: 'bg-zinc-500/15', text: 'text-zinc-400' },
}

function LeadsPage() {
  const [activeTab, setActiveTab] = useState<'hot' | 'all'>('hot')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const { data: allLeads = [], isLoading, isError } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
    retry: 1,
    staleTime: 30_000,
  })

  const hotLeads = allLeads.filter(l => l.score >= 80)
  const displayLeads = activeTab === 'hot' ? hotLeads : allLeads
  const filtered = displayLeads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-14 pb-28 min-h-[100dvh]"
    >
      {/* Header */}
      <div className="px-6 mb-5">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold tracking-tight text-gradient"
        >
          Leads
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-sm text-zinc-500 mt-1"
        >
          {allLeads.length} contactos · {hotLeads.length} hot leads
        </motion.p>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6 mb-4"
      >
        <div className="glass-strong rounded-xl p-1 flex">
          <button
            onClick={() => setActiveTab('hot')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative',
              activeTab === 'hot' ? 'text-white' : 'text-zinc-500'
            )}
          >
            {activeTab === 'hot' && (
              <motion.div
                layoutId="leads-tab-bg"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/25"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Flame size={15} /> Hot ({hotLeads.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative',
              activeTab === 'all' ? 'text-white' : 'text-zinc-500'
            )}
          >
            {activeTab === 'all' && (
              <motion.div
                layoutId="leads-tab-bg"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Users size={15} /> Todos ({allLeads.length})
            </span>
          </button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-6 mb-5"
      >
        <div className="glass rounded-xl flex items-center gap-3 px-4 py-3">
          <Search size={17} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o empresa..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-zinc-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-zinc-500">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Cargando leads...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="px-6">
          <div className="flex items-center gap-2.5 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-sm text-red-400">
            <AlertCircle size={15} className="shrink-0" />
            No se pudo cargar los leads. Verifica la conexión con la API.
          </div>
        </div>
      )}

      {/* Lead List */}
      {!isLoading && !isError && (
        <div className="px-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((lead, i) => {
              const stageStyle = STAGE_STYLES[lead.stage] || STAGE_STYLES.new
              return (
                <motion.button
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedLead(lead)}
                  className="w-full text-left glass rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all duration-300 relative overflow-hidden"
                >
                  <div className={cn(
                    'absolute left-0 top-3 bottom-3 w-0.5 rounded-full',
                    lead.score >= 80 ? 'bg-emerald-400' : lead.score >= 60 ? 'bg-amber-400' : 'bg-zinc-600'
                  )} />

                  <ScoreRing score={lead.score} size={48} />

                  <div className="flex-1 min-w-0 pl-1">
                    <p className="font-semibold text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{lead.company}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', stageStyle.bg, stageStyle.text)}>
                        {lead.stage}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                </motion.button>
              )
            })}
          </AnimatePresence>

          {filtered.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-zinc-500"
            >
              <Search size={40} className="mx-auto mb-3 text-zinc-600" />
              <p className="text-sm font-medium">No se encontraron leads</p>
              <p className="text-xs text-zinc-600 mt-1">Prueba con otro término de búsqueda</p>
            </motion.div>
          )}
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

              <div className="flex items-center gap-4 mb-5">
                <ScoreRing score={selectedLead.score} size={60} />
                <div>
                  <h2 className="text-xl font-bold">{selectedLead.name}</h2>
                  <p className="text-sm text-zinc-500">{selectedLead.company}</p>
                  <p className="text-xs text-indigo-400 mt-0.5 font-medium">{selectedLead.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {(() => {
                  const s = STAGE_STYLES[selectedLead.stage] || STAGE_STYLES.new
                  return (
                    <span className={cn('text-xs px-3 py-1 rounded-full font-semibold', s.bg, s.text)}>
                      {selectedLead.stage}
                    </span>
                  )
                })()}
                {selectedLead.source && (
                  <span className="text-xs glass px-3 py-1 rounded-full text-zinc-400 font-medium">
                    {selectedLead.source}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <button className="w-full py-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform">
                  <MessageSquare size={16} /> Enviar WhatsApp
                </button>
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                  <Calendar size={16} /> Agendar Demo
                </button>
                <button className="w-full py-3 rounded-xl glass text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/[0.05] transition-colors text-zinc-300">
                  <Zap size={14} className="text-amber-400" /> Enriquecer Datos
                </button>
                <button className="w-full py-3 rounded-xl glass text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/[0.05] transition-colors text-zinc-400">
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

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const sw = size > 50 ? 3.5 : size > 40 ? 3 : 2.5
  const radius = (size - sw * 2) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ color, fontSize: size > 50 ? 16 : size > 40 ? 13 : 10 }}>
        {score}
      </span>
    </div>
  )
}
