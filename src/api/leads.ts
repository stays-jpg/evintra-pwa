import { apiClient } from './client'

export interface Lead {
  id: string
  name: string
  email: string
  company: string
  phone?: string
  score: number
  stage: 'new' | 'contacted' | 'demo' | 'negotiation' | 'won' | 'lost'
  source?: string
  linkedin?: string
  created_at: string
  updated_at?: string
  notes?: string
}

export async function fetchLeads(): Promise<Lead[]> {
  const res = await apiClient('/api/v1/dashboard/leads')
  if (!res.ok) throw new Error('Failed to fetch leads')
  const data = await res.json()
  // backend returns { leads: [...], total: N }
  return Array.isArray(data) ? data : (data.leads ?? [])
}

export async function fetchHotLeads(): Promise<Lead[]> {
  const leads = await fetchLeads()
  return leads.filter(l => l.score >= 80)
}
