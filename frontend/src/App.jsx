import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Sidebar }     from './components/Sidebar'
import { Overview }    from './pages/Overview'
import { Tools }       from './pages/Tools'
import { Scans }       from './pages/Scans'
import { Reports }     from './pages/Reports'
import { Triage }      from './pages/Triage'
import { Login }       from './pages/Login'
import { AuthSuccess, AuthError } from './pages/AuthSuccess'

function AppShell() {
  const { user, loading, authRequired } = useAuth()

  // Auth callback routes must work regardless of auth state
  const path = window.location.pathname
  if (path === '/auth/success') return <AuthSuccess />
  if (path === '/auth-error')   return <AuthError />

  if (loading) {
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

  if (authRequired && !user) {
    return <Login />
  }

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
