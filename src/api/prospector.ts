import { apiClient } from './client'

export interface ProspectRequest {
  first_name: string
  last_name: string
  company: string
  country?: string
  domain_hint?: string
}

export interface EmailCandidate {
  email: string
  confidence: number
  source: 'scraped' | 'pattern' | 'verified'
  pattern_type?: string | null
}

export interface ProspectResult {
  first_name: string
  last_name: string
  company: string
  country: string
  domain: string | null
  linkedin_url: string | null
  best_email: string | null
  best_confidence: number
  mx_verified: boolean
  candidates: EmailCandidate[]
}

export interface BulkResultItem {
  name: string
  company: string
  best_email: string | null
  best_confidence: number
  linkedin_url: string | null
  domain: string | null
  error?: string
}

export async function searchContact(req: ProspectRequest): Promise<ProspectResult> {
  const res = await apiClient('/api/v1/prospector/search', {
    method: 'POST',
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error('Error al buscar contacto')
  return res.json()
}

export async function bulkSearch(contacts: ProspectRequest[]): Promise<BulkResultItem[]> {
  const res = await apiClient('/api/v1/prospector/bulk', {
    method: 'POST',
    body: JSON.stringify({ contacts }),
  })
  if (!res.ok) throw new Error('Error en búsqueda masiva')
  return res.json()
}

export async function saveProspectAsLead(result: ProspectResult): Promise<{ id: string; message: string }> {
  const res = await apiClient('/api/v1/prospector/save-lead', {
    method: 'POST',
    body: JSON.stringify(result),
  })
  if (!res.ok) throw new Error('Error al guardar lead')
  return res.json()
}
