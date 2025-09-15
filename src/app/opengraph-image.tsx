import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  const { width, height } = size
  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '64px',
          background: 'linear-gradient(135deg, #f7fafc 0%, #ffffff 50%, #e2e8f0 100%)',
          color: '#0f172a',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            color: '#2563eb',
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 9999, background: '#2563eb' }} />
          Job Stats Explorer
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
          Tendances, Skills, TJM — en un clin d'œil
        </div>
        <div style={{ fontSize: 28, color: '#334155', maxWidth: 900 }}>
          Explorez votre dataset: filtres puissants, graphiques interactifs et exports rapides.
        </div>
      </div>
    ),
    { ...size },
  )
}
