import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: 16, padding: 40,
          color: 'var(--text-muted)',
        }}>
          <AlertTriangle size={36} style={{ color: 'var(--status-warn)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Algo correu mal
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', textAlign: 'center', maxWidth: 400 }}>
            {this.state.error?.message || 'Erro inesperado neste módulo.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 20px', background: 'var(--accent)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-display)', fontWeight: 600,
              fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
