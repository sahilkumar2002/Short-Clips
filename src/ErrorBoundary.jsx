import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#ff4444', background: '#09090b', minHeight: '100vh', fontFamily: 'system-ui' }}>
          <h2>Something went wrong in the UI.</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', background: '#1e1e1e', padding: '1rem', borderRadius: '8px' }}>
            <summary style={{cursor: 'pointer', marginBottom: '1rem', color: '#fff'}}>View Error Details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{marginTop: '2rem', padding: '0.8rem 1.5rem', background: '#1ed760', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
