import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Calculation module error", error, errorInfo);
  }

  private reset = () => {
    this.setState({ hasError: false, message: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, fontSize: 14, color: "#b91c1c" }}>
          <div>
            Ошибка в модуле расчёта. Проверьте входные данные или перезагрузите страницу.
          </div>
          {this.state.message ? (
            <div style={{ marginTop: 8, fontSize: 12, color: "#7f1d1d" }}>
              {this.state.message}
            </div>
          ) : null}
          <button
            type="button"
            onClick={this.reset}
            style={{
              marginTop: 12,
              padding: "6px 12px",
              border: "1px solid #fecaca",
              borderRadius: 4,
              background: "#fff1f2",
              color: "#991b1b",
              cursor: "pointer",
            }}
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
