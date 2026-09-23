import { Component, type ReactNode } from "react";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="error-panel" role="alert">
          <h1>No pudimos mostrar esta página</h1>
          <p>
            Recarga la aplicación para volver a intentarlo. Si el problema
            continúa, contacta al administrador.
          </p>
          <button
            className="text-link"
            onClick={() => window.location.reload()}
          >
            Recargar aplicación
          </button>
        </div>
      );
    return this.props.children;
  }
}
