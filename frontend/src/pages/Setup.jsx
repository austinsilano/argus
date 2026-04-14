import { useState, useEffect } from 'react'

const STEPS = [
  { id: 'welcome',     label: 'Welcome' },
  { id: 'provider',    label: 'Provider' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'validate',    label: 'Validate' },
  { id: 'settings',    label: 'Settings' },
  { id: 'finish',      label: 'Finish' },
]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
      {STEPS.map((s, i) => (
        <div key={s.id} style={{
          width: i === current ? 24 : 8,
          height: 8, borderRadius: 4,
          background: i === current ? 'var(--cyan)'
                    : i < current  ? 'var(--cyan-d)'
                    : 'var(--bg-4)',
          border: i < current ? '1px solid var(--cyan)' : 'none',
          transition: 'all 0.2s',
        }} />
      ))}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, hint, valid, error, mono }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)', letterSpacing: '0.1em' }}>
          {label.toUpperCase()}
        </label>
        {valid === true  && <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ looks good</span>}
        {valid === false && error && <span style={{ fontSize: 11, color: 'var(--red)' }}>✗ {error}</span>}
      </div>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'var(--bg-1)',
          border: `1px solid ${error ? 'var(--red)' : valid ? 'var(--green)' : focused ? 'var(--cyan)' : 'var(--line)'}`,
          borderRadius: 'var(--r2)', color: 'var(--txt-1)',
          fontSize: 13,
          fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
          outline: 'none', transition: 'border-color 0.15s',
        }}
      />
      {hint && <div style={{ fontSize: 11, color: 'var(--txt-4)', marginTop: 5, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  )
}

function Btn({ onClick, children, disabled, variant = 'primary', loading }) {
  const styles = {
    primary: { bg: 'var(--cyan-d)', border: 'var(--cyan)', color: 'var(--cyan)' },
    secondary: { bg: 'transparent', border: 'var(--line-bright)', color: 'var(--txt-2)' },
    success: { bg: 'var(--green-d)', border: 'var(--green)', color: 'var(--green)' },
  }
  const s = styles[variant]
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      padding: '10px 24px', borderRadius: 'var(--r2)',
      background: s.bg, border: `1px solid ${s.border}`,
      color: disabled ? 'var(--txt-4)' : s.color,
      fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.06em',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s',
    }}>
      {loading ? '...' : children}
    </button>
  )
}

function CopyBox({ label, value }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: 'var(--bg-1)', border: '1px solid var(--line)',
        borderRadius: 'var(--r2)',
      }}>
        <code style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--cyan)', wordBreak: 'break-all' }}>
          {value}
        </code>
        <button onClick={copy} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 10,
          color: copied ? 'var(--green)' : 'var(--txt-3)',
          whiteSpace: 'nowrap', padding: '2px 6px',
        }}>
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
      </div>
    </div>
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function StepWelcome({ onNext }) {
  const [checks] = useState([
    { label: 'Docker is running',                    ok: true },
    { label: 'You have access to Azure portal',      ok: true },
    { label: 'You have an O365 / Entra ID account',  ok: true },
  ])
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Welcome to Argus</h2>
      <p style={{ color: 'var(--txt-2)', lineHeight: 1.7, marginBottom: 28, fontSize: 13 }}>
        This wizard will configure your Argus AI Shadow IT Scanner in about 5 minutes.
        You'll need access to the Azure portal to register an application.
      </p>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 12 }}>PREREQUISITES</div>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-1)', borderRadius: 'var(--r1)', marginBottom: 6, border: '1px solid var(--line-soft)' }}>
            <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>
            <span style={{ fontSize: 13, color: 'var(--txt-2)' }}>{c.label}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 16px', background: 'var(--bg-1)', borderRadius: 'var(--r2)', border: '1px solid var(--line-soft)', marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.1em', marginBottom: 6 }}>WHAT THIS WIZARD DOES</div>
        <ul style={{ color: 'var(--txt-2)', fontSize: 12, lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
          <li>Registers Argus as an app in your Azure tenant</li>
          <li>Configures Microsoft sign-in for your team</li>
          <li>Writes your configuration file automatically</li>
          <li>Validates everything works before finishing</li>
        </ul>
      </div>

      <Btn onClick={onNext}>GET STARTED →</Btn>
    </div>
  )
}

function StepProvider({ provider, setProvider, onNext, onBack }) {
  const options = [
    { id: 'entra', label: 'Microsoft Entra ID', desc: 'Use your organisation O365 / Azure AD accounts. Recommended for most teams.', badge: 'RECOMMENDED' },
    { id: 'okta',  label: 'Okta',               desc: 'Use Okta as your identity provider. Choose this if your org uses Okta in front of O365.', badge: 'COMING SOON', disabled: true },
  ]
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Choose your identity provider</h2>
      <p style={{ color: 'var(--txt-2)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
        Your team will sign in using this provider. You can change this later.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {options.map(o => (
          <div key={o.id} onClick={() => !o.disabled && setProvider(o.id)} style={{
            padding: '16px 18px', borderRadius: 'var(--r2)',
            border: `1px solid ${provider === o.id ? 'var(--cyan)' : 'var(--line)'}`,
            background: provider === o.id ? 'var(--cyan-d)' : 'var(--bg-1)',
            cursor: o.disabled ? 'not-allowed' : 'pointer',
            opacity: o.disabled ? 0.5 : 1,
            transition: 'all 0.15s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 500, fontSize: 14, color: provider === o.id ? 'var(--cyan)' : 'var(--txt-1)' }}>{o.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: provider === o.id ? 'var(--cyan)' : 'var(--txt-4)', background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 2 }}>{o.badge}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt-3)', lineHeight: 1.5 }}>{o.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={onBack} variant="secondary">← BACK</Btn>
        <Btn onClick={onNext}>NEXT →</Btn>
      </div>
    </div>
  )
}

function StepCredentials({ creds, setCreds, redirectUri, onNext, onBack }) {
  function validate(field, val) {
    const UUID_OK = UUID_RE.test(val.trim())
    if (field === 'client_id')  return val.length > 0 ? UUID_OK : null
    if (field === 'tenant_id')  return val.length > 0 ? UUID_OK : null
    if (field === 'client_secret') return val.length > 0 ? val.length >= 10 : null
    return null
  }

  const canNext = UUID_RE.test(creds.client_id.trim()) &&
                  UUID_RE.test(creds.tenant_id.trim()) &&
                  creds.client_secret.trim().length >= 10

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Azure App Registration</h2>
      <p style={{ color: 'var(--txt-2)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
        Register Argus in your Azure tenant, then paste the values below.
      </p>

      {/* Step by step instructions */}
      <div style={{ padding: '14px 16px', background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r2)', marginBottom: 20, fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.8 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.1em', marginBottom: 8 }}>AZURE PORTAL STEPS</div>
        <ol style={{ paddingLeft: 16, margin: 0 }}>
          <li>Go to <strong style={{ color: 'var(--txt-1)' }}>portal.azure.com</strong> → search <strong style={{ color: 'var(--txt-1)' }}>App registrations</strong></li>
          <li>Click <strong style={{ color: 'var(--txt-1)' }}>New registration</strong></li>
          <li>Name: <strong style={{ color: 'var(--txt-1)' }}>Argus</strong> · Account type: <strong style={{ color: 'var(--txt-1)' }}>Single tenant</strong></li>
          <li>Redirect URI → Web → paste the URI below exactly</li>
          <li>Click <strong style={{ color: 'var(--txt-1)' }}>Register</strong></li>
          <li>Copy <strong style={{ color: 'var(--txt-1)' }}>Application (client) ID</strong> and <strong style={{ color: 'var(--txt-1)' }}>Directory (tenant) ID</strong></li>
          <li>Go to <strong style={{ color: 'var(--txt-1)' }}>Certificates &amp; secrets</strong> → <strong style={{ color: 'var(--txt-1)' }}>New client secret</strong> → copy the <strong style={{ color: 'var(--txt-1)' }}>Value</strong></li>
        </ol>
      </div>

      <CopyBox label="PASTE THIS AS YOUR REDIRECT URI IN AZURE" value={redirectUri} />

      <Field
        label="Application (client) ID"
        value={creds.client_id}
        onChange={v => setCreds(c => ({ ...c, client_id: v }))}
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        valid={validate('client_id', creds.client_id)}
        error="Must be a valid UUID"
        mono
      />
      <Field
        label="Directory (tenant) ID"
        value={creds.tenant_id}
        onChange={v => setCreds(c => ({ ...c, tenant_id: v }))}
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        valid={validate('tenant_id', creds.tenant_id)}
        error="Must be a valid UUID"
        mono
      />
      <Field
        label="Client secret value"
        value={creds.client_secret}
        onChange={v => setCreds(c => ({ ...c, client_secret: v }))}
        placeholder="Paste the secret Value (not the Secret ID)"
        type="password"
        valid={validate('client_secret', creds.client_secret)}
        error="Copy the Value column, not the ID"
        hint="Go to Certificates & secrets → New client secret → copy the Value immediately (only shown once)"
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn onClick={onBack} variant="secondary">← BACK</Btn>
        <Btn onClick={onNext} disabled={!canNext}>VALIDATE →</Btn>
      </div>
    </div>
  )
}

function StepValidate({ creds, provider, onNext, onBack }) {
  const [status, setStatus]   = useState(null) // null | 'loading' | 'ok' | 'error'
  const [result, setResult]   = useState(null)
  const [errors, setErrors]   = useState([])

  async function runValidation() {
    setStatus('loading'); setErrors([])
    try {
      const r = await fetch('/api/setup/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, ...creds }),
      })
      const data = await r.json()
      if (data.valid) {
        setStatus('ok'); setResult(data)
      } else {
        setStatus('error'); setErrors(data.errors || ['Validation failed'])
      }
    } catch (e) {
      setStatus('error'); setErrors([e.message])
    }
  }

  useEffect(() => { runValidation() }, [])

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Validating credentials</h2>
      <p style={{ color: 'var(--txt-2)', fontSize: 13, marginBottom: 28 }}>
        Testing connection to Microsoft identity platform...
      </p>

      <div style={{
        padding: '24px', borderRadius: 'var(--r2)', marginBottom: 28,
        background: status === 'ok'      ? 'var(--green-d)'
                  : status === 'error'   ? 'var(--red-d)'
                  : 'var(--bg-1)',
        border: `1px solid ${status === 'ok' ? 'var(--green)33' : status === 'error' ? 'var(--red)33' : 'var(--line)'}`,
        transition: 'all 0.3s',
      }}>
        {status === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--txt-2)' }}>CONNECTING TO MICROSOFT...</span>
          </div>
        )}
        {status === 'ok' && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)', marginBottom: 8 }}>✓ CREDENTIALS VALID</div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>{result?.message}</div>
            {result?.issuer && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', marginTop: 6 }}>ISSUER: {result.issuer}</div>}
          </div>
        )}
        {status === 'error' && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>✗ VALIDATION FAILED</div>
            {errors.map((e, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid var(--red)' }}>{e}</div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={onBack} variant="secondary">← BACK</Btn>
        {status === 'error' && <Btn onClick={runValidation} variant="secondary">RETRY</Btn>}
        {status === 'ok'    && <Btn onClick={onNext} variant="success">CONTINUE →</Btn>}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function StepSettings({ settings, setSettings, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Settings</h2>
      <p style={{ color: 'var(--txt-2)', fontSize: 13, marginBottom: 24 }}>
        Optional settings — all have sensible defaults.
      </p>

      <Field
        label="Admin email (optional)"
        value={settings.admin_email}
        onChange={v => setSettings(s => ({ ...s, admin_email: v }))}
        placeholder="security@yourteam.com"
        hint="Receives critical risk alerts and daily scan digests"
      />

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)', letterSpacing: '0.1em', marginBottom: 8 }}>RESCAN INTERVAL</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Disabled', value: 0 },
            { label: 'Every 6h', value: 6 },
            { label: 'Daily',    value: 24 },
            { label: 'Weekly',   value: 168 },
          ].map(o => (
            <button key={o.value} onClick={() => setSettings(s => ({ ...s, rescan_hours: o.value }))} style={{
              flex: 1, padding: '8px 0',
              borderRadius: 'var(--r1)', fontFamily: 'var(--mono)', fontSize: 11,
              border: settings.rescan_hours === o.value ? '1px solid var(--cyan)' : '1px solid var(--line)',
              background: settings.rescan_hours === o.value ? 'var(--cyan-d)' : 'transparent',
              color: settings.rescan_hours === o.value ? 'var(--cyan)' : 'var(--txt-3)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}>{o.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt-4)', marginTop: 6 }}>
          Automatically re-scores all discovered tools against the latest risk database
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <Btn onClick={onBack} variant="secondary">← BACK</Btn>
        <Btn onClick={onNext}>FINISH SETUP →</Btn>
      </div>
    </div>
  )
}

function StepFinish({ creds, provider, settings, onComplete = () => {} }) {
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState(null)

  async function finish() {
    setStatus('loading')
    try {
      const r = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          client_id:     creds.client_id,
          client_secret: creds.client_secret,
          tenant_id:     creds.tenant_id,
          admin_email:   settings.admin_email || null,
          rescan_hours:  settings.rescan_hours,
          frontend_url:  window.location.origin,
        }),
      })
      const data = await r.json()
      if (data.success) {
        setStatus('ok'); setResult(data)
        // Notify parent that setup is done
        setTimeout(() => onComplete(), 1500)
      } else {
        setStatus('error'); setError(data.error)
      }
    } catch (e) {
      setStatus('error'); setError(e.message)
    }
  }

  useEffect(() => { finish() }, [])

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
        {status === 'ok' ? 'Setup complete!' : status === 'error' ? 'Setup failed' : 'Saving configuration...'}
      </h2>

      <div style={{ padding: '24px', borderRadius: 'var(--r2)', marginBottom: 24,
        background: status === 'ok' ? 'var(--green-d)' : status === 'error' ? 'var(--red-d)' : 'var(--bg-1)',
        border: `1px solid ${status === 'ok' ? 'var(--green)33' : status === 'error' ? 'var(--red)33' : 'var(--line)'}`,
      }}>
        {status === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--txt-2)' }}>WRITING CONFIGURATION...</span>
          </div>
        )}
        {status === 'ok' && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)', marginBottom: 12 }}>✓ CONFIGURATION SAVED</div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.7, marginBottom: 16 }}>
              Your configuration has been written. To activate it, restart the backend container:
            </div>
            <CopyBox value="docker compose restart backend" />
            <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 12 }}>
              After restarting, refresh this page and you'll see the Microsoft login screen.
            </div>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>✗ COULD NOT WRITE CONFIG FILE</div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 12 }}>{error}</div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.7 }}>
              Set these environment variables manually in your <code style={{ fontFamily: 'var(--mono)', color: 'var(--cyan)', fontSize: 11 }}>.env</code> file:
            </div>
            <div style={{ marginTop: 10 }}>
              {[
                `AUTH_PROVIDER=${provider}`,
                `AZURE_CLIENT_ID=${creds.client_id}`,
                `AZURE_CLIENT_SECRET=${creds.client_secret}`,
                `AZURE_TENANT_ID=${creds.tenant_id}`,
              ].map((line, i) => (
                <CopyBox key={i} value={line} />
              ))}
            </div>
          </div>
        )}
      </div>

      {status === 'ok' && (
        <div style={{ padding: '14px 16px', background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r2)', fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.7 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.1em', marginBottom: 6 }}>NEXT STEPS</div>
          <ol style={{ paddingLeft: 16, margin: 0 }}>
            <li>Run <code style={{ fontFamily: 'var(--mono)', color: 'var(--cyan)', fontSize: 11 }}>docker compose restart backend</code> in your terminal</li>
            <li>Refresh this page</li>
            <li>Sign in with your Microsoft account</li>
            <li>Go to Scans → upload a DNS CSV to discover AI tools</li>
          </ol>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function Setup({ onComplete = () => {} }) {
  const [step, setStep]         = useState(0)
  const [provider, setProvider] = useState('entra')
  const [redirectUri, setRedirectUri] = useState('http://localhost:8000/api/auth/callback')
  const [creds, setCreds]       = useState({ client_id: '', client_secret: '', tenant_id: '' })
  const [settings, setSettings] = useState({ admin_email: '', rescan_hours: 24 })

  useEffect(() => {
    fetch('/api/setup/redirect-uri')
      .then(r => r.json())
      .then(d => setRedirectUri(d.redirect_uri))
      .catch(() => {})
  }, [])

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep(s => Math.max(s - 1, 0))

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--line)',
        borderRadius: 'var(--r3)', width: '100%', maxWidth: 560,
        padding: '40px 44px',
        animation: 'fadeIn 0.3s ease both',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="4" fill="var(--cyan-d)" stroke="var(--cyan)" strokeWidth="0.75"/>
            <circle cx="13" cy="13" r="5" stroke="var(--cyan)" strokeWidth="1.2" fill="none"/>
            <circle cx="13" cy="13" r="2" fill="var(--cyan)"/>
            <line x1="13" y1="4" x2="13" y2="8" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="13" y1="18" x2="13" y2="22" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="4" y1="13" x2="8" y2="13" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="18" y1="13" x2="22" y2="13" stroke="var(--cyan)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 13, color: 'var(--txt-1)', letterSpacing: '0.12em' }}>ARGUS SETUP</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-3)', letterSpacing: '0.1em' }}>
              STEP {step + 1} OF {STEPS.length} — {STEPS[step].label.toUpperCase()}
            </div>
          </div>
        </div>

        <StepDots current={step} />

        {step === 0 && <StepWelcome onNext={next} />}
        {step === 1 && <StepProvider provider={provider} setProvider={setProvider} onNext={next} onBack={back} />}
        {step === 2 && <StepCredentials creds={creds} setCreds={setCreds} redirectUri={redirectUri} onNext={next} onBack={back} />}
        {step === 3 && <StepValidate creds={creds} provider={provider} onNext={next} onBack={back} />}
        {step === 4 && <StepSettings settings={settings} setSettings={setSettings} onNext={next} onBack={back} />}
        {step === 5 && <StepFinish creds={creds} provider={provider} settings={settings} onComplete={onComplete} />}
      </div>
    </div>
  )
}
