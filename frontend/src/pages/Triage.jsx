import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'

const STATUS_TABS = ['PENDING', 'REVIEWED', 'DISMISSED', 'ALL']

export function Triage() {
  const [tab, setTab]           = useState('PENDING')
  const [actioning, setActioning] = useState(null)
  const [reviewer, setReviewer] = useState('')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState(null)

  const { data: items, loading, refetch } = useApi(
    () => api.triageList(tab), [tab]
  )
  const { data: countData, refetch: refetchCount } = useApi(api.triageCount)

  async function handleAction(item, status) {
    setActioning(item)
    setSaving(false)
    setReviewer('')
    setNotes('')
  }

  async function submitAction(status) {
    setSaving(true); setMsg(null)
    try {
      await api.triageAction(actioning.id, { status, reviewed_by: reviewer || null, notes: notes || null })
      setMsg({ ok: true, text: `Marked as ${status}` })
      setActioning(null)
      refetch(); refetchCount()
    } catch (e) { setMsg({ ok: false, text: e.message }) }
    finally { setSaving(false) }
  }

  const pending = countData?.pending ?? 0

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>

      {/* Action modal */}
      {actioning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(2,4,10,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => e.target === e.currentTarget && setActioning(null)}>
          <div style={{
            background: 'var(--bg-2)', border: '1px solid var(--line-bright)',
            borderRadius: 'var(--r3)', width: 460, overflow: 'hidden',
            animation: 'fadeIn 0.15s ease both',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Review Domain</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--cyan)', marginTop: 2 }}>{actioning.domain}</div>
              </div>
              <button onClick={() => setActioning(null)} style={{ background: 'none', border: 'none', color: 'var(--txt-3)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '10px 14px', background: 'var(--bg-1)', borderRadius: 'var(--r1)', fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.6 }}>
                This domain appeared <strong>{actioning.seen_count}x</strong> in scans but is not in the AI tool database.
                Review it and decide how to handle it.
              </div>

              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 6 }}>REVIEWER</div>
                <input value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder="Your name or email"
                  style={{ width: '100%', padding: '8px 11px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--txt-1)', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--line)'}
                />
              </div>

              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', letterSpacing: '0.1em', marginBottom: 6 }}>NOTES</div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. internal tool, not AI-related, add to YAML DB..."
                  rows={3}
                  style={{ width: '100%', padding: '8px 11px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', color: 'var(--txt-1)', fontSize: 12, fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--line)'}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => submitAction('REVIEWED')} disabled={saving} style={{
                  flex: 1, padding: '9px', background: 'var(--cyan-d)',
                  border: '1px solid var(--cyan)', borderRadius: 'var(--r1)',
                  color: 'var(--cyan)', fontFamily: 'var(--mono)', fontSize: 11,
                  letterSpacing: '0.06em', cursor: saving ? 'wait' : 'pointer',
                }}>
                  MARK REVIEWED
                </button>
                <button onClick={() => submitAction('DISMISSED')} disabled={saving} style={{
                  flex: 1, padding: '9px', background: 'transparent',
                  border: '1px solid var(--line-bright)', borderRadius: 'var(--r1)',
                  color: 'var(--txt-3)', fontFamily: 'var(--mono)', fontSize: 11,
                  letterSpacing: '0.06em', cursor: saving ? 'wait' : 'pointer',
                }}>
                  DISMISS
                </button>
              </div>

              {msg && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: msg.ok ? 'var(--green)' : 'var(--red)' }}>
                  {msg.ok ? `✓ ${msg.text}` : `✕ ${msg.text}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PageHeader
        crumb="Argus / Triage"
        title="Triage Queue"
        subtitle="Unclassified domains requiring analyst review before scoring"
        action={pending > 0 && (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 12,
            color: 'var(--yellow)', background: 'var(--yellow-d)',
            border: '1px solid var(--yellow)33',
            padding: '5px 14px', borderRadius: 'var(--r1)',
          }}>
            {pending} PENDING
          </div>
        )}
      />

      <div style={{ padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Explainer */}
        <div style={{
          padding: '14px 18px', background: 'var(--bg-2)',
          border: '1px solid var(--line)', borderRadius: 'var(--r2)',
          fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.7,
          animation: 'fadeIn 0.3s ease both',
        }}>
          Domains that appeared in scans but are not in the AI tool database land here.
          No score is assigned until an analyst reviews them.
          To add a tool permanently, update <code style={{ fontFamily: 'var(--mono)', color: 'var(--cyan)', fontSize: 11 }}>data/tools/ai_tools.yaml</code> and re-run a scan.
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setTab(s)} style={{
              padding: '6px 16px', borderRadius: 'var(--r1)',
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
              border: tab === s ? '1px solid var(--cyan)' : '1px solid var(--line)',
              background: tab === s ? 'var(--cyan-d)' : 'transparent',
              color: tab === s ? 'var(--cyan)' : 'var(--txt-3)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}>
              {s}
              {s === 'PENDING' && pending > 0 && (
                <span style={{ marginLeft: 6, background: 'var(--yellow)', color: 'var(--bg-0)', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>
                  {pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <Panel delay={100}>
          {loading ? (
            <div style={{ padding: '32px 20px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 2, borderRadius: 3 }} />)}
            </div>
          ) : !items?.length ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-4)', letterSpacing: '0.06em' }}>
              {tab === 'PENDING' ? 'NO PENDING ITEMS — ALL DOMAINS CLASSIFIED' : `NO ${tab} ITEMS`}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  {['Domain', 'Source', 'Times Seen', 'First Seen', 'Status', 'Notes', ''].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', fontWeight: 400, letterSpacing: '0.1em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}
                    style={{ borderBottom: '1px solid var(--line-soft)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--txt-1)', fontWeight: 500 }}>{item.domain}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)' }}>{item.source || '—'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: item.seen_count > 5 ? 'var(--orange)' : 'var(--txt-2)' }}>
                      {item.seen_count}
                      {item.seen_count > 5 && <span style={{ fontSize: 9, marginLeft: 4, color: 'var(--orange)' }}>HIGH FREQ</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--txt-3)' }}>
                      {item.first_seen ? new Date(item.first_seen).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em',
                        color: item.status === 'PENDING' ? 'var(--yellow)' : item.status === 'REVIEWED' ? 'var(--green)' : 'var(--txt-3)',
                      }}>● {item.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--txt-3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.notes || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {item.status === 'PENDING' && (
                        <button onClick={() => handleAction(item)} style={{
                          padding: '4px 12px', borderRadius: 'var(--r1)',
                          border: '1px solid var(--yellow)55', background: 'var(--yellow-d)',
                          color: 'var(--yellow)', fontFamily: 'var(--mono)', fontSize: 10,
                          cursor: 'pointer', letterSpacing: '0.06em', transition: 'all 0.12s',
                        }}>
                          REVIEW
                        </button>
                      )}
                    </td>
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
