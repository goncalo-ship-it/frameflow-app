import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initCapacitor } from './core/capacitor.js'

// Initialize Capacitor native plugins (no-op on web)
initCapacitor()

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#fff', background: '#2A3040', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#f44' }}>FrameFlow — Crash</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ffa' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#aaa', fontSize: 12 }}>{this.state.error.stack}</pre>
          <button onClick={() => { localStorage.removeItem('frame-v1'); window.location.reload() }}
            style={{ marginTop: 20, padding: '10px 24px', background: '#f90', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
            Reset &amp; Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err =>
      console.warn('SW registration failed:', err)
    )
  })
}
