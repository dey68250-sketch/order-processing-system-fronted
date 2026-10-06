import { apiClient } from './client'

// Maps 1:1 to PaymentController. The backend's FakePaymentGateway fails
// ~30% of the time by design, and the circuit breaker's fallback still
// returns 201 with status CANCELLED rather than an HTTP error - the UI
// treats that as a normal (if unhappy) response, not a request failure.
export const paymentsApi = {
  pay: (orderId) => apiClient.post('/api/payments', { orderId }).then((r) => r.data),
}
