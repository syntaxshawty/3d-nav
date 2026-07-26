import { Link } from 'react-router-dom'

export default function FirstGardenObjectPage() {
  return (
    <div style={{ padding: '3rem 2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>First Garden Object</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Full-page view</p>
      <p style={{ lineHeight: 1.7, color: '#333' }}>
        This is the full static page for the first garden object. Add any content here —
        images, longer writing, project details — that wouldn't fit in the 3D overlay.
      </p>
      <Link to="/" style={{ display: 'inline-block', marginTop: '2rem', color: '#555' }}>
        ← Back to garden
      </Link>
    </div>
  )
}
