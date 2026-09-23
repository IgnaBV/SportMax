import SearchableSelect from "@/components/common/SearchableSelect";
import { useState, useCallback } from "react";
import { Plus, Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageTitle,
  QueryState,
  Table,
  Badge,
  Modal,
  DataForm,
  Confirm,
} from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadHR, saveRequest, resolveRequest } from "../services/hr";
import { same, fullName } from "@/lib/data";
import { useToast } from "@/context/toast";
import { useAuth } from "@/context/auth";
import type { Request, Id } from "@/types/entities";
import { AuditHistory, AuditStamp } from "./Audit";
import { timestamp } from "../services/presentation";
export default function RequestsPage({
  type,
  employeeId,
}: {
  type: "PERMISO" | "VACACIONES";
  employeeId?: Id;
}) {
  const loader = useCallback(() => loadHR(employeeId), [employeeId]);
  const q = useQuery(loader);
  const toast = useToast();
  const { session } = useAuth();
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Request | null>(null);
  const [decision, setDecision] = useState<{
    request: Request;
    status: "APROBADO" | "RECHAZADO";
  } | null>(null);
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const d = q.data;
  const title = type === "PERMISO" ? "Permisos" : "Vacaciones";
  const selected = employeeId ?? employee;
  const action = (
    <Button onClick={() => setOpen(true)}>
      <Plus />
      Nueva solicitud
    </Button>
  );
  return (
    <>
      {employeeId ? (
        <div className="record-section-heading">
          <div>
            <h2>{title}</h2>
            <p>Consulta, registra y resuelve solicitudes de este trabajador.</p>
          </div>
          {action}
        </div>
      ) : (
        <PageTitle
          eyebrow="RECURSOS HUMANOS / SOLICITUDES"
          title={title}
          description="Gestiona las solicitudes de tu equipo con claridad y seguimiento."
          action={action}
        />
      )}
      <section className="panel">
        <div className="toolbar">
          {!employeeId && (
            <SearchableSelect
              label="Trabajador"
              value={employee}
              onChange={setEmployee}
              placeholder="Todos los trabajadores"
              options={
                d?.employees.map((e) => ({
                  value: String(e.id),
                  label: fullName(e),
                })) ?? []
              }
            />
          )}
          <select
            aria-label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {["PENDIENTE", "APROBADO", "RECHAZADO"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <QueryState {...q}>
          <Table
            key={`${selected}-${status}`}
            headers={[
              "Trabajador",
              "Inicio",
              "Fin",
              "Motivo",
              "Estado",
              "Responsable / fecha",
              "Consulta",
              "Decisión",
            ]}
            rows={
              d?.requests
                .filter(
                  (r) =>
                    r.tipo === type &&
                    (!selected || same(selected, r.trabajador_id)) &&
                    (!status || status === r.estado),
                )
                .map((r) => [
                  fullName(
                    d.employees.find((e) => same(e.id, r.trabajador_id)) || {
                      nombres: "Trabajador",
                      apellidos: "no disponible",
                    },
                  ),
                  timestamp(r.fecha_inicio),
                  timestamp(r.fecha_fin),
                  r.motivo,
                  <Badge>{r.estado}</Badge>,
                  <AuditStamp record={r} />,
                  <Button variant="ghost" onClick={() => setView(r)}>
                    <Eye />
                    Consultar
                  </Button>,
                  r.estado === "PENDIENTE" ? (
                    <div className="row-actions">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDecision({ request: r, status: "APROBADO" });
                          setResponse("");
                          setError("");
                        }}
                      >
                        <Check />
                        Aprobar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setDecision({ request: r, status: "RECHAZADO" });
                          setResponse("");
                          setError("");
                        }}
                      >
                        <X />
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    "Resuelta"
                  ),
                ]) || []
            }
          />
        </QueryState>
      </section>
      {view && (
        <Modal
          title={`Consulta de ${type === "PERMISO" ? "permiso" : "vacaciones"}`}
          onClose={() => setView(null)}
        >
          <div className="modal-body">
            <Badge>{view.estado}</Badge>
            <p>
              {timestamp(view.fecha_inicio)} — {timestamp(view.fecha_fin)}
            </p>
            <p>{view.motivo}</p>
            <h3>Respuesta</h3>
            <p>{view.observacion_respuesta || "Sin observación"}</p>
            <AuditStamp record={view} />
            <AuditHistory
              record={view}
              fields={{
                estado: "Estado",
                observacion_respuesta: "Respuesta",
                fecha_inicio: "Inicio",
                fecha_fin: "Fin",
                motivo: "Motivo",
              }}
            />
          </div>
        </Modal>
      )}
      {open && (
        <Modal
          title={`Solicitar ${title.toLowerCase()}`}
          onClose={() => setOpen(false)}
        >
          <DataForm
            initial={{ trabajador_id: String(employeeId ?? employee) }}
            onClose={() => setOpen(false)}
            fields={[
              ...(!employeeId
                ? [
                    {
                      name: "trabajador_id",
                      searchable: true,
                      label: "Trabajador",
                      required: true,
                      options:
                        d?.employees
                          .filter((e) => e.estado === "ACTIVO")
                          .map((e) => ({
                            value: String(e.id),
                            label: fullName(e),
                          })) || [],
                    },
                  ]
                : []),
              {
                name: "fecha_inicio",
                label: "Fecha y hora inicial",
                type: "datetime-local",
                required: true,
              },
              {
                name: "fecha_fin",
                label: "Fecha y hora final",
                type: "datetime-local",
                required: true,
              },
              {
                name: "motivo",
                label: "Motivo",
                type: "textarea",
                required: true,
              },
            ]}
            validate={(v): Record<string, string> =>
              new Date(v.fecha_fin) <= new Date(v.fecha_inicio)
                ? {
                    fecha_fin: "La fecha final debe ser posterior a la inicial",
                  }
                : {}
            }
            onSave={async (v) => {
              await saveRequest(
                {
                  ...v,
                  trabajador_id: String(employeeId ?? v.trabajador_id),
                  fecha_inicio: new Date(v.fecha_inicio).toISOString(),
                  fecha_fin: new Date(v.fecha_fin).toISOString(),
                },
                type,
              );
              setOpen(false);
              q.reload();
              toast("Solicitud registrada correctamente");
            }}
          />
        </Modal>
      )}
      {decision && (
        <Confirm
          title={
            decision.status === "APROBADO"
              ? "Aprobar solicitud"
              : "Rechazar solicitud"
          }
          busy={busy}
          onClose={() => setDecision(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await resolveRequest(
                decision.request.id,
                decision.status,
                response.trim(),
              );
              setDecision(null);
              q.reload();
              toast(
                decision.status === "APROBADO"
                  ? "Solicitud aprobada"
                  : "Solicitud rechazada",
              );
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "No fue posible guardar",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            <strong>
              {fullName(
                d?.employees.find((e) =>
                  same(e.id, decision.request.trabajador_id),
                ) || { nombres: "Trabajador", apellidos: "" },
              )}
            </strong>
          </p>
          <p>
            {timestamp(decision.request.fecha_inicio)} —{" "}
            {timestamp(decision.request.fecha_fin)}
          </p>
          <p>{decision.request.motivo}</p>
          <p>
            Responsable de la decisión: <strong>{session?.user.email}</strong>.
            El estado resuelto y su responsable quedarán registrados.
          </p>
          <label htmlFor="response">Observación de respuesta</label>
          <textarea
            id="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={busy}
          />
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </Confirm>
      )}
    </>
  );
}
