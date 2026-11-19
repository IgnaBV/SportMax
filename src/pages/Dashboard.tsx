import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Package,
  Boxes,
  TriangleAlert,
  Users,
  ClipboardList,
  ArrowDownToLine,
  CalendarCheck,
  Activity,
} from "lucide-react";
import { PageTitle, QueryState, Table, Badge } from "@/components/common/UI";
import { useQuery } from "@/hooks/useQuery";
import { loadInventory } from "@/modules/inventory/services/inventory";
import { loadHR } from "@/modules/hr/services/hr";
import { useAuth } from "@/context/auth";
import { date, fullName, same } from "@/lib/data";
export default function Dashboard({ module }: { module?: "inventory" | "hr" }) {
  const { role } = useAuth();
  const inventory =
    module !== "hr" && (role === "ADMINISTRADOR" || role === "INVENTARIO");
  const hr =
    module !== "inventory" && (role === "ADMINISTRADOR" || role === "RRHH");
  const loader = useCallback(async () => {
    const [inv, people] = await Promise.all([
      inventory ? loadInventory() : null,
      hr ? loadHR() : null,
    ]);
    return { inv, people };
  }, [inventory, hr]);
  const q = useQuery(loader);
  const inv = q.data?.inv;
  const people = q.data?.people;
  const total = inv?.stock.reduce((n, s) => n + s.cantidad, 0) ?? 0;
  const low =
    inv?.products.filter(
      (p) =>
        p.activo &&
        inv.stock
          .filter((s) => same(s.producto_id, p.id))
          .reduce((n, s) => n + s.cantidad, 0) <= p.stock_minimo,
    ) || [];
  const stats = [
    ...(inventory
      ? [
          {
            label: "Productos registrados",
            value: inv?.products.length,
            icon: Package,
            caption: "Tu catálogo de productos",
            path: "/inventory/products",
          },
          {
            label: "Unidades en inventario",
            value: total,
            icon: Boxes,
            caption: "En todas las sucursales",
            path: "/inventory/stock",
          },
          {
            label: "Productos con stock bajo",
            value: low.length,
            icon: TriangleAlert,
            caption: "Requieren atención",
            path: "/inventory/stock",
          },
        ]
      : []),
    ...(hr
      ? [
          {
            label: "Trabajadores activos",
            value: people?.employees.filter((e) => e.estado === "ACTIVO")
              .length,
            icon: Users,
            caption: "El equipo de tu empresa",
            path: "/hr/employees",
          },
          {
            label: "Solicitudes pendientes",
            value: people?.requests.filter((r) => r.estado === "PENDIENTE")
              .length,
            icon: ClipboardList,
            caption: "Permisos y vacaciones",
            path: "/hr/permissions",
          },
        ]
      : []),
  ];
  return (
    <>
      <PageTitle
        eyebrow={
          module === "inventory"
            ? "INVENTARIOS / RESUMEN"
            : module === "hr"
              ? "RECURSOS HUMANOS / RESUMEN"
              : "TU EMPRESA, DE UN VISTAZO"
        }
        title={
          module === "inventory"
            ? "Resumen de inventarios"
            : module === "hr"
              ? "Resumen del equipo"
              : "Dashboard"
        }
        description="La información que necesitas para tomar mejores decisiones."
      />
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">TODO CONECTADO. TODO EN ORDEN.</span>
          <p>Gestiona tus operaciones con claridad, desde un solo lugar.</p>
        </div>
        <div className="banner-symbol">
          <Activity size={72} strokeWidth={1} />
        </div>
      </div>
      <QueryState {...q}>
        <div className="stats-grid">
          {stats.map((s) => (
            <Link to={s.path} key={s.label} className="stat-card">
              <div className="stat-top">
                <span className="stat-icon">
                  <s.icon size={21} />
                </span>
                <ArrowUpRight size={17} />
              </div>
              <p>{s.label}</p>
              <strong>{(s.value ?? 0).toLocaleString("es-BO")}</strong>
              <small>{s.caption}</small>
            </Link>
          ))}
        </div>
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  {inventory
                    ? "Movimientos recientes"
                    : "Solicitudes recientes"}
                </h2>
                <p>
                  {inventory
                    ? "La última actividad de tu inventario"
                    : "Novedades y solicitudes del equipo"}
                </p>
              </div>
              <Link
                className="text-link"
                to={inventory ? "/inventory/movements" : "/hr/permissions"}
              >
                Ver todos <ArrowUpRight size={15} />
              </Link>
            </div>
            {inventory ? (
              <Table
                headers={["Producto", "Tipo", "Cantidad", "Fecha"]}
                rows={
                  inv?.movements
                    .slice(0, 5)
                    .map((m) => [
                      <strong>
                        {inv.products.find((p) => same(p.id, m.producto_id))
                          ?.nombre || "Producto no disponible"}
                      </strong>,
                      <Badge>{m.tipo}</Badge>,
                      m.cantidad,
                      date(m.created_at),
                    ]) || []
                }
              />
            ) : (
              <Table
                headers={["Trabajador", "Tipo", "Estado"]}
                rows={
                  people?.requests.slice(0, 5).map((r) => [
                    fullName(
                      people.employees.find((e) =>
                        same(e.id, r.trabajador_id),
                      ) || {
                        nombres: "Trabajador",
                        apellidos: "no disponible",
                      },
                    ),
                    r.tipo,
                    <Badge>{r.estado}</Badge>,
                  ]) || []
                }
              />
            )}
          </section>
          <section className="panel padded">
            <span className="eyebrow">SIMPLIFICA TU DÍA</span>
            <h2>Accesos rápidos</h2>
            <p className="muted">Tus operaciones más frecuentes.</p>
            <div className="quick-links">
              {inventory && (
                <>
                  <Link to="/inventory/entries">
                    <span className="quick-icon">
                      <ArrowDownToLine />
                    </span>
                    <div>
                      <strong>Registrar entrada</strong>
                      <small>Actualiza tus existencias</small>
                    </div>
                    <ArrowUpRight size={18} />
                  </Link>
                  <Link to="/inventory/products">
                    <span className="quick-icon">
                      <Package />
                    </span>
                    <div>
                      <strong>Gestionar catálogo</strong>
                      <small>Productos y variantes</small>
                    </div>
                    <ArrowUpRight size={18} />
                  </Link>
                </>
              )}
              {hr && (
                <>
                  <Link to="/hr/attendance">
                    <span className="quick-icon">
                      <CalendarCheck />
                    </span>
                    <div>
                      <strong>Registrar asistencia</strong>
                      <small>Control de la jornada</small>
                    </div>
                    <ArrowUpRight size={18} />
                  </Link>
                  <Link to="/hr/vacations">
                    <span className="quick-icon">
                      <Users />
                    </span>
                    <div>
                      <strong>Revisar vacaciones</strong>
                      <small>Planifica con tu equipo</small>
                    </div>
                    <ArrowUpRight size={18} />
                  </Link>
                </>
              )}
            </div>
          </section>
        </div>
        {inventory && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Atención al inventario</h2>
                <p>Productos cuyo stock total está en el mínimo o por debajo</p>
              </div>
              <TriangleAlert className="gold-text" />
            </div>
            <Table
              empty="No hay alertas de stock"
              headers={["Producto", "Código", "Disponible", "Mínimo", "Estado"]}
              rows={low.map((p) => [
                p.nombre,
                p.codigo,
                inv?.stock
                  .filter((s) => same(s.producto_id, p.id))
                  .reduce((n, s) => n + s.cantidad, 0),
                p.stock_minimo,
                <Badge>Bajo</Badge>,
              ])}
            />
          </section>
        )}
        {inventory && hr && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Solicitudes del equipo</h2>
                <p>Permisos y vacaciones pendientes de revisión</p>
              </div>
              <Link className="text-link" to="/hr">
                Ir a Recursos Humanos <ArrowUpRight size={15} />
              </Link>
            </div>
            <Table
              headers={["Trabajador", "Tipo", "Inicio", "Estado"]}
              rows={
                people?.requests
                  .filter((r) => r.estado === "PENDIENTE")
                  .slice(0, 5)
                  .map((r) => [
                    fullName(
                      people.employees.find((e) =>
                        same(e.id, r.trabajador_id),
                      ) || {
                        nombres: "Trabajador",
                        apellidos: "no disponible",
                      },
                    ),
                    r.tipo,
                    date(r.fecha_inicio),
                    <Badge>{r.estado}</Badge>,
                  ]) || []
              }
            />
          </section>
        )}
      </QueryState>
    </>
  );
}
