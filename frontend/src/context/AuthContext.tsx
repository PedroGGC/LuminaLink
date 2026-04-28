import { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  plan: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (identifier: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('token')
    if (saved) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${saved}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => { setToken(saved); setUser(d.user) })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (identifier: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Falha no login')
    setUser(data.user); setToken(data.token)
    localStorage.setItem('token', data.token)
  }

  const register = async (email: string, name: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Falha no cadastro')
    setUser(data.user); setToken(data.token)
    localStorage.setItem('token', data.token)
  }

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    setUser(null); setToken(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
