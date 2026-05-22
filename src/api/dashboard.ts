import { apiClient } from './client'

export interface DashboardStats {
  total_leads: number
  hot_leads: number
  conversion_rate: number
  revenue_pipeline: number
  demos_scheduled: number
  tasks_pending: number
}

export interface RecentActivity {
  id: string
  type: 'lead_contacted' | 'task_created' | 'lead_enriched' | 'demo_scheduled' | 'agent_action'
  title: string
  description: string
  agent: string
  timestamp: string
}

/**
 * Fetch dashboard statistics
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient('/api/v1/dashboard/stats')
  if (!res.ok) throw new Error('Failed to fetch dashboard stats')
  return res.json()
}

/**
 * Fetch recent activity feed
 */
export async function fetchRecentActivity(): Promise<RecentActivity[]> {
  const res = await apiClient('/api/v1/dashboard/recent-activity')
  if (!res.ok) throw new Error('Failed to fetch recent activity')
  return res.json()
}
