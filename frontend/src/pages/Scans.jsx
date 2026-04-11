import { useState, useRef, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { RiskBadge } from '../components/RiskBadge'

const TABS = ['CSV Upload', 'Paste Domains', 'Manual Lookup']

const INTEGRATIONS = [
  { name: 'Microsoft 365 Admin API', desc: 'OAuth app inventory',  phase: 2 },
  { name: 'Google Workspace Admin',  desc: 'OAuth app inventory',  phase: 2 },
  { name: 'Slack API',               desc: 'AI bot detection',     phase: 2 },
  { name: 'GitHub API',              desc: 'Copilot usage',        phase: 2 },
  { name: 'Okta',                    desc: 'SSO connections',      phase: 2 },
  { name: 'Zscaler',                 desc: 'Web traffic data',     phase: 2 },
]

function ResultBanner({ result }) {
  if (!result) return null
  const ok = !result.error
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--r1)', marginTop: 12,
      border: `1px solid ${ok ? 'var(--green)33' : 'var(--red)33'}`,
      background: ok ? 'var(--green-d)' : 'var(--red-d)',
      fontFamily: 'var(--mono)', fontSize: 11,
      color: ok ? 'var(--green)' : 'var(--red)',
    }}>
      {result.error
        ? `✕ ERROR: ${result.error}`
        : `✓ ${result.message}`
      }
    </div>
  )
}

// ── CSV Upload tab ────────────────────────────────────────────────────────────
function CsvTab({ onDone }) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult]       = useState(null)
  const [drag, setDrag]           = useState(false)
  const fileRef = useRef()

  async function handleFile(file) {
    if (!file?.name.endsWith('.csv')) { setResult({ error: 'Must be a .csv file' }); return }
    setUploading(true); setResult(null)
    try {
      const r = await api.uploadDnsCsv(file)
      setResult({ message: `${r.tools_found} tools discovered · ${r.summary?.critical ?? 0} critical · ${r.summary?.high ?? 0} high` })
      onDone()
    } catch (e) { setResult({ error: e.message }) }
    finally { setUploading(false) }
  }

  return (
    <div style={{ padding: '20px' }}>
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
        style={{
          border: `1px dashed ${drag ? 'var(--cyan)' : 'var(--line-bright)'}`,
          borderRadius: 'var(--r2)', padding: '32px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          cursor: uploading ? 'wait' : 'pointer',
          background: drag ? 'var(--cyan-d)' : 'var(--bg-1)',
          transition: 'all 0.15s',
        }}
      >
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ opacity: uploading ? 0.4 : 1 }}>
          <rect width="28" height="28" rx="5" fill="var(--bg-3)"/>
          <path d="M9 16L14 11L19 16" stroke={drag ? 'var(--cyan)' : 'var(--txt-3)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="14" y1="11" x2="14" y2="21" stroke={drag ? 'var(--cyan)' : 'var(--txt-3)'} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="8" y1="21" x2="20" y2="21" stroke={drag ? 'var(--cyan)' : 'var(--txt-3)'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: uploading ? 'var(--cyan)' : 'var(--txt-2)', letterSpacing: '0.04em' }}>
          {uploading ? 'PROCESSING...' : 'DROP DNS CSV OR CLICK TO UPLOAD'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt-4)', textAlign: 'center', lineHeight: 1.6 }}>
          Cisco Umbrella · Palo Alto · Zscaler · Pi-hole · any DNS platform
        </div>
      </div>
      <ResultBanner result={result} />
    </div>
  )
}

// ── Paste tab ─────────────────────────────────────────────────────────────────
function PasteTab({ onDone }) {
  const [text, setText]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function handleSubmit() {
    if (!text.trim()) return
    setLoading(true); setResult(null)
    try {
      const r = await api.pasteDomains(text)
      setResult({ message: `${r.tools_found} tools matched from ${r.summary?.submitted ?? '?'} domains · ${r.summary?.critical ?? 0} critical · ${r.summary?.high ?? 0} high` })
      setText('')
      onDone()
    } catch (e) { setResult({ error: e.message }) }
    finally { setLoading(false) }
  }

  const lineCount = text.trim() ? text.trim().split(/[\n,;]+/).filter(Boolean).length : 0

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 10, lineHeight: 1.6 }}>
        Paste any list of domains — one per line, comma separated, or space separated. No formatting required.
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={`chat.openai.com\ngrammarly.com\ncursor.sh\notter.ai`}
        rows={8}
        style={{
          width: '100%', padding: '12px 14px',
          background: 'var(--bg-1)', border: '1px solid var(--line)',
          borderRadius: 'var(--r2)', color: 'var(--txt-1)',
          fontSize: 12, fontFamily: 'var(--mono)', outline: 'none',
          resize: 'vertical', lineHeight: 1.7,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
        onBlur={e  => e.target.style.borderColor = 'var(--line)'}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)' }}>
          {lineCount > 0 ? `${lineCount} domains entered` : 'Enter domains above'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          style={{
            padding: '8px 20px',
            background: text.trim() && !loading ? 'var(--cyan-d)' : 'transparent',
            border: `1px solid ${text.trim() && !loading ? 'var(--cyan)' : 'var(--line)'}`,
            borderRadius: 'var(--r1)', color: text.trim() && !loading ? 'var(--cyan)' : 'var(--txt-4)',
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
            cursor: text.trim() && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          {loading ? 'SCANNING...' : 'SCAN DOMAINS'}
        </button>
      </div>
      <ResultBanner result={result} />
    </div>
  )
}

// ── Manual Lookup tab ─────────────────────────────────────────────────────────
function ManualTab({ onDone }) {
  const [query, setQuery]   = useState('')
  const [notes, setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [result, setResult] = useState(null)

  async function handleLookup() {
    if (!query.trim()) return
    setLoading(true); setProfile(null); setResult(null)
    try {
      const r = await api.manualLookup(query.trim())
      if (r.found) setProfile(r)
      else setResult({ error: `No profile found for "${query}" — not in the risk database yet` })
    } catch (e) { setResult({ error: e.message }) }
    finally { setLoading(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.manualSave(query.trim(), notes)
      setResult({ message: `${profile.name} saved to inventory` })
      setProfile(null); setQuery(''); setNotes('')
      onDone()
    } catch (e) { setResult({ error: e.message }) }
    finally { setSaving(false) }
  }

  const RISK_COLOR = {
    CRITICAL: 'var(--red)', HIGH: 'var(--orange)',
    MEDIUM: 'var(--yellow)', LOW: 'var(--green)',
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 14, lineHeight: 1.6 }}>
        Look up any AI tool by name or domain to instantly check its risk profile against the database.
      </div>

      {/* Search input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          placeholder="e.g. ChatGPT, cursor.sh, Grammarly..."
          style={{
            flex: 1, padding: '9px 14px',
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 'var(--r1)', color: 'var(--txt-1)',
            fontSize: 13, fontFamily: 'var(--sans)', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
          onBlur={e  => e.target.style.borderColor = 'var(--line)'}
        />
        <button onClick={handleLookup} disabled={!query.trim() || loading} style={{
          padding: '9px 20px',
          background: 'var(--cyan-d)', border: '1px solid var(--cyan)',
          borderRadius: 'var(--r1)', color: 'var(--cyan)',
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
          cursor: query.trim() && !loading ? 'pointer' : 'not-allowed',
          opacity: query.trim() && !loading ? 1 : 0.4,
        }}>
          {loading ? 'LOOKING UP...' : 'LOOKUP'}
        </button>
      </div>

      {/* Profile result card */}
      {profile && (
        <div style={{
          background: 'var(--bg-1)', border: `1px solid ${RISK_COLOR[profile.risk_level] || 'var(--line)'}22`,
          borderRadius: 'var(--r2)', overflow: 'hidden',
          borderTop: `2px solid ${RISK_COLOR[profile.risk_level] || 'var(--line)'}`,
          animation: 'fadeIn 0.2s ease both',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{profile.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>{profile.domain}</div>
            </div>
            <RiskBadge level={profile.risk_level} />
          </div>

          {/* Fields grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1, background: 'var(--line-soft)' }}>
            {[
              ['Category',        profile.category],
              ['Vendor',          profile.vendor],
              ['Score',           `${profile.risk_score} / 10`],
              ['GDPR',            profile.gdpr_relevant],
              ['Data Leaves Org', profile.data_leaves_org ? 'YES' : 'NO'],
              ['Trains on Data',  profile.trains_on_data  ? 'YES' : 'NO'],
              ['SSO Available',   profile.sso_available   ? 'YES' : 'NO'],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'var(--bg-2)', padding: '10px 14px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 3 }}>{label.toUpperCase()}</div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 12,
                  color: val === 'YES' && label !== 'SSO Available' ? 'var(--orange)'
                       : val === 'YES' && label === 'SSO Available' ? 'var(--green)'
                       : val === 'NO'  ? 'var(--txt-3)'
                       : 'var(--txt-2)',
                }}>{val || '—'}</div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {profile.db_notes && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line-soft)', fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', letterSpacing: '0.1em', marginRight: 8 }}>NOTE</span>
              {profile.db_notes}
            </div>
          )}

          {/* Save section */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line-soft)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes (e.g. approved for marketing team)..."
              style={{
                flex: 1, padding: '7px 11px',
                background: 'var(--bg-1)', border: '1px solid var(--line)',
                borderRadius: 'var(--r1)', color: 'var(--txt-1)',
                fontSize: 12, fontFamily: 'var(--sans)', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
              onBlur={e  => e.target.style.borderColor = 'var(--line)'}
            />
            <button onClick={handleSave} disabled={saving} style={{
              padding: '7px 18px', whiteSpace: 'nowrap',
              background: 'var(--cyan-d)', border: '1px solid var(--cyan)',
              borderRadius: 'var(--r1)', color: 'var(--cyan)',
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
              cursor: saving ? 'wait' : 'pointer',
            }}>
              {saving ? 'SAVING...' : 'SAVE TO INVENTORY'}
            </button>
          </div>
        </div>
      )}

      <ResultBanner result={result} />
    </div>
  )
}

// ── Scheduler panel ───────────────────────────────────────────────────────────
function SchedulerPanel() {
  const [status, setStatus]     = useState(null)
  const [interval, setInterval] = useState(24)
  const [saving, setSaving]     = useState(false)
  const [running, setRunning]   = useState(false)
  const [msg, setMsg]           = useState(null)

  useEffect(() => {
    api.schedulerStatus().then(setStatus).catch(() => {})
  }, [])

  async function save() {
    setSaving(true); setMsg(null)
    try {
      await api.schedulerConfigure(interval)
      const s = await api.schedulerStatus()
      setStatus(s)
      setMsg({ message: interval === 0 ? 'Scheduler disabled' : `Scheduler set to every ${interval}h` })
    } catch (e) { setMsg({ error: e.message }) }
    finally { setSaving(false) }
  }

  async function runNow() {
    setRunning(true); setMsg(null)
    try {
      await api.schedulerRunNow()
      setMsg({ message: 'Rescan complete — risk scores updated' })
    } catch (e) { setMsg({ error: e.message }) }
    finally { setRunning(false) }
  }

  const OPTIONS = [
    { label: 'Disabled',  value: 0 },
    { label: 'Every 6h',  value: 6 },
    { label: 'Daily',     value: 24 },
    { label: 'Weekly',    value: 168 },
  ]

  return (
    <Panel title="Scheduled Rescans">
      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 14, lineHeight: 1.6 }}>
          Automatically re-score all discovered tools against the latest risk database on a schedule.
          Runs inside the existing container — no extra infrastructure needed.
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Interval selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {OPTIONS.map(o => (
              <button key={o.value} onClick={() => setInterval(o.value)} style={{
                padding: '6px 14px', borderRadius: 'var(--r1)',
                fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.06em',
                border: interval === o.value ? '1px solid var(--cyan)' : '1px solid var(--line)',
                background: interval === o.value ? 'var(--cyan-d)' : 'transparent',
                color: interval === o.value ? 'var(--cyan)' : 'var(--txt-3)',
                cursor: 'pointer', transition: 'all 0.12s',
              }}>{o.label}</button>
            ))}
          </div>

          <button onClick={save} disabled={saving} style={{
            padding: '6px 16px',
            background: 'var(--bg-3)', border: '1px solid var(--line-bright)',
            borderRadius: 'var(--r1)', color: 'var(--txt-2)',
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
            cursor: saving ? 'wait' : 'pointer',
          }}>
            {saving ? 'SAVING...' : 'SAVE'}
          </button>

          <button onClick={runNow} disabled={running} style={{
            padding: '6px 16px',
            background: 'var(--cyan-d)', border: '1px solid var(--cyan)',
            borderRadius: 'var(--r1)', color: 'var(--cyan)',
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
            cursor: running ? 'wait' : 'pointer',
          }}>
            {running ? 'RUNNING...' : 'RUN NOW'}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 3 }}>STATUS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.running ? 'var(--green)' : 'var(--txt-4)', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: status.running ? 'var(--green)' : 'var(--txt-3)' }}>
                  {status.running && status.interval_hours > 0 ? `ACTIVE — every ${status.interval_hours}h` : 'DISABLED'}
                </span>
              </div>
            </div>
            {status.next_run && (
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 3 }}>NEXT RUN</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-2)' }}>
                  {new Date(status.next_run).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}

        {msg && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 'var(--r1)',
            border: `1px solid ${msg.error ? 'var(--red)33' : 'var(--green)33'}`,
            background: msg.error ? 'var(--red-d)' : 'var(--green-d)',
            fontFamily: 'var(--mono)', fontSize: 11,
            color: msg.error ? 'var(--red)' : 'var(--green)',
          }}>
            {msg.error ? `✕ ${msg.error}` : `✓ ${msg.message}`}
          </div>
        )}
      </div>
    </Panel>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function Scans() {
  const { data: scans, loading, refetch } = useApi(api.scans)
  const [tab, setTab] = useState(0)

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <PageHeader crumb="Argus / Scans" title="Scans" subtitle="Discover AI tools across your environment" />

      <div style={{ padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Ingestion panel with tabs */}
        <Panel title="Ingest Data" delay={0}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line-soft)' }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} style={{
                padding: '10px 20px',
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
                background: 'none', border: 'none',
                borderBottom: tab === i ? '2px solid var(--cyan)' : '2px solid transparent',
                color: tab === i ? 'var(--cyan)' : 'var(--txt-3)',
                cursor: 'pointer', transition: 'all 0.15s',
                marginBottom: -1,
              }}>{t.toUpperCase()}</button>
            ))}
          </div>

          {tab === 0 && <CsvTab onDone={refetch} />}
          {tab === 1 && <PasteTab onDone={refetch} />}
          {tab === 2 && <ManualTab onDone={refetch} />}
        </Panel>

        {/* Scheduler */}
        <SchedulerPanel />

        {/* Phase 2 integrations */}
        <Panel title="Integrations — Phase 2" delay={100}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 1, background: 'var(--line-soft)' }}>
            {INTEGRATIONS.map(int => (
              <div key={int.name} style={{ background: 'var(--bg-2)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{int.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', background: 'var(--bg-3)', padding: '2px 7px', borderRadius: 2, letterSpacing: '0.08em' }}>PHASE {int.phase}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{int.desc}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Scan history */}
        <Panel title="Scan History" delay={180}>
          {loading ? (
            <div style={{ padding: '24px 18px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 36, marginBottom: 2 }} />)}
            </div>
          ) : !scans?.length ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-4)', letterSpacing: '0.06em' }}>NO SCANS YET</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  {['ID', 'Type', 'Status', 'Tools', 'Critical', 'High', 'Timestamp'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', fontWeight: 400, letterSpacing: '0.1em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--line-soft)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-4)' }}>#{s.id}</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: 11 }}>{s.scan_type}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em', color: s.status === 'complete' ? 'var(--green)' : s.status === 'failed' ? 'var(--red)' : 'var(--yellow)' }}>
                        ● {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: 12 }}>{s.tools_found}</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)' }}>{s.summary?.critical ?? '—'}</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--orange)' }}>{s.summary?.high ?? '—'}</td>
                    <td style={{ padding: '11px 16px', fontSize: 11, color: 'var(--txt-3)' }}>{s.created_at ? new Date(s.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  )
}
