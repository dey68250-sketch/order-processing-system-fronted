import { apiClient } from './client'

// Maps 1:1 to ProductController.
export const productsApi = {
  list: () => apiClient.get('/api/products').then((r) => r.data),

  get: (id) => apiClient.get(`/api/products/${id}`).then((r) => r.data),

  create: (payload) => apiClient.post('/api/products', payload).then((r) => r.data),

  update: (id, payload) => apiClient.put(`/api/products/${id}`, payload).then((r) => r.data),

  remove: (id) => apiClient.delete(`/api/products/${id}`).then((r) => r.data),
}
