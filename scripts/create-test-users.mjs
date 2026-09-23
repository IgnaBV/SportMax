// Ejecutar: node scripts/create-test-users.mjs
// API oficial: https://supabase.com/docs/reference/javascript/auth-admin-createuser
// Las credenciales se leen de archivos *.local ignorados por Git; nunca de src.
import { readFileSync, existsSync } from "node:fs";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";

const env = Object.assign(
  {},
  ...[".env.local", ".env.test-users.local", ".env.admin.local"].map((file) =>
    existsSync(file) ? parseEnv(readFileSync(file, "utf8")) : {},
  ),
);
const url = env.VITE_SUPABASE_URL;
const publicKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const secret = env.SUPABASE_SECRET_KEY;
if (!url || !publicKey || !secret) {
  console.error(
    "Falta SUPABASE_SECRET_KEY en .env.admin.local o la configuración pública de Supabase. No se modificaron usuarios.",
  );
  process.exit(1);
}
const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};
const admin = createClient(url, secret, options);
const accounts = [
  {
    email: "admin@empresa.com",
    role: "ADMINISTRADOR",
    password: env.TEST_ADMIN_PASSWORD,
  },
  {
    email: "inventario@empresa.com",
    role: "INVENTARIO",
    password: env.TEST_INVENTORY_PASSWORD,
  },
  { email: "rrhh@empresa.com", role: "RRHH", password: env.TEST_HR_PASSWORD },
];
if (accounts.some((a) => !a.password))
  throw new Error("Faltan contraseñas de prueba en .env.test-users.local.");

try {
  const existing = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    for (const user of data.users)
      if (accounts.some((a) => a.email === user.email))
        existing.set(user.email, user);
    if (data.users.length < 1000) break;
  }
  for (const account of accounts) {
    const previous = existing.get(account.email);
    if (previous) {
      // No restablecer contraseñas de cuentas preexistentes sin verificar su identidad.
      const probe = createClient(url, publicKey, options);
      const result = await probe.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });
      if (result.error)
        throw new Error(
          `${account.email} ya existe y no permite entrar con la contraseña indicada. No se cambió esa cuenta.`,
        );
      await probe.auth.signOut();
      if (previous.app_metadata.role !== account.role) {
        const { error } = await admin.auth.admin.updateUserById(previous.id, {
          app_metadata: { ...previous.app_metadata, role: account.role },
        });
        if (error) throw error;
      }
    } else {
      const { error } = await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        app_metadata: { role: account.role, test_account: true },
      });
      if (error) throw error;
    }
    const client = createClient(url, publicKey, options);
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });
      if (error) throw error;
      if (data.user.app_metadata.role !== account.role)
        throw new Error(`Rol incorrecto para ${account.email}`);
      const tables =
        account.role === "ADMINISTRADOR"
          ? ["productos", "trabajadores"]
          : account.role === "INVENTARIO"
            ? ["productos"]
            : ["trabajadores"];
      for (const table of tables) {
        const { error: queryError } = await client
          .from(table)
          .select("id")
          .limit(1);
        if (queryError) throw queryError;
      }
      console.log(
        `${account.email}: ${account.role} · acceso y lectura verificados`,
      );
    } finally {
      await client.auth.signOut();
    }
  }
} catch (error) {
  console.error(
    "No se completó la creación de todas las cuentas:",
    error instanceof Error ? error.message : "Error de Supabase",
  );
  process.exitCode = 1;
}
