import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useMailbox } from "./useMailbox";

export default function InventoryBell() {
  const { role } = useAuth();
  const mailbox = useMailbox();
  const count =
    role === "ADMINISTRADOR"
      ? mailbox.notices.filter((notice) => !notice.visto_at).length
      : mailbox.alerts.length;
  const failed =
    role === "ADMINISTRADOR" ? mailbox.noticeError : mailbox.alertError;
  return (
    <Link
      className="text-link"
      to="/inventory/notifications"
      aria-label={`Buzón de inventario${failed ? ": no se pudo actualizar" : `: ${count} ${role === "ADMINISTRADOR" ? "avisos sin ver" : "alertas de stock bajo"}`}`}
    >
      <Bell size={20} /> Buzón {failed ? "!" : count > 0 ? `(${count})` : ""}
    </Link>
  );
}
