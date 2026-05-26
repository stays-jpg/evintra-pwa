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
  // Bypass ngrok's browser-warning interstitial on free-tier tunnels
  headers.set('ngrok-skip-browser-warning', 'true')

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
      signal: AbortSignal.timeout(5000),
      headers: { 'ngrok-skip-browser-warning': 'true' },
    })
    return res.ok
  } catch {
    return false
  }
}
