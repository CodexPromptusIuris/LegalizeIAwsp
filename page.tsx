export default function Home() {
  return (
    <main style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: '#F4F7FB', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
    }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{
          background: '#0B2B5C', borderRadius: 16, padding: '2rem',
          color: '#fff', marginBottom: '1.5rem',
          boxShadow: '0 12px 40px rgba(11,43,92,0.2)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚖️</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Legalizes</h1>
          <p style={{ color: '#90A4BE', margin: '0.5rem 0 0', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Agente Legal Chileno · WhatsApp
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #B8D0EE', marginBottom: '1rem' }}>
          <h2 style={{ color: '#0B2B5C', fontSize: '1rem', marginTop: 0 }}>✅ Bot activo</h2>
          <p style={{ color: '#4A5568', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
            Base normativa local: <strong>3.820 artículos</strong><br />
            CC · CPC · CPP · Código del Trabajo · Ley 21.719
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            ['💼', 'Derecho Laboral'],
            ['📜', 'Derecho Civil'],
            ['🛡️', 'Derecho Penal'],
            ['🔐', 'Ley 21.719'],
          ].map(([icon, label]) => (
            <div key={label} style={{
              background: '#EBF2FB', borderRadius: 8, padding: '0.75rem',
              border: '1px solid #B8D0EE', fontSize: '0.8rem', color: '#0B2B5C', fontWeight: 600
            }}>
              {icon} {label}
            </div>
          ))}
        </div>

        <a
          href={`https://wa.me/${(process.env.NEXT_PUBLIC_WA_NUMBER || '56929648142')}`}
          style={{
            display: 'block', background: '#25D366', color: '#fff',
            padding: '1rem', borderRadius: 10, textDecoration: 'none',
            fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem'
          }}
        >
          💬 Consultar por WhatsApp
        </a>

        <p style={{ color: '#90A4BE', fontSize: '0.7rem', margin: 0 }}>
          VibeCodingChile · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
