import { Menu, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import InventoryBell from "@/modules/inventory/components/InventoryBell";
export default function Header({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const { role } = useAuth();
  return (
    <header className="header">
      <div>
        <Button
          className="menu-toggle"
          variant="ghost"
          size="icon"
          onClick={onMenu}
          aria-label="Abrir menú"
        >
          <Menu />
        </Button>
        <span>
          Espacio de trabajo <b>/</b>{" "}
          <strong>
            {pathname.startsWith("/inventory")
              ? "Inventarios"
              : pathname.startsWith("/hr")
                ? "Recursos Humanos"
                : "Vista general"}
          </strong>
        </span>
      </div>
      {(role === "ADMINISTRADOR" || role === "INVENTARIO") && <InventoryBell />}
      <div className="header-right">
        <span>
          {new Date().toLocaleDateString("es-BO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        <ShieldCheck size={18} />
        <span>Acceso privado</span>
      </div>
    </header>
  );
}
