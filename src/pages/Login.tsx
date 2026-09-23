import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Layers3, ArrowRight, ShieldCheck, Boxes, Users } from "lucide-react";
import { supabase, configurationError } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
export default function Login() {
  const { session, loading, error: authError } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (session)
    return <Navigate to={location.state?.from || "/dashboard"} replace />;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No fue posible iniciar sesión",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login">
      <section className="login-story">
        <div className="brand">
          <Layers3 />
          <div>Sport Max</div>
        </div>
        <div>
          <span className="eyebrow">CADA DETALLE, BAJO CONTROL</span>
          <h1>
            Tu empresa.
            <br />
            En un mismo lugar.
          </h1>
          <p>
            La claridad que necesitas para gestionar tu inventario y cuidar de
            tu equipo.
          </p>
          <div className="login-features">
            <span>
              <Boxes />
              Inventarios conectados
            </span>
            <span>
              <Users />
              Personas primero
            </span>
          </div>
        </div>
        <small>Orden para hoy. Visión para mañana.</small>
      </section>
      <section className="login-form">
        <div>
          <span className="eyebrow">BIENVENIDO A SPORT MAX</span>
          <h2>Inicia sesión</h2>
          <p>Ingresa con tu cuenta empresarial para continuar.</p>
          {configurationError && (
            <div className="notice">
              <strong>Conexión pendiente</strong>
              <p>{configurationError}</p>
            </div>
          )}
          <form onSubmit={submit}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              autoComplete="username"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
            />
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
            />
            {(error || authError) && (
              <p className="field-error" role="alert">
                {error || authError}
              </p>
            )}
            <Button
              type="submit"
              disabled={busy || loading || !!configurationError}
            >
              {busy ? "Ingresando…" : "Ingresar al sistema"}
              <ArrowRight size={18} />
            </Button>
          </form>
          <div className="login-secure">
            <ShieldCheck size={16} />
            Tu información está en un espacio privado.
          </div>
          <p className="login-help">
            ¿Necesitas una cuenta? Contacta al administrador de tu empresa.
          </p>
        </div>
      </section>
    </div>
  );
}
