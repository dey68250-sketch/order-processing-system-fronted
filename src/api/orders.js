import { apiClient } from './client'

// OrderController requires an Idempotency-Key header on every create call,
// so a retried submit (e.g. a double click) resolves to the same order
// instead of deducting stock twice.
export const ordersApi = {
  create: (payload, idempotencyKey) =>
    apiClient
      .post('/api/orders', payload, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      .then((r) => r.data),
}

export function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // Fallback for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
