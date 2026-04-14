export function KpiCard({ label, value, color, sub, delay = 0, loading }) {
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r2)',
      padding: '16px 20px',
      animation: `fadeIn 0.35s ease both ${delay}ms`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, background: color, borderRadius: '3px 0 0 3px',
      }} />

      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10,
        color: 'var(--txt-3)', letterSpacing: '0.12em',
        marginBottom: 10, textTransform: 'uppercase',
      }}>{label}</div>

      {loading ? (
        <div className="skeleton" style={{ width: 48, height: 32, marginBottom: 6 }} />
      ) : (
        <div style={{
          fontFamily: 'var(--mono)', fontWeight: 600,
          fontSize: 32, lineHeight: 1, color,
          letterSpacing: '-0.02em',
        }}>
          {value ?? 0}
        </div>
      )}

      {sub && (
        <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  )
}
