const RISK = {
  CRITICAL: { color: 'var(--red)',    bg: 'var(--red-d)',    border: '#f0443822' },
  HIGH:     { color: 'var(--orange)', bg: 'var(--orange-d)', border: '#f9731622' },
  MEDIUM:   { color: 'var(--yellow)', bg: 'var(--yellow-d)', border: '#eab30822' },
  LOW:      { color: 'var(--green)',  bg: 'var(--green-d)',  border: '#22c55e22' },
}

export function RiskBadge({ level, size = 'md' }) {
  const s = RISK[level] || { color: 'var(--txt-3)', bg: 'var(--bg-3)', border: 'var(--line)' }
  const small = size === 'sm'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '1px 7px' : '2px 9px',
      borderRadius: 'var(--r1)',
      fontSize: small ? 10 : 11,
      fontFamily: 'var(--mono)',
      fontWeight: 500,
      letterSpacing: '0.06em',
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: s.color, flexShrink: 0,
      }} />
      {level || 'UNKNOWN'}
    </span>
  )
}
