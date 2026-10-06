import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '../api/products'
import { ordersApi, newIdempotencyKey } from '../api/orders'
import { extractErrorMessage } from '../api/client'
import { useToast } from '../context/ToastContext'
import StatusPill from '../components/StatusPill'
import EmptyState from '../components/EmptyState'

function currency(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return value
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

export default function OrdersPage() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [submitting, setSubmitting] = useState(false)
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ops.orders') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    productsApi
      .list()
      .then((data) => {
        setProducts(data || [])
        if (data?.length && !productId) setProductId(String(data[0].id))
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    sessionStorage.setItem('ops.orders', JSON.stringify(orders))
  }, [orders])

  const selectedProduct = products.find((p) => String(p.id) === String(productId))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!productId) {
      toast.error('Choose a product first.')
      return
    }
    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error('Quantity must be a whole number of at least 1.')
      return
    }
    if (selectedProduct && qty > selectedProduct.stock) {
      toast.error(`Only ${selectedProduct.stock} in stock.`)
      return
    }

    setSubmitting(true)
    try {
      const order = await ordersApi.create({ productId: Number(productId), quantity: qty }, newIdempotencyKey())
      setOrders((prev) => [order, ...prev])
      toast.success(`Order #${order.orderId} placed for ${order.productName}.`)
      // Refresh product stock locally without a re-fetch round trip.
      setProducts((prev) =>
        prev.map((p) => (p.id === order.productId ? { ...p, stock: p.stock - order.quantity } : p))
      )
      setQuantity('1')
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
          <h1>Orders</h1>
          <p className="page__lede">
            Each submission carries a fresh idempotency key, so a retried request never double-books stock.
          </p>
        </div>
      </header>

      <div className="layout-split">
        <section className="panel">
          <div className="panel__header">
            <h2>Place an order</h2>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Product</span>
              <select value={productId} onChange={(e) => setProductId(e.target.value)}>
                {products.length === 0 && <option value="">No products available</option>}
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.name} &mdash; {currency(p.price)} ({p.stock} in stock)
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Quantity</span>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>

            {selectedProduct && Number(quantity) > 0 && (
              <div className="order-preview">
                <span>Estimated total</span>
                <strong className="mono">{currency(selectedProduct.price * Number(quantity || 0))}</strong>
              </div>
            )}

            <button className="btn btn--primary" type="submit" disabled={submitting || products.length === 0}>
              {submitting ? 'Placing order&hellip;' : 'Place order'}
            </button>
          </form>
        </section>

        <section className="panel panel--wide">
          <div className="panel__header">
            <h2>This session's orders</h2>
            <span className="muted">{orders.length} placed</span>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              body="Orders you place appear here. The API doesn't expose a full order history endpoint, so this list resets when the tab closes."
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed</th>
                  <th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.orderId}>
                    <td className="mono muted">#{o.orderId}</td>
                    <td>{o.productName}</td>
                    <td className="mono">{o.quantity}</td>
                    <td className="mono">{currency(o.totalAmount)}</td>
                    <td>
                      <StatusPill status={o.status} />
                    </td>
                    <td className="muted">{new Date(o.orderedAt).toLocaleString()}</td>
                    <td className="table__actions">
                      {o.status === 'PENDING' && (
                        <Link className="btn btn--ghost btn--small" to={`/payments?orderId=${o.orderId}`}>
                          Pay now
                        </Link>
                      )}
                    </td>
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
