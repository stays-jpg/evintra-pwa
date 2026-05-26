import { createFileRoute } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Mic, MicOff, Paperclip, Bot, User, Sparkles, X,
  CreditCard, Mail, Phone, Building2, Globe, CheckCircle2, Image,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { sendChatMessage, type ContactData } from '../api/agents'

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})

// ─── Types ─────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: string
  timestamp: Date
  images?: string[]          // data URLs shown as thumbnails
  contacts?: ContactData[]   // extracted business card data
}

// ─── Agent colour map ────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  Orchestrator:    'from-indigo-500 to-purple-600',
  SalesPro:        'from-amber-500 to-orange-500',
  DataMiner:       'from-cyan-500 to-blue-500',
  FairHunter:      'from-violet-500 to-purple-500',
  EvintraGuide:    'from-sky-500 to-blue-500',
  AdminAssistant:  'from-emerald-500 to-green-500',
  FastResponder:   'from-rose-500 to-pink-500',
  VisionAnalyst:   'from-fuchsia-500 to-pink-500',
  BusinessCardAgent: 'from-teal-500 to-emerald-500',
}

const MAX_IMAGES   = 5
const MAX_BYTES    = 6 * 1024 * 1024   // 6 MB per image

// ─── Sub-components ──────────────────────────────────────────────────────────

function ContactCard({ contact }: { contact: ContactData }) {
  const initials = (contact.name || '?')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 glass rounded-xl p-3.5 border border-teal-500/20 space-y-2"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{contact.name || 'Sin nombre'}</p>
          {contact.role && <p className="text-[11px] text-zinc-400 truncate">{contact.role}</p>}
        </div>
        {contact.confidence !== undefined && contact.confidence > 0 && (
          <span className={cn(
            'text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0',
            contact.confidence >= 0.7
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          )}>
            {Math.round(contact.confidence * 100)}%
          </span>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-1">
        {contact.company && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Building2 size={11} className="shrink-0 text-zinc-500" />
            <span className="truncate">{contact.company}</span>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-2 text-xs text-indigo-400">
            <Mail size={11} className="shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Phone size={11} className="shrink-0" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.website && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Globe size={11} className="shrink-0" />
            <span className="truncate">{contact.website}</span>
          </div>
        )}
      </div>

      {/* Saved badge */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
        <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
          Guardado como lead
        </span>
      </div>
    </motion.div>
  )
}

function ImageThumbnail({
  src,
  onRemove,
}: {
  src: string
  onRemove: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="relative shrink-0"
    >
      <img
        src={src}
        alt="preview"
        className="w-16 h-16 rounded-xl object-cover border border-white/10"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
      >
        <X size={10} />
      </button>
    </motion.div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! 👋 Soy el orquestador de Evintra. Puedo ayudarte con ventas, leads y más.\n\nTambién puedo **leer tarjetas de presentación** — toca el clip y sube una foto.',
      agent: 'Orchestrator',
      timestamp: new Date(),
    },
  ])
  const [input, setInput]               = useState('')
  const [pendingImages, setPendingImages] = useState<string[]>([])   // data URLs
  const [isListening, setIsListening]   = useState(false)
  const [isThinking, setIsThinking]     = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // ── File handling ────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remaining = MAX_IMAGES - pendingImages.length
    const toProcess = files.slice(0, remaining)

    toProcess.forEach(file => {
      if (file.size > MAX_BYTES) return   // skip oversized
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        if (dataUrl) {
          setPendingImages(prev =>
            prev.length < MAX_IMAGES ? [...prev, dataUrl] : prev
          )
        }
      }
      reader.readAsDataURL(file)
    })

    // Reset input so same file can be re-selected
    e.target.value = ''
  }, [pendingImages.length])

  const removeImage = (idx: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Send message ─────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text   = input.trim()
    const imgs   = [...pendingImages]

    if (!text && !imgs.length) return
    if (isThinking) return

    const userMsg: Message = {
      id:        Date.now().toString(),
      role:      'user',
      content:   text || (imgs.length === 1 ? 'Analiza esta imagen' : `Analiza estas ${imgs.length} imágenes`),
      timestamp: new Date(),
      images:    imgs.length ? imgs : undefined,
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setPendingImages([])
    setIsThinking(true)
    inputRef.current?.focus()

    try {
      const response = await sendChatMessage(text || 'Extrae la información de estas tarjetas', imgs.length ? imgs : undefined)

      const botMsg: Message = {
        id:        (Date.now() + 1).toString(),
        role:      'assistant',
        content:   response.response,
        agent:     response.agent_space === 'business_card' ? 'BusinessCardAgent' : (response.agent || 'Orchestrator'),
        timestamp: new Date(),
        contacts:  response.contacts?.length ? response.contacts : undefined,
      }
      setMessages(prev => [...prev, botMsg])
    } catch {
      setMessages(prev => [...prev, {
        id:        (Date.now() + 1).toString(),
        role:      'assistant',
        content:   'Error al conectar con el servidor. Verifica la URL en Ajustes.',
        agent:     'Orchestrator',
        timestamp: new Date(),
      }])
    } finally {
      setIsThinking(false)
    }
  }

  const toggleVoice = () => setIsListening(v => !v)

  const canSend = (input.trim().length > 0 || pendingImages.length > 0) && !isThinking

  return (
    <div className="flex flex-col h-[100dvh]">

      {/* ── Header ─────────────────────────────────────────────────────── */}
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
              {isThinking
                ? <span className="text-indigo-400">Procesando...</span>
                : '7 agentes · En línea · Sube imágenes con el clip'
              }
            </p>
          </div>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const gradient = msg.agent
              ? (AGENT_COLORS[msg.agent] || 'from-indigo-500 to-purple-600')
              : 'from-indigo-500 to-purple-600'

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                  'flex gap-3 max-w-[88%]',
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-400'
                    : `bg-gradient-to-br ${gradient}`
                )}>
                  {msg.role === 'user'
                    ? <User size={14} className="text-white" />
                    : msg.agent === 'BusinessCardAgent'
                      ? <CreditCard size={14} className="text-white" />
                      : <Bot size={14} className="text-white" />
                  }
                </div>

                {/* Bubble */}
                <div className={cn(
                  'rounded-2xl px-4 py-3 relative max-w-full',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-md shadow-lg shadow-indigo-500/20'
                    : 'glass rounded-tl-md'
                )}>

                  {/* Agent label */}
                  {msg.agent && msg.role === 'assistant' && (
                    <span className={cn(
                      'text-[10px] uppercase tracking-widest font-bold block mb-1.5 bg-gradient-to-r bg-clip-text text-transparent',
                      gradient
                    )}>
                      {msg.agent}
                    </span>
                  )}

                  {/* Image thumbnails (user message) */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-2.5">
                      {msg.images.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`imagen ${i + 1}`}
                          className="w-20 h-20 rounded-xl object-cover border border-white/20 shadow"
                        />
                      ))}
                    </div>
                  )}

                  {/* Text content */}
                  {msg.content && (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content.split('**').map((part, i) =>
                        i % 2 === 1
                          ? <strong key={i} className="font-semibold">{part}</strong>
                          : part
                      )}
                    </div>
                  )}

                  {/* Contact cards */}
                  {msg.contacts && msg.contacts.length > 0 && (
                    <div className="space-y-2 mt-1">
                      {msg.contacts.map((c, i) => (
                        <ContactCard key={i} contact={c} />
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
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
                  animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15, ease: 'easeInOut' }}
                  className="w-2 h-2 rounded-full bg-indigo-400"
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ─────────────────────────────────────────────────── */}
      <div className="p-4 pb-24 relative z-20 space-y-2">

        {/* Image preview strip */}
        <AnimatePresence>
          {pendingImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-2xl px-3 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide"
            >
              <Image size={14} className="text-zinc-500 shrink-0" />
              <div className="flex gap-2">
                <AnimatePresence>
                  {pendingImages.map((src, i) => (
                    <ImageThumbnail key={src.slice(-20)} src={src} onRemove={() => removeImage(i)} />
                  ))}
                </AnimatePresence>
              </div>
              {pendingImages.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  <span className="text-lg leading-none">+</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text input row */}
        <div className="glass-strong rounded-2xl flex items-center gap-2 px-3 py-2">

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Paperclip */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              pendingImages.length > 0
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-zinc-500 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            <Paperclip size={19} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={pendingImages.length ? 'Añade un mensaje (opcional)...' : 'Escribe un mensaje...'}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-zinc-600"
          />

          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              isListening ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            {isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>

          <motion.button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              canSend
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
