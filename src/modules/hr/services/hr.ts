import { list, save } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type {
  Employee,
  Attendance,
  Request,
  Document,
  Id,
  Schedule,
} from "@/types/entities";
export const loadEmployees = () => list<Employee>("trabajadores");
export async function loadHR() {
  const [employees, attendance, requests, documents, schedules] =
    await Promise.all([
      loadEmployees(),
      list<Attendance>("asistencias"),
      list<Request>("solicitudes"),
      list<Document>("documentos_trabajador"),
      list<Schedule>(
        "horarios",
        "id,trabajador_id,hora_entrada,hora_salida,activo",
      ),
    ]);
  return {
    employees,
    attendance: attendance.sort((a, b) => b.fecha.localeCompare(a.fecha)),
    requests: requests.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    documents,
    schedules,
  };
}
export function saveEmployee(v: Record<string, string>, id?: Id) {
  return save("trabajadores", { ...v, salario: Number(v.salario) }, id);
}
export function saveAttendance(v: Record<string, string>, id?: Id) {
  return save(
    "asistencias",
    {
      ...v,
      hora_entrada: v.hora_entrada || null,
      hora_salida: v.hora_salida || null,
    },
    id,
  );
}
export function saveRequest(
  v: Record<string, string>,
  tipo: "PERMISO" | "VACACIONES",
) {
  return save("solicitudes", { ...v, tipo, estado: "PENDIENTE" });
}
export async function resolveRequest(
  id: Id,
  estado: string,
  observacion: string,
) {
  const { error } = await supabase
    .from("solicitudes")
    .update({ estado, observacion_respuesta: observacion || null })
    .eq("id", id)
    .eq("estado", "PENDIENTE")
    .select("id")
    .single();
  if (error)
    throw new Error(
      "No se pudo resolver la solicitud. Puede haber sido atendida por otra persona o no tienes permisos.",
    );
}
export function saveDocument(v: Record<string, string>) {
  return save("documentos_trabajador", v);
}
