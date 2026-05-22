import { createFileRoute } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Paperclip, Bot, User, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'
import { sendChatMessage } from '../api/agents'

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: string
  timestamp: Date
}

const AGENT_COLORS: Record<string, string> = {
  Orchestrator: 'from-indigo-500 to-purple-600',
  SalesPro: 'from-amber-500 to-orange-500',
  DataMiner: 'from-cyan-500 to-blue-500',
  FairHunter: 'from-violet-500 to-purple-500',
  EvintraGuide: 'from-sky-500 to-blue-500',
  AdminAssistant: 'from-emerald-500 to-green-500',
  FastResponder: 'from-rose-500 to-pink-500',
  VisionAnalyst: 'from-fuchsia-500 to-pink-500',
}

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola Andy! 👋 Soy el orquestador de Evintra. ¿En qué puedo ayudarte hoy?\n\nPuedo conectarte con cualquier agente: **SalesPro**, **DataMiner**, **FairHunter** y más.',
      agent: 'Orchestrator',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking])

  const handleSend = async () => {
    if (!input.trim() || isThinking) return
    const text = input.trim()
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsThinking(true)
    inputRef.current?.focus()

    try {
      const response = await sendChatMessage(text)
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        agent: response.agent || 'Orchestrator',
        timestamp: new Date(response.timestamp),
      }
      setMessages(prev => [...prev, botMsg])
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error al conectar con el servidor. Verifica la URL en Ajustes.',
        agent: 'Orchestrator',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsThinking(false)
    }
  }

  const toggleVoice = () => setIsListening(!isListening)

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* ─── Header ─── */}
      <div className="glass-strong px-6 py-4 pt-14 relative z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg glow-indigo">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#08090d] status-active" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Agentes Evintra</h1>
            <p className="text-[11px] text-zinc-500 font-medium">
              {isThinking ? (
                <span className="text-indigo-400">Pensando...</span>
              ) : (
                '7 agentes disponibles · En línea'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scrollbar-hide">
        <AnimatePresence>
          {messages.map((msg) => {
            const agentGradient = msg.agent ? AGENT_COLORS[msg.agent] || 'from-indigo-500 to-purple-600' : ''

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                  'flex gap-3 max-w-[85%]',
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-400'
                    : `bg-gradient-to-br ${agentGradient}`
                )}>
                  {msg.role === 'user'
                    ? <User size={14} className="text-white" />
                    : <Bot size={14} className="text-white" />
                  }
                </div>

                {/* Bubble */}
                <div className={cn(
                  'rounded-2xl px-4 py-3 relative',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-md shadow-lg shadow-indigo-500/20'
                    : 'glass rounded-tl-md'
                )}>
                  {msg.agent && msg.role === 'assistant' && (
                    <span className={cn(
                      'text-[10px] uppercase tracking-widest font-bold block mb-1.5',
                      'bg-gradient-to-r bg-clip-text text-transparent', agentGradient
                    )}>
                      {msg.agent}
                    </span>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content.split('**').map((part, i) =>
                      i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] mt-2 block',
                    msg.role === 'user' ? 'text-white/50 text-right' : 'text-zinc-600'
                  )}>
                    {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 items-center"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="glass rounded-2xl rounded-tl-md px-5 py-3.5 flex gap-2">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    delay: i * 0.15,
                    ease: 'easeInOut'
                  }}
                  className="w-2 h-2 rounded-full bg-indigo-400"
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input Area ─── */}
      <div className="p-4 pb-24 relative z-20">
        <div className="glass-strong rounded-2xl flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            className="p-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            <Paperclip size={19} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-zinc-600"
          />
          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              isListening
                ? 'bg-red-500/20 text-red-400'
                : 'text-zinc-500 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            {isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>
          <motion.button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              input.trim() && !isThinking
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-zinc-600 cursor-not-allowed'
            )}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
