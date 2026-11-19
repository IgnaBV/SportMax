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
export function scheduleDifference(value: string | null, s: Schedule, kind: "entry" | "exit") {
  const entry = minutes(s.hora_entrada);
  const exit = minutes(s.hora_salida);
  if (!value) return null;
  let actual = minutes(value);
  let planned = kind === "entry" ? entry : exit;
  if (exit < entry) {
    if (kind === "exit") {
      planned += 1440;
      if (actual < entry) actual += 1440;
    } else if (actual <= exit) actual += 1440;
  }
  return actual - planned;
}
export function compareAttendance(a: Pick<Attendance, "hora_entrada">, s?: Schedule) {
  if (!s) return "Sin horario vigente";
  if (!a.hora_entrada) return "Sin entrada registrada";
  const delta = scheduleDifference(a.hora_entrada, s, "entry")!;
  return delta > 0
    ? `Retraso de entrada: ${delta} min`
    : delta < 0
      ? `${-delta} min antes de la entrada prevista`
      : "Entrada a la hora prevista";
}
export function compareDeparture(a: Pick<Attendance, "hora_salida">, s?: Schedule) {
  if (!s) return "Sin horario vigente";
  if (!a.hora_salida) return "Salida pendiente";
  const delta = scheduleDifference(a.hora_salida, s, "exit")!;
  return delta < 0
    ? `Salida anticipada: ${-delta} min`
    : delta > 0
      ? `Salida posterior: ${delta} min`
      : "Salida a tiempo";
}

export function attendanceStatus(entry: string, schedule?: Schedule) {
  if (!schedule) return "PRESENTE";
  const planned = minutes(schedule.hora_entrada);
  let actual = minutes(entry);
  if (
    minutes(schedule.hora_salida) < planned &&
    actual <= minutes(schedule.hora_salida)
  )
    actual += 1440;
  return actual > planned ? "ATRASO" : "PRESENTE";
}
