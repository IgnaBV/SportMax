import { useState } from "react";
import { Modal, Table, Badge } from "@/components/common/UI";
import { date, same, fullName } from "@/lib/data";
import type { Employee } from "@/types/entities";
import type { loadHR } from "../services/hr";
export default function EmployeeDetail({
  employee: e,
  data,
  onClose,
}: {
  employee: Employee;
  data: Awaited<ReturnType<typeof loadHR>>;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("Información");
  return (
    <Modal title={fullName(e)} onClose={onClose}>
      <div className="modal-body">
        <div className="employee-summary">
          <span className="avatar large">
            {e.nombres[0]}
            {e.apellidos[0]}
          </span>
          <div>
            <h3>{e.cargo}</h3>
            <p>
              {e.area} · Ingreso: {date(e.fecha_ingreso)}
            </p>
            <Badge>{e.estado}</Badge>
          </div>
        </div>
        <div className="tabs" role="tablist">
          {[
            "Información",
            "Horarios",
            "Asistencia",
            "Permisos",
            "Vacaciones",
            "Documentos",
          ].map((t) => (
            <button
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? "active" : ""}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div role="tabpanel">
          {tab === "Horarios" && (
            <Table
              headers={["Entrada", "Salida", "Estado"]}
              rows={data.schedules
                .filter((s) => same(s.trabajador_id, e.id))
                .map((s) => [
                  s.hora_entrada,
                  s.hora_salida,
                  <Badge>{s.activo ? "ACTIVO" : "INACTIVO"}</Badge>,
                ])}
            />
          )}
          {tab === "Información" && (
            <dl className="detail-grid">
              {[
                ["Identificación", e.identificacion],
                ["Teléfono", e.telefono],
                ["Dirección", e.direccion],
                [
                  "Salario",
                  Number(e.salario).toLocaleString("es-BO", {
                    minimumFractionDigits: 2,
                  }),
                ],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab === "Asistencia" && (
            <Table
              headers={["Fecha", "Entrada", "Salida", "Estado"]}
              rows={data.attendance
                .filter((a) => same(a.trabajador_id, e.id))
                .map((a) => [
                  date(a.fecha),
                  a.hora_entrada || "—",
                  a.hora_salida || "—",
                  <Badge>{a.estado}</Badge>,
                ])}
            />
          )}
          {(tab === "Permisos" || tab === "Vacaciones") && (
            <Table
              headers={["Inicio", "Fin", "Motivo", "Estado"]}
              rows={data.requests
                .filter(
                  (r) =>
                    same(r.trabajador_id, e.id) &&
                    r.tipo === (tab === "Permisos" ? "PERMISO" : "VACACIONES"),
                )
                .map((r) => [
                  date(r.fecha_inicio),
                  date(r.fecha_fin),
                  r.motivo,
                  <Badge>{r.estado}</Badge>,
                ])}
            />
          )}
          {tab === "Documentos" && (
            <Table
              headers={["Documento", "Tipo", "Fecha", "Archivo"]}
              rows={data.documents
                .filter((d) => same(d.trabajador_id, e.id))
                .map((d) => [
                  d.nombre,
                  d.tipo,
                  date(d.created_at),
                  /^https:\/\//i.test(d.archivo_url) ? (
                    <a
                      className="text-link"
                      href={d.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir archivo ↗
                    </a>
                  ) : (
                    "URL no válida"
                  ),
                ])}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
