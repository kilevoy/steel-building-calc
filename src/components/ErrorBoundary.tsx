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
        <div className="note note--danger" style={{ margin: 16 }}>
          <div>
            Ошибка в модуле расчёта. Проверьте входные данные или перезагрузите страницу.
          </div>
          {this.state.message ? (
            <div className="text-small" style={{ marginTop: 8 }}>
              {this.state.message}
            </div>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <button type="button" className="btn btn--danger" onClick={this.reset}>
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
