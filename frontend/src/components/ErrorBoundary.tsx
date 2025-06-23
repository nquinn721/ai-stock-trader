import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error);
    console.error("Error info:", errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            background: "#1a1a1a",
            color: "#fff",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
          }}
        >
          <h2 style={{ color: "#ff6b6b", marginBottom: "20px" }}>
            🚨 Application Error
          </h2>
          <div
            style={{
              background: "#2a2a2a",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "800px",
              width: "100%",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ color: "#ffd93d" }}>Error Details:</h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: "14px",
                color: "#ff9999",
                marginBottom: "10px",
              }}
            >
              {this.state.error?.toString()}
            </pre>
            {this.state.errorInfo && (
              <details style={{ marginTop: "10px" }}>
                <summary style={{ color: "#6bcf7f", cursor: "pointer" }}>
                  Stack Trace
                </summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "12px",
                    color: "#cccccc",
                    marginTop: "10px",
                    maxHeight: "300px",
                    overflow: "auto",
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
          <button
            onClick={() => {
              this.setState({
                hasError: false,
                error: undefined,
                errorInfo: undefined,
              });
              window.location.reload();
            }}
            style={{
              background: "#6bcf7f",
              color: "#1a1a1a",
              border: "none",
              padding: "12px 24px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            🔄 Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
