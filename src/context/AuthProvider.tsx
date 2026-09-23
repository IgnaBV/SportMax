import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, configurationError } from "@/lib/supabase";
import { AuthContext, type Role } from "./auth";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!configurationError);
  const [error, setError] = useState("");
  useEffect(() => {
    if (configurationError) return;
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(data.session);
          setError(error?.message ?? "");
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("No se pudo recuperar la sesión.");
          setLoading(false);
        }
      });
    const { data } = supabase.auth.onAuthStateChange((_event, value) => {
      setSession(value);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const value = session?.user.app_metadata?.role;
  const role: Role | null = ["ADMINISTRADOR", "INVENTARIO", "RRHH"].includes(
    value,
  )
    ? value
    : null;
  return (
    <AuthContext.Provider value={{ session, role, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
