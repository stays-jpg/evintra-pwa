import { apiClient } from './client'

export interface AgentStatus {
  id: string
  name: string
  status: 'active' | 'standby' | 'offline' | 'error'
  description: string
  lastActive?: string
}

export interface ContactData {
  name?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
  role?: string | null
  website?: string | null
  linkedin_url?: string | null
  address?: string | null
  notes?: string | null
  confidence?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  agent?: string
  timestamp: string
  images?: string[]
}

export interface ChatResponse {
  response: string
  agent_space: string
  intent: string
  thread_id: string
  contacts?: ContactData[]
  agent?: string
  timestamp: string
  error?: string
}

/**
 * Fetch all agent statuses
 */
export async function fetchAgents(): Promise<AgentStatus[]> {
  const res = await apiClient('/api/v1/agents')
  if (!res.ok) throw new Error('Failed to fetch agents')
  return res.json()
}

/**
 * Send a chat message, optionally with base64 images
 */
export async function sendChatMessage(
  message: string,
  images?: string[],   // data URLs (data:image/...;base64,xxxx) or raw base64
): Promise<ChatResponse> {
  const body: Record<string, unknown> = { message }

  if (images?.length) {
    // Strip "data:...;base64," prefix — backend expects raw base64
    body.images = images.map(img => (img.includes(',') ? img.split(',')[1] : img))
  }

  const res = await apiClient('/api/v1/orchestrator/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

/**
 * Analyze an image with VisionAnalyst
 */
export async function analyzeImage(file: File): Promise<Record<string, string>> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await apiClient('/api/v1/agents/analyze-image', {
    method: 'POST',
    headers: {},
    body: formData,
  })
  if (!res.ok) throw new Error('Failed to analyze image')
  return res.json()
}

/**
 * Run a specific agent
 */
export async function runAgent(agentId: string, input: string): Promise<{ result: string }> {
  const res = await apiClient(`/api/v1/agents/${agentId}/run`, {
    method: 'POST',
    body: JSON.stringify({ input }),
  })
  if (!res.ok) throw new Error(`Failed to run agent ${agentId}`)
  return res.json()
}

/**
 * HITL approve/reject
 */
export async function hitlAction(action: 'enable' | 'disable'): Promise<void> {
  await apiClient(`/api/v1/orchestrator/hitl/${action}`, { method: 'POST' })
}
