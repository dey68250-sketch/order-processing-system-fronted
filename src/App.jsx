import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import PaymentsPage from './pages/PaymentsPage'

export default function App() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </main>
    </div>
  )
}
