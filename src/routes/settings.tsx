import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { 
  Wifi, Globe, Bell, LogOut, Download, CheckCircle2, XCircle, Loader2, 
  Server, Shield, Smartphone, ChevronRight, Info, Palette
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useServer } from '../store/server'
import { useAuth } from '../store/auth'
import { pingServer } from '../api/client'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } }
}

function SettingsPage() {
  const { url, setUrl } = useServer()
  const { logout } = useAuth()
  const [mode, setMode] = useState<'local' | 'remote'>('local')
  const [localUrl, setLocalUrl] = useState('192.168.1.100:8000')
  const [remoteUrl, setRemoteUrl] = useState('https://evintra.tu-dominio.com')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle')
  const [notifications, setNotifications] = useState({
    newLead: true,
    demoScheduled: true,
    briefing: true,
    agentAction: false,
  })

  const testConnection = async () => {
    setConnectionStatus('testing')
    const testUrl = mode === 'local' ? `http://${localUrl}` : remoteUrl
    const ok = await pingServer(testUrl)
    setConnectionStatus(ok ? 'connected' : 'failed')
    if (ok) setUrl(testUrl)
    setTimeout(() => setConnectionStatus('idle'), 3000)
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pt-14 pb-28 px-6 space-y-7"
    >
      <motion.h1 variants={item} className="text-2xl font-bold tracking-tight text-gradient">
        Configuración
      </motion.h1>

      {/* ─── Server ─── */}
      <motion.section variants={item} className="space-y-3">
        <SectionHeader icon={<Server size={16} className="text-indigo-400" />} title="Servidor" />

        <div className="glass-strong rounded-2xl p-1 flex mb-1">
          <button
            onClick={() => setMode('local')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative',
              mode === 'local' ? 'text-white' : 'text-zinc-500'
            )}
          >
            {mode === 'local' && (
              <motion.div
                layoutId="server-mode"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2"><Wifi size={14} /> Local</span>
          </button>
          <button
            onClick={() => setMode('remote')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative',
              mode === 'remote' ? 'text-white' : 'text-zinc-500'
            )}
          >
            {mode === 'remote' && (
              <motion.div
                layoutId="server-mode"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2"><Globe size={14} /> Túnel</span>
          </button>
        </div>

        <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
          {mode === 'local'
            ? <Wifi size={16} className="text-zinc-500 shrink-0" />
            : <Globe size={16} className="text-zinc-500 shrink-0" />
          }
          <input
            type="text"
            value={mode === 'local' ? localUrl : remoteUrl}
            onChange={(e) => mode === 'local' ? setLocalUrl(e.target.value) : setRemoteUrl(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-zinc-300"
            placeholder={mode === 'local' ? '192.168.1.X:8000' : 'https://...'}
          />
        </div>

        <motion.button
          onClick={testConnection}
          disabled={connectionStatus === 'testing'}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300',
            connectionStatus === 'connected'
              ? 'glass border-emerald-500/30 text-emerald-400 glow-emerald'
              : connectionStatus === 'failed'
              ? 'glass border-red-500/30 text-red-400'
              : 'btn-primary'
          )}
        >
          {connectionStatus === 'testing' && <Loader2 size={16} className="animate-spin" />}
          {connectionStatus === 'connected' && <CheckCircle2 size={16} />}
          {connectionStatus === 'failed' && <XCircle size={16} />}
          {connectionStatus === 'idle' ? 'Probar Conexión' :
           connectionStatus === 'testing' ? 'Probando...' :
           connectionStatus === 'connected' ? '¡Conectado!' : 'Sin conexión'}
        </motion.button>
      </motion.section>

      {/* ─── Notifications ─── */}
      <motion.section variants={item} className="space-y-3">
        <SectionHeader icon={<Bell size={16} className="text-amber-400" />} title="Notificaciones Push" />
        <div className="glass rounded-2xl p-1">
          <ToggleRow label="Nuevo lead detectado" emoji="🎯" checked={notifications.newLead} onChange={(v) => setNotifications(n => ({ ...n, newLead: v }))} />
          <ToggleRow label="Demo programada" emoji="📅" checked={notifications.demoScheduled} onChange={(v) => setNotifications(n => ({ ...n, demoScheduled: v }))} />
          <ToggleRow label="Briefing matutino" emoji="☀️" checked={notifications.briefing} onChange={(v) => setNotifications(n => ({ ...n, briefing: v }))} />
          <ToggleRow label="Acciones de agentes" emoji="🤖" checked={notifications.agentAction} onChange={(v) => setNotifications(n => ({ ...n, agentAction: v }))} isLast />
        </div>
      </motion.section>

      {/* ─── Account ─── */}
      <motion.section variants={item} className="space-y-3">
        <SectionHeader icon={<Shield size={16} className="text-emerald-400" />} title="Cuenta" />
        <div className="glass rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg glow-indigo">
            A
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Andy</p>
            <p className="text-xs text-zinc-500 mt-0.5">admin@evintra.com</p>
          </div>
          <ChevronRight size={16} className="text-zinc-600" />
        </div>
        <button
          onClick={logout}
          className="w-full py-3 rounded-xl glass text-sm font-medium flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={15} /> Cerrar Sesión
        </button>
      </motion.section>

      {/* ─── App ─── */}
      <motion.section variants={item} className="space-y-3">
        <SectionHeader icon={<Smartphone size={16} className="text-blue-400" />} title="App" />
        <div className="glass rounded-2xl p-1">
          <InfoRow label="Versión" value="1.0.0" />
          <InfoRow label="Servidor" value={url} mono />
          <InfoRow label="PWA Status" value="Instalable" valueColor="text-emerald-400" isLast />
        </div>
        <button
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm"
        >
          <Download size={16} /> Instalar como App
        </button>
      </motion.section>

      {/* Footer */}
      <motion.div variants={item} className="text-center pt-4 pb-4">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
          Evintra AI Agents Hub · v1.0.0
        </p>
        <p className="text-[10px] text-zinc-700 mt-1">
          Mac Mini M4 · Cloudflare Tunnel
        </p>
      </motion.div>
    </motion.div>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      {icon}
      <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
    </div>
  )
}

function ToggleRow({ label, emoji, checked, onChange, isLast }: {
  label: string; emoji: string; checked: boolean; onChange: (v: boolean) => void; isLast?: boolean
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/[0.03] transition-colors',
        !isLast && 'border-b border-white/[0.03]'
      )}
    >
      <span className="text-base">{emoji}</span>
      <span className="text-sm flex-1 text-left">{label}</span>
      <div className={cn(
        'w-11 h-6 rounded-full relative transition-all duration-300',
        checked ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'bg-zinc-700'
      )}>
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
        />
      </div>
    </button>
  )
}

function InfoRow({ label, value, mono, valueColor, isLast }: {
  label: string; value: string; mono?: boolean; valueColor?: string; isLast?: boolean
}) {
  return (
    <div className={cn(
      'flex items-center justify-between p-3.5',
      !isLast && 'border-b border-white/[0.03]'
    )}>
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={cn(
        'text-sm truncate max-w-44 text-right',
        mono ? 'font-mono text-xs text-indigo-400' : valueColor || 'text-zinc-300'
      )}>
        {value}
      </span>
    </div>
  )
}
