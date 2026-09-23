import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
export type Role = "ADMINISTRADOR" | "INVENTARIO" | "RRHH";
export const homeForRole = (role: Role | null) =>
  role === "ADMINISTRADOR"
    ? "/dashboard"
    : role === "INVENTARIO"
      ? "/inventory"
      : role === "RRHH"
        ? "/hr"
        : "/login";
export const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
  role: Role | null;
  error: string;
  logout: () => Promise<void>;
}>({
  session: null,
  loading: true,
  role: null,
  error: "",
  logout: async () => {},
});
export const useAuth = () => useContext(AuthContext);
