import { Suspense } from "react";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { ToastProvider } from "./context/ToastProvider";
import AppRoutes from "./routes/AppRoutes";
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Suspense
              fallback={
                <div className="loading" role="status">
                  Cargando página…
                </div>
              }
            >
              <AppRoutes />
            </Suspense>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
