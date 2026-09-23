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
import { same, date } from "@/lib/data";
export default function MovementsPage() {
  const q = useQuery(loadInventory);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [type, setType] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const d = q.data;
  const rows =
    d?.movements.filter((m) => {
      const p = d.products.find((p) => same(p.id, m.producto_id));
      return (
        `${p?.nombre} ${p?.codigo}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!branch || same(branch, m.sucursal_id)) &&
        (!type || type === m.tipo) &&
        (!start || new Date(m.created_at) >= new Date(start + "T00:00:00")) &&
        (!end || new Date(m.created_at) <= new Date(end + "T23:59:59.999"))
      );
    }) || [];
  return (
    <>
      <PageTitle
        eyebrow="INVENTARIOS / TRAZABILIDAD"
        title="Movimientos"
        description="Cada cambio tiene una historia. Consulta entradas, salidas y ajustes."
      />
      <section className="panel">
        <div className="toolbar wrap">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar producto…"
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
          <select
            aria-label="Tipo"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {["ENTRADA", "SALIDA", "AJUSTE"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <label>
            Desde
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              min={start}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        {start && end && start > end && (
          <p className="field-error">
            La fecha final debe ser posterior a la inicial.
          </p>
        )}
        <QueryState {...q}>
          <Table
            headers={[
              "Fecha",
              "Producto",
              "Sucursal",
              "Tipo",
              "Cantidad",
              "Anterior",
              "Nueva",
              "Motivo",
              "Responsable",
            ]}
            rows={rows.map((m) => [
              date(m.created_at),
              d?.products.find((p) => same(p.id, m.producto_id))?.nombre ||
                "Producto no disponible",
              d?.branches.find((b) => same(b.id, m.sucursal_id))?.nombre || "—",
              <Badge>{m.tipo}</Badge>,
              m.cantidad,
              m.cantidad_anterior,
              m.cantidad_nueva,
              m.motivo,
              m.responsable || "—",
            ])}
          />
        </QueryState>
      </section>
    </>
  );
}
