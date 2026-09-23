import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { AlertCircle, Inbox, LoaderCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  const text = String(children);
  return (
    <span
      className={`badge ${/^(APROBADO|ACTIVO|PRESENTE|ENTRADA|Correcto)$/.test(text) ? "green" : /^(PENDIENTE|ATRASO|Bajo|AJUSTE)$/.test(text) ? "gold" : /^(RECHAZADO|AUSENTE|SALIDA|Sin stock)$/.test(text) ? "red" : ""}`}
    >
      {children}
    </span>
  );
}
export function Empty({
  title = "Todavía no hay registros",
  text = "Los datos aparecerán aquí cuando registres la primera operación.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <span>
        <Inbox size={30} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function QueryState({
  loading,
  error,
  reload,
  children,
}: {
  loading: boolean;
  error: string;
  reload: () => void;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="loading" role="status">
        <LoaderCircle className="spin" /> Cargando información…
      </div>
    );
  if (error)
    return (
      <div className="error-panel" role="alert">
        <AlertCircle />
        <h3>No pudimos cargar la información</h3>
        <p>{error}</p>
        <Button variant="outline" onClick={reload}>
          Volver a intentar
        </Button>
      </div>
    );
  return children;
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Buscar…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search">
      <Search size={18} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
export function Table({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  const [page, setPage] = useState(0);
  const max = Math.max(0, Math.ceil(rows.length / 12) - 1);
  const current = Math.min(page, max);
  return (
    <>
      {rows.length ? (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(current * 12, current * 12 + 12).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              {rows.length} registros · Página {current + 1} de {max + 1}
            </span>
            <div>
              <Button
                variant="ghost"
                disabled={!current}
                onClick={() => setPage(current - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                disabled={current >= max}
                onClick={() => setPage(current + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      ) : (
        <Empty
          title={empty || "No se encontraron resultados"}
          text="Prueba con otros filtros o registra nueva información."
        />
      )}
    </>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => {
    if (!ref.current?.querySelector("fieldset[disabled]")) onClose();
  };
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="modal-header">
        <h2 id={titleId}>{title}</h2>
        <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={close}>
          <X />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  children,
  onConfirm,
  onClose,
  busy,
}: {
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  return (
    <Modal
      title={title}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="modal-body">{children}</div>
      <div className="modal-footer">
        <Button variant="outline" disabled={busy} onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={busy} onClick={onConfirm}>
          {busy ? "Guardando…" : "Confirmar operación"}
        </Button>
      </div>
    </Modal>
  );
}
export interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  step?: string;
  options?: { value: string; label: string }[];
  section?: string;
}
export function DataForm({
  fields,
  initial = {},
  onSave,
  onClose,
  validate,
}: {
  fields: Field[];
  initial?: Record<string, unknown>;
  onSave: (values: Record<string, string>) => Promise<void>;
  onClose: () => void;
  validate?: (v: Record<string, string>) => Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [f.name, String(initial[f.name] ?? "")]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.name].trim();
      if (f.required && !v) next[f.name] = "Este campo es obligatorio";
      if (
        v &&
        f.type === "number" &&
        (!Number.isFinite(Number(v)) ||
          (f.min !== undefined && Number(v) < f.min))
      )
        next[f.name] = `Introduce un número válido, mínimo ${f.min ?? 0}`;
      if (v && f.type?.includes("date") && Number.isNaN(Date.parse(v)))
        next[f.name] = "Introduce una fecha válida";
      if (v && f.type === "url") {
        try {
          const url = new URL(v);
          if (url.protocol !== "https:" || url.username || url.password)
            throw new Error("Invalid URL");
        } catch {
          next[f.name] = "Introduce una URL HTTPS válida, sin credenciales";
        }
      }
    }
    Object.assign(next, validate?.(values));
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await onSave(
        Object.fromEntries(
          Object.entries(values).map(([k, v]) => [k, v.trim()]),
        ),
      );
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : "Error al guardar" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={busy} className="form-grid modal-body">
        {fields.map((f) => (
          <div
            key={f.name}
            className={
              f.type === "textarea" || f.section ? "field wide" : "field"
            }
          >
            {f.section && <h3 className="form-section">{f.section}</h3>}
            <label htmlFor={f.name}>
              {f.label}
              {f.required && " *"}
            </label>
            {f.options ? (
              <select
                id={f.name}
                value={values[f.name]}
                onChange={(e) =>
                  setValues({ ...values, [f.name]: e.target.value })
                }
              >
                <option value="">Seleccionar…</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                id={f.name}
                value={values[f.name]}
                onChange={(e) =>
                  setValues({ ...values, [f.name]: e.target.value })
                }
              />
            ) : (
              <input
                id={f.name}
                type={f.type || "text"}
                min={f.min}
                step={f.step}
                value={values[f.name]}
                onChange={(e) =>
                  setValues({ ...values, [f.name]: e.target.value })
                }
                aria-invalid={!!errors[f.name]}
                aria-describedby={
                  errors[f.name] ? `${f.name}-error` : undefined
                }
              />
            )}
            {errors[f.name] && (
              <small className="field-error" id={`${f.name}-error`}>
                {errors[f.name]}
              </small>
            )}
          </div>
        ))}
        {errors.form && (
          <p role="alert" className="field-error wide">
            {errors.form}
          </p>
        )}
      </fieldset>
      <div className="modal-footer">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
