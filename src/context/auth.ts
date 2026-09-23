import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
export type Role = "ADMINISTRADOR" | "INVENTARIO" | "RRHH";
export const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
  role: Role | null;
  error: string;
}>({ session: null, loading: true, role: null, error: "" });
export const useAuth = () => useContext(AuthContext);
