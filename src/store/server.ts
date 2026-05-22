import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ServerStore {
  url: string
  setUrl: (url: string) => void
}

export const useServer = create<ServerStore>()(
  persist(
    (set) => ({
      url: import.meta.env.VITE_API_URL || 'http://192.168.1.100:8000',
      setUrl: (url) => set({ url }),
    }),
    { name: 'evintra-server' }
  )
)
