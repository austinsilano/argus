import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { RiskBadge } from '../components/RiskBadge'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'

const LEVELS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const LEVEL_COLOR = { CRITICAL: 'var(--red)', HIGH: 'var(--orange)', MEDIUM: 'var(--yellow)', LOW: 'var(--green)', ALL: 'var(--cyan)' }

// ── Override modal ────────────────────────────────────────────────────────────
function OverrideModal({ tool, onClose, onSaved }) {
  const [decision, setDecision] = useState('APPROVED')
  const [score, setScore]       = useState(tool.risk_score ?? 5)
  const [reviewer, setReviewer] = useState('')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      await api.createOverride({
        domain: tool.domain,
        decision,
        override_score: decision === 'RESCORE' ? parseFloat(score) : null,
        reviewed_by: reviewer || null,
        notes: notes || null,
      })
      onSaved()
      onClose()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const DECISIONS = [
    { value: 'APPROVED', label: 'Approved', color: 'var(--green)',  desc: 'Mark as safe — lowers score to LOW' },
    { value: 'BLOCKED',  label: 'Blocked',  color: 'var(--red)',    desc: 'Block this tool — raises to CRITICAL' },
    { value: 'RESCORE',  label: 'Rescore',  color: 'var(--yellow)', desc: 'Set a custom risk score' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(2,4,10,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--line-bright)',
        borderRadius: 'var(--r3)', width: 480, overflow: 'hidden',
        animation: 'fadeIn 0.15s ease both',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{tool.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>{tool.domain}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt-3)', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}>✕</button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Decision */}
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 8 }}>DECISION</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {DECISIONS.map(d => (
                <button key={d.value} onClick={() => setDecision(d.value)} style={{
                  flex: 1, padding: '8px 10px', borderRadius: 'var(--r1)',
                  border: decision === d.value ? `1px solid ${d.color}` : '1px solid var(--line)',
                  background: decision === d.value ? `${d.color}14` : 'transparent',
                  color: decision === d.value ? d.color : 'var(--txt-3)',
                  fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                  transition: 'all 0.12s',
                }}>
                  {d.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 6 }}>
              {DECISIONS.find(d => d.value === decision)?.desc}
            </div>
          </div>

          {/* Score slider — only for RESCORE */}
          {decision === 'RESCORE' && (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 8 }}>
                RISK SCORE: <span style={{ color: 'var(--cyan)' }}>{score} / 10</span>
              </div>
              <input type="range" min="0" max="10" step="0.5" value={score}
                onChange={e => setScore(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--cyan)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((l, i) => (
                  <span key={l} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)' }}>{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Reviewer */}
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 6 }}>REVIEWED BY</div>
            <input value={reviewer} onChange={e => setReviewer(e.target.value)}
              placeholder="Your name or email..."
              style={{ width: '100%', padding: '8px 11px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--txt-1)', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
              onBlur={e  => e.target.style.borderColor = 'var(--line)'}
            />
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 6 }}>JUSTIFICATION</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Semaphore is our approved CI/CD tool, not an AI risk..."
              rows={3}
              style={{ width: '100%', padding: '8px 11px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--txt-1)', fontSize: 12, fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
              onBlur={e  => e.target.style.borderColor = 'var(--line)'}
            />
          </div>

          {error && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)' }}>✕ {error}</div>}

          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px', background: 'var(--cyan-d)',
            border: '1px solid var(--cyan)', borderRadius: 'var(--r1)',
            color: 'var(--cyan)', fontFamily: 'var(--mono)', fontSize: 12,
            letterSpacing: '0.06em', cursor: saving ? 'wait' : 'pointer',
          }}>
            {saving ? 'SAVING...' : 'SAVE OVERRIDE'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Tag({ children, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 'var(--r1)',
      fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.06em',
      border: active ? `1px solid ${color}55` : '1px solid var(--line)',
      background: active ? `${color}14` : 'transparent',
      color: active ? color : 'var(--txt-3)',
      transition: 'all 0.12s', cursor: 'pointer',
    }}>{children}</button>
  )
}

export function Tools() {
  const { data: tools, loading, refetch } = useApi(api.tools)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('ALL')
  const [expanded, setExpanded] = useState(null)
  const [overriding, setOverriding] = useState(null)

  const filtered = (tools || []).filter(t => {
    const lMatch = filter === 'ALL' || t.risk_level === filter
    const sMatch = !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.domain?.toLowerCase().includes(search.toLowerCase()) ||
      t.vendor?.toLowerCase().includes(search.toLowerCase())
    return lMatch && sMatch
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {overriding && (
        <OverrideModal
          tool={overriding}
          onClose={() => setOverriding(null)}
          onSaved={refetch}
        />
      )}

      <PageHeader
        crumb="Argus / Tool Inventory"
        title="Tool Inventory"
        subtitle={`${tools?.length ?? 0} tools discovered · click any row to expand · use Override to adjust risk`}
      />

      <div style={{ padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', animation: 'fadeIn 0.3s ease both' }}>
          <div style={{ position: 'relative', flex: '0 0 280px' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-4)' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, domain, vendor..."
              style={{ width: '100%', padding: '7px 10px 7px 28px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--txt-1)', fontSize: 12, fontFamily: 'var(--sans)', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
              onBlur={e  => e.target.style.borderColor = 'var(--line)'}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {LEVELS.map(l => <Tag key={l} active={filter === l} color={LEVEL_COLOR[l]} onClick={() => setFilter(l)}>{l}</Tag>)}
          </div>
          {filtered.length !== (tools?.length ?? 0) && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)', marginLeft: 'auto' }}>
              {filtered.length} / {tools?.length} shown
            </span>
          )}
        </div>

        {/* Table */}
        <Panel delay={100}>
          {loading ? (
            <div style={{ padding: '32px 20px' }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 42, marginBottom: 2, borderRadius: 3 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-4)', letterSpacing: '0.06em' }}>
              {(tools?.length ?? 0) === 0 ? 'NO TOOLS YET — UPLOAD A DNS CSV IN SCANS' : 'NO RESULTS MATCH YOUR FILTER'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  {['Tool', 'Domain', 'Category', 'Vendor', 'Source', 'GDPR', 'Risk', 'Score', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <>
                    <tr key={t.id}
                      onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      style={{ borderBottom: '1px solid var(--line-soft)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (expanded !== t.id) e.currentTarget.style.background = 'var(--bg-3)' }}
                      onMouseLeave={e => { if (expanded !== t.id) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '11px 14px', fontWeight: 500, fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', transform: expanded === t.id ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                          {t.name}
                          {t.raw_profile?.dynamic && (
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--yellow)', background: 'var(--yellow-d)', border: '1px solid var(--yellow)22', padding: '1px 6px', borderRadius: 2 }}>
                              ~DYNAMIC
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-3)' }}>{t.domain || '—'}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--txt-2)', fontSize: 12 }}>{t.category || '—'}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--txt-2)', fontSize: 12 }}>{t.vendor || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)' }}>{t.source || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 10 }}>
                        <span style={{ color: t.gdpr_relevant === 'YES' ? 'var(--yellow)' : 'var(--txt-4)' }}>{t.gdpr_relevant || '—'}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}><RiskBadge level={t.risk_level} /></td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--txt-2)' }}>{t.risk_score}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); setOverriding(t) }}
                          style={{
                            padding: '4px 10px', borderRadius: 'var(--r1)',
                            border: '1px solid var(--line-bright)', background: 'transparent',
                            color: 'var(--txt-3)', fontFamily: 'var(--mono)', fontSize: 10,
                            cursor: 'pointer', letterSpacing: '0.06em',
                            transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.color = 'var(--cyan)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-bright)'; e.currentTarget.style.color = 'var(--txt-3)' }}
                        >
                          OVERRIDE
                        </button>
                      </td>
                    </tr>

                    {expanded === t.id && (
                      <tr key={`${t.id}-exp`}>
                        <td colSpan={9} style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--line)', padding: 0 }}>
                          <div style={{ padding: '16px 24px 18px', borderLeft: '2px solid var(--cyan)', marginLeft: 14 }}>

                            {/* Override badge if active */}
                            {t.raw_profile?.override_active && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 'var(--r1)', background: 'var(--cyan-d)', border: '1px solid var(--cyan)33', marginBottom: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--cyan)' }}>
                                ⚑ Override active
                              </div>
                            )}

                            {/* Dynamic scoring reasoning */}
                            {t.raw_profile?.dynamic && (
                              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 'var(--r1)', border: '1px solid var(--yellow)22' }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--yellow)', letterSpacing: '0.1em', marginBottom: 4 }}>DYNAMIC SCORE — NOT IN RISK DATABASE</div>
                                <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>
                                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)', marginRight: 8 }}>
                                    CONFIDENCE: {t.raw_profile?.confidence}
                                  </span>
                                  {t.raw_profile?.reasoning}
                                </div>
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 24px', marginBottom: 14 }}>
                              {[
                                ['Data Leaves Org',    t.raw_profile?.data_leaves_org],
                                ['Trains on Data',     t.raw_profile?.trains_on_data],
                                ['SSO Available',      t.raw_profile?.sso_available],
                                ['Data Classification',t.data_classification],
                                ['First Seen',         t.first_seen ? new Date(t.first_seen).toLocaleDateString() : null],
                              ].map(([label, val]) => (
                                <div key={label}>
                                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 3, textTransform: 'uppercase' }}>{label}</div>
                                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: val === true ? 'var(--red)' : val === false ? 'var(--green)' : 'var(--txt-2)' }}>
                                    {val === true ? 'YES' : val === false ? 'NO' : val ?? '—'}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {t.raw_profile?.notes && (
                              <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.6, maxWidth: 700 }}>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', letterSpacing: '0.1em', marginRight: 8 }}>NOTE</span>
                                {t.raw_profile.notes}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  )
}
