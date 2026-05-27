import { createFileRoute } from '@tanstack/react-router'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useState } from 'react'
import {
  Search, User, Building2, Globe, ExternalLink, Mail, Copy, CheckCheck,
  Save, ChevronDown, ChevronUp, Loader2, AlertCircle, Sparkles, Shield
} from 'lucide-react'
import { cn } from '../lib/utils'
import { searchContact, saveProspectAsLead, type ProspectRequest, type ProspectResult, type EmailCandidate } from '../api/prospector'

export const Route = createFileRoute('/prospector')({
  component: ProspectorPage,
})

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } },
}

function confidenceColor(c: number) {
  if (c >= 0.75) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
  if (c >= 0.55) return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
  return 'text-zinc-400 border-zinc-600/30 bg-zinc-700/20'
}

function confidenceLabel(c: number) {
  if (c >= 0.80) return 'Alta'
  if (c >= 0.60) return 'Media'
  return 'Baja'
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-500 hover:text-zinc-300"
    >
      {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  )
}

function ResultCard({ result, onSave }: { result: ProspectResult; onSave: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveProspectAsLead(result)
      setSaved(true)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
    onSave()
  }

  return (
    <motion.div
      variants={item}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg glow-indigo">
          {result.first_name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">
              {result.first_name} {result.last_name}
            </p>
            {result.mx_verified && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                <Shield size={9} /> MX OK
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{result.company}</p>
          {result.domain && (
            <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{result.domain}</p>
          )}
        </div>
      </div>

      {/* Best email */}
      {result.best_email && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5">
            <Mail size={13} className="text-indigo-400 shrink-0" />
            <span className="text-sm font-mono text-zinc-200 flex-1 truncate">{result.best_email}</span>
            <span className={cn(
              'text-[10px] font-semibold border rounded-full px-2 py-0.5 shrink-0',
              confidenceColor(result.best_confidence)
            )}>
              {confidenceLabel(result.best_confidence)} {Math.round(result.best_confidence * 100)}%
            </span>
            <CopyButton text={result.best_email} />
          </div>
        </div>
      )}

      {/* LinkedIn + actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        {result.linkedin_url && (
          <a
            href={result.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 hover:bg-blue-500/20 transition-colors"
          >
            <ExternalLink size={12} /> LinkedIn
          </a>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {result.candidates.length} candidatos
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all',
            saved
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'btn-primary py-1.5 text-xs'
          )}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saved ? 'Guardado' : 'Guardar lead'}
        </button>
      </div>

      {/* Candidates list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/[0.05]"
          >
            <div className="p-3 space-y-1.5">
              {result.candidates.map((c, i) => (
                <CandidateRow key={i} candidate={c} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CandidateRow({ candidate: c }: { candidate: EmailCandidate }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors group">
      <Mail size={11} className="text-zinc-600 shrink-0" />
      <span className="text-xs font-mono text-zinc-300 flex-1 truncate">{c.email}</span>
      {c.pattern_type && (
        <span className="text-[9px] text-zinc-600 font-mono hidden group-hover:block">{c.pattern_type}</span>
      )}
      <span className={cn(
        'text-[10px] border rounded-full px-1.5 py-0.5 shrink-0',
        confidenceColor(c.confidence)
      )}>
        {Math.round(c.confidence * 100)}%
      </span>
      <span className={cn(
        'text-[9px] uppercase tracking-wider shrink-0',
        c.source === 'verified' ? 'text-emerald-400' : c.source === 'scraped' ? 'text-amber-400' : 'text-zinc-600'
      )}>
        {c.source}
      </span>
      <CopyButton text={c.email} />
    </div>
  )
}

function ProspectorPage() {
  const [form, setForm] = useState<ProspectRequest>({
    first_name: '',
    last_name: '',
    company: '',
    country: '',
    domain_hint: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProspectResult | null>(null)
  const [history, setHistory] = useState<ProspectResult[]>([])

  const canSearch = form.first_name.trim() && form.last_name.trim() && form.company.trim()

  const handleSearch = async () => {
    if (!canSearch) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await searchContact(form)
      setResult(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al buscar')
    } finally {
      setLoading(false)
    }
  }

  const handleSaved = () => {
    if (result) setHistory(h => [result, ...h.filter(r => r.best_email !== result.best_email)])
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pt-14 pb-28 px-6 space-y-6"
    >
      {/* Header */}
      <motion.header variants={item}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient">Prospector</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Encuentra emails profesionales</p>
          </div>
        </div>
      </motion.header>

      {/* Search Form */}
      <motion.div variants={item} className="glass rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Nombre</label>
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5">
              <User size={13} className="text-zinc-500 shrink-0" />
              <input
                type="text"
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                placeholder="Carlos"
                className="bg-transparent border-none outline-none text-sm flex-1 min-w-0"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Apellido</label>
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5">
              <User size={13} className="text-zinc-500 shrink-0" />
              <input
                type="text"
                value={form.last_name}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                placeholder="García"
                className="bg-transparent border-none outline-none text-sm flex-1 min-w-0"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Empresa *</label>
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5">
            <Building2 size={13} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              placeholder="Acme Corp"
              className="bg-transparent border-none outline-none text-sm flex-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">País</label>
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5">
              <Globe size={13} className="text-zinc-500 shrink-0" />
              <input
                type="text"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                placeholder="España"
                className="bg-transparent border-none outline-none text-sm flex-1 min-w-0"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Dominio (opcional)</label>
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5">
              <Mail size={13} className="text-zinc-500 shrink-0" />
              <input
                type="text"
                value={form.domain_hint}
                onChange={e => setForm(f => ({ ...f, domain_hint: e.target.value }))}
                placeholder="acme.com"
                className="bg-transparent border-none outline-none text-sm flex-1 min-w-0 font-mono"
              />
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleSearch}
          disabled={!canSearch || loading}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 mt-1',
            canSearch && !loading ? 'btn-primary' : 'glass text-zinc-600 cursor-not-allowed'
          )}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Buscando...</>
            : <><Search size={16} /> Buscar Email</>
          }
        </motion.button>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          variants={item}
          className="flex items-center gap-2.5 bg-red-900/15 border border-red-700/30 rounded-xl px-4 py-3 text-sm text-red-400"
        >
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.best_email ?? result.first_name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <ResultCard result={result} onSave={handleSaved} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <motion.section variants={item} className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">
            Guardados recientes
          </h2>
          <div className="space-y-3">
            {history.map((r, i) => (
              <ResultCard key={i} result={r} onSave={() => {}} />
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  )
}
