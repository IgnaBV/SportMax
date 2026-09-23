import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
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
import type { Request } from "@/types/entities";
export default function RequestsPage({
  type,
}: {
  type: "PERMISO" | "VACACIONES";
}) {
  const q = useQuery(loadHR);
  const toast = useToast();
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<{
    request: Request;
    status: string;
  } | null>(null);
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const d = q.data;
  const title = type === "PERMISO" ? "Permisos" : "Vacaciones";
  const displayDate = (v: string) =>
    new Date(v).toLocaleString("es-BO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  return (
    <>
      <PageTitle
        eyebrow="RECURSOS HUMANOS / SOLICITUDES"
        title={title}
        description="Gestiona las solicitudes de tu equipo con claridad y seguimiento."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Nueva solicitud
          </Button>
        }
      />
      <section className="panel">
        <div className="toolbar">
          <select
            aria-label="Trabajador"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
          >
            <option value="">Todos los trabajadores</option>
            {d?.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {fullName(e)}
              </option>
            ))}
          </select>
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
            headers={[
              "Trabajador",
              "Inicio",
              "Fin",
              "Motivo",
              "Estado",
              "Respuesta",
              "Acciones",
            ]}
            rows={
              d?.requests
                .filter(
                  (r) =>
                    r.tipo === type &&
                    (!employee || same(employee, r.trabajador_id)) &&
                    (!status || status === r.estado),
                )
                .map((r) => [
                  fullName(
                    d.employees.find((e) => same(e.id, r.trabajador_id)) || {
                      nombres: "Trabajador",
                      apellidos: "no disponible",
                    },
                  ),
                  displayDate(r.fecha_inicio),
                  displayDate(r.fecha_fin),
                  r.motivo,
                  <Badge>{r.estado}</Badge>,
                  r.observacion_respuesta || "—",
                  r.estado === "PENDIENTE" ? (
                    <div className="row-actions">
                      <Button
                        variant="outline"
                        title="Aprobar"
                        onClick={() => {
                          setDecision({ request: r, status: "APROBADO" });
                          setResponse("");
                        }}
                      >
                        <Check />
                        Aprobar
                      </Button>
                      <Button
                        variant="ghost"
                        title="Rechazar"
                        onClick={() => {
                          setDecision({ request: r, status: "RECHAZADO" });
                          setResponse("");
                        }}
                      >
                        <X />
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    "Atendida"
                  ),
                ]) || []
            }
          />
        </QueryState>
      </section>
      {open && (
        <Modal
          title={`Solicitar ${title.toLowerCase()}`}
          onClose={() => setOpen(false)}
        >
          <DataForm
            onClose={() => setOpen(false)}
            fields={[
              {
                name: "trabajador_id",
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
              toast(
                e instanceof Error ? e.message : "No fue posible guardar",
                true,
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            Confirma tu decisión para la solicitud seleccionada. El cambio
            quedará registrado.
          </p>
          <label htmlFor="response">Observación de respuesta</label>
          <textarea
            id="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={busy}
          />
        </Confirm>
      )}
    </>
  );
}
