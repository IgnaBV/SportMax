import { useState, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle, QueryState, Badge, Empty } from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadHR } from "../services/hr";
import { date, same, fullName } from "@/lib/data";
import EmployeeEditor from "./EmployeeEditor";
import { AuditHistory, AuditStamp } from "./Audit";
import SchedulePanel from "./SchedulePanel";
import AttendancePage from "../pages/AttendancePage";
import DocumentsPage from "../pages/DocumentsPage";
import RequestsPage from "./RequestsPage";
const tabs = [
  ["informacion", "Información"],
  ["asistencia", "Asistencia"],
  ["permisos", "Permisos"],
  ["vacaciones", "Vacaciones"],
  ["horario", "Horario"],
  ["documentos", "Documentos"],
] as const;
export default function EmployeeDetail() {
  const { employeeId } = useParams();
  const [params, setParams] = useSearchParams();
  const loader = useCallback(() => loadHR(employeeId), [employeeId]);
  const q = useQuery(loader);
  const [edit, setEdit] = useState(false);
  const e = q.data?.employees.find((e) => same(e.id, employeeId));
  const tab = tabs.some(([key]) => key === params.get("tab"))
    ? params.get("tab")!
    : "informacion";
  return (
    <>
      <Link className="text-link back-link" to="/hr/employees">
        <ArrowLeft size={16} />
        Volver a trabajadores
      </Link>
      <QueryState {...q}>
        {e ? (
          <>
            <PageTitle
              eyebrow={`RECURSOS HUMANOS / FICHA #${e.id}`}
              title={fullName(e)}
              description={`${e.area || "Sin área"} · ${e.cargo || "Sin cargo"}`}
            />
            <section className="panel employee-record">
              <div className="employee-record-summary">
                <div className="employee-summary">
                  <span className="avatar large">
                    {e.nombres[0]}
                    {e.apellidos[0]}
                  </span>
                  <div>
                    <h3>Identificación: {e.identificacion}</h3>
                    <p>Ingreso: {date(e.fecha_ingreso)}</p>
                    <Badge>{e.estado}</Badge>
                  </div>
                </div>
                <span className="muted">Una ficha para todos sus procesos</span>
              </div>
              <div
                className="tabs employee-tabs"
                role="tablist"
                aria-label="Ficha del trabajador"
              >
                {tabs.map(([key, label], i) => (
                  <button
                    key={key}
                    id={`tab-${key}`}
                    role="tab"
                    aria-controls={`panel-${key}`}
                    aria-selected={tab === key}
                    tabIndex={tab === key ? 0 : -1}
                    className={tab === key ? "active" : ""}
                    onClick={() => setParams({ tab: key })}
                    onKeyDown={(event) => {
                      let index: number;
                      if (event.key === "ArrowRight")
                        index = (i + 1) % tabs.length;
                      else if (event.key === "ArrowLeft")
                        index = (i + tabs.length - 1) % tabs.length;
                      else if (event.key === "Home") index = 0;
                      else if (event.key === "End") index = tabs.length - 1;
                      else return;
                      event.preventDefault();
                      setParams({ tab: tabs[index][0] });
                      document.getElementById(`tab-${tabs[index][0]}`)?.focus();
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div
                className="employee-tab-content"
                role="tabpanel"
                id={`panel-${tab}`}
                aria-labelledby={`tab-${tab}`}
              >
                {tab === "informacion" && (
                  <>
                    <div className="record-section-heading">
                      <h2>Información del trabajador</h2>
                      <Button onClick={() => setEdit(true)}>
                        <Pencil />
                        Editar información
                      </Button>
                    </div>
                    <dl className="detail-grid">
                      {[
                        ["Nombres", e.nombres],
                        ["Apellidos", e.apellidos],
                        ["Identificación", e.identificacion],
                        ["Teléfono", e.telefono],
                        ["Dirección", e.direccion],
                        ["Área", e.area],
                        ["Cargo", e.cargo],
                        ["Fecha de ingreso", date(e.fecha_ingreso)],
                        [
                          "Salario",
                          Number(e.salario).toLocaleString("es-BO", {
                            minimumFractionDigits: 2,
                          }),
                        ],
                        ["Estado", e.estado],
                      ].map(([key, value]) => (
                        <div key={key}>
                          <dt>{key}</dt>
                          <dd>{value || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                    <AuditStamp record={e} />
                    <AuditHistory
                      record={e}
                      fields={{
                        nombres: "Nombres",
                        apellidos: "Apellidos",
                        identificacion: "Identificación",
                        telefono: "Teléfono",
                        direccion: "Dirección",
                        area: "Área",
                        cargo: "Cargo",
                        salario: "Salario",
                        estado: "Estado",
                      }}
                    />
                  </>
                )}
                {tab === "asistencia" && <AttendancePage employeeId={e.id} />}
                {tab === "permisos" && (
                  <RequestsPage type="PERMISO" employeeId={e.id} />
                )}
                {tab === "vacaciones" && (
                  <RequestsPage type="VACACIONES" employeeId={e.id} />
                )}
                {tab === "horario" && <SchedulePanel employeeId={e.id} />}
                {tab === "documentos" && <DocumentsPage employeeId={e.id} />}
              </div>
            </section>
            {edit && (
              <EmployeeEditor
                employee={e}
                onClose={() => setEdit(false)}
                onSaved={q.reload}
              />
            )}
          </>
        ) : (
          <Empty
            title="Trabajador no encontrado"
            text="El registro no existe o tu cuenta no tiene acceso. Regresa al listado para continuar."
          />
        )}
      </QueryState>
    </>
  );
}
