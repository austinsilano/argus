import { useAuth } from '../context/AuthContext'

const PROVIDER_LABELS = {
  entra: 'Microsoft',
  okta:  'Okta',
}

export function Login() {
  const { login, provider } = useAuth()
  const providerLabel = PROVIDER_LABELS[provider] || 'your organisation account'

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--line)',
        borderRadius: 'var(--r3)', padding: '48px 52px', width: 420,
        animation: 'fadeIn 0.3s ease both',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <svg width="32" height="32" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="4" fill="var(--cyan-d)" stroke="var(--cyan)" strokeWidth="0.75"/>
            <circle cx="13" cy="13" r="5" stroke="var(--cyan)" strokeWidth="1.2" fill="none"/>
            <circle cx="13" cy="13" r="2" fill="var(--cyan)"/>
            <line x1="13" y1="4" x2="13" y2="8" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="13" y1="18" x2="13" y2="22" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="4" y1="13" x2="8" y2="13" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="18" y1="13" x2="22" y2="13" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 18, color: 'var(--txt-1)', letterSpacing: '0.12em' }}>ARGUS</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)', letterSpacing: '0.1em' }}>AI SHADOW IT SCANNER</div>
          </div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Sign in</h1>
        <p style={{ fontSize: 13, color: 'var(--txt-2)', lineHeight: 1.6, marginBottom: 28 }}>
          Use your organisation account to access the dashboard.
        </p>

        {/* Sign in button */}
        <button onClick={login} style={{
          width: '100%', padding: '12px 20px',
          background: provider === 'okta' ? '#007dc1' : '#0078d4',
          border: 'none', borderRadius: 'var(--r2)',
          color: '#fff', fontSize: 14, fontFamily: 'var(--sans)',
          fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'filter 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.9)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          {provider === 'entra' && (
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
          )}
          Sign in with {providerLabel}
        </button>

        <div style={{ marginTop: 24, padding: '12px 14px', background: 'var(--bg-1)', borderRadius: 'var(--r1)', border: '1px solid var(--line-soft)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 4 }}>ACCESS CONTROL</div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)', lineHeight: 1.6 }}>
            Access is managed by your organisation's identity provider. Contact your IT admin if you need access.
          </div>
        </div>
      </div>
    </div>
  )
}
