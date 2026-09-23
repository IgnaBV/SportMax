import { useState } from "react";
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
          <div className="inline-summary">
            {rows.length} combinaciones ·{" "}
            <strong>
              {rows.reduce((n, r) => n + r.quantity, 0)} unidades en la
              selección
            </strong>
          </div>
          <Table
            headers={["Producto", "Sucursal", "Disponible", "Mínimo", "Estado"]}
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
            ])}
          />
        </QueryState>
      </section>
    </>
  );
}
