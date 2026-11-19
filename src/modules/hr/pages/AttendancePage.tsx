import AttendanceDifference from "../components/AttendanceDifference";
import AttendanceEditor from "../components/AttendanceEditor";
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
} from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadHR } from "../services/hr";
import { date, same, fullName } from "@/lib/data";
import { useToast } from "@/context/toast";
import { AuditStamp } from "../components/Audit";
import {
  hour,
} from "../services/presentation";
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
    <Button disabled={q.loading || !!q.error} onClick={() => setEdit("new")}>
      <Plus />
      Marcar entrada / asistencia
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
              "Comparación de salida",
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
                  <AttendanceDifference record={a} schedule={schedule(a.trabajador_id)} kind="entry" />,
                  <AttendanceDifference record={a} schedule={schedule(a.trabajador_id)} kind="exit" />,
                  <Badge>{a.estado}</Badge>,
                  a.observacion || "—",
                  <AuditStamp record={a} />,
                  <Button
                    variant="ghost"
                    aria-label="Editar asistencia"
                    onClick={() => setEdit(a)}
                  >
                    <Pencil />
                    {a.hora_entrada && !a.hora_salida ? "Marcar salida" : "Editar asistencia"}
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
          <AttendanceEditor
            current={edit}
            employeeId={employeeId}
            selected={selected}
            employees={d?.employees ?? []}
            schedules={d?.schedules ?? []}
            records={d?.attendance ?? []}
            onClose={() => setEdit(null)}
            onSaved={() => {
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
