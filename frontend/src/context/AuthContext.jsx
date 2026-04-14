import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const TOKEN_KEY = 'argus_session'

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [provider, setProvider]   = useState(null)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    // Check if there's already a token in localStorage FIRST
    // before checking auth status - prevents the login loop
    const existingToken = localStorage.getItem(TOKEN_KEY)
    
    try {
      const statusRes = await fetch('/api/auth/status')
      const status = await statusRes.json()
      setAuthRequired(status.configured)
      setProvider(status.provider)

      if (!status.configured) {
        // Dev mode
        setUser({ name: 'Dev User', email: 'dev@localhost', dev: true })
        setLoading(false)
        return
      }

      if (existingToken) {
        await validateToken(existingToken)
      } else {
        setLoading(false)
      }
    } catch (e) {
      setLoading(false)
    }
  }

  async function validateToken(token) {
    try {
      const r = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (r.ok) {
        const data = await r.json()
        setUser({ ...data, token })
      } else {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  function login() {
    window.location.href = '/api/auth/login'
  }

  async function logout() {
    const token = localStorage.getItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    try {
      const r = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await r.json()
      if (data.logout_url) {
        window.location.href = data.logout_url
        return
      }
    } catch {}
    window.location.href = '/'
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
    validateToken(token)
  }

  return (
    <AuthContext.Provider value={{
      user, loading, authRequired, provider,
      login, logout, setToken,
      token: localStorage.getItem(TOKEN_KEY),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
