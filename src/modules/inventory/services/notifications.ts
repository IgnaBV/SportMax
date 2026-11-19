import { list, same } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { Id, Named, Product, Stock } from "@/types/entities";

export type StockAlert = { product: Product; branch: Named; quantity: number };
export interface ReplenishmentNotice {
  id: Id;
  producto_id: string;
  sucursal_id: string;
  producto: string;
  sucursal: string;
  cantidad: number;
  minimo: number;
  responsable: string;
  created_at: string;
  visto_at: string | null;
}
export async function loadStockAlerts(): Promise<StockAlert[]> {
  const [products, branches, stocks] = await Promise.all([
    list<Product>("productos"),
    list<Named>("sucursales", "id,nombre"),
    list<Stock>("inventarios"),
  ]);
  return products
    .filter((product) => product.activo)
    .flatMap((product) =>
      branches.map((branch) => ({
        product,
        branch,
        quantity: stocks
          .filter(
            (stock) =>
              same(stock.producto_id, product.id) &&
              same(stock.sucursal_id, branch.id),
          )
          .reduce((total, stock) => total + stock.cantidad, 0),
      })),
    )
    .filter((alert) => alert.quantity <= alert.product.stock_minimo);
}
export async function loadNotices() {
  try {
    const notices = await list<ReplenishmentNotice>("avisos_reposicion");
    return notices.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    throw new Error(
      "No se pudo cargar el buzón compartido. Comprueba la conexión y que se haya aplicado 20260925_avisos_reposicion.sql en Supabase.",
    );
  }
}
export const refreshMailbox = () =>
  window.dispatchEvent(new Event("inventory-mailbox-change"));
export async function sendReplenishmentNotice(productId: Id, branchId: Id) {
  const { error } = await supabase.rpc("enviar_aviso_reposicion", {
    p_producto_id: String(productId),
    p_sucursal_id: String(branchId),
  });
  if (error)
    throw new Error(
      error.code === "PGRST202"
        ? "Falta aplicar 20260925_avisos_reposicion.sql en Supabase para enviar avisos."
        : error.message,
    );
  refreshMailbox();
}
export async function markNoticeSeen(id: Id) {
  const { error } = await supabase.rpc("marcar_aviso_reposicion_visto", {
    p_id: id,
  });
  if (error) throw new Error(error.message);
  refreshMailbox();
}
