import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const NAV = [
  { to: '/',        label: 'Overview',       abbr: 'OV' },
  { to: '/tools',   label: 'Tool Inventory', abbr: 'TI' },
  { to: '/scans',   label: 'Scans',          abbr: 'SC' },
  { to: '/triage',  label: 'Triage Queue',   abbr: 'TQ', badge: true },
  { to: '/reports', label: 'Reports',        abbr: 'RP' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const [alive, setAlive]     = useState(null)
  const [summary, setSummary] = useState(null)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    api.health().then(() => setAlive(true)).catch(() => setAlive(false))
    api.toolSummary().then(setSummary).catch(() => {})
    api.triageCount().then(d => setPending(d.pending ?? 0)).catch(() => {})
  }, [])

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <aside style={{
      width: 'var(--sidebar)', height: '100vh',
      background: 'var(--bg-1)', borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, zIndex: 200,
    }}>
      {/* Wordmark */}
      <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <rect width="26" height="26" rx="4" fill="var(--cyan-d)" stroke="var(--cyan)" strokeWidth="0.75"/>
          <circle cx="13" cy="13" r="5" stroke="var(--cyan)" strokeWidth="1.2" fill="none"/>
          <circle cx="13" cy="13" r="2" fill="var(--cyan)"/>
          <line x1="13" y1="4" x2="13" y2="8" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="13" y1="18" x2="13" y2="22" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="4" y1="13" x2="8" y2="13" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="18" y1="13" x2="22" y2="13" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 14, color: 'var(--txt-1)', letterSpacing: '0.12em' }}>ARGUS</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-3)', letterSpacing: '0.1em' }}>AI SHADOW IT v0.4</div>
        </div>
      </div>

      {/* Risk bar */}
      {summary?.total > 0 && (
        <>
          <div style={{ margin: '12px 14px 0', borderRadius: 2, overflow: 'hidden', height: 3, background: 'var(--bg-3)', display: 'flex' }}>
            {[
              { count: summary.critical, color: 'var(--red)' },
              { count: summary.high,     color: 'var(--orange)' },
              { count: summary.medium,   color: 'var(--yellow)' },
              { count: summary.low,      color: 'var(--green)' },
            ].map(({ count, color }, i) => count > 0 && (
              <div key={i} style={{ flex: count, background: color, opacity: 0.85 }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 14px 10px' }}>
            {[
              { n: summary.critical, c: 'var(--red)',    l: 'C' },
              { n: summary.high,     c: 'var(--orange)', l: 'H' },
              { n: summary.medium,   c: 'var(--yellow)', l: 'M' },
              { n: summary.low,      c: 'var(--green)',  l: 'L' },
            ].map(({ n, c, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: c }}>{n}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-3)' }}>{l}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Nav */}
      <nav style={{ padding: '8px 10px', flex: 1 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', letterSpacing: '0.14em', padding: '6px 10px 8px' }}>NAVIGATION</div>
        {NAV.map(({ to, label, abbr, badge }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 10px', borderRadius: 'var(--r1)', marginBottom: 1,
            color: isActive ? 'var(--cyan)' : 'var(--txt-2)',
            background: isActive ? 'var(--cyan-d)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--cyan)' : '2px solid transparent',
            fontSize: 12.5, fontWeight: isActive ? 500 : 400,
            transition: 'all 0.1s', textDecoration: 'none',
          })}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {label}
              {badge && pending > 0 && (
                <span style={{ background: 'var(--yellow)', color: 'var(--bg-0)', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>
                  {pending}
                </span>
              )}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)' }}>{abbr}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + status footer */}
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {user && (
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--cyan-d)', border: '1px solid var(--cyan)33',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || user.email}
              </div>
              {user.dev && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--yellow)' }}>DEV MODE</div>
              )}
              {user.provider && !user.dev && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', textTransform: 'uppercase' }}>{user.provider}</div>
              )}
            </div>
            <button onClick={logout} title="Sign out" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--txt-4)', fontSize: 14, padding: '2px 4px',
              borderRadius: 4, transition: 'color 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-2)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-4)'}
            >⏏</button>
          </div>
        )}
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)' }}>API STATUS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: alive === null ? 'var(--txt-4)' : alive ? 'var(--green)' : 'var(--red)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: alive ? 'var(--green)' : 'var(--txt-3)' }}>
                {alive === null ? 'CHECKING' : alive ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
          {pending > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)' }}>TRIAGE PENDING</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--yellow)' }}>{pending}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
