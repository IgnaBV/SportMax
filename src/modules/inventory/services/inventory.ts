import { list, save, checkConfiguration } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { refreshMailbox } from "./notifications";
import type {
  Product,
  Stock,
  Named,
  Movement,
  MovementType,
  Id,
} from "@/types/entities";
export async function loadInventory() {
  const [products, stock, branches, categories, movements] = await Promise.all([
    list<Product>("productos"),
    list<Stock>("inventarios"),
    list<Named>("sucursales", "id,nombre"),
    list<Named>("categorias", "id,nombre"),
    list<Movement>("movimientos_inventario"),
  ]);
  return {
    products,
    stock,
    branches,
    categories,
    movements: movements.sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
  };
}
export function saveProduct(v: Record<string, string>, id?: Id) {
  return save(
    "productos",
    {
      codigo: v.codigo,
      nombre: v.nombre,
      descripcion: v.descripcion || null,
      categoria_id: v.categoria_id || null,
      ...(Object.hasOwn(v, "proveedor_id")
        ? { proveedor_id: v.proveedor_id || null }
        : {}),
      talla: v.talla || null,
      color: v.color || null,
      stock_minimo: Number(v.stock_minimo),
      activo: v.activo === "true",
    },
    id,
  );
}
export async function loadMovementNames(): Promise<Record<string, string>> {
  const { data, error } = await supabase.rpc("nombres_responsables_inventario");
  if (error)
    throw new Error(
      error.code === "PGRST202"
        ? "Para mostrar los nombres de los responsables, aplica la migración 20260923_movimientos_responsables.sql en Supabase."
        : "No se pudieron cargar los nombres de los responsables.",
    );
  return Object.fromEntries(
    (data as { responsable: string; nombre: string }[]).map((user) => [
      user.responsable,
      user.nombre,
    ]),
  );
}
export async function registerMovement(input: {
  producto_id: string;
  sucursal_id: string;
  tipo: MovementType;
  cantidad: number;
  motivo: string;
  cantidad_esperada: number;
}) {
  checkConfiguration();
  const { data, error } = await supabase.rpc(
    "registrar_movimiento_inventario",
    {
      p_producto_id: input.producto_id,
      p_sucursal_id: input.sucursal_id,
      p_tipo: input.tipo,
      p_cantidad: input.cantidad,
      p_motivo: input.motivo,
      p_cantidad_esperada: input.cantidad_esperada,
    },
  );
  if (error)
    throw new Error(
      error.code === "PGRST202"
        ? "La función transaccional de inventario aún no está instalada. Aplica el archivo SQL de integración antes de registrar movimientos."
        : error.message,
    );
  refreshMailbox();
  return data;
}
