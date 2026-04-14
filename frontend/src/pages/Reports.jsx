import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { RiskBadge } from '../components/RiskBadge'

function DownloadBtn({ href, label, disabled }) {
  return (
    <a
      href={disabled ? undefined : href}
      download
      onClick={disabled ? e => e.preventDefault() : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '8px 16px',
        borderRadius: 'var(--r1)',
        fontSize: 11, fontFamily: 'var(--mono)',
        letterSpacing: '0.06em',
        border: disabled ? '1px solid var(--line)' : '1px solid var(--cyan)',
        background: disabled ? 'transparent' : 'var(--cyan-d)',
        color: disabled ? 'var(--txt-4)' : 'var(--cyan)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--cyan-g)' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'var(--cyan-d)' }}
    >
      ↓ {label}
    </a>
  )
}

export function Reports() {
  const { data: report, loading } = useApi(api.reportPreview)
  const [org, setOrg] = useState('Your Organisation')

  const hasData = (report?.summary?.total_tools ?? 0) > 0
  const execUrl = `/api/reports/executive.pdf?org=${encodeURIComponent(org)}`
  const techUrl = `/api/reports/technical.pdf?org=${encodeURIComponent(org)}`

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <PageHeader crumb="Argus / Reports" title="Reports" subtitle="Downloadable reports for leadership and compliance teams" />

      <div style={{ padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Org name input */}
        <Panel title="Report Settings" delay={0}>
          <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-3)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
              ORGANISATION NAME
            </div>
            <input
              value={org}
              onChange={e => setOrg(e.target.value)}
              placeholder="Your Organisation"
              style={{
                flex: 1, maxWidth: 320,
                padding: '7px 11px',
                background: 'var(--bg-1)', border: '1px solid var(--line)',
                borderRadius: 'var(--r1)', color: 'var(--txt-1)',
                fontSize: 13, fontFamily: 'var(--sans)', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
              onBlur={e  => e.target.style.borderColor = 'var(--line)'}
            />
            <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>
              Appears in PDF header and filename
            </div>
          </div>
        </Panel>

        {/* Report type cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, animation: 'fadeIn 0.3s ease both' }}>
          {[
            {
              title: 'Executive Summary',
              desc: 'Two-page risk overview for leadership. Total exposure, critical tools, risk breakdown, and recommended policy actions.',
              url: execUrl,
              filename: `argus-executive-${org.replace(/ /g,'_')}.pdf`,
              available: true,
            },
            {
              title: 'Technical Report',
              desc: 'Full inventory with risk scores, GDPR flags, data flow analysis, scan history, and per-tool detail cards for top risks.',
              url: techUrl,
              filename: `argus-technical-${org.replace(/ /g,'_')}.pdf`,
              available: true,
            },
          ].map(r => (
            <div key={r.title} style={{
              background: 'var(--bg-2)', border: '1px solid var(--line)',
              borderRadius: 'var(--r2)', padding: '20px 22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 9,
                  color: hasData ? 'var(--green)' : 'var(--txt-4)',
                  background: 'var(--bg-3)', padding: '3px 8px',
                  borderRadius: 2, letterSpacing: '0.08em',
                }}>
                  {hasData ? 'READY' : 'NO DATA'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.65, marginBottom: 18 }}>{r.desc}</p>
              <DownloadBtn href={r.url} label="DOWNLOAD PDF" disabled={!hasData} />
            </div>
          ))}
        </div>

        {/* Live data preview */}
        <Panel title="Live Data Preview" delay={120}>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 36, marginBottom: 2 }} />)}
            </div>
          ) : !hasData ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-4)', letterSpacing: '0.06em' }}>
              NO DATA — RUN A SCAN FIRST
            </div>
          ) : (
            <>
              {/* Stats strip */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--line-soft)', background: 'var(--bg-1)' }}>
                {[
                  { label: 'TOTAL',    value: report?.summary?.total_tools, color: 'var(--txt-2)' },
                  { label: 'CRITICAL', value: report?.summary?.critical,    color: 'var(--red)' },
                  { label: 'HIGH',     value: report?.summary?.high,        color: 'var(--orange)' },
                ].map(({ label, value, color }, i) => (
                  <div key={label} style={{
                    flex: 1, padding: '14px 20px', textAlign: 'center',
                    borderRight: i < 2 ? '1px solid var(--line-soft)' : 'none',
                  }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, color, marginBottom: 2 }}>{value ?? 0}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt-4)', letterSpacing: '0.1em' }}>{label}</div>
                  </div>
                ))}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    {['Tool', 'Risk Level', 'Score / 10'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)', fontWeight: 400, letterSpacing: '0.1em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(report?.top_risk_tools || []).map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--line-soft)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '11px 16px', fontWeight: 500 }}>{t.name}</td>
                      <td style={{ padding: '11px 16px' }}><RiskBadge level={t.risk_level} /></td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 80, height: 3, background: 'var(--bg-4)', borderRadius: 2 }}>
                            <div style={{
                              height: '100%', borderRadius: 2,
                              width: `${(t.risk_score / 10) * 100}%`,
                              background: t.risk_level === 'CRITICAL' ? 'var(--red)'
                                        : t.risk_level === 'HIGH'     ? 'var(--orange)'
                                        : t.risk_level === 'MEDIUM'   ? 'var(--yellow)'
                                        : 'var(--green)',
                            }} />
                          </div>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--txt-2)' }}>{t.risk_score}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}
