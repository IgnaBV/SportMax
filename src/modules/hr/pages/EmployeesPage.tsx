import { useState } from "react";
import { Plus, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageTitle,
  QueryState,
  SearchBox,
  Table,
  Badge,
  Modal,
  DataForm,
  Confirm,
} from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadHR, saveEmployee } from "../services/hr";
import { fullName, date } from "@/lib/data";
import { useToast } from "@/context/toast";
import EmployeeDetail from "../components/EmployeeDetail";
import type { Employee } from "@/types/entities";
export default function EmployeesPage() {
  const q = useQuery(loadHR);
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState("");
  const [edit, setEdit] = useState<Employee | "new" | null>(null);
  const [view, setView] = useState<Employee | null>(null);
  const [pending, setPending] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const rows =
    q.data?.employees.filter(
      (e) =>
        `${fullName(e)} ${e.identificacion}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!area || e.area === area) &&
        (!status || e.estado === status),
    ) || [];
  async function persist(v: Record<string, string>) {
    await saveEmployee(v, edit && edit !== "new" ? edit.id : undefined);
    setEdit(null);
    setPending(null);
    q.reload();
    toast("Trabajador guardado correctamente");
  }
  return (
    <>
      <PageTitle
        eyebrow="RECURSOS HUMANOS / EQUIPO"
        title="Trabajadores"
        description="Las personas que hacen posible tu empresa."
        action={
          <Button onClick={() => setEdit("new")}>
            <Plus />
            Nuevo trabajador
          </Button>
        }
      />
      <section className="panel">
        <div className="toolbar wrap">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar nombre o identificación…"
          />
          <select
            aria-label="Área"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            <option value="">Todas las áreas</option>
            {[
              ...new Set(q.data?.employees.map((e) => e.area).filter(Boolean)),
            ].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select
            aria-label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option>ACTIVO</option>
            <option>INACTIVO</option>
          </select>
        </div>
        <QueryState {...q}>
          <Table
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
                  size="icon"
                  aria-label={`Ver ${fullName(e)}`}
                  onClick={() => setView(e)}
                >
                  <Eye />
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
        <Modal
          title={edit === "new" ? "Registrar trabajador" : "Editar trabajador"}
          onClose={() => setEdit(null)}
        >
          <DataForm
            initial={edit === "new" ? { estado: "ACTIVO" } : { ...edit }}
            onClose={() => setEdit(null)}
            onSave={async (v) => {
              if (
                edit !== "new" &&
                edit.estado === "ACTIVO" &&
                v.estado !== "ACTIVO"
              ) {
                setPending(v);
                return;
              }
              await persist(v);
            }}
            fields={[
              {
                name: "nombres",
                label: "Nombres",
                required: true,
                section: "Datos personales",
              },
              { name: "apellidos", label: "Apellidos", required: true },
              {
                name: "identificacion",
                label: "Identificación",
                required: true,
              },
              { name: "telefono", label: "Teléfono", type: "tel" },
              { name: "direccion", label: "Dirección" },
              {
                name: "area",
                label: "Área",
                required: true,
                section: "Datos laborales",
              },
              { name: "cargo", label: "Cargo", required: true },
              {
                name: "fecha_ingreso",
                label: "Fecha de ingreso",
                type: "date",
                required: true,
              },
              {
                name: "salario",
                label: "Salario",
                type: "number",
                min: 0,
                step: "0.01",
                required: true,
              },
              {
                name: "estado",
                label: "Estado",
                required: true,
                options: [
                  { value: "ACTIVO", label: "Activo" },
                  { value: "INACTIVO", label: "Inactivo" },
                ],
              },
            ]}
          />
        </Modal>
      )}
      {pending && (
        <Confirm
          title="Desactivar trabajador"
          busy={busy}
          onClose={() => setPending(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await persist(pending);
            } catch (e) {
              toast(e instanceof Error ? e.message : "Error al guardar", true);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            Se conservarán los registros históricos del trabajador. Confirma el
            cambio de estado.
          </p>
        </Confirm>
      )}
      {view && q.data && (
        <EmployeeDetail
          employee={view}
          data={q.data}
          onClose={() => setView(null)}
        />
      )}
    </>
  );
}
