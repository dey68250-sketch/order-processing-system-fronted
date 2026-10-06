import { useEffect, useMemo, useState } from 'react'
import { productsApi } from '../api/products'
import { extractErrorMessage } from '../api/client'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/EmptyState'

const BLANK_FORM = { name: '', price: '', stock: '' }

function currency(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return value
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

export default function ProductsPage() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null) // null = creating new
  const [form, setForm] = useState(BLANK_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [query, setQuery] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await productsApi.list()
      setProducts(data || [])
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return products
    const q = query.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, query])

  const startEdit = (product) => {
    setEditingId(product.id)
    setForm({ name: product.name, price: String(product.price), stock: String(product.stock) })
  }

  const startCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Give the product a name.')
      return
    }
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!(price > 0)) {
      toast.error('Price must be greater than zero.')
      return
    }
    if (!(stock >= 0) || !Number.isInteger(stock)) {
      toast.error('Stock must be a whole number, zero or more.')
      return
    }

    const payload = { name: form.name.trim(), price, stock }
    setSubmitting(true)
    try {
      if (editingId) {
        const updated = await productsApi.update(editingId, payload)
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
        toast.success(`Updated "${updated.name}".`)
      } else {
        const created = await productsApi.create(payload)
        setProducts((prev) => [created, ...prev])
        toast.success(`Added "${created.name}" to inventory.`)
      }
      startCreate()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Remove "${product.name}" from inventory? This can't be undone.`)) return
    try {
      await productsApi.remove(product.id)
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      toast.success(`Removed "${product.name}".`)
      if (editingId === product.id) startCreate()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>Inventory</h1>
          <p className="page__lede">Products available to sell. Stock decrements automatically as orders are placed.</p>
        </div>
        <input
          className="search"
          placeholder="Search by name&hellip;"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <div className="layout-split">
        <section className="panel">
          <div className="panel__header">
            <h2>{editingId ? 'Edit product' : 'New product'}</h2>
            {editingId && (
              <button type="button" className="btn btn--ghost btn--small" onClick={startCreate}>
                Cancel edit
              </button>
            )}
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mechanical Keyboard"
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Price (USD)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </label>
              <label className="field">
                <span>Stock</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                />
              </label>
            </div>
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving&hellip;' : editingId ? 'Save changes' : 'Add product'}
            </button>
          </form>
        </section>

        <section className="panel panel--wide">
          <div className="panel__header">
            <h2>Catalog</h2>
            <span className="muted">{filtered.length} of {products.length}</span>
          </div>

          {loading ? (
            <div className="loading-rows">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-row" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={products.length === 0 ? 'No products yet' : 'No matches'}
              body={products.length === 0 ? 'Add your first product using the form.' : 'Try a different search term.'}
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="mono muted">#{p.id}</td>
                    <td>{p.name}</td>
                    <td className="mono">{currency(p.price)}</td>
                    <td className="mono">
                      <span className={p.stock === 0 ? 'stock-tag stock-tag--out' : p.stock < 5 ? 'stock-tag stock-tag--low' : 'stock-tag'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="table__actions">
                      <button className="btn btn--ghost btn--small" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button className="btn btn--danger btn--small" onClick={() => handleDelete(p)}>
                        Delete
                      </button>
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
