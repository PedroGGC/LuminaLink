import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export function LoginModal({ onClose, onRegister }: { onClose: () => void; onRegister: () => void }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(identifier, password); onClose() }
    catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in-up_200ms_ease-out]">
      <div className="bg-bg-surface dark:bg-d-bg-surface rounded-[12px] w-full max-w-md p-8 border-[1.5px] border-text-main dark:border-d-border-subtle shadow-[8px_8px_0px_#111111] dark:shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-2xl font-editorial font-bold text-text-main dark:text-d-text-main">Welcome back</h3>
          <button onClick={onClose} className="text-text-muted dark:text-d-text-muted hover:text-text-main dark:hover:text-d-text-main transition-colors">
            <span className="material-symbols-outlined" style={{fontSize:20}}>close</span>
          </button>
        </div>
        <p className="text-text-muted dark:text-d-text-muted text-sm mb-8">Access your shortened links</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-text-main dark:text-d-text-main text-sm font-medium mb-1.5">Email or Username</label>
            <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="you@example.com or user" required
              className="w-full bg-bg-base dark:bg-d-bg-base border border-border-subtle dark:border-d-border-subtle rounded-[6px] py-2 px-3 text-text-main dark:text-d-text-main text-sm focus:outline-none focus:border-text-main dark:focus:border-d-text-main transition-colors placeholder:text-text-muted dark:placeholder:text-d-text-muted" />
          </div>
          <div>
            <label className="block text-text-main dark:text-d-text-main text-sm font-medium mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              className="w-full bg-bg-base dark:bg-d-bg-base border border-border-subtle dark:border-d-border-subtle rounded-[6px] py-2 px-3 text-text-main dark:text-d-text-main text-sm focus:outline-none focus:border-text-main dark:focus:border-d-text-main transition-colors placeholder:text-text-muted dark:placeholder:text-d-text-muted" />
          </div>
          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center py-2.5 bg-text-main dark:bg-d-text-main text-bg-base dark:text-d-bg-base disabled:opacity-50 rounded-[6px] text-sm font-medium transition-transform hover:scale-[0.99] active:scale-[0.98]">
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </form>
        <p className="text-center text-text-muted dark:text-d-text-muted mt-6 text-sm">
          Don't have an account?{' '}
          <button onClick={onRegister} className="text-text-main dark:text-d-text-main font-medium underline underline-offset-4 decoration-border-subtle hover:decoration-text-main">
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}

export function RegisterModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await register(email, name, password); onClose() }
    catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in-up_200ms_ease-out]">
      <div className="bg-bg-surface dark:bg-d-bg-surface rounded-[12px] w-full max-w-md p-8 border-[1.5px] border-text-main dark:border-d-border-subtle shadow-[8px_8px_0px_#111111] dark:shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-2xl font-editorial font-bold text-text-main dark:text-d-text-main">Create an account</h3>
          <button onClick={onClose} className="text-text-muted dark:text-d-text-muted hover:text-text-main dark:hover:text-d-text-main transition-colors">
            <span className="material-symbols-outlined" style={{fontSize:20}}>close</span>
          </button>
        </div>
        <p className="text-text-muted dark:text-d-text-muted text-sm mb-8">Start tracking your links today</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-text-main dark:text-d-text-main text-sm font-medium mb-1.5">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
              className="w-full bg-bg-base dark:bg-d-bg-base border border-border-subtle dark:border-d-border-subtle rounded-[6px] py-2 px-3 text-text-main dark:text-d-text-main text-sm focus:outline-none focus:border-text-main dark:focus:border-d-text-main transition-colors placeholder:text-text-muted dark:placeholder:text-d-text-muted" />
          </div>
          <div>
            <label className="block text-text-main dark:text-d-text-main text-sm font-medium mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
              className="w-full bg-bg-base dark:bg-d-bg-base border border-border-subtle dark:border-d-border-subtle rounded-[6px] py-2 px-3 text-text-main dark:text-d-text-main text-sm focus:outline-none focus:border-text-main dark:focus:border-d-text-main transition-colors placeholder:text-text-muted dark:placeholder:text-d-text-muted" />
          </div>
          <div>
            <label className="block text-text-main dark:text-d-text-main text-sm font-medium mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
              className="w-full bg-bg-base dark:bg-d-bg-base border border-border-subtle dark:border-d-border-subtle rounded-[6px] py-2 px-3 text-text-main dark:text-d-text-main text-sm focus:outline-none focus:border-text-main dark:focus:border-d-text-main transition-colors placeholder:text-text-muted dark:placeholder:text-d-text-muted" />
          </div>
          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center py-2.5 bg-text-main dark:bg-d-text-main text-bg-base dark:text-d-bg-base disabled:opacity-50 rounded-[6px] text-sm font-medium transition-transform hover:scale-[0.99] active:scale-[0.98]">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
        <p className="text-center text-text-muted dark:text-d-text-muted mt-6 text-sm">
          Already have an account?{' '}
          <button onClick={onLogin} className="text-text-main dark:text-d-text-main font-medium underline underline-offset-4 decoration-border-subtle hover:decoration-text-main">
            Log In
          </button>
        </p>
      </div>
    </div>
  )
}
