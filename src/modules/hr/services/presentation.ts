import type { Attendance, Schedule } from "@/types/entities";
export const timestamp = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("es-BO", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Sin registro previo";
export const hour = (value?: string | null) => value?.slice(0, 5) || "—";
const minutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};
export function compareAttendance(a: Attendance, s?: Schedule) {
  if (!s) return "Sin horario vigente";
  if (!a.hora_entrada) return "Sin entrada registrada";
  const planned = minutes(s.hora_entrada);
  let actual = minutes(a.hora_entrada);
  if (minutes(s.hora_salida) < planned && actual <= minutes(s.hora_salida))
    actual += 1440;
  const delta = actual - planned;
  return delta > 0
    ? `${delta} min después de la entrada prevista`
    : delta < 0
      ? `${-delta} min antes de la entrada prevista`
      : "Entrada a la hora prevista";
}
