import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lotmart_user') || localStorage.getItem('trader_user')
      if (saved && !localStorage.getItem('lotmart_user')) {
        localStorage.setItem('lotmart_user', saved)
        localStorage.removeItem('trader_user')
      }
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed')
      }
      setUser(data.user)
      localStorage.setItem('lotmart_user', JSON.stringify(data.user))
      setIsSignInModalOpen(false)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('lotmart_user')
  }

  const openSignInModal = () => setIsSignInModalOpen(true)
  const closeSignInModal = () => setIsSignInModalOpen(false)

  return (
    <UserContext.Provider value={{
      user,
      login,
      logout,
      isSignInModalOpen,
      openSignInModal,
      closeSignInModal
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
