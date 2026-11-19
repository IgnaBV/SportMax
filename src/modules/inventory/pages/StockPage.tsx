import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { useToast } from "@/context/toast";
import { sendReplenishmentNotice } from "../services/notifications";
import type { Id } from "@/types/entities";
import {
  PageTitle,
  QueryState,
  SearchBox,
  Table,
  Badge,
} from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadInventory } from "../services/inventory";
import { same } from "@/lib/data";
export default function StockPage() {
  const q = useQuery(loadInventory);
  const { role } = useAuth();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Set<string>>(() => new Set());
  async function notify(productId: Id, branchId: Id) {
    setSending(true);
    try {
      await sendReplenishmentNotice(productId, branchId);
      setSent((current) => new Set(current).add(`${productId}:${branchId}`));
      toast("Aviso de reposición disponible en el buzón del administrador");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "No se pudo enviar el aviso",
        true,
      );
    } finally {
      setSending(false);
    }
  }
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [low, setLow] = useState(false);
  const d = q.data;
  const rows =
    d?.products
      .flatMap((p) =>
        d.branches.map((b) => ({
          p,
          b,
          quantity:
            d.stock.find(
              (s) => same(s.producto_id, p.id) && same(s.sucursal_id, b.id),
            )?.cantidad ?? 0,
        })),
      )
      .filter(
        (r) =>
          (!branch || same(r.b.id, branch)) &&
          `${r.p.nombre} ${r.p.codigo}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (!low || r.quantity <= r.p.stock_minimo),
      ) || [];
  return (
    <>
      <PageTitle
        eyebrow="INVENTARIOS / DISPONIBILIDAD"
        title="Existencias"
        description="Conoce qué tienes y dónde está, sucursal por sucursal."
      />
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar producto o código…"
          />
          <select
            aria-label="Sucursal"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {d?.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
          <label className="check">
            <input
              type="checkbox"
              checked={low}
              onChange={(e) => setLow(e.target.checked)}
            />
            Solo stock bajo
          </label>
        </div>
        <QueryState {...q}>
          {rows.some((r) => r.p.activo && r.quantity <= r.p.stock_minimo) && (
            <div className="notice" role="status">
              Hay productos con stock bajo en las sucursales seleccionadas.{" "}
              <Link className="text-link" to="/inventory/notifications">
                Abrir buzón de reposición
              </Link>
            </div>
          )}
          <div className="inline-summary">
            {rows.length} combinaciones ·{" "}
            <strong>
              {rows.reduce((n, r) => n + r.quantity, 0)} unidades en la
              selección
            </strong>
          </div>
          <Table
            headers={[
              "Producto",
              "Sucursal",
              "Disponible",
              "Mínimo",
              "Estado",
              "Reposición",
            ]}
            rows={rows.map((r) => [
              <div>
                <strong>{r.p.nombre}</strong>
                <small>
                  {r.p.codigo} · {r.p.talla} · {r.p.color}
                </small>
              </div>,
              r.b.nombre,
              <strong>{r.quantity}</strong>,
              r.p.stock_minimo,
              <Badge>
                {r.quantity === 0
                  ? "Sin stock"
                  : r.quantity <= r.p.stock_minimo
                    ? "Bajo"
                    : "Correcto"}
              </Badge>,
              ...(role === "INVENTARIO"
                ? [
                    r.p.activo && r.quantity <= r.p.stock_minimo ? (
                      <Button
                        variant="outline"
                        disabled={sending || sent.has(`${r.p.id}:${r.b.id}`)}
                        onClick={() => notify(r.p.id, r.b.id)}
                      >
                        {sent.has(`${r.p.id}:${r.b.id}`)
                          ? "Aviso enviado"
                          : "Avisar al administrador"}
                      </Button>
                    ) : (
                      "—"
                    ),
                  ]
                : [
                    r.p.activo ? (
                      <Link
                        className="text-link"
                        to={`/inventory/purchases?${new URLSearchParams({ product: String(r.p.id), branch: String(r.b.id) })}`}
                      >
                        Reponer con compra
                      </Link>
                    ) : (
                      "—"
                    ),
                  ]),
            ])}
          />
        </QueryState>
      </section>
    </>
  );
}
