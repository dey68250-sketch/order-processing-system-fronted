import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/products', label: 'Inventory', hint: 'Products' },
  { to: '/orders', label: 'Orders', hint: 'Place & track' },
  { to: '/payments', label: 'Payments', hint: 'Settle orders' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark">OP</span>
        <div>
          <div className="sidebar__title">Ledger</div>
          <div className="sidebar__subtitle">Order Processing Console</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 'sidebar__link' + (isActive ? ' sidebar__link--active' : '')}
          >
            <span className="sidebar__link-label">{link.label}</span>
            <span className="sidebar__link-hint">{link.hint}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__footer-row">
          <span className="dot dot--live" />
          API {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}
        </div>
      </div>
    </aside>
  )
}
