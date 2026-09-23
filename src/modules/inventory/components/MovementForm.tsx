import { useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle, QueryState, Confirm } from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadInventory, registerMovement } from "../services/inventory";
import { same } from "@/lib/data";
import { useToast } from "@/context/toast";
import type { MovementType } from "@/types/entities";
export default function MovementForm({ type }: { type: MovementType }) {
  const q = useQuery(loadInventory);
  const toast = useToast();
  const [product, setProduct] = useState("");
  const [branch, setBranch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const d = q.data;
  const stock =
    d?.stock.find(
      (s) => same(s.producto_id, product) && same(s.sucursal_id, branch),
    )?.cantidad ?? 0;
  const amount = Number(quantity);
  const next =
    type === "AJUSTE"
      ? amount
      : stock + (type === "ENTRADA" ? amount : -amount);
  const title =
    type === "ENTRADA"
      ? "Registrar entrada"
      : type === "SALIDA"
        ? "Registrar salida"
        : "Ajuste de inventario";
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!product || !branch || !reason.trim() || quantity === "")
      return setError("Completa producto, sucursal, cantidad y motivo.");
    if (!Number.isSafeInteger(amount) || amount < (type === "AJUSTE" ? 0 : 1))
      return setError("Introduce una cantidad entera válida.");
    if (next < 0) return setError("Stock insuficiente para esta salida.");
    if (type === "AJUSTE" && next === stock)
      return setError("La cantidad física coincide con la registrada.");
    setError("");
    setConfirm(true);
  }
  async function commit() {
    setBusy(true);
    try {
      await registerMovement({
        producto_id: product,
        sucursal_id: branch,
        tipo: type,
        cantidad: amount,
        motivo: reason.trim(),
        cantidad_esperada: stock,
      });
      toast("Movimiento registrado correctamente");
      setConfirm(false);
      setQuantity("");
      setReason("");
      q.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar");
      setConfirm(false);
      q.reload();
      toast("No se registró el movimiento. Revisa el detalle.", true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="INVENTARIOS / OPERACIONES"
        title={title}
        description={
          type === "AJUSTE"
            ? "Reconcilia el inventario registrado con el conteo físico."
            : "Registra el movimiento y mantén tus existencias actualizadas."
        }
      />
      <QueryState {...q}>
        <div className="operation-layout">
          <section className="panel padded">
            <h2>Información del movimiento</h2>
            <p className="muted">
              Completa los datos antes de confirmar la operación.
            </p>
            <form onSubmit={submit}>
              <fieldset disabled={busy} className="form-grid">
                <div className="field">
                  <label htmlFor="branch">Sucursal *</label>
                  <select
                    id="branch"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    <option value="">Selecciona una sucursal</option>
                    {d?.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="product">Producto *</label>
                  <select
                    id="product"
                    required
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  >
                    <option value="">Selecciona un producto</option>
                    {d?.products
                      .filter((p) => p.activo || type === "AJUSTE")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codigo} · {p.nombre} · {p.talla} {p.color}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="field wide">
                  <label htmlFor="quantity">
                    {type === "AJUSTE"
                      ? "Cantidad física / correcta"
                      : "Cantidad"}{" "}
                    *
                  </label>
                  <input
                    id="quantity"
                    required
                    type="number"
                    min={type === "AJUSTE" ? 0 : 1}
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="field wide">
                  <label htmlFor="reason">Motivo / observación *</label>
                  <textarea
                    id="reason"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe el motivo del movimiento…"
                  />
                </div>
                {error && (
                  <p className="field-error wide" role="alert">
                    {error}
                  </p>
                )}
              </fieldset>
              <div className="form-actions">
                <Button
                  type="submit"
                  disabled={busy || !d?.products.length || !d?.branches.length}
                >
                  Revisar y confirmar
                  <ArrowRight />
                </Button>
              </div>
            </form>
          </section>
          <aside className="panel padded preview-panel">
            <span className="eyebrow">VISTA PREVIA</span>
            <h2>Así quedará tu stock</h2>
            <div className="stock-number">
              {branch && product ? stock : "—"}
              <span>unidades actuales</span>
            </div>
            <div className="preview-line">
              <span>
                {type === "AJUSTE" ? "Diferencia" : "Cantidad del movimiento"}
              </span>
              <strong>
                {quantity !== ""
                  ? type === "AJUSTE"
                    ? amount - stock
                    : amount
                  : "—"}
              </strong>
            </div>
            <div className="preview-line result">
              <span>Nuevo stock</span>
              <strong>
                {quantity !== "" && branch && product ? next : "—"}
              </strong>
            </div>
            <p>
              <ShieldCheck size={18} />
              La operación y su historial se guardan juntos, de forma
              transaccional.
            </p>
          </aside>
        </div>
      </QueryState>
      {confirm && (
        <Confirm
          title={`Confirmar ${type.toLowerCase()}`}
          busy={busy}
          onClose={() => setConfirm(false)}
          onConfirm={commit}
        >
          <p>
            <strong>
              {d?.products.find((p) => same(p.id, product))?.nombre}
            </strong>{" "}
            · {d?.branches.find((b) => same(b.id, branch))?.nombre}
          </p>
          <div className="stock-preview">
            <span>
              Stock anterior<strong>{stock}</strong>
            </span>
            <ArrowRight />
            <span>
              Stock nuevo<strong>{next}</strong>
            </span>
          </div>
          <p>{reason}</p>
        </Confirm>
      )}
    </>
  );
}
