export function Panel({ title, action, children, style = {}, delay = 0 }) {
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r2)',
      overflow: 'hidden',
      animation: `fadeIn 0.4s ease both ${delay}ms`,
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--line-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10,
            color: 'var(--txt-3)', letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>{title}</span>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
