import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          height: "100vh", background: "#1a1a1a", color: "#fff", fontFamily: "monospace", padding: "2rem", gap: "1rem"
        }}>
          <h1 style={{ color: "#ff5555", fontSize: "1.5rem" }}>⚠ OpenNotes crashed</h1>
          <p style={{ color: "#aaa", fontSize: "0.875rem" }}>An error occurred during rendering.</p>
          <pre style={{
            background: "#111", color: "#ff9999", padding: "1rem", borderRadius: "8px",
            maxWidth: "80vw", overflowX: "auto", fontSize: "0.75rem", lineHeight: 1.5,
            whiteSpace: "pre-wrap", wordBreak: "break-word"
          }}>
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: "0.5rem 1rem", background: "#0075de", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
