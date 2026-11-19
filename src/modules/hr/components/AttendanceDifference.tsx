import type { Attendance, Schedule } from "@/types/entities";
import { compareAttendance, compareDeparture, scheduleDifference } from "../services/presentation";

export default function AttendanceDifference({ record, schedule, kind }: {
  record: Pick<Attendance, "hora_entrada" | "hora_salida">;
  schedule?: Schedule;
  kind: "entry" | "exit";
}) {
  const value = kind === "entry" ? record.hora_entrada : record.hora_salida;
  const delta = schedule && value ? scheduleDifference(value, schedule, kind) : null;
  const color = delta === null ? "" : kind === "exit" && delta < 0 ? "red" : delta > 0 ? "gold" : "green";
  const text = kind === "entry" ? compareAttendance(record, schedule) : compareDeparture(record, schedule);
  return <span className={`badge ${color}`} title="Comparación con el horario vigente">{text}</span>;
}
