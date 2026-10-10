import { createContext, useContext, useState } from 'react'
import api from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem('admin_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const login = async (username, password) => {
    try {
      const res = await api.post('/admin/login', { username, password })
      if (!res.data?.success) return { ok: false, message: 'Invalid credentials' }
      sessionStorage.setItem('admin_token', res.data.token)
      sessionStorage.setItem('admin_user', JSON.stringify(res.data.admin))
      setUser(res.data.admin)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || 'Login failed' }
    }
  }

  const logout = async () => {
    try {
      await api.post('/admin/logout')
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_user')
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, isAuthed: !!user, login, logout }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
