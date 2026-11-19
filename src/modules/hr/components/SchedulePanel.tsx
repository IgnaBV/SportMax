import { useState, useCallback } from "react";
import { Plus, Pencil, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DataForm,
  Modal,
  QueryState,
  Table,
  Badge,
} from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadHR, saveSchedule } from "../services/hr";
import { same } from "@/lib/data";
import { useToast } from "@/context/toast";
import { useAuth } from "@/context/auth";
import type { Id } from "@/types/entities";
import { AuditHistory, AuditStamp } from "./Audit";
import { hour } from "../services/presentation";
export default function SchedulePanel({ employeeId }: { employeeId: Id }) {
  const loader = useCallback(() => loadHR(employeeId), [employeeId]);
  const q = useQuery(loader);
  const toast = useToast();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const schedules =
    q.data?.schedules.filter((s) => same(s.trabajador_id, employeeId)) || [];
  const active = schedules.filter((s) => s.activo);
  const current = active.length === 1 ? active[0] : undefined;
  return (
    <section>
      <div className="record-section-heading">
        <div>
          <h2>Horario de trabajo asignado</h2>
          <p>
            Define la hora de entrada y salida que debe cumplir el trabajador.
          </p>
        </div>
        <Button
          disabled={q.loading || !!q.error || active.length > 1}
          onClick={() => setOpen(true)}
        >
          {current ? <Pencil /> : <Plus />}
          {current ? "Modificar horario" : "Asignar horario"}
        </Button>
      </div>
      <QueryState {...q}>
        {active.length > 1 ? (
          <p role="alert" className="error-panel">
            Hay varios horarios activos. Revisa los datos antes de continuar.
          </p>
        ) : current ? (
          <div className="schedule-card">
            <Clock3 />
            <div>
              <span>Horario vigente</span>
              <h3>
                {hour(current.hora_entrada)} — {hour(current.hora_salida)}
              </h3>
              {current.hora_salida < current.hora_entrada && (
                <small>La salida corresponde al día siguiente.</small>
              )}
            </div>
            <AuditStamp record={current} />
          </div>
        ) : (
          <p className="notice">Todavía no hay un horario asignado.</p>
        )}
        {current && (
          <AuditHistory
            record={current}
            fields={{
              hora_entrada: "Entrada",
              hora_salida: "Salida",
              activo: "Vigente",
            }}
          />
        )}
        {schedules.some((s) => !s.activo) && (
          <Table
            headers={["Entrada", "Salida", "Estado", "Última modificación"]}
            rows={schedules
              .filter((s) => !s.activo)
              .map((s) => [
                hour(s.hora_entrada),
                hour(s.hora_salida),
                <Badge>INACTIVO</Badge>,
                <AuditStamp record={s} />,
              ])}
          />
        )}
      </QueryState>
      {open && (
        <Modal
          title={current ? "Actualizar horario" : "Asignar horario"}
          onClose={() => setOpen(false)}
        >
          <p className="modal-note">
            Responsable: {session?.user.email}. El cambio conservará el
            historial anterior. Una salida anterior a la entrada representa un
            turno nocturno.
          </p>
          <DataForm
            initial={
              current
                ? {
                    hora_entrada: current.hora_entrada.slice(0, 5),
                    hora_salida: current.hora_salida.slice(0, 5),
                  }
                : {}
            }
            fields={[
              {
                name: "hora_entrada",
                label: "Hora de entrada",
                type: "time",
                required: true,
              },
              {
                name: "hora_salida",
                label: "Hora de salida",
                type: "time",
                required: true,
              },
            ]}
            validate={(v): Record<string, string> =>
              v.hora_entrada === v.hora_salida
                ? { hora_salida: "La entrada y la salida deben ser distintas" }
                : {}
            }
            onClose={() => setOpen(false)}
            onSave={async (v) => {
              await saveSchedule(employeeId, v, current);
              setOpen(false);
              q.reload();
              toast("Horario guardado con su responsable e historial");
            }}
          />
        </Modal>
      )}
    </section>
  );
}
