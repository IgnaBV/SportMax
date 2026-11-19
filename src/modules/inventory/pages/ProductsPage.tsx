import { useState } from "react";
import { Plus, Pencil, Eye } from "lucide-react";
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
import { loadInventory, saveProduct } from "../services/inventory";
import { same } from "@/lib/data";
import { useToast } from "@/context/toast";
import type { Product } from "@/types/entities";
import { loadSuppliers } from "../services/purchases";
export default function ProductsPage() {
  const q = useQuery(loadInventory);
  const suppliers = useQuery(loadSuppliers);
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [edit, setEdit] = useState<Product | "new" | null>(null);
  const [view, setView] = useState<Product | null>(null);
  const [pending, setPending] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const d = q.data;
  const products =
    d?.products.filter(
      (p) =>
        `${p.codigo} ${p.nombre} ${p.talla} ${p.color}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!status || String(p.activo) === status),
    ) || [];
  const total = (p: Product) =>
    d?.stock
      .filter((s) => same(s.producto_id, p.id))
      .reduce((n, s) => n + s.cantidad, 0) || 0;
  async function persist(v: Record<string, string>) {
    await saveProduct(v, edit && edit !== "new" ? edit.id : undefined);
    setEdit(null);
    setPending(null);
    q.reload();
    toast("Producto guardado correctamente");
  }
  return (
    <>
      <PageTitle
        eyebrow="INVENTARIOS / CATÁLOGO"
        title="Productos"
        description="Todo tu catálogo, organizado hasta el último detalle."
        action={
          <Button disabled={suppliers.loading} onClick={() => setEdit("new")}>
            <Plus />
            Nuevo producto
          </Button>
        }
      />
      <section className="panel">
        {suppliers.error && (
          <p className="notice" role="status">
            {suppliers.error}
          </p>
        )}
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar código, nombre, talla o color…"
          />
          <select
            aria-label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
        <QueryState {...q}>
          <Table
            headers={[
              "Producto",
              "Categoría",
              "Proveedor principal",
              "Talla / Color",
              "Stock total",
              "Stock mínimo",
              "Estado",
              "Acciones",
            ]}
            rows={products.map((p) => [
              <div>
                <strong>{p.nombre}</strong>
                <small>{p.codigo}</small>
              </div>,
              d?.categories.find((c) => same(c.id, p.categoria_id))?.nombre ||
                "Sin categoría",
              suppliers.data?.find((s) => same(s.id, p.proveedor_id))?.nombre ||
                (p.proveedor_id ? "Proveedor no disponible" : "Sin proveedor"),
              `${p.talla || "—"} / ${p.color || "—"}`,
              <strong>{total(p)}</strong>,
              p.stock_minimo,
              <Badge>{p.activo ? "ACTIVO" : "INACTIVO"}</Badge>,
              <div className="row-actions">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Ver producto"
                  aria-label={`Ver ${p.nombre}`}
                  onClick={() => setView(p)}
                >
                  <Eye />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Editar producto"
                  disabled={suppliers.loading}
                  aria-label={`Editar ${p.nombre}`}
                  onClick={() => setEdit(p)}
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
          title={edit === "new" ? "Nuevo producto" : "Editar producto"}
          onClose={() => setEdit(null)}
        >
          <DataForm
            initial={
              edit === "new" ? { activo: "true", stock_minimo: 0 } : { ...edit }
            }
            onClose={() => setEdit(null)}
            onSave={async (v) => {
              if (edit !== "new" && edit.activo && v.activo === "false") {
                setPending(v);
                return;
              }
              await persist(v);
            }}
            fields={[
              { name: "codigo", label: "Código", required: true },
              { name: "nombre", label: "Nombre", required: true },
              ...(suppliers.data
                ? [
                    {
                      name: "proveedor_id",
                      label: "Proveedor principal",
                      options: suppliers.data
                        .filter(
                          (s) =>
                            s.activo ||
                            (edit !== "new" && same(s.id, edit.proveedor_id)),
                        )
                        .map((s) => ({
                          value: String(s.id),
                          label: `${s.nombre}${s.activo ? "" : " (inactivo)"}`,
                        })),
                    },
                  ]
                : []),
              {
                name: "categoria_id",
                label: "Categoría",
                options:
                  d?.categories.map((c) => ({
                    value: String(c.id),
                    label: c.nombre,
                  })) || [],
              },
              { name: "talla", label: "Talla" },
              { name: "color", label: "Color" },
              {
                name: "stock_minimo",
                label: "Stock mínimo",
                type: "number",
                min: 0,
                step: "1",
                required: true,
              },
              {
                name: "activo",
                label: "Estado",
                required: true,
                options: [
                  { value: "true", label: "Activo" },
                  { value: "false", label: "Inactivo" },
                ],
              },
              { name: "descripcion", label: "Descripción", type: "textarea" },
            ]}
            validate={(v): Record<string, string> =>
              Number.isInteger(Number(v.stock_minimo))
                ? {}
                : { stock_minimo: "Utiliza unidades enteras" }
            }
          />
        </Modal>
      )}
      {pending && (
        <Confirm
          title="Desactivar producto"
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
            El producto dejará de estar disponible para nuevas entradas y
            salidas. Su historial se conservará.
          </p>
        </Confirm>
      )}
      {view && (
        <Modal title={view.nombre} onClose={() => setView(null)}>
          <div className="modal-body">
            <span className="eyebrow">{view.codigo}</span>
            <p>{view.descripcion || "Sin descripción"}</p>
            <p>
              Proveedor:{" "}
              {suppliers.data?.find((s) => same(s.id, view.proveedor_id))
                ?.nombre || "Sin proveedor disponible"}
            </p>
            <div className="stock-preview">
              <span>
                Existencias totales<strong>{total(view)}</strong>
              </span>
              <span>
                Stock mínimo<strong>{view.stock_minimo}</strong>
              </span>
            </div>
            <Table
              headers={["Sucursal", "Unidades"]}
              rows={
                d?.branches.map((b) => [
                  b.nombre,
                  d.stock.find(
                    (s) =>
                      same(s.producto_id, view.id) && same(s.sucursal_id, b.id),
                  )?.cantidad ?? 0,
                ]) || []
              }
            />
          </div>
        </Modal>
      )}
    </>
  );
}
