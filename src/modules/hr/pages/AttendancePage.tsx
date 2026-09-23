import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import type { Attendance } from "@/types/entities";
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
export default function AttendancePage() {
  const q = useQuery(loadHR);
  const toast = useToast();
  const [employee, setEmployee] = useState("");
  const [day, setDay] = useState("");
  const [edit, setEdit] = useState<Attendance | "new" | null>(null);
  const d = q.data;
  return (
    <>
      <PageTitle
        eyebrow="RECURSOS HUMANOS / CONTROL DIARIO"
        title="Asistencia"
        description="Un registro claro de cada jornada de trabajo."
        action={
          <Button onClick={() => setEdit("new")}>
            <Plus />
            Registrar asistencia
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
        <QueryState {...q}>
          <Table
            headers={[
              "Trabajador",
              "Fecha",
              "Entrada",
              "Salida",
              "Estado",
              "Observación",
              "Acciones",
            ]}
            rows={
              d?.attendance
                .filter(
                  (a) =>
                    (!employee || same(employee, a.trabajador_id)) &&
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
                  a.hora_entrada || "—",
                  a.hora_salida || "—",
                  <Badge>{a.estado}</Badge>,
                  a.observacion || "—",
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
            initial={edit === "new" ? { estado: "PRESENTE" } : { ...edit }}
            onClose={() => setEdit(null)}
            fields={[
              {
                name: "trabajador_id",
                label: "Trabajador",
                required: true,
                options:
                  d?.employees
                    .filter(
                      (e) =>
                        e.estado === "ACTIVO" ||
                        (edit !== "new" && same(e.id, edit.trabajador_id)),
                    )
                    .map((e) => ({
                      value: String(e.id),
                      label: fullName(e),
                    })) || [],
              },
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
              if (
                d?.attendance.some(
                  (a) =>
                    same(a.trabajador_id, v.trabajador_id) &&
                    (edit === "new" || !same(a.id, edit.id)) &&
                    a.fecha === v.fecha,
                )
              )
                errors.fecha =
                  "Ya existe asistencia para este trabajador y fecha";
              if (
                v.hora_salida &&
                (!v.hora_entrada || v.hora_salida <= v.hora_entrada)
              )
                errors.hora_salida =
                  "La salida debe ser posterior a la entrada";
              if (["PRESENTE", "ATRASO"].includes(v.estado) && !v.hora_entrada)
                errors.hora_entrada = "Registra la hora de entrada";
              return errors;
            }}
            onSave={async (v) => {
              await saveAttendance(v, edit === "new" ? undefined : edit.id);
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
