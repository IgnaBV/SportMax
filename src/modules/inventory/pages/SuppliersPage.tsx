import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import {
  PageTitle,
  QueryState,
  Table,
  SearchBox,
  Modal,
  DataForm,
  Badge,
} from "@/components/common/UI";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/useQuery";
import { useToast } from "@/context/toast";
import {
  loadSuppliers,
  saveSupplier,
  type Supplier,
} from "../services/purchases";

export default function SuppliersPage() {
  const q = useQuery(loadSuppliers);
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Supplier | "new" | null>(null);
  return (
    <>
      <PageTitle
        eyebrow="INVENTARIOS / ADMINISTRACIÓN"
        title="Proveedores"
        description="Registra y actualiza los proveedores de tus productos."
        action={
          <Button onClick={() => setEdit("new")}>
            <Plus />
            Nuevo proveedor
          </Button>
        }
      />
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar proveedor, contacto o NIT…"
          />
        </div>
        <QueryState {...q}>
          <Table
            headers={[
              "Proveedor",
              "NIT / identificación",
              "Contacto",
              "Correo / teléfono",
              "Dirección",
              "Estado",
              "Acciones",
            ]}
            rows={(q.data ?? [])
              .filter((s) =>
                `${s.nombre} ${s.contacto ?? ""} ${s.identificacion_fiscal ?? ""}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((s) => [
                s.nombre,
                s.identificacion_fiscal || "—",
                s.contacto || "—",
                <div>
                  {s.email || "—"}
                  <small>{s.telefono || "—"}</small>
                </div>,
                s.direccion || "—",
                <Badge>{s.activo ? "ACTIVO" : "INACTIVO"}</Badge>,
                <Button variant="outline" onClick={() => setEdit(s)}>
                  <Pencil />
                  Editar
                </Button>,
              ])}
          />
        </QueryState>
      </section>
      {edit && (
        <Modal
          title={edit === "new" ? "Nuevo proveedor" : "Editar proveedor"}
          onClose={() => setEdit(null)}
        >
          <p className="modal-note">
            Desactivar conserva el historial e impide nuevas compras.
          </p>
          <DataForm
            initial={edit === "new" ? { activo: "true" } : { ...edit }}
            onClose={() => setEdit(null)}
            fields={[
              {
                name: "nombre",
                label: "Nombre / razón social",
                required: true,
              },
              {
                name: "identificacion_fiscal",
                label: "NIT / identificación fiscal",
              },
              { name: "contacto", label: "Persona de contacto" },
              { name: "email", label: "Correo", type: "email" },
              { name: "telefono", label: "Teléfono", type: "tel" },
              { name: "direccion", label: "Dirección" },
              {
                name: "activo",
                label: "Estado",
                required: true,
                options: [
                  { value: "true", label: "Activo" },
                  { value: "false", label: "Inactivo" },
                ],
              },
              { name: "notas", label: "Notas", type: "textarea" },
            ]}
            validate={(v) => {
              const errors: Record<string, string> = {};
              if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
                errors.email = "Introduce un correo válido";
              return errors;
            }}
            onSave={async (v) => {
              await saveSupplier(v, edit === "new" ? undefined : edit.id);
              setEdit(null);
              q.reload();
              toast("Proveedor guardado");
            }}
          />
        </Modal>
      )}
    </>
  );
}
