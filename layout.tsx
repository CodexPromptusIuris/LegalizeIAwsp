import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legalizes — Agente Legal Chileno',
  description: 'Consultas jurídicas sobre derecho chileno via WhatsApp. CC, CPC, CPP, Código del Trabajo, Ley 21.719.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
