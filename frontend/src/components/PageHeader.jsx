export function PageHeader({ crumb, title, subtitle, action }) {
  return (
    <div style={{
      padding: '22px 32px 20px',
      borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10,
          color: 'var(--txt-3)', letterSpacing: '0.14em',
          marginBottom: 5, textTransform: 'uppercase',
        }}>{crumb}</div>
        <h1 style={{
          fontSize: 20, fontWeight: 600,
          color: 'var(--txt-1)', lineHeight: 1,
          letterSpacing: '-0.01em',
        }}>{title}</h1>
        {subtitle && (
          <p style={{ color: 'var(--txt-2)', marginTop: 5, fontSize: 12 }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
