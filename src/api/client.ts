import { useServer } from '../store/server'
import { useAuth } from '../store/auth'

/**
 * Custom fetch wrapper that automatically injects the current server URL
 * and Authorization token into every request.
 */
export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const { url: serverUrl } = useServer.getState()
  const { token, logout } = useAuth.getState()

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${serverUrl}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Auto logout on unauthorized
    logout()
  }

  return response
}

/**
 * Health check to verify connection to the Mac M4 backend
 */
export async function pingServer(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { 
      signal: AbortSignal.timeout(3000),
      // Prevent CORS preflight issues for simple ping if necessary, but /health usually allows GET
    })
    return res.ok
  } catch {
    return false
  }
}
