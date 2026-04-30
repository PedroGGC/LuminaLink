import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

interface LinkItem {
  id: string
  shortCode: string
  shortUrl: string
  originalUrl: string
  clickCount: number
  hasPassword: boolean
  expiresAt: number | null
  createdAt: number
}

function timeLeft(expiresAt: number | null): string {
  if (expiresAt == null) return '∞ No expiration'
  const diff = expiresAt - Date.now()
  if (diff <= 0) return 'Expired'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function timeLeftColor(expiresAt: number | null): string {
  if (expiresAt == null) return 'text-text-muted dark:text-d-text-muted'
  const diff = expiresAt - Date.now()
  if (diff <= 0) return 'text-red-500'
  if (diff < 3600000) return 'text-red-500'
  if (diff < 86400000) return 'text-yellow-600 dark:text-yellow-500'
  return 'text-text-muted dark:text-d-text-muted'
}

interface Props {
  onCreateClick: () => void
  onStatsChange?: () => void
}

export function LinksPage({ onCreateClick, onStatsChange }: Props) {
  const { token } = useAuth()
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = () => {
    if (!token) return
    setLoading(true)
    fetch('/api/links', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setLinks(Array.isArray(d) ? d : []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [token])

  const handleDelete = async (shortCode: string) => {
    setDeletingId(shortCode)
    try {
      await fetch(`/api/links/${shortCode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setLinks(prev => prev.filter(l => l.shortCode !== shortCode))
      onStatsChange?.()
      setDeleteModal(null)
    } finally {
      setDeletingId(null)
    }
  }

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const filtered = links.filter(l =>
    l.shortCode.toLowerCase().includes(search.toLowerCase()) ||
    l.originalUrl.toLowerCase().includes(search.toLowerCase())
  )

  const baseUrl = window.location.origin

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-editorial font-bold text-text-main dark:text-d-text-main tracking-tight mb-1">My Links</h2>
          <p className="text-text-muted dark:text-d-text-muted text-sm">{links.length} link{links.length !== 1 ? 's' : ''} registered</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-d-text-muted text-sm" style={{lineHeight:1}}>search</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-bg-surface dark:bg-d-bg-surface text-sm text-text-main dark:text-d-text-main placeholder:text-text-muted dark:placeholder:text-d-text-muted border border-[#A3A3A3] dark:border-[#2E2E2E] rounded-[6px] py-2.5 pl-9 pr-4 focus:border-text-main dark:focus:border-d-text-main outline-none transition-colors"
          placeholder="Search by original URL or short code..." />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-text-muted dark:text-d-text-muted animate-spin" style={{fontSize:24}}>progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-text-muted dark:text-d-text-muted text-sm">{search ? 'No results found.' : "You haven't created any links yet."}</p>
          {!search && (
            <button onClick={onCreateClick} className="text-text-main dark:text-d-text-main text-sm font-medium underline underline-offset-4 decoration-border-subtle hover:decoration-text-main transition-colors">
              Create your first link
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => {
            const shortUrl = l.shortUrl || `${window.location.origin}/${l.shortCode}`
            const isExpired = l.expiresAt ? l.expiresAt < Date.now() : false
            return (
              <div key={l.id} className={`bg-bg-surface dark:bg-d-bg-surface rounded-[8px] p-5 border-2 transition-all duration-200 ${isExpired ? 'border-red-500/20 opacity-60' : 'border-[#A3A3A3] dark:border-[#2E2E2E] hover:border-text-main dark:hover:border-d-text-main hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:hover:shadow-none'}`}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-[6px] bg-bg-muted dark:bg-d-bg-muted border border-[#A3A3A3] dark:border-[#2E2E2E] flex items-center justify-center shrink-0 mt-0.5">
                    {l.hasPassword
                      ? <span className="material-symbols-outlined text-text-main dark:text-d-text-main text-sm">lock</span>
                      : <span className="material-symbols-outlined text-text-muted dark:text-d-text-muted text-sm">link</span>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-text-main dark:text-d-text-main truncate">{l.originalUrl}</p>
                      {isExpired && <span className="text-[10px] uppercase font-bold tracking-widest bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-[4px] shrink-0">Expired</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-mono text-text-main dark:text-d-text-main bg-bg-muted dark:bg-d-bg-muted px-1.5 py-0.5 rounded-[4px]">{shortUrl}</span>
                      <button onClick={() => copy(shortUrl, l.id)}
                        className="text-text-muted dark:text-d-text-muted hover:text-text-main dark:hover:text-d-text-main transition-colors flex items-center gap-1 text-xs font-medium">
                        {copied === l.id ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Stats + actions */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-base font-bold text-text-main dark:text-d-text-main">{l.clickCount.toLocaleString()}</p>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted dark:text-d-text-muted">clicks</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className={`text-xs font-medium ${timeLeftColor(l.expiresAt)}`}>
                        {timeLeft(l.expiresAt)}
                      </p>
                      <p className="text-xs text-text-muted dark:text-d-text-muted mt-0.5">
                        {new Date(l.createdAt).toLocaleDateString('en-US')}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteModal(l.shortCode)}
                      disabled={deletingId === l.shortCode}
                      className="w-8 h-8 rounded-[4px] flex items-center justify-center text-text-muted dark:text-d-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50 border border-transparent hover:border-red-200 dark:hover:border-red-500/20">
                      <span className="material-symbols-outlined" style={{fontSize:16}}>delete</span>
                    </button>
                  </div>
                </div>

                {/* Mobile expiry row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#A3A3A3] dark:border-[#2E2E2E] sm:hidden text-xs">
                  <span className="text-text-muted dark:text-d-text-muted font-medium">{l.clickCount} clicks</span>
                  <span className={timeLeftColor(l.expiresAt)}>{timeLeft(l.expiresAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in-up_200ms_ease-out]">
          <div className="bg-bg-surface dark:bg-d-bg-surface rounded-[12px] w-full max-w-sm p-6 border-2 border-[#A3A3A3] dark:border-[#2E2E2E] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none">
            <h3 className="text-xl font-editorial font-bold text-text-main dark:text-d-text-main mb-2">Delete link?</h3>
            <p className="text-sm text-text-muted dark:text-d-text-muted mb-6 leading-relaxed">This action cannot be undone. Any traffic to this short link will be lost.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2.5 rounded-[6px] text-sm font-medium text-text-muted dark:text-d-text-muted hover:bg-bg-muted dark:hover:bg-d-bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteModal)} disabled={deletingId === deleteModal} className="px-4 py-2.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] rounded-[6px] text-sm font-medium hover:bg-[#333333] dark:hover:bg-[#EAEAEA] transition-colors disabled:opacity-50">
                {deletingId === deleteModal ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
