import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import { KpiCard } from '../components/KpiCard'
import { Panel } from '../components/Panel'
import { PageHeader } from '../components/PageHeader'
import { RiskBadge } from '../components/RiskBadge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area,
} from 'recharts'

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-3)', border: '1px solid var(--line-bright)',
      borderRadius: 'var(--r2)', padding: '8px 12px',
      fontFamily: 'var(--mono)', fontSize: 11,
    }}>
      <div style={{ color: 'var(--txt-2)', marginBottom: 3 }}>{label}</div>
      <div style={{ color: 'var(--txt-1)', fontWeight: 600 }}>{payload[0].value} / 10</div>
    </div>
  )
}

export function Overview() {
  const { data: summary, loading } = useApi(api.toolSummary)
  const { data: report  }          = useApi(api.reportPreview)

  const barData = (report?.top_risk_tools || []).map(t => ({
    name:  t.name.length > 13 ? t.name.slice(0, 13) + '…' : t.name,
    score: t.risk_score,
    level: t.risk_level,
  }))

  const colorFor = l =>
    l === 'CRITICAL' ? 'var(--red)'
  : l === 'HIGH'     ? 'var(--orange)'
  : l === 'MEDIUM'   ? 'var(--yellow)'
  : 'var(--green)'

  const hasData = summary?.total > 0

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <PageHeader
        crumb="Argus / Overview"
        title="Risk Overview"
        subtitle="AI tool exposure across your organisation"
      />

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <KpiCard label="Total Tools"    value={summary?.total}    color="var(--txt-2)"   loading={loading} delay={0} />
          <KpiCard label="Critical"       value={summary?.critical} color="var(--red)"     loading={loading} delay={50}  sub="Immediate action" />
          <KpiCard label="High"           value={summary?.high}     color="var(--orange)"  loading={loading} delay={100} />
          <KpiCard label="Medium"         value={summary?.medium}   color="var(--yellow)"  loading={loading} delay={150} />
          <KpiCard label="Low"            value={summary?.low}      color="var(--green)"   loading={loading} delay={200} sub="Approved / safe" />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>

          {/* Risk breakdown donut-style bar */}
          <Panel title="Risk Breakdown" delay={220}>
            <div style={{ padding: '18px 20px' }}>
              {loading ? (
                [1,2,3,4].map(i => (
                  <div key={i} className="skeleton" style={{ height: 28, marginBottom: 10, borderRadius: 3 }} />
                ))
              ) : !hasData ? (
                <EmptyMsg msg="No data — run a scan first" />
              ) : (
                [
                  { label: 'Critical', count: summary.critical, color: 'var(--red)',    total: summary.total },
                  { label: 'High',     count: summary.high,     color: 'var(--orange)', total: summary.total },
                  { label: 'Medium',   count: summary.medium,   color: 'var(--yellow)', total: summary.total },
                  { label: 'Low',      count: summary.low,      color: 'var(--green)',  total: summary.total },
                ].map(({ label, count, color, total }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-2)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color }}>
                        {count} <span style={{ color: 'var(--txt-4)' }}>/ {total}</span>
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg-4)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${total ? (count / total) * 100 : 0}%`,
                        background: color,
                        borderRadius: 2,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          {/* Bar chart */}
          <Panel title="Top Risk Tools — Score (0–10)" delay={260}>
            <div style={{ padding: '16px 16px 12px' }}>
              {!hasData ? (
                <EmptyMsg msg="Upload a DNS CSV to populate" height={180} />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} barSize={16} margin={{ left: -28, right: 4, bottom: 0, top: 4 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'var(--txt-3)', fontSize: 9, fontFamily: 'var(--mono)' }}
                      axisLine={{ stroke: 'var(--line)' }} tickLine={false}
                    />
                    <YAxis
                      domain={[0, 10]} ticks={[0,2,4,6,8,10]}
                      tick={{ fill: 'var(--txt-3)', fontSize: 9, fontFamily: 'var(--mono)' }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<TT />} cursor={{ fill: 'var(--bg-3)' }} />
                    <Bar dataKey="score" radius={[2,2,0,0]}>
                      {barData.map((d, i) => <Cell key={i} fill={colorFor(d.level)} fillOpacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>
        </div>

        {/* Top tools table */}
        <Panel title="Highest Risk Tools" delay={300}>
          {!hasData ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <EmptyMsg msg="No scan data yet — go to Scans and upload a DNS CSV export" />
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  {['#', 'Tool', 'Category', 'Vendor', 'Data Leaves Org', 'Risk', 'Score'].map(h => (
                    <th key={h} style={{
                      padding: '9px 16px', textAlign: 'left',
                      fontFamily: 'var(--mono)', fontSize: 10,
                      color: 'var(--txt-3)', fontWeight: 400,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(report?.top_risk_tools || []).map((t, i) => (
                  <tr key={i}
                    style={{ borderBottom: '1px solid var(--line-soft)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt-4)' }}>{String(i+1).padStart(2,'0')}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 500, fontSize: 13 }}>{t.name}</td>
                    <td style={{ padding: '11px 16px', color: 'var(--txt-2)', fontSize: 12 }}>—</td>
                    <td style={{ padding: '11px 16px', color: 'var(--txt-2)', fontSize: 12 }}>—</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-3)' }}>—</td>
                    <td style={{ padding: '11px 16px' }}><RiskBadge level={t.risk_level} /></td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, maxWidth: 60, height: 3, background: 'var(--bg-4)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${(t.risk_score / 10) * 100}%`, background: colorFor(t.risk_level), borderRadius: 2 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: colorFor(t.risk_level), minWidth: 32 }}>
                          {t.risk_score}
                        </span>
                      </div>
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

function EmptyMsg({ msg, height = 80 }) {
  return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt-4)', letterSpacing: '0.06em' }}>{msg}</span>
    </div>
  )
}
