import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, configurationError } from "@/lib/supabase";
import { AuthContext, type Role } from "./auth";
import { useNavigate } from "react-router-dom";
import { ToastProvider } from "./ToastProvider";
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!configurationError);
  const [error, setError] = useState("");
  useEffect(() => {
    if (configurationError) return;
    let active = true;
    let authChanged = false;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && !authChanged) {
          setSession(data.session);
          setError(error?.message ?? "");
          setLoading(false);
        }
      })
      .catch(() => {
        if (active && !authChanged) {
          setError("No se pudo recuperar la sesión.");
          setLoading(false);
        }
      });
    const { data } = supabase.auth.onAuthStateChange((_event, value) => {
      authChanged = true;
      setSession(value);
      setError("");
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const value = session?.user.app_metadata?.role;
  async function logout() {
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "local",
    });
    if (signOutError) throw signOutError;
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("currentUser");
    setSession(null);
    setError("");
    setLoading(false);
    navigate("/login", { replace: true, state: null });
  }
  const role: Role | null = ["ADMINISTRADOR", "INVENTARIO", "RRHH"].includes(
    value,
  )
    ? value
    : null;
  return (
    <AuthContext.Provider value={{ session, role, loading, error, logout }}>
      <ToastProvider
        key={`${session?.user.id ?? "anonymous"}:${role ?? "none"}`}
      >
        {children}
      </ToastProvider>
    </AuthContext.Provider>
  );
}
