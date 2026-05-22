import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../store/auth'
import { useServer } from '../store/server'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setToken } = useAuth()
  const { url } = useServer()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${url}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Credenciales inválidas')
      }
      const { access_token } = await res.json()
      setToken(access_token)
      navigate({ to: '/' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-4">
            <Sparkles size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Evintra</h1>
          <p className="text-sm text-zinc-500 mt-1.5 font-medium">AI Agents Hub</p>
        </motion.div>

        {/* Card */}
        <form onSubmit={handleLogin} className="glass rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-center mb-2">Iniciar Sesión</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2.5 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-sm text-red-400"
            >
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-sm bg-transparent outline-none border border-white/5 focus:border-indigo-500/40 transition-colors"
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 pr-12 text-sm bg-transparent outline-none border border-white/5 focus:border-indigo-500/40 transition-colors"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'w-full py-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2.5 mt-2 active:scale-[0.97] transition-transform',
              loading && 'opacity-70 cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Conectando...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Entrar
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Servidor:{' '}
          <span className="text-zinc-500 font-medium">{url}</span>
        </p>
      </motion.div>
    </div>
  )
}
