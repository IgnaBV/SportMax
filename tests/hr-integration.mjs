// Prueba de integración con registros temporales propios. Requiere las variables
// locales de prueba y administración; no modifica registros preexistentes.
import fs from "node:fs";
import { parseEnv } from "node:util";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const env = Object.assign(
  {},
  ...[".env.local", ".env.admin.local", ".env.test-users.local"].map((p) =>
    parseEnv(fs.readFileSync(p, "utf8")),
  ),
);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const root = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  options,
);
const clients = [];
let workerId;
let checks = 0;
async function unwrap(p) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}
async function login(email, password) {
  const client = createClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  const session = await unwrap(
    client.auth.signInWithPassword({ email, password }),
  );
  clients.push(client);
  return { client, user: session.user };
}
function check(value, message) {
  assert.ok(value, message);
  checks++;
}
try {
  for (const t of [
    "trabajadores",
    "asistencias",
    "horarios",
    "solicitudes",
    "documentos_trabajador",
  ])
    await unwrap(
      root
        .from(t)
        .select("id,updated_at,updated_by,updated_by_label,historial")
        .limit(0),
    );
  const rrhh = await login("rrhh@empresa.com", env.TEST_HR_PASSWORD);
  const admin = await login("admin@empresa.com", env.TEST_ADMIN_PASSWORD);
  const inv = await login(
    "inventario@empresa.com",
    env.TEST_INVENTORY_PASSWORD,
  );
  const worker = await unwrap(
    rrhh.client
      .from("trabajadores")
      .insert({
        nombres: "Prueba automatizada",
        apellidos: "RRHH temporal",
        identificacion: "QA-" + randomUUID(),
        area: "Pruebas",
        cargo: "Registro temporal",
        fecha_ingreso: "2026-09-23",
        salario: 0,
        estado: "ACTIVO",
      })
      .select()
      .single(),
  );
  workerId = worker.id;
  check(
    worker.updated_by === rrhh.user.id && worker.historial.length === 1,
    "Autor y registro de trabajador",
  );
  const change = {
    p_trabajador_id: workerId,
    p_hora_entrada: "09:00",
    p_hora_salida: "18:00",
    p_horario_id: null,
    p_version: null,
  };
  const first = await unwrap(
    rrhh.client.rpc("actualizar_horario_rrhh", change),
  );
  check(
    first.activo &&
      first.historial.length === 1 &&
      first.updated_by === rrhh.user.id,
    "Asignación auditada",
  );
  const second = await unwrap(
    rrhh.client.rpc("actualizar_horario_rrhh", {
      ...change,
      p_hora_entrada: "10:00",
      p_horario_id: first.id,
      p_version: first.updated_at,
    }),
  );
  check(
    second.id === first.id && second.historial.length === 2,
    "Actualización sin duplicar horario",
  );
  check(
    second.historial[1].anterior.hora_entrada === "09:00:00" &&
      second.historial[1].nuevo.hora_entrada === "10:00:00",
    "Historial conserva ambos valores",
  );
  const stale = await rrhh.client.rpc("actualizar_horario_rrhh", {
    ...change,
    p_horario_id: first.id,
    p_version: first.updated_at,
  });
  check(!!stale.error, "Rechazo de edición obsoleta");
  const duplicate = await rrhh.client
    .from("horarios")
    .insert({
      trabajador_id: workerId,
      hora_entrada: "08:00",
      hora_salida: "17:00",
      activo: true,
    });
  check(duplicate.error?.code === "23505", "Un único horario vigente");
  const competing = await Promise.all(
    ["11:00", "12:00"].map((h) =>
      rrhh.client.rpc("actualizar_horario_rrhh", {
        ...change,
        p_horario_id: second.id,
        p_version: second.updated_at,
        p_hora_entrada: h,
      }),
    ),
  );
  check(
    competing.filter((r) => !r.error).length === 1 &&
      competing.filter((r) => r.error).length === 1,
    "Protección concurrente del horario",
  );
  const doc = await unwrap(
    rrhh.client
      .from("documentos_trabajador")
      .insert({
        trabajador_id: workerId,
        nombre: "Referencia temporal",
        tipo: "PRUEBA",
        archivo_url: null,
      })
      .select()
      .single(),
  );
  check(
    doc.updated_by === rrhh.user.id && doc.historial.length === 1,
    "Registro documental auditado sin archivo",
  );
  const modified = await unwrap(
    admin.client
      .from("documentos_trabajador")
      .update({
        nombre: "Referencia temporal revisada",
        updated_by: rrhh.user.id,
        updated_by_label: "AUTOR FALSO",
        historial: [],
      })
      .eq("id", doc.id)
      .eq("updated_at", doc.updated_at)
      .select()
      .single(),
  );
  check(
    modified.updated_by === admin.user.id &&
      modified.updated_by_label === admin.user.email &&
      modified.historial.length === 2,
    "Autor confiable e historial protegido",
  );
  const oldDoc = await rrhh.client
    .from("documentos_trabajador")
    .update({ nombre: "No debe guardarse" })
    .eq("id", doc.id)
    .eq("updated_at", doc.updated_at)
    .select()
    .single();
  check(!!oldDoc.error, "Protección concurrente de documentos");
  for (const [tipo, estado] of [
    ["PERMISO", "APROBADO"],
    ["VACACIONES", "RECHAZADO"],
  ]) {
    const request = await unwrap(
      rrhh.client
        .from("solicitudes")
        .insert({
          trabajador_id: workerId,
          tipo,
          fecha_inicio: "2026-10-01T12:00:00Z",
          fecha_fin: "2026-10-02T12:00:00Z",
          motivo: "Validación automatizada temporal",
          estado: "PENDIENTE",
        })
        .select()
        .single(),
    );
    const result = await unwrap(
      admin.client
        .from("solicitudes")
        .update({ estado, observacion_respuesta: "Decisión de prueba" })
        .eq("id", request.id)
        .eq("estado", "PENDIENTE")
        .select()
        .single(),
    );
    check(
      result.updated_by === admin.user.id &&
        result.historial.at(-1).accion === estado,
      "Decisión auditada " + tipo,
    );
    const repeated = await rrhh.client
      .from("solicitudes")
      .update({ estado: "PENDIENTE" })
      .eq("id", request.id);
    check(!!repeated.error, "Decisión final protegida " + tipo);
  }
  const attendance = await unwrap(
    rrhh.client
      .from("asistencias")
      .insert({
        trabajador_id: workerId,
        fecha: "2026-09-23",
        hora_entrada: "09:10",
        estado: "ATRASO",
      })
      .select()
      .single(),
  );
  check(attendance.updated_by === rrhh.user.id, "Asistencia auditada");
  for (const t of [
    "trabajadores",
    "horarios",
    "documentos_trabajador",
    "solicitudes",
    "asistencias",
  ]) {
    const result = await inv.client
      .from(t)
      .select("id")
      .eq(t === "trabajadores" ? "id" : "trabajador_id", workerId);
    check(!result.data?.length, "Inventario no puede leer " + t);
  }
  const forbidden = await inv.client.rpc("actualizar_horario_rrhh", change);
  check(!!forbidden.error, "Inventario no puede actualizar horario");
  console.log(
    "PASS:",
    checks,
    "comprobaciones reales de auditoría, concurrencia, relaciones y permisos.",
  );
} catch (e) {
  console.error("FAIL:", e.message);
  process.exitCode = 1;
} finally {
  if (workerId !== undefined) {
    for (const table of [
      "asistencias",
      "solicitudes",
      "documentos_trabajador",
      "horarios",
    ]) {
      const { error } = await root
        .from(table)
        .delete()
        .eq("trabajador_id", workerId);
      if (error) {
        console.error("No se pudo limpiar tabla de prueba:", table);
        process.exitCode = 1;
      }
    }
    const { error } = await root
      .from("trabajadores")
      .delete()
      .eq("id", workerId);
    if (error) {
      console.error("No se pudo limpiar el trabajador temporal");
      process.exitCode = 1;
    } else console.log("Registros temporales eliminados.");
  }
  for (const c of clients) await c.auth.signOut();
}
