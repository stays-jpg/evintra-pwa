import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, type Variants } from 'framer-motion'
import {
  Flame, TrendingUp, Activity, ArrowUpRight, CheckCircle2,
  Sparkles, Zap, Eye, Brain, Shield, Search, Cpu, AlertCircle, Loader2
} from 'lucide-react'
import { cn } from '../lib/utils'
import { fetchDashboardStats, fetchRecentActivity } from '../api/dashboard'

export const Route = createFileRoute('/')({
  component: DashboardHome,
})

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } }
}

const AGENTS = [
  { name: 'SalesPro', desc: 'Ventas & CRM', status: 'activo' as const, icon: <Zap size={16} />, color: 'from-indigo-500 to-purple-500' },
  { name: 'FastResponder', desc: 'Respuesta rápida', status: 'activo' as const, icon: <Sparkles size={16} />, color: 'from-amber-500 to-orange-500' },
  { name: 'DataMiner', desc: 'Enriquecimiento', status: 'activo' as const, icon: <Search size={16} />, color: 'from-cyan-500 to-blue-500' },
  { name: 'VisionAnalyst', desc: 'Análisis visual', status: 'standby' as const, icon: <Eye size={16} />, color: 'from-pink-500 to-rose-500' },
  { name: 'FairHunter', desc: 'Ferias & eventos', status: 'activo' as const, icon: <Brain size={16} />, color: 'from-violet-500 to-purple-500' },
  { name: 'AdminAssistant', desc: 'Tareas & agenda', status: 'activo' as const, icon: <Shield size={16} />, color: 'from-emerald-500 to-green-500' },
  { name: 'EvintraGuide', desc: 'Knowledge base', status: 'activo' as const, icon: <Cpu size={16} />, color: 'from-sky-500 to-blue-500' },
]

function DashboardHome() {
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return '🌅 Buenos días'
    if (h < 18) return '☀️ Buenas tardes'
    return '🌙 Buenas noches'
  })()

  const now = new Date()
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dateStr = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} · ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const { data: statsData, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    retry: 1,
    staleTime: 30_000,
  })

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: fetchRecentActivity,
    retry: 1,
    staleTime: 30_000,
  })

  const stats = [
    {
      label: 'Hot Leads',
      value: statsLoading ? '…' : statsError ? '—' : String(statsData?.hot_leads ?? 0),
      icon: <Flame size={18} />,
      color: 'from-orange-500 to-red-500',
      glow: 'shadow-orange-500/30',
    },
    {
      label: 'Total Leads',
      value: statsLoading ? '…' : statsError ? '—' : String(statsData?.total_leads ?? 0),
      icon: <Activity size={18} />,
      color: 'from-blue-500 to-cyan-400',
      glow: 'shadow-blue-500/30',
    },
    {
      label: 'Conversión',
      value: statsLoading ? '…' : statsError ? '—' : `${statsData?.conversion_rate ?? 0}%`,
      icon: <TrendingUp size={18} />,
      color: 'from-emerald-500 to-teal-400',
      glow: 'shadow-emerald-500/30',
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-6 pt-14 pb-28 space-y-8"
    >
      {/* ─── Header ─── */}
      <motion.header variants={item}>
        <h1 className="text-3xl font-bold tracking-tight text-gradient">
          {greeting}, Andy
        </h1>
        <p className="text-sm text-zinc-500 mt-1.5 font-medium">{dateStr}</p>
      </motion.header>

      {/* ─── Stats Cards ─── */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileTap={{ scale: 0.96 }}
            className={cn(
              'glass rounded-2xl p-4 flex flex-col items-center justify-center gap-2 relative overflow-hidden group cursor-pointer',
              `shadow-lg ${stat.glow}`
            )}
          >
            <div className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r', stat.color)} />
            <div className={cn(
              'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white',
              stat.color
            )}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* API error notice */}
      {statsError && (
        <motion.div
          variants={item}
          className="flex items-center gap-2.5 bg-amber-900/15 border border-amber-700/30 rounded-xl px-4 py-3 text-sm text-amber-500"
        >
          <AlertCircle size={15} className="shrink-0" />
          No se pudo conectar con el servidor. Verifica la URL en Ajustes.
        </motion.div>
      )}

      {/* ─── Agents Grid ─── */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Agentes IA</h2>
          <span className="text-xs text-indigo-400 font-medium">
            {AGENTS.filter(a => a.status === 'activo').length}/{AGENTS.length} activos
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {AGENTS.slice(0, 4).map((agent) => (
            <motion.div
              key={agent.name}
              whileTap={{ scale: 0.97 }}
              className="glass rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer group hover:border-white/10 transition-all duration-300"
            >
              <div className={cn(
                'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0',
                agent.color
              )}>
                {agent.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{agent.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    agent.status === 'activo' ? 'bg-emerald-400 status-active' : 'bg-amber-400'
                  )} />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                    {agent.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass rounded-2xl p-1">
          {AGENTS.slice(4).map((agent) => (
            <div
              key={agent.name}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <div className={cn(
                'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0',
                agent.color
              )}>
                {agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{agent.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{agent.desc}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  agent.status === 'activo' ? 'bg-emerald-400 status-active' : 'bg-amber-400'
                )} />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{agent.status}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ─── Activity Feed ─── */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Actividad Reciente</h2>
          <span className="text-xs text-zinc-500 font-medium">Hoy</span>
        </div>

        {activityLoading && (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">Cargando actividad...</span>
          </div>
        )}

        {!activityLoading && (
          <div className="space-y-3">
            {(activityData ?? []).map((activity, i) => (
              <motion.div
                key={activity.id ?? i}
                variants={item}
                whileTap={{ scale: 0.98 }}
                className="glass rounded-2xl p-4 flex items-start gap-4 cursor-pointer group hover:border-white/10 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  {activity.type === 'task_created' || activity.type === 'demo_scheduled'
                    ? <CheckCircle2 size={18} />
                    : <ArrowUpRight size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{activity.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{activity.description}</p>
                  <p className="text-[10px] text-zinc-600 mt-1.5 font-medium">{activity.timestamp}</p>
                </div>
              </motion.div>
            ))}

            {activityData?.length === 0 && (
              <p className="text-center text-sm text-zinc-500 py-8">Sin actividad reciente</p>
            )}
          </div>
        )}
      </motion.section>
    </motion.div>
  )
}
