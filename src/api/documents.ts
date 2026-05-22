import { apiClient } from './client'

/**
 * Upload a document to the backend
 */
export async function uploadDocument(file: File): Promise<{ id: string; filename: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await apiClient('/api/v1/documents/upload', {
    method: 'POST',
    headers: {},
    body: formData,
  })
  if (!res.ok) throw new Error('Failed to upload document')
  return res.json()
}
