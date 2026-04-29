import React, { useState, useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginModal, RegisterModal } from './components/AuthModals'
import { LinksPage } from './components/LinksPage'
import MinimalHome from './components/MinimalHome'
import WorldMap from './components/WorldMap'

interface Stats {
  totalLinks: number; totalClicks: number
  topLink: { shortCode: string; clicks: number } | null
  clickTraffic: { label: string; count: number }[]
  topLocations: { country: string; count: number; percent: number }[]
  deviceBreakdown: { device: string; count: number; percent: number }[]
  recentLinks: { id: string; shortCode: string; originalUrl: string; clickCount: number }[]
}

const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

function App() {
  const { user, token, logout } = useAuth()
  const isLoggedIn = !!user
  const [stats, setStats] = useState<Stats|null>(null)
  const [page, setPage] = useState<'dashboard'|'links'>('dashboard')
  const [authModal, setAuthModal] = useState<'login'|'register'|null>(null)
  const [timeFilter, setTimeFilter] = useState('week')
  const [showCreate, setShowCreate] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createdLink, setCreatedLink] = useState<string|null>(null)
  const linksPageRef = useRef<{load:()=>void}|null>(null)
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const path = window.location.pathname;
    if (import.meta.env.DEV && path !== '/' && path !== '/index.html') {
      // If someone visits a short link on the Vite dev server (port 5173), redirect to the backend
      window.location.href = `http://localhost:3002${path}`;
    }
  }, []);

  const loadStats = () => {
    if (!token) return
    fetch(`/api/dashboard/stats?range=${timeFilter}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => {})
  }

  useEffect(() => {
    if (isLoggedIn) {
      loadStats()
      statsIntervalRef.current = setInterval(loadStats, 5000)
      return () => { if (statsIntervalRef.current) clearInterval(statsIntervalRef.current) }
    }
  }, [isLoggedIn, timeFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreateError(''); setCreatedLink(null); setSubmitting(true)
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ originalUrl: newUrl, customSlug: slug || undefined, password: password || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error || 'Error'); return }
      setCreatedLink(data.shortUrl); setNewUrl(''); setSlug(''); setPassword(''); loadStats()
      if (page === 'links') linksPageRef.current?.load()
    } catch { setCreateError('Connection error') }
    finally { setSubmitting(false) }
  }

  const maxT = Math.max(...(stats?.clickTraffic?.map(t => t.count) ?? [1]), 1)
  const days = stats?.clickTraffic ?? [{label:'Mon',count:0},{label:'Tue',count:0},{label:'Wed',count:0},{label:'Thu',count:0},{label:'Fri',count:0},{label:'Sat',count:0},{label:'Sun',count:0}]
  const gapClass = days.length > 90 ? 'gap-[1px]' : (days.length > 30 ? 'gap-1' : 'gap-2')

  return (
    <>
      {!isLoggedIn ? (
        <MinimalHome onLoginClick={() => setAuthModal('login')} isDark={isDark} setIsDark={setIsDark} />
      ) : (
      <div 
        className="bg-bg-base dark:bg-d-bg-base text-text-main dark:text-d-text-main font-sans antialiased flex h-screen overflow-hidden transition-colors duration-300"
      >
        {/* Sidebar */}
        <aside className="flex flex-col fixed left-0 top-0 h-full w-64 py-8 z-40 bg-bg-surface dark:bg-d-bg-surface border-r border-border-subtle dark:border-d-border-subtle hidden md:flex transition-colors duration-300">
          <div className="px-8 mb-10 flex items-center justify-between">
            <h1 className="text-xl font-editorial font-bold tracking-tight text-text-main dark:text-d-text-main">
              LuminaLink
            </h1>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {([['dashboard','Overview','grid_view'],['links','My Links','link']] as const).map(([pg,label,icon]) => (
              <button key={pg} onClick={() => setPage(pg as 'dashboard'|'links')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[6px] text-sm transition-all duration-200 ${
                  page===pg 
                    ? 'bg-text-main dark:bg-d-text-main text-bg-base dark:text-d-bg-base font-medium' 
                    : 'text-text-muted dark:text-d-text-muted hover:bg-bg-muted dark:hover:bg-d-bg-muted hover:text-text-main dark:hover:text-d-text-main'
                }`}>
                <span className="material-symbols-outlined" style={{fontSize: 20}}>{icon}</span>{label}
              </button>
            ))}
          </nav>

          <div className="px-6 mt-auto space-y-2">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[6px] text-sm text-text-muted dark:text-d-text-muted hover:bg-bg-muted dark:hover:bg-d-bg-muted hover:text-text-main dark:hover:text-d-text-main transition-colors"
            >
              <span className="material-symbols-outlined" style={{fontSize: 20}}>
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
              Toggle Theme
            </button>
            
            <div className="flex items-center gap-3 p-3 rounded-[8px] bg-bg-muted dark:bg-d-bg-muted border border-border-subtle dark:border-d-border-subtle">
              <div className="w-8 h-8 rounded-[4px] bg-border-subtle dark:bg-d-border-subtle flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-text-muted dark:text-d-text-muted" style={{fontSize:18}}>person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main dark:text-d-text-main truncate">{user?.name}</p>
                <p className="text-xs text-text-muted dark:text-d-text-muted capitalize">Plan {user?.plan}</p>
              </div>
              <button onClick={logout} className="text-text-muted dark:text-d-text-muted hover:text-text-main dark:hover:text-d-text-main transition-colors">
                <span className="material-symbols-outlined" style={{fontSize:18}}>logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col md:ml-64 h-full relative">
          {/* Header */}
          <header className="flex justify-between items-center px-8 h-16 w-full sticky top-0 z-30 bg-bg-base/80 dark:bg-d-bg-base/80 backdrop-blur-md border-b border-border-subtle dark:border-d-border-subtle">
            <div className="hidden md:flex items-center">
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <button onClick={() => setShowCreate(true)} className="hidden md:flex bg-text-main dark:bg-d-text-main text-bg-base dark:text-d-bg-base px-4 py-1.5 rounded-[6px] text-sm font-medium hover:scale-[0.98] active:scale-[0.95] transition-transform items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> New Link
              </button>
            </div>
          </header>

          {/* Content */}
          {page === 'links' ? (
            <LinksPage onCreateClick={() => setShowCreate(true)} onStatsChange={loadStats} />
          ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">

            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
              <div>
                <h2 className="text-2xl font-editorial font-bold text-text-main dark:text-d-text-main tracking-tight mb-1">Overview</h2>
                <p className="text-text-muted dark:text-d-text-muted text-sm">Track your links performance.</p>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Links */}
              <div className="bg-bg-surface dark:bg-d-bg-surface border-[1px] border-border-subtle dark:border-d-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none rounded-[8px] p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-8 h-8 rounded-[4px] bg-bg-muted dark:bg-d-bg-muted border border-border-subtle dark:border-d-border-subtle flex items-center justify-center">
                    <span className="material-symbols-outlined text-text-main dark:text-d-text-main text-sm">link</span>
                  </div>
                </div>
                <p className="text-text-muted dark:text-d-text-muted text-xs uppercase tracking-[0.05em] mb-1 font-medium">Links Created</p>
                <h3 className="text-2xl font-editorial font-bold text-text-main dark:text-d-text-main">{stats ? fmt(stats.totalLinks) : '—'}</h3>
              </div>

              {/* Total Clicks */}
              <div className="bg-bg-surface dark:bg-d-bg-surface border-[1px] border-border-subtle dark:border-d-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none rounded-[8px] p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-8 h-8 rounded-[4px] bg-bg-muted dark:bg-d-bg-muted border border-border-subtle dark:border-d-border-subtle flex items-center justify-center">
                    <span className="material-symbols-outlined text-text-main dark:text-d-text-main text-sm">ads_click</span>
                  </div>
                </div>
                <p className="text-text-muted dark:text-d-text-muted text-xs uppercase tracking-[0.05em] mb-1 font-medium">Total Clicks</p>
                <h3 className="text-2xl font-editorial font-bold text-text-main dark:text-d-text-main">{stats ? fmt(stats.totalClicks) : '—'}</h3>
              </div>

              {/* Top Link */}
              <div className="bg-bg-surface dark:bg-d-bg-surface border-[1px] border-border-subtle dark:border-d-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none rounded-[8px] p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-8 h-8 rounded-[4px] bg-bg-muted dark:bg-d-bg-muted border border-border-subtle dark:border-d-border-subtle flex items-center justify-center">
                    <span className="material-symbols-outlined text-text-main dark:text-d-text-main text-sm">military_tech</span>
                  </div>
                </div>
                <p className="text-text-muted dark:text-d-text-muted text-xs uppercase tracking-[0.05em] mb-1 font-medium">Top Link</p>
                {stats?.topLink ? (
                  <>
                    <h3 className="text-xl font-sans font-medium text-text-main dark:text-d-text-main truncate mb-1">/{stats.topLink.shortCode}</h3>
                    <p className="text-xs text-text-muted dark:text-d-text-muted">{fmt(stats.topLink.clicks)} clicks</p>
                  </>
                ) : (
                  <h3 className="text-xl font-sans font-medium text-text-muted dark:text-d-text-muted">—</h3>
                )}
              </div>
            </div>

            {/* Chart + Recent Links */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Click Traffic */}
              <div className="lg:col-span-2 bg-bg-surface dark:bg-d-bg-surface border-[1px] border-border-subtle dark:border-d-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none rounded-[8px] p-6 relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-medium text-text-main dark:text-d-text-main">Click Traffic</h3>
                  <div className="flex items-center gap-1 bg-bg-surface dark:bg-d-bg-surface border border-border-subtle dark:border-d-border-subtle p-1 rounded-[6px]">
                    {['week','month','year'].map(f => (
                      <button key={f} onClick={() => setTimeFilter(f)}
                        className={`px-3 py-1 rounded-[4px] text-xs font-medium capitalize transition-all ${timeFilter===f ? 'bg-bg-muted dark:bg-d-bg-muted text-text-main dark:text-d-text-main' : 'text-text-muted dark:text-d-text-muted hover:text-text-main dark:hover:text-d-text-main'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`h-48 flex items-end ${gapClass} w-full pt-6`}>
                  {days.map((t: any, i: number) => {
                    const h = stats ? Math.max((t.count/maxT)*100, 5) : [30,45,85,60,40,70,55][i]
                    const isPeak = t.count === maxT && t.count > 0
                    return (
                      <div key={i} className={`flex-1 rounded-[2px] relative group transition-colors ${isPeak ? 'bg-text-main dark:bg-d-text-main' : 'bg-border-subtle dark:bg-d-border-subtle hover:bg-text-muted dark:hover:bg-d-text-muted'}`} style={{height:`${h}%`}}>
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-text-main dark:bg-d-text-main text-bg-base dark:text-d-bg-base text-[10px] px-1.5 py-0.5 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{t.count ?? ''}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-[11px] text-text-muted dark:text-d-text-muted mt-3">
                  {days.map((t: any, i: number) => (
                    t.label ? <span key={i}>{t.label}</span> : <span key={i} className="invisible">-</span>
                  ))}
                </div>
              </div>

              {/* Recent Links */}
              <div className="bg-bg-surface dark:bg-d-bg-surface border-[1px] border-border-subtle dark:border-d-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none rounded-[8px] p-6 flex flex-col relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-medium text-text-main dark:text-d-text-main">Recent Links</h3>
                  <button className="text-text-muted dark:text-d-text-muted text-xs hover:text-text-main dark:hover:text-d-text-main">See All</button>
                </div>
                <div className="flex-1 space-y-0 divide-y divide-border-subtle dark:divide-d-border-subtle overflow-y-auto">
                  {stats?.recentLinks?.length ? stats.recentLinks.map(l => (
                    <div key={l.id} className="flex items-center justify-between py-3 group cursor-pointer">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="truncate">
                          <p className="text-sm text-text-main dark:text-d-text-main truncate group-hover:underline decoration-border-subtle underline-offset-2">{l.originalUrl.replace(/https?:\/\//,'').slice(0,22)}</p>
                          <p className="text-xs text-text-muted dark:text-d-text-muted truncate">/{l.shortCode}</p>
                        </div>
                      </div>
                      <p className="text-xs font-mono text-text-main dark:text-d-text-main shrink-0 bg-bg-muted dark:bg-d-bg-muted px-1.5 py-0.5 rounded-[4px]">{fmt(l.clickCount)}</p>
                    </div>
                  )) : <p className="text-text-muted dark:text-d-text-muted text-sm pt-2">No links yet.</p>}
                </div>
              </div>
            </div>

            {/* Map Row */}
            {stats && (
              <div className="bg-bg-surface dark:bg-d-bg-surface border-[1px] border-border-subtle dark:border-d-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none rounded-[8px] p-6 relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-medium text-text-main dark:text-d-text-main">Global Clicks</h3>
                  <span className="text-xs text-text-muted dark:text-d-text-muted font-mono">
                    {stats.topLocations?.length ?? 0} {(stats.topLocations?.length ?? 0) === 1 ? 'country' : 'countries'}
                  </span>
                </div>

                {(!stats.topLocations || stats.topLocations.length === 0) ? (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <span className="material-symbols-outlined text-text-muted dark:text-d-text-muted" style={{fontSize: 40}}>public</span>
                    <p className="text-text-muted dark:text-d-text-muted text-sm">No click data yet.</p>
                    <p className="text-text-muted dark:text-d-text-muted text-xs">Share your links — clicks will appear here with country &amp; device info.</p>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Map */}
                    <div className="flex-1 min-w-0">
                      <WorldMap data={stats.topLocations} />
                    </div>

                    {/* Right panel */}
                    <div className="lg:w-64 shrink-0 flex flex-col gap-6">

                      {/* Top Countries */}
                      <div>
                        <p className="text-xs uppercase tracking-[0.05em] font-medium text-text-muted dark:text-d-text-muted mb-3">Top Countries</p>
                        <div className="space-y-2">
                          {stats.topLocations.map((loc, i) => {
                            const maxCount = Math.max(...stats.topLocations.map(d => d.count))
                            const barW = Math.max(4, Math.round((loc.count / maxCount) * 100))
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-text-muted dark:text-d-text-muted w-4 text-right shrink-0">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-text-main dark:text-d-text-main truncate">{loc.country}</span>
                                    <span className="text-xs text-text-muted dark:text-d-text-muted shrink-0 ml-2">{loc.count} · {loc.percent}%</span>
                                  </div>
                                  <div className="h-1 bg-bg-muted dark:bg-d-bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-emerald-500"
                                      style={{ width: `${barW}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Device Breakdown */}
                      {stats.deviceBreakdown && stats.deviceBreakdown.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-[0.05em] font-medium text-text-muted dark:text-d-text-muted mb-3">Devices</p>
                          <div className="space-y-2">
                            {stats.deviceBreakdown.map((d, i) => {
                              const icon = d.device === 'mobile' ? 'smartphone' : d.device === 'tablet' ? 'tablet' : 'computer'
                              return (
                                <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-muted dark:text-d-text-muted" style={{fontSize: 16}}>{icon}</span>
                                    <span className="text-xs text-text-main dark:text-d-text-main capitalize">{d.device}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-text-muted dark:text-d-text-muted">{d.count}</span>
                                    <span className="text-xs font-mono bg-bg-muted dark:bg-d-bg-muted px-1.5 py-0.5 rounded-[4px] text-text-main dark:text-d-text-main">{d.percent}%</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
          )}
        </main>
      </div>
      )}

      {/* Auth Modals */}
      {authModal==='login' && <LoginModal onClose={() => setAuthModal(null)} onRegister={() => setAuthModal('register')} />}
      {authModal==='register' && <RegisterModal onClose={() => setAuthModal(null)} onLogin={() => setAuthModal('login')} />}

      {/* Create Link Modal */}
      {showCreate && isLoggedIn && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in-up_200ms_ease-out]">
          <div className="bg-bg-surface dark:bg-d-bg-surface rounded-[12px] w-full max-w-lg p-8 border-[1.5px] border-text-main dark:border-d-border-subtle shadow-[8px_8px_0px_#111111] dark:shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-editorial font-bold text-text-main dark:text-d-text-main">Create Short Link</h3>
              <button onClick={() => { setShowCreate(false); setCreatedLink(null) }} className="text-text-muted dark:text-d-text-muted hover:text-text-main dark:hover:text-d-text-main">
                <span className="material-symbols-outlined" style={{fontSize:20}}>close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-text-main dark:text-d-text-main text-sm font-medium mb-1.5">Destination URL</label>
                <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://example.com" required
                  className="w-full bg-bg-base dark:bg-d-bg-base border border-border-subtle dark:border-d-border-subtle rounded-[6px] py-2 px-3 text-text-main dark:text-d-text-main text-sm focus:outline-none focus:border-text-main dark:focus:border-d-text-main transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-main dark:text-d-text-main text-sm font-medium mb-1.5">Slug (Optional)</label>
                  <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="my-link"
                    className="w-full bg-bg-base dark:bg-d-bg-base border border-border-subtle dark:border-d-border-subtle rounded-[6px] py-2 px-3 text-text-main dark:text-d-text-main text-sm focus:outline-none focus:border-text-main dark:focus:border-d-text-main transition-colors" />
                </div>
                <div>
                  <label className="block text-text-main dark:text-d-text-main text-sm font-medium mb-1.5">Password (Optional)</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="empty = public"
                    className="w-full bg-bg-base dark:bg-d-bg-base border border-border-subtle dark:border-d-border-subtle rounded-[6px] py-2 px-3 text-text-main dark:text-d-text-main text-sm focus:outline-none focus:border-text-main dark:focus:border-d-text-main transition-colors" />
                </div>
              </div>
              {createError && <p className="text-red-500 text-xs font-medium">{createError}</p>}
              
              {createdLink && (
                <div className="p-3 bg-accent-subtle dark:bg-d-accent-subtle border border-border-subtle dark:border-d-border-subtle rounded-[6px] flex items-center justify-between">
                  <span className="text-accent-text dark:text-d-accent-text font-medium text-sm truncate pr-4">
                    {createdLink}
                  </span>
                  <button type="button" onClick={() => navigator.clipboard.writeText(createdLink)} className="text-accent-text dark:text-d-accent-text bg-bg-surface dark:bg-d-bg-surface border border-border-subtle dark:border-d-border-subtle px-2 py-1 rounded-[4px] text-xs font-bold uppercase tracking-[0.05em] hover:scale-[0.98] active:scale-[0.95] transition-transform">
                    Copy
                  </button>
                </div>
              )}
              
              <div className="pt-2">
                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-text-main dark:bg-d-text-main text-bg-base dark:text-d-bg-base disabled:opacity-50 rounded-[6px] text-sm font-medium transition-transform hover:scale-[0.99] active:scale-[0.98]">
                  {submitting ? 'Shortening...' : 'Shorten'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default function Root() {
  return <AuthProvider><App /></AuthProvider>
}