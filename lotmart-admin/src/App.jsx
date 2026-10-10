import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Lots from './pages/Lots'
import Traders from './pages/Traders'
import Pricing from './pages/Pricing'
import Timers from './pages/Timers'
import Team from './pages/Team'
import Activity from './pages/Activity'
import './styles.css'
import './styles2.css'

function Guard({ children }) {
  const { isAuthed } = useAuth()
  if (!isAuthed) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Guard><Dashboard /></Guard>} />
          <Route path="/orders" element={<Guard><Orders /></Guard>} />
          <Route path="/lots" element={<Guard><Lots /></Guard>} />
          <Route path="/traders" element={<Guard><Traders /></Guard>} />
          <Route path="/pricing" element={<Guard><Pricing /></Guard>} />
          <Route path="/timers" element={<Guard><Timers /></Guard>} />
          <Route path="/team" element={<Guard><Team /></Guard>} />
          <Route path="/activity" element={<Guard><Activity /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
