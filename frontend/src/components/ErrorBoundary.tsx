import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '32px',
            margin: '24px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            color: '#f8fafc',
          }}
        >
          <h3 style={{ color: '#f87171', marginTop: 0 }}>
            {this.props.fallbackTitle || 'Component Error'}
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this view.'}
          </p>
          <button
            type="button"
            className="button button-secondary small"
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{ marginTop: '12px' }}
          >
            Reload Component
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
