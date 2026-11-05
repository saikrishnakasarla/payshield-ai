import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PayShield Root Error intercepted:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#050A12',
          color: '#F5FAFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            backgroundColor: '#0C1B2A',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            borderRadius: '1.25rem',
            padding: '2.5rem',
            boxShadow: '0 0 30px rgba(0, 229, 255, 0.15)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 82, 99, 0.15)',
              border: '1px solid #FF5263',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: '#FF5263',
              fontSize: '24px'
            }}>
              !
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#F5FAFF' }}>
              Security Module Encountered an Issue
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#A6B6C7', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
              The application recovered from an unexpected error. Try refreshing the workspace.
            </p>
            {this.state.error?.message && (
              <pre style={{
                backgroundColor: '#071522',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#FF5263',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg, #00E5FF 0%, #0099FF 100%)',
                color: '#050A12',
                fontWeight: 700,
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.35)'
              }}
            >
              Refresh Operations Center
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
