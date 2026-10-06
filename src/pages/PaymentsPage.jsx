import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { paymentsApi } from '../api/payments'
import { extractErrorMessage } from '../api/client'
import { useToast } from '../context/ToastContext'
import StatusPill from '../components/StatusPill'
import EmptyState from '../components/EmptyState'

function currency(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return value
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function syncOrderStatus(orderId, status) {
  try {
    const orders = JSON.parse(sessionStorage.getItem('ops.orders') || '[]')
    const next = orders.map((o) => (o.orderId === orderId ? { ...o, status } : o))
    sessionStorage.setItem('ops.orders', JSON.stringify(next))
  } catch {
    // sessionStorage unavailable or empty - nothing to sync
  }
}

export default function PaymentsPage() {
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '')
  const [submitting, setSubmitting] = useState(false)
  const [payments, setPayments] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ops.payments') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    const q = searchParams.get('orderId')
    if (q) setOrderId(q)
  }, [searchParams])

  useEffect(() => {
    sessionStorage.setItem('ops.payments', JSON.stringify(payments))
  }, [payments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const id = Number(orderId)
    if (!Number.isInteger(id) || id < 1) {
      toast.error('Enter a valid order ID.')
      return
    }

    setSubmitting(true)
    try {
      const payment = await paymentsApi.pay(id)
      setPayments((prev) => [payment, ...prev])
      syncOrderStatus(payment.orderId, payment.status === 'CONFIRMED' ? 'COMPLETED' : 'CANCELLED')

      if (payment.status === 'CONFIRMED') {
        toast.success(`Payment confirmed for order #${payment.orderId}.`)
      } else {
        toast.error(`Gateway declined order #${payment.orderId}. The order was cancelled.`)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>Payments</h1>
          <p className="page__lede">
            The backend's payment gateway is simulated and fails on roughly 3 of every 10 charges &mdash; a circuit
            breaker trips after repeated failures and cancels the order instead of erroring out.
          </p>
        </div>
      </header>

      <div className="layout-split">
        <section className="panel">
          <div className="panel__header">
            <h2>Settle an order</h2>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Order ID</span>
              <input
                type="number"
                min="1"
                step="1"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. 1"
              />
            </label>
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Charging&hellip;' : 'Charge payment'}
            </button>
          </form>
        </section>

        <section className="panel panel--wide">
          <div className="panel__header">
            <h2>This session's payments</h2>
            <span className="muted">{payments.length} attempted</span>
          </div>

          {payments.length === 0 ? (
            <EmptyState
              title="No payments yet"
              body="Charge an order above to see the gateway's response here."
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Settled</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.paymentId ?? `declined-${p.orderId}-${i}`}>
                    <td className="mono muted">{p.paymentId ? `#${p.paymentId}` : '&mdash;'}</td>
                    <td className="mono">#{p.orderId}</td>
                    <td className="mono">{currency(p.amount)}</td>
                    <td>
                      <StatusPill status={p.status} />
                    </td>
                    <td className="muted">{p.paidAt ? new Date(p.paidAt).toLocaleString() : '&mdash;'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
