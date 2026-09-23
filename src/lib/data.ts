import { supabase, configurationError } from "./supabase";
import type { Id } from "@/types/entities";
export function checkConfiguration() {
  if (configurationError) throw new Error(configurationError);
}
export async function list<T>(table: string, columns = "*"): Promise<T[]> {
  checkConfiguration();
  const rows: T[] = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id")
      .range(start, start + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data as unknown as T[]));
    if (data.length < 1000) return rows;
  }
}
export async function save(table: string, values: object, id?: Id) {
  checkConfiguration();
  const query =
    id === undefined
      ? supabase.from(table).insert(values)
      : supabase.from(table).update(values).eq("id", id);
  const { data, error } = await query.select("id").single();
  if (error) throw new Error(error.message);
  return data;
}
export const same = (a: Id | null | undefined, b: Id | null | undefined) =>
  String(a) === String(b);
export const date = (value: string) =>
  value
    ? new Date(
        value.length === 10 ? value + "T12:00:00" : value,
      ).toLocaleDateString("es-BO")
    : "—";
export const fullName = (e: { nombres: string; apellidos: string }) =>
  `${e.nombres} ${e.apellidos}`;
