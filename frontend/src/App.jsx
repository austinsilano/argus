import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Sidebar }     from './components/Sidebar'
import { Overview }    from './pages/Overview'
import { Tools }       from './pages/Tools'
import { Scans }       from './pages/Scans'
import { Reports }     from './pages/Reports'
import { Triage }      from './pages/Triage'
import { Login }       from './pages/Login'
import { Setup }       from './pages/Setup'
import { AuthSuccess, AuthError } from './pages/AuthSuccess'

const SETUP_DONE_KEY = 'argus_setup_complete'

function WaitingRestart() {
  useEffect(() => {
    // Poll /api/setup/status every 3 seconds
    // When setup_complete becomes true, reload the page
    const interval = setInterval(async () => {
      try {
        const r = await fetch('/api/setup/status')
        const d = await r.json()
        if (d.setup_complete) {
          localStorage.removeItem(SETUP_DONE_KEY)
          window.location.reload()
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--line)',
        borderRadius: 'var(--r3)', padding: '40px 48px',
        width: 480, textAlign: 'center',
        animation: 'fadeIn 0.3s ease both',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="4" fill="var(--cyan-d)" stroke="var(--cyan)" strokeWidth="0.75"/>
            <circle cx="13" cy="13" r="5" stroke="var(--cyan)" strokeWidth="1.2" fill="none"/>
            <circle cx="13" cy="13" r="2" fill="var(--cyan)"/>
            <line x1="13" y1="4" x2="13" y2="8" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="13" y1="18" x2="13" y2="22" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="4" y1="13" x2="8" y2="13" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="18" y1="13" x2="22" y2="13" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 14, color: 'var(--txt-1)', letterSpacing: '0.12em' }}>ARGUS</div>
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)', marginBottom: 16, letterSpacing: '0.06em' }}>
          ✓ CONFIGURATION SAVED
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Restart required</h2>
        <p style={{ fontSize: 13, color: 'var(--txt-2)', lineHeight: 1.7, marginBottom: 24 }}>
          Run this command in your terminal to apply the configuration:
        </p>

        {/* Copy box */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', background: 'var(--bg-1)',
          border: '1px solid var(--line)', borderRadius: 'var(--r2)',
          marginBottom: 24,
        }}>
          <code style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--cyan)', textAlign: 'left' }}>
            docker compose restart backend
          </code>
          <button onClick={() => navigator.clipboard.writeText('docker compose restart backend')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)', padding: '2px 6px' }}>
            COPY
          </button>
        </div>

        {/* Waiting indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--cyan)',
            animation: 'pulse 1.5s ease infinite',
          }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-3)', letterSpacing: '0.08em' }}>
            WAITING FOR RESTART...
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--txt-4)', marginTop: 10 }}>
          This page will update automatically once the backend restarts.
        </p>
      </div>
    </div>
  )
}

function AppShell() {
  const { user, loading, authRequired } = useAuth()
  const [setupComplete, setSetupComplete] = useState(null)

  useEffect(() => {
    fetch('/api/setup/status')
      .then(r => r.json())
      .then(d => setSetupComplete(d.setup_complete))
      .catch(() => setSetupComplete(true))
  }, [])

  // Auth callback routes always work
  const path = window.location.pathname
  if (path === '/auth/success') return <AuthSuccess />
  if (path === '/auth-error')   return <AuthError />

  // Setup just completed but backend not restarted yet
  if (localStorage.getItem(SETUP_DONE_KEY) === 'true') {
    return <WaitingRestart />
  }

  // Show wizard if not configured
  if (setupComplete === false) return <Setup onComplete={() => {
    localStorage.setItem(SETUP_DONE_KEY, 'true')
    window.location.reload()
  }} />

  // Loading
  if (setupComplete === null || loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--mono)', color: 'var(--txt-3)',
        fontSize: 11, letterSpacing: '0.1em',
      }}>
        LOADING...
      </div>
    )
  }

  if (authRequired && !user) return <Login />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{
        marginLeft: 'var(--sidebar)', flex: 1,
        overflowY: 'auto', background: 'var(--bg-0)',
        display: 'flex', flexDirection: 'column',
      }}>
        <Routes>
          <Route path="/"        element={<Overview />} />
          <Route path="/tools"   element={<Tools />} />
          <Route path="/scans"   element={<Scans />} />
          <Route path="/triage"  element={<Triage />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
