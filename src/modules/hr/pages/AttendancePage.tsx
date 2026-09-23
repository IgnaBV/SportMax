import SearchableSelect from "@/components/common/SearchableSelect";
import { useState, useCallback } from "react";
import { Plus, Pencil } from "lucide-react";
import type { Attendance, Id } from "@/types/entities";
import { Button } from "@/components/ui/button";
import {
  PageTitle,
  QueryState,
  Table,
  Badge,
  Modal,
  DataForm,
} from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadHR, saveAttendance } from "../services/hr";
import { date, same, fullName } from "@/lib/data";
import { useToast } from "@/context/toast";
import { AuditStamp } from "../components/Audit";
import { compareAttendance, hour } from "../services/presentation";
export default function AttendancePage({ employeeId }: { employeeId?: Id }) {
  const loader = useCallback(() => loadHR(employeeId), [employeeId]);
  const q = useQuery(loader);
  const toast = useToast();
  const [employee, setEmployee] = useState("");
  const [day, setDay] = useState("");
  const [edit, setEdit] = useState<Attendance | "new" | null>(null);
  const d = q.data;
  const selected = employeeId ?? employee;
  const schedule = (id: Id) => {
    const matches =
      d?.schedules.filter((s) => s.activo && same(s.trabajador_id, id)) || [];
    return matches.length === 1 ? matches[0] : undefined;
  };
  const action = (
    <Button onClick={() => setEdit("new")}>
      <Plus />
      Registrar asistencia
    </Button>
  );
  return (
    <>
      {employeeId ? (
        <div className="record-section-heading">
          <div>
            <h2>Asistencia</h2>
            <p>Registro de jornada y comparación con el horario vigente.</p>
          </div>
          {action}
        </div>
      ) : (
        <PageTitle
          eyebrow="RECURSOS HUMANOS / CONTROL DIARIO"
          title="Asistencia"
          description="Un registro claro de cada jornada de trabajo."
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
          <label>
            Fecha
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </label>
          <Button
            variant="ghost"
            onClick={() => {
              setDay("");
              setEmployee("");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
        <p className="inline-summary">
          Comparación orientativa con el horario vigente. No recalcula el estado
          ni reconstruye horarios de jornadas anteriores.
        </p>
        <QueryState {...q}>
          <Table
            key={`${selected}-${day}`}
            headers={[
              "Trabajador",
              "Fecha",
              "Entrada registrada",
              "Salida registrada",
              "Horario vigente",
              "Comparación de entrada",
              "Estado",
              "Observación",
              "Última modificación",
              "Acciones",
            ]}
            rows={
              d?.attendance
                .filter(
                  (a) =>
                    (!selected || same(selected, a.trabajador_id)) &&
                    (!day || a.fecha === day),
                )
                .map((a) => [
                  fullName(
                    d.employees.find((e) => same(e.id, a.trabajador_id)) || {
                      nombres: "Trabajador",
                      apellidos: "no disponible",
                    },
                  ),
                  date(a.fecha),
                  hour(a.hora_entrada),
                  hour(a.hora_salida),
                  schedule(a.trabajador_id)
                    ? `${hour(schedule(a.trabajador_id)?.hora_entrada)} — ${hour(schedule(a.trabajador_id)?.hora_salida)}`
                    : "Sin horario",
                  compareAttendance(a, schedule(a.trabajador_id)),
                  <Badge>{a.estado}</Badge>,
                  a.observacion || "—",
                  <AuditStamp record={a} />,
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar asistencia"
                    onClick={() => setEdit(a)}
                  >
                    <Pencil />
                  </Button>,
                ]) || []
            }
          />
        </QueryState>
      </section>
      {edit && (
        <Modal
          title={edit === "new" ? "Registrar asistencia" : "Editar asistencia"}
          onClose={() => setEdit(null)}
        >
          <DataForm
            initial={
              edit === "new"
                ? { estado: "PRESENTE", trabajador_id: String(selected) }
                : { ...edit }
            }
            onClose={() => setEdit(null)}
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
                          .filter(
                            (e) =>
                              e.estado === "ACTIVO" ||
                              (edit !== "new" &&
                                same(e.id, edit.trabajador_id)),
                          )
                          .map((e) => ({
                            value: String(e.id),
                            label: fullName(e),
                          })) || [],
                    },
                  ]
                : []),
              { name: "fecha", label: "Fecha", type: "date", required: true },
              { name: "hora_entrada", label: "Hora de entrada", type: "time" },
              { name: "hora_salida", label: "Hora de salida", type: "time" },
              {
                name: "estado",
                label: "Estado",
                required: true,
                options: ["PRESENTE", "ATRASO", "AUSENTE", "PERMISO"].map(
                  (s) => ({ value: s, label: s }),
                ),
              },
              { name: "observacion", label: "Observación", type: "textarea" },
            ]}
            validate={(v) => {
              const errors: Record<string, string> = {};
              const id = employeeId ?? v.trabajador_id;
              const planned = schedule(id);
              const overnight =
                planned && planned.hora_salida < planned.hora_entrada;
              if (
                d?.attendance.some(
                  (a) =>
                    same(a.trabajador_id, id) &&
                    (edit === "new" || !same(a.id, edit.id)) &&
                    a.fecha === v.fecha,
                )
              )
                errors.fecha =
                  "Ya existe asistencia para este trabajador y fecha";
              if (
                v.hora_salida &&
                (!v.hora_entrada ||
                  v.hora_salida === v.hora_entrada ||
                  (!overnight && v.hora_salida < v.hora_entrada))
              )
                errors.hora_salida =
                  "La salida debe ser posterior a la entrada (salvo un horario nocturno asignado)";
              if (["PRESENTE", "ATRASO"].includes(v.estado) && !v.hora_entrada)
                errors.hora_entrada = "Registra la hora de entrada";
              return errors;
            }}
            onSave={async (v) => {
              await saveAttendance(
                { ...v, trabajador_id: String(employeeId ?? v.trabajador_id) },
                edit === "new" ? undefined : edit.id,
              );
              setEdit(null);
              q.reload();
              toast("Asistencia registrada correctamente");
            }}
          />
        </Modal>
      )}
    </>
  );
}
