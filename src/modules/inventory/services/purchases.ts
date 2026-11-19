import { list, save } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { refreshMailbox } from "./notifications";
import type { Id, Named, Product, Stock } from "@/types/entities";
export interface Supplier {
  id: Id;
  nombre: string;
  identificacion_fiscal: string | null;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  updated_at: string;
}
export interface Purchase {
  id: string;
  proveedor_nombre: string;
  producto_nombre: string;
  sucursal_nombre: string;
  cantidad: number;
  costo_unitario: number;
  total: number;
  fecha_recepcion: string;
  comprobante: string | null;
  observacion: string | null;
  responsable: string;
  created_at: string;
}
export async function loadSuppliers() {
  try {
    return await list<Supplier>("proveedores");
  } catch {
    throw new Error(
      "No se pudieron cargar los proveedores. Comprueba la conexión y aplica 20260925_compras_proveedores.sql en Supabase.",
    );
  }
}
export function saveSupplier(values: Record<string, string>, id?: Id) {
  return save(
    "proveedores",
    {
      nombre: values.nombre,
      identificacion_fiscal: values.identificacion_fiscal || null,
      contacto: values.contacto || null,
      email: values.email || null,
      telefono: values.telefono || null,
      direccion: values.direccion || null,
      notas: values.notas || null,
      activo: values.activo === "true",
    },
    id,
  );
}
export async function loadPurchases() {
  const [suppliers, products, branches, stock, purchases] = await Promise.all([
    loadSuppliers(),
    list<Product>("productos"),
    list<Named>("sucursales", "id,nombre"),
    list<Stock>("inventarios"),
    list<Purchase>("compras"),
  ]);
  return {
    suppliers,
    products,
    branches,
    stock,
    purchases: purchases.sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
  };
}
export async function registerPurchase(
  id: string,
  values: Record<string, string>,
  expected: number,
) {
  const { error } = await supabase.rpc("registrar_compra_recibida", {
    p_id: id,
    p_proveedor_id: values.proveedor_id,
    p_producto_id: values.producto_id,
    p_sucursal_id: values.sucursal_id,
    p_cantidad: Number(values.cantidad),
    p_costo_unitario: Number(values.costo_unitario),
    p_fecha_recepcion: values.fecha_recepcion,
    p_comprobante: values.comprobante,
    p_observacion: values.observacion,
    p_cantidad_esperada: expected,
  });
  if (error)
    throw new Error(
      error.code === "PGRST202"
        ? "Aplica la migración 20260925_compras_proveedores.sql en Supabase."
        : error.message,
    );
  refreshMailbox();
}
