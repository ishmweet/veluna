import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Veluna error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          background: "#0c0b0b",
          color: "#e2ddd9",
          padding: "24px",
          boxSizing: "border-box",
          textAlign: "center",
          fontFamily: "Outfit, Inter, sans-serif"
        }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "480px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
          }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "18px", color: "#ffffff" }}>Something went wrong</h2>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#9e9894", lineHeight: 1.5 }}>
              Veluna encountered an unexpected error:
            </p>
            <pre style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "11.5px",
              color: "#ff6060",
              overflowX: "auto",
              textAlign: "left",
              marginBottom: "24px"
            }}>
              {this.state.error?.message || "Unknown error"}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "var(--v-accent, #e2ddd9)",
                color: "#000000",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Reload Veluna
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
