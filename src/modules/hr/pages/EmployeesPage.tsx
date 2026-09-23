import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageTitle,
  QueryState,
  SearchBox,
  Table,
  Badge,
} from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadEmployees } from "../services/hr";
import { fullName, date } from "@/lib/data";
import EmployeeEditor from "../components/EmployeeEditor";
import type { Employee } from "@/types/entities";
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export default function EmployeesPage() {
  const q = useQuery(loadEmployees);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("");
  const [cargo, setCargo] = useState("");
  const [status, setStatus] = useState("");
  const [edit, setEdit] = useState<Employee | "new" | null>(null);
  const rows =
    q.data?.filter(
      (e) =>
        normalize(`${fullName(e)} ${e.identificacion}`).includes(
          normalize(search),
        ) &&
        (!area || e.area === area) &&
        (!cargo || e.cargo === cargo) &&
        (!status || e.estado === status),
    ) || [];
  return (
    <>
      <PageTitle
        eyebrow="RECURSOS HUMANOS / EQUIPO"
        title="Trabajadores"
        description="Encuentra a cada persona y accede a su ficha centralizada."
        action={
          <Button onClick={() => setEdit("new")}>
            <Plus />
            Nuevo trabajador
          </Button>
        }
      />
      <section className="panel">
        <div className="toolbar wrap employee-filters">
          <label>
            Nombre o identificación
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Buscar nombre o identificación…"
            />
          </label>
          <label>
            Área
            <select
              aria-label="Área"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">Todas las áreas</option>
              {[...new Set(q.data?.map((e) => e.area).filter(Boolean))]
                .sort()
                .map((a) => (
                  <option key={a}>{a}</option>
                ))}
            </select>
          </label>
          <label>
            Cargo
            <select
              aria-label="Cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            >
              <option value="">Todos los cargos</option>
              {[...new Set(q.data?.map((e) => e.cargo).filter(Boolean))]
                .sort()
                .map((c) => (
                  <option key={c}>{c}</option>
                ))}
            </select>
          </label>
          <label>
            Estado
            <select
              aria-label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option>ACTIVO</option>
              <option>INACTIVO</option>
            </select>
          </label>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setArea("");
              setCargo("");
              setStatus("");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
        <QueryState {...q}>
          <p className="inline-summary">
            {rows.length} de {q.data?.length ?? 0} trabajadores · Abre una ficha
            para gestionar sus procesos.
          </p>
          <Table
            key={`${search}-${area}-${cargo}-${status}`}
            headers={[
              "Trabajador",
              "Identificación",
              "Área / Cargo",
              "Teléfono",
              "Ingreso",
              "Estado",
              "Acciones",
            ]}
            rows={rows.map((e) => [
              <div className="person">
                <span className="avatar light">
                  {e.nombres[0]}
                  {e.apellidos[0]}
                </span>
                <strong>{fullName(e)}</strong>
              </div>,
              e.identificacion,
              <div>
                {e.area}
                <small>{e.cargo}</small>
              </div>,
              e.telefono || "—",
              date(e.fecha_ingreso),
              <Badge>{e.estado}</Badge>,
              <div className="row-actions">
                <Button
                  variant="ghost"
                  aria-label={`Ver ${fullName(e)}`}
                  onClick={() => navigate(`/hr/employees/${e.id}`)}
                >
                  <Eye />
                  Ver ficha
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar ${fullName(e)}`}
                  onClick={() => setEdit(e)}
                >
                  <Pencil />
                </Button>
              </div>,
            ])}
          />
        </QueryState>
      </section>
      {edit && (
        <EmployeeEditor
          employee={edit}
          onClose={() => setEdit(null)}
          onSaved={q.reload}
        />
      )}
    </>
  );
}
