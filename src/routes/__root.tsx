import { createRootRoute, Outlet, Link, useRouterState, redirect } from '@tanstack/react-router'
import { Home, MessageSquare, Sparkles, Users, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { cn } from '../lib/utils'
import { useAuth } from '../store/auth'

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const { token } = useAuth.getState()
    if (!token && location.pathname !== '/login') {
      throw redirect({ to: '/login' })
    }
    if (token && location.pathname === '/login') {
      throw redirect({ to: '/' })
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const routerState = useRouterState()
  const isLoginPage = routerState.location.pathname === '/login'

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <div className="flex flex-col min-h-[100dvh] text-foreground antialiased font-sans relative">
      {/* Animated Mesh Background */}
      <div className="mesh-bg" />

      {/* Subtle Noise Overlay */}
      <div className="noise" />

      <main className="flex-1 overflow-x-hidden overflow-y-auto relative z-10">
        <Outlet />
      </main>
      {!isLoginPage && <BottomNav />}
    </div>
  )
}

const NAV_ITEMS = [
  { to: '/' as const, icon: Home, label: 'Home' },
  { to: '/chat' as const, icon: MessageSquare, label: 'Chat' },
  { to: '/prospector' as const, icon: Sparkles, label: 'Prospector' },
  { to: '/leads' as const, icon: Users, label: 'Leads' },
  { to: '/settings' as const, icon: Settings, label: 'Ajustes' },
]

function BottomNav() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 safe-bottom pt-2">
      <div className="glass-strong mx-auto flex max-w-md items-center justify-around rounded-2xl px-1 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.to === '/' ? currentPath === '/' : currentPath.startsWith(item.to)
          const Icon = item.icon

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-2 transition-all duration-300',
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {/* Active Background Glow */}
              {isActive && (
                <motion.div
                  layoutId="nav-active-bg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-indigo-500/20 to-purple-600/10 border border-indigo-500/20"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative z-10">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={cn(
                'text-[10px] leading-none relative z-10',
                isActive ? 'font-semibold' : 'font-normal'
              )}>
                {item.label}
              </span>

              {/* Active Dot Indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400"
                  style={{ boxShadow: '0 0 8px 2px rgba(129, 140, 248, 0.6)' }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
