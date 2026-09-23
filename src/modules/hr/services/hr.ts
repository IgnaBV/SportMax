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
export async function loadHR(employeeId?: Id) {
  const filter =
    employeeId === undefined
      ? undefined
      : { column: "trabajador_id", value: employeeId };
  const [employees, attendance, requests, documents, schedules] =
    await Promise.all([
      employeeId === undefined
        ? loadEmployees()
        : list<Employee>("trabajadores", "*", {
            column: "id",
            value: employeeId,
          }),
      list<Attendance>("asistencias", "*", filter),
      list<Request>("solicitudes", "*", filter),
      list<Document>("documentos_trabajador", "*", filter),
      list<Schedule>("horarios", "*", filter),
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
  estado: "APROBADO" | "RECHAZADO",
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
export async function saveDocument(
  v: Record<string, string>,
  current?: Document,
) {
  const values = {
    nombre: v.nombre,
    tipo: v.tipo,
    archivo_url: v.archivo_url || null,
  };
  if (!current)
    return save("documentos_trabajador", {
      ...values,
      trabajador_id: v.trabajador_id,
    });
  let query = supabase
    .from("documentos_trabajador")
    .update(values)
    .eq("id", current.id);
  query = current.updated_at
    ? query.eq("updated_at", current.updated_at)
    : query.is("updated_at", null);
  const { error } = await query.select("id").single();
  if (error)
    throw new Error(
      "No se pudo actualizar el documento. Revisa tus permisos, la migración y si otra persona lo modificó; después recarga la ficha.",
    );
}
export async function saveSchedule(
  employeeId: Id,
  values: Record<string, string>,
  current?: Schedule,
) {
  const { error } = await supabase.rpc("actualizar_horario_rrhh", {
    p_trabajador_id: employeeId,
    p_hora_entrada: values.hora_entrada,
    p_hora_salida: values.hora_salida,
    p_horario_id: current?.id ?? null,
    p_version: current?.updated_at ?? null,
  });
  if (error)
    throw new Error(
      error.code === "PGRST202"
        ? "Falta aplicar la migración de horarios y auditoría en Supabase."
        : error.message,
    );
}
