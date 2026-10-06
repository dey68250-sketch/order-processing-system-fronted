import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Normalizes Spring's error payloads (validation errors, RuntimeException
// messages, etc.) into a single readable string for the UI layer.
export function extractErrorMessage(error) {
  const data = error?.response?.data

  if (!data) return error?.message || 'Something went wrong. Is the backend running?'

  if (typeof data === 'string') return data
  if (data.message) return data.message
  if (data.error) return data.error

  // Bean validation errors typically arrive as { fieldErrors: [...] } or
  // a map of field -> message depending on the exception handler in use.
  if (Array.isArray(data.errors)) {
    return data.errors.map((e) => e.defaultMessage || e.message || JSON.stringify(e)).join(', ')
  }
  if (typeof data === 'object') {
    const values = Object.values(data).filter((v) => typeof v === 'string')
    if (values.length) return values.join(', ')
  }

  return 'Something went wrong. Is the backend running?'
}
