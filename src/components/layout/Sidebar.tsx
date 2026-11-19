import { canReadHR } from "@/modules/hr/permissions";
import { NavLink } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  History,
  Bell,
  ShoppingCart,
  Truck,
  Users,
  CalendarCheck,
  CalendarDays,
  FileText,
  ClipboardList,
  LogOut,
  Layers3,
  X,
} from "lucide-react";
import { useAuth, homeForRole } from "@/context/auth";
import { useToast } from "@/context/toast";
const inventory = [
  ["/inventory", "Resumen", Boxes],
  ["/inventory/products", "Productos", Package],
  ["/inventory/stock", "Existencias", Layers3],
  ["/inventory/notifications", "Buzón de reposición", Bell],
  ["/inventory/entries", "Registrar entrada", ArrowDownToLine],
  ["/inventory/exits", "Registrar salida", ArrowUpFromLine],
  ["/inventory/adjustments", "Ajustes", SlidersHorizontal],
  ["/inventory/movements", "Movimientos", History],
] as const;
const hr = [
  ["/hr", "Resumen", Users],
  ["/hr/employees", "Trabajadores", Users],
  ["/hr/attendance", "Asistencia", CalendarCheck],
  ["/hr/permissions", "Permisos", ClipboardList],
  ["/hr/vacations", "Vacaciones", CalendarDays],
  ["/hr/documents", "Documentos", FileText],
] as const;
export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { session, role, logout } = useAuth();
  const toast = useToast();
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLElement>("button.drawer-close")?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const items =
          sidebar.current?.querySelectorAll<HTMLElement>("a, button");
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [open, onClose]);
  return (
    <>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar menú tocando fuera"
          onClick={onClose}
        />
      )}
      <aside
        ref={sidebar}
        className={`sidebar ${open ? "open" : ""}`}
        aria-label="Navegación principal"
      >
        <button
          className="drawer-close"
          aria-label="Cerrar navegación"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <NavLink to={homeForRole(role)} className="brand" onClick={onClose}>
          <div className="brand-mark">
            <Layers3 />
          </div>
          <div>Sport Max</div>
        </NavLink>
        <nav>
          {role === "ADMINISTRADOR" && (
            <NavLink to="/dashboard" onClick={onClose}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
          )}
          {(role === "ADMINISTRADOR" || role === "INVENTARIO") && (
            <>
              <p className="nav-label">INVENTARIOS</p>
              {inventory.map(([path, label, Icon]) => (
                <NavLink end key={path} to={path} onClick={onClose}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
              {role === "ADMINISTRADOR" && (
                <>
                  <NavLink to="/inventory/suppliers" onClick={onClose}>
                    <Truck size={18} />
                    Proveedores
                  </NavLink>
                  <NavLink to="/inventory/purchases" onClick={onClose}>
                    <ShoppingCart size={18} />
                    Compras y reposición
                  </NavLink>
                </>
              )}
            </>
          )}
          {canReadHR(role) && (
            <>
              <p className="nav-label">RECURSOS HUMANOS</p>
              {hr.map(([path, label, Icon]) => (
                <NavLink end key={path} to={path} onClick={onClose}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">
            {session?.user.email?.slice(0, 2).toUpperCase() || "SM"}
          </div>
          <div>
            <strong>{session?.user.email}</strong>
            <small>{role || "Sin rol asignado"}</small>
          </div>
          <button
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={async () => {
              try {
                await logout();
              } catch (error) {
                toast(
                  error instanceof Error
                    ? error.message
                    : "No se pudo cerrar la sesión",
                  true,
                );
              }
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
