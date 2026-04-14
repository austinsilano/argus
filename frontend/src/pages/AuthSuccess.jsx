import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const TOKEN_KEY = 'argus_session'

export function AuthSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
      // Hard navigate to force full React remount with token in place
      window.location.replace('/')
    } else {
      navigate('/auth-error?reason=no_token', { replace: true })
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--mono)', color: 'var(--txt-3)', fontSize: 11, letterSpacing: '0.1em',
    }}>
      SIGNING IN...
    </div>
  )
}

export function AuthError() {
  const params  = new URLSearchParams(window.location.search)
  const reason  = params.get('reason') || 'unknown'

  const messages = {
    invalid_state:          'Invalid or expired login attempt. Please try again.',
    token_exchange_failed:  'Could not complete sign-in. Check your app registration redirect URI.',
    missing_params:         'Missing parameters in callback. Check your app registration settings.',
    no_token:               'No token received from identity provider.',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--red)33',
        borderTop: '2px solid var(--red)',
        borderRadius: 'var(--r3)', padding: '40px 48px', width: 420, textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)', marginBottom: 12, letterSpacing: '0.1em' }}>
          AUTHENTICATION FAILED
        </div>
        <div style={{ fontSize: 13, color: 'var(--txt-2)', marginBottom: 8, lineHeight: 1.6 }}>
          {messages[reason] || `Sign-in failed: ${reason}`}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', marginBottom: 24 }}>
          reason: {reason}
        </div>
        <a href="/" style={{
          display: 'inline-block', padding: '8px 20px',
          background: 'var(--cyan-d)', border: '1px solid var(--cyan)',
          borderRadius: 'var(--r1)', color: 'var(--cyan)',
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
          textDecoration: 'none',
        }}>
          TRY AGAIN
        </a>
      </div>
    </div>
  )
}