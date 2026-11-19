import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageTitle,
  QueryState,
  Table,
  Modal,
  DataForm,
  Confirm,
  SearchBox,
} from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { useToast } from "@/context/toast";
import { date, same } from "@/lib/data";
import { loadPurchases, registerPurchase } from "../services/purchases";

const money = (value: number) =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(
    value,
  );
export default function PurchasesPage() {
  const q = useQuery(loadPurchases);
  return (
    <QueryState {...q}>
      {q.data && <PurchaseWorkspace data={q.data} reload={q.reload} />}
    </QueryState>
  );
}
function PurchaseWorkspace({
  data,
  reload,
}: {
  data: Awaited<ReturnType<typeof loadPurchases>>;
  reload: () => void;
}) {
  const [params, setParams] = useSearchParams();
  const initialProduct = data.products.find((p) =>
    same(p.id, params.get("product")),
  );
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/La_Paz",
  });
  const [open, setOpen] = useState(!!params.get("product"));
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{
    values: Record<string, string>;
    stock: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const operationId = useRef(crypto.randomUUID());
  const toast = useToast();
  return (
    <>
      <PageTitle
        eyebrow="INVENTARIOS / ADMINISTRACIÓN"
        title="Compras y reposición"
        description="Registra compras recibidas y suma las unidades a la sucursal."
        action={
          <div className="row-actions">
            <Button variant="outline" onClick={reload}>
              <RefreshCw />
              Actualizar
            </Button>
            <Button
              onClick={() => {
                operationId.current = crypto.randomUUID();
                setOpen(true);
              }}
            >
              <Plus />
              Registrar compra
            </Button>
          </div>
        }
      />
      <p className="notice">
        Cada registro corresponde a un producto recibido, en bolivianos. Se
        guarda la compra y su entrada de inventario juntas.{" "}
        <Link className="text-link" to="/inventory/suppliers">
          Gestionar proveedores
        </Link>{" "}
        ·{" "}
        <Link className="text-link" to="/inventory/products">
          Vincular productos
        </Link>
      </p>
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar producto, proveedor o comprobante…"
          />
        </div>
        <Table
          headers={[
            "Recepción",
            "Proveedor",
            "Producto / sucursal",
            "Cantidad",
            "Costo unitario",
            "Total",
            "Comprobante",
            "Responsable",
          ]}
          empty="Todavía no hay compras registradas"
          rows={data.purchases
            .filter((p) =>
              `${p.producto_nombre} ${p.proveedor_nombre} ${p.comprobante ?? ""}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((p) => [
              date(p.fecha_recepcion),
              p.proveedor_nombre,
              <div>
                <strong>{p.producto_nombre}</strong>
                <small>{p.sucursal_nombre}</small>
                <small>Compra #{p.id}</small>
                {p.observacion && <small>{p.observacion}</small>}
              </div>,
              p.cantidad,
              money(Number(p.costo_unitario)),
              money(Number(p.total)),
              p.comprobante || "Sin comprobante",
              p.responsable,
            ])}
        />
      </section>
      {open && (
        <Modal
          title="Registrar compra recibida"
          onClose={() => {
            setOpen(false);
            setParams({}, { replace: true });
          }}
        >
          <p className="modal-note">
            Selecciona el proveedor y uno de sus productos vinculados. Si el
            producto no aparece, asígnale su proveedor desde Productos.
          </p>
          <DataForm
            initial={{
              proveedor_id: initialProduct?.proveedor_id ?? "",
              producto_id: initialProduct?.id ?? "",
              sucursal_id: params.get("branch") ?? "",
              fecha_recepcion: today,
            }}
            onClose={() => {
              setOpen(false);
              setParams({}, { replace: true });
            }}
            fields={[
              {
                name: "proveedor_id",
                label: "Proveedor",
                required: true,
                options: data.suppliers
                  .filter((s) => s.activo)
                  .map((s) => ({ value: String(s.id), label: s.nombre })),
              },
              {
                name: "producto_id",
                label: "Producto",
                required: true,
                dependsOn: "proveedor_id",
                getOptions: (v) =>
                  data.products
                    .filter(
                      (p) => p.activo && same(p.proveedor_id, v.proveedor_id),
                    )
                    .map((p) => ({
                      value: String(p.id),
                      label: `${p.codigo} · ${p.nombre} · ${p.talla ?? ""} ${p.color ?? ""}`,
                    })),
              },
              {
                name: "sucursal_id",
                label: "Sucursal de recepción",
                required: true,
                options: data.branches.map((b) => ({
                  value: String(b.id),
                  label: b.nombre,
                })),
              },
              {
                name: "cantidad",
                label: "Unidades recibidas",
                type: "number",
                min: 1,
                step: "1",
                required: true,
              },
              {
                name: "costo_unitario",
                label: "Costo unitario (Bs)",
                type: "number",
                min: 0,
                step: "0.01",
                required: true,
              },
              {
                name: "fecha_recepcion",
                label: "Fecha de recepción",
                type: "date",
                required: true,
              },
              {
                name: "comprobante",
                label: "N.º factura / comprobante (opcional)",
              },
              { name: "observacion", label: "Observación", type: "textarea" },
            ]}
            validate={(v) => {
              const errors: Record<string, string> = {};
              if (
                !data.suppliers.some(
                  (s) => s.activo && same(s.id, v.proveedor_id),
                )
              )
                errors.proveedor_id = "Selecciona un proveedor activo";
              if (
                !data.products.some(
                  (p) =>
                    p.activo &&
                    same(p.id, v.producto_id) &&
                    same(p.proveedor_id, v.proveedor_id),
                )
              )
                errors.producto_id =
                  "Selecciona un producto vinculado al proveedor";
              if (
                !Number.isSafeInteger(Number(v.cantidad)) ||
                Number(v.cantidad) > 2147483647
              )
                errors.cantidad =
                  "Introduce unidades enteras dentro del rango permitido";
              if (
                !/^\d+(\.\d{1,2})?$/.test(v.costo_unitario) ||
                Number(v.costo_unitario) > 9999999999.99
              )
                errors.costo_unitario = "Costo válido con máximo dos decimales";
              if (v.fecha_recepcion > today)
                errors.fecha_recepcion = "La recepción no puede ser futura";
              return errors;
            }}
            onSave={async (values) => {
              const stock =
                data.stock.find(
                  (s) =>
                    same(s.producto_id, values.producto_id) &&
                    same(s.sucursal_id, values.sucursal_id),
                )?.cantidad ?? 0;
              setError("");
              setPending({ values, stock });
            }}
          />
        </Modal>
      )}
      {pending && (
        <Confirm
          title="Confirmar compra y entrada de stock"
          busy={busy}
          onClose={() => setPending(null)}
          onConfirm={async () => {
            setBusy(true);
            setError("");
            try {
              await registerPurchase(
                operationId.current,
                pending.values,
                pending.stock,
              );
              setPending(null);
              setOpen(false);
              setParams({}, { replace: true });
              toast("Compra registrada y existencias repuestas");
              reload();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "No se pudo registrar la compra",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            <strong>
              {
                data.suppliers.find((s) =>
                  same(s.id, pending.values.proveedor_id),
                )?.nombre
              }
            </strong>{" "}
            ·{" "}
            {
              data.products.find((p) => same(p.id, pending.values.producto_id))
                ?.nombre
            }
          </p>
          <p>
            Sucursal:{" "}
            {
              data.branches.find((b) => same(b.id, pending.values.sucursal_id))
                ?.nombre
            }
          </p>
          <p>
            {pending.values.cantidad} unidades ×{" "}
            {money(Number(pending.values.costo_unitario))}
          </p>
          <p>
            <strong>
              Total:{" "}
              {money(
                Number(pending.values.cantidad) *
                  Number(pending.values.costo_unitario),
              )}
            </strong>
          </p>
          <p>
            Stock: {pending.stock} →{" "}
            {pending.stock + Number(pending.values.cantidad)} unidades.
          </p>
          <p>Confirma únicamente si los productos ya fueron recibidos.</p>
          {error && (
            <p className="field-error" role="alert">
              {error} Si la conexión falló, puedes reintentar esta misma
              confirmación sin duplicar la compra. Si cambió el stock, cancela y
              actualiza el historial antes de registrar otra operación.
            </p>
          )}
        </Confirm>
      )}
    </>
  );
}
