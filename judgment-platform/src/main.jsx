import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("COATS Application Crash caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          backgroundColor: "#141312",
          color: "#F5F3EF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
          <div style={{
            maxWidth: "600px",
            width: "100%",
            background: "#1E1D1B",
            border: "1px solid #3A3530",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 style={{ fontSize: "1.25rem", color: "#E05252", marginBottom: "0.75rem", fontWeight: 700 }}>
              COATS Encountered an Initialization Issue
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#A8A29E", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              {this.state.error?.message || "An unexpected error occurred while loading the application interface."}
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "0.6rem 1.25rem",
                  background: "#C5A059",
                  color: "#141312",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer"
                }}
              >
                Reload Application
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                style={{
                  padding: "0.6rem 1.25rem",
                  background: "transparent",
                  color: "#C5A059",
                  border: "1px solid #C5A059",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer"
                }}
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)

