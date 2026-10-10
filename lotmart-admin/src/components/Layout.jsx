import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/orders', label: 'Orders & Bids', icon: '🧾' },
  { to: '/lots', label: 'Direct Lots', icon: '📦' },
  { to: '/traders', label: 'Buyers', icon: '👥' },
  { to: '/pricing', label: 'Pricing', icon: '💰' },
  { to: '/timers', label: 'Timers', icon: '⏱️' },
  { to: '/team', label: 'Team', icon: '🛡️' },
  { to: '/activity', label: 'Activity', icon: '📜' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">LM</div>
          <div>
            <div className="brand-name">Lotmart</div>
            <div className="brand-sub">Admin Console</div>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="me">
            <div className="avatar">{(user?.username || 'A').slice(0, 1).toUpperCase()}</div>
            <div>
              <div className="me-name">{user?.username || 'Admin'}</div>
              <div className="me-role">{user?.isSuperAdmin ? 'Super admin' : 'Admin'}</div>
            </div>
          </div>
          <button className="btn ghost sm full" onClick={onLogout}>Logout</button>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  )
}
