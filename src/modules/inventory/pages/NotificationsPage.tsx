import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, RefreshCw, Send } from "lucide-react";
import { PageTitle, Table, Badge } from "@/components/common/UI";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { useToast } from "@/context/toast";
import { same } from "@/lib/data";
import { useMailbox } from "../components/useMailbox";
import {
  sendReplenishmentNotice,
  markNoticeSeen,
} from "../services/notifications";

const dateTime = (value: string) => new Date(value).toLocaleString("es-BO");
export default function NotificationsPage() {
  const { role } = useAuth();
  const mailbox = useMailbox();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [showSeen, setShowSeen] = useState(false);
  async function act(action: () => Promise<void>, message: string) {
    setBusy(true);
    try {
      await action();
      toast(message);
      mailbox.reload();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "No se pudo guardar el aviso",
        true,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="INVENTARIOS / NOTIFICACIONES"
        title="Buzón de reposición"
        description="Alertas de stock bajo por sucursal y avisos a administración."
        action={
          <Button variant="outline" onClick={mailbox.reload}>
            <RefreshCw />
            Actualizar
          </Button>
        }
      />
      <p className="notice">
        <Bell size={18} /> El buzón se actualiza cada 30 segundos mientras la
        aplicación está abierta. Marcar un aviso como visto no repone productos
        ni cambia existencias.
      </p>
      {mailbox.loading && <p role="status">Cargando notificaciones…</p>}
      <section className="panel padded">
        <h2>
          {role === "ADMINISTRADOR"
            ? "Avisos recibidos de inventario"
            : "Avisos enviados a administración"}
        </h2>
        <label className="check">
          <input
            type="checkbox"
            checked={showSeen}
            onChange={(e) => setShowSeen(e.target.checked)}
          />
          Incluir avisos vistos
        </label>
        {mailbox.noticeError ? (
          <p className="field-error" role="alert">
            {mailbox.noticeError}
          </p>
        ) : (
          !mailbox.loading && (
            <Table
              headers={[
                "Fecha",
                "Producto",
                "Sucursal",
                "Stock al enviar",
                "Enviado por",
                "Estado",
                "Acción",
              ]}
              empty="No hay avisos pendientes"
              rows={mailbox.notices
                .filter((notice) => showSeen || !notice.visto_at)
                .map((notice) => [
                  dateTime(notice.created_at),
                  notice.producto,
                  notice.sucursal,
                  `${notice.cantidad} / mínimo ${notice.minimo}`,
                  notice.responsable,
                  notice.visto_at ? (
                    `Visto por administración · ${dateTime(notice.visto_at)}`
                  ) : (
                    <Badge>PENDIENTE</Badge>
                  ),
                  role === "ADMINISTRADOR" ? (
                    <div className="row-actions">
                      <Link
                        className="text-link"
                        to={`/inventory/purchases?${new URLSearchParams({ product: notice.producto_id, branch: notice.sucursal_id })}`}
                      >
                        Reponer con compra
                      </Link>
                      {!notice.visto_at && (
                        <Button
                          disabled={busy}
                          variant="outline"
                          onClick={() =>
                            act(
                              () => markNoticeSeen(notice.id),
                              "Aviso marcado como visto",
                            )
                          }
                        >
                          Marcar como visto
                        </Button>
                      )}
                    </div>
                  ) : (
                    "—"
                  ),
                ])}
            />
          )
        )}
      </section>
      <section className="panel padded">
        <h2>Alertas de existencias bajas ({mailbox.alerts.length})</h2>
        <p className="muted">
          Productos activos con existencias iguales o inferiores al mínimo. La
          alerta desaparece al superar el mínimo de la sucursal.
        </p>
        {mailbox.alertError ? (
          <p className="field-error" role="alert">
            {mailbox.alertError}
          </p>
        ) : (
          !mailbox.loading && (
            <Table
              headers={[
                "Producto",
                "Sucursal",
                "Disponible",
                "Mínimo",
                "Notificación",
              ]}
              empty="No hay alertas de stock bajo"
              rows={mailbox.alerts.map(({ product, branch, quantity }) => {
                const pending = mailbox.notices.some(
                  (notice) =>
                    !notice.visto_at &&
                    same(notice.producto_id, product.id) &&
                    same(notice.sucursal_id, branch.id),
                );
                return [
                  <div>
                    <strong>{product.nombre}</strong>
                    <small>
                      {product.codigo} · {product.talla} · {product.color}
                    </small>
                  </div>,
                  branch.nombre,
                  quantity,
                  product.stock_minimo,
                  role === "ADMINISTRADOR" ? (
                    <Link
                      className="text-link"
                      to={`/inventory/purchases?${new URLSearchParams({ product: String(product.id), branch: String(branch.id) })}`}
                    >
                      Reponer con compra
                    </Link>
                  ) : pending ? (
                    "Aviso pendiente en administración"
                  ) : role === "INVENTARIO" ? (
                    <Button
                      disabled={busy || !!mailbox.noticeError}
                      onClick={() =>
                        act(
                          () => sendReplenishmentNotice(product.id, branch.id),
                          "Aviso enviado al buzón de administración",
                        )
                      }
                    >
                      <Send />
                      Avisar al administrador
                    </Button>
                  ) : (
                    <Badge>Bajo</Badge>
                  ),
                ];
              })}
            />
          )
        )}
      </section>
    </>
  );
}
