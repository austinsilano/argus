import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar }  from './components/Sidebar'
import { Overview } from './pages/Overview'
import { Tools }    from './pages/Tools'
import { Scans }    from './pages/Scans'
import { Reports }  from './pages/Reports'
import { Triage }   from './pages/Triage'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <main style={{
          marginLeft: 'var(--sidebar)',
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-0)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Routes>
            <Route path="/"        element={<Overview />} />
            <Route path="/tools"   element={<Tools />} />
            <Route path="/scans"   element={<Scans />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/triage"  element={<Triage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
