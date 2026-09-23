import fs from "node:fs";
import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [
        line.slice(0, i).trim(),
        line
          .slice(i + 1)
          .trim()
          .replace(/^['"]|['"]$/g, ""),
      ];
    }),
);
const project = new URL(env.VITE_SUPABASE_URL).hostname.split(".")[0];
const base = "http://127.0.0.1:5173";
const fixture = {
  productos: [
    {
      id: 1,
      codigo: "TEST-01",
      nombre: "Producto de prueba",
      descripcion: "Registro exclusivo de la prueba del navegador",
      categoria_id: 1,
      talla: "M",
      color: "Crema",
      stock_minimo: 5,
      activo: true,
      created_at: "2026-09-01T12:00:00Z",
    },
  ],
  categorias: [{ id: 1, nombre: "Categoría de prueba" }],
  sucursales: [{ id: 1, nombre: "Sucursal de prueba" }],
  inventarios: [{ id: 1, producto_id: 1, sucursal_id: 1, cantidad: 10 }],
  movimientos_inventario: [],
  trabajadores: [
    {
      id: 1,
      nombres: "Persona",
      apellidos: "de prueba",
      identificacion: "TEST-001",
      telefono: "",
      direccion: "",
      area: "Administración",
      cargo: "Analista",
      fecha_ingreso: "2026-01-01",
      salario: 3000,
      estado: "ACTIVO",
      created_at: "2026-01-01T12:00:00Z",
    },
  ],
  asistencias: [
    {
      id: 1,
      trabajador_id: 1,
      fecha: "2026-09-23",
      hora_entrada: "09:00",
      hora_salida: null,
      estado: "PRESENTE",
      observacion: "",
    },
  ],
  solicitudes: [
    {
      id: 1,
      trabajador_id: 1,
      tipo: "PERMISO",
      fecha_inicio: "2026-09-25T12:00:00Z",
      fecha_fin: "2026-09-25T14:00:00Z",
      motivo: "Prueba de solicitud",
      estado: "PENDIENTE",
      created_at: "2026-09-20T12:00:00Z",
    },
  ],
  documentos_trabajador: [],
  horarios: [],
};
const browser = await chromium.launch({ channel: "msedge", headless: true });
let count = 0;
const errors = [];
async function context(role = "ADMINISTRADOR", mode = "data") {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  if (role) {
    const user = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "prueba@example.invalid",
      app_metadata: { role },
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00Z",
    };
    const payload = {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "authenticated",
      app_metadata: { role },
    };
    const token =
      [{ alg: "HS256", typ: "JWT" }, payload]
        .map((v) => Buffer.from(JSON.stringify(v)).toString("base64url"))
        .join(".") + ".test-signature";
    await ctx.addInitScript(
      ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
      {
        key: `sb-${project}-auth-token`,
        session: {
          access_token: token,
          refresh_token: "test-only",
          expires_at: payload.exp,
          expires_in: 3600,
          token_type: "bearer",
          user,
        },
      },
    );
  }
  await ctx.route("**/auth/v1/**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await ctx.route("**/rest/v1/**", async (r) => {
    const req = r.request();
    const path = new URL(req.url()).pathname;
    const table = path.split("/").at(-1);
    if (mode === "error")
      return r.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error de conexión simulado" }),
      });
    if (req.method() === "GET")
      return r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mode === "empty" ? [] : fixture[table] || []),
      });
    if (path.includes("/rpc/")) {
      const body = req.postDataJSON();
      assert.equal(body.p_tipo, "ENTRADA");
      assert.equal(body.p_cantidad, 3);
      assert.equal(body.p_cantidad_esperada, 10);
      fixture.inventarios[0].cantidad = 13;
      return r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ cantidad_anterior: 10, cantidad_nueva: 13 }),
      });
    }
    return r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: 1 }),
    });
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  return { ctx, page };
}
try {
  const { ctx, page } = await context();
  const routes = [
    "/dashboard",
    "/inventory",
    "/inventory/products",
    "/inventory/stock",
    "/inventory/entries",
    "/inventory/exits",
    "/inventory/adjustments",
    "/inventory/movements",
    "/hr",
    "/hr/employees",
    "/hr/attendance",
    "/hr/permissions",
    "/hr/vacations",
    "/hr/documents",
    "/not-found",
  ];
  for (const route of routes) {
    await page.goto(base + route);
    await page.locator("main h1").waitFor();
    await page.waitForFunction(() => !document.querySelector(".loading"));
    assert.ok(
      (await page.locator("main").innerText()).trim().length > 60,
      route + " empty",
    );
    assert.equal(
      await page.locator(".error-panel").count(),
      0,
      route + " error",
    );
    count++;
  }
  await page.goto(base + "/inventory/products");
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await page.getByText("Este campo es obligatorio").first().waitFor();
  assert.ok(await page.getByRole("dialog").isVisible());
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  count++;
  await page.goto(base + "/inventory/exits");
  await page.getByLabel("Sucursal *", { exact: true }).selectOption("1");
  await page.getByLabel("Producto *", { exact: true }).selectOption("1");
  await page.getByLabel("Cantidad *", { exact: true }).fill("11");
  await page
    .getByLabel("Motivo / observación *", { exact: true })
    .fill("Salida de prueba");
  await page.getByRole("button", { name: "Revisar y confirmar" }).click();
  await page.getByText("Stock insuficiente para esta salida.").waitFor();
  assert.equal(await page.getByRole("dialog").count(), 0);
  count++;
  await page.goto(base + "/inventory/entries");
  await page.getByLabel("Sucursal *", { exact: true }).selectOption("1");
  await page.getByLabel("Producto *", { exact: true }).selectOption("1");
  await page.getByLabel("Cantidad *", { exact: true }).fill("3");
  await page
    .getByLabel("Motivo / observación *", { exact: true })
    .fill("Entrada de prueba");
  await page.getByRole("button", { name: "Revisar y confirmar" }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Confirmar operación" }).click();
  await page.getByText("Movimiento registrado correctamente").waitFor();
  count++;
  await page.goto(base + "/hr/employees");
  await page
    .getByRole("button", { name: "Ver Persona de prueba", exact: true })
    .click();
  for (const name of [
    "Información",
    "Horarios",
    "Asistencia",
    "Permisos",
    "Vacaciones",
    "Documentos",
  ]) {
    await page.getByRole("tab", { name, exact: true }).click();
    assert.ok((await page.getByRole("tabpanel").innerText()).trim().length > 0);
    count++;
  }
  await page.keyboard.press("Escape");
  await page.goto(base + "/hr/attendance");
  await page.getByRole("button", { name: "Editar asistencia" }).click();
  await page.getByLabel("Hora de salida").fill("18:00");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await page.getByText("Asistencia registrada correctamente").waitFor();
  count++;
  await page.goto(base + "/hr/permissions");
  await page.getByRole("button", { name: "Aprobar", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Confirmar operación" }).click();
  await page.getByText("Solicitud aprobada", { exact: true }).waitFor();
  count++;
  await page.goto(base + "/dashboard");
  await page.waitForFunction(() => !document.querySelector(".loading"));
  await page.screenshot({
    path: "tests/dashboard-desktop.png",
    fullPage: true,
  });
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.locator(".sidebar.open").waitFor();
    await page.getByRole("button", { name: "Cerrar navegación" }).click();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow at ${width}`,
    );
    count++;
    for (const route of routes.slice(0, -1)) {
      await page.goto(base + route);
      await page.locator("main h1").waitFor();
      await page.waitForFunction(() => !document.querySelector(".loading"));
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow ${route} at ${width}`,
      );
      count++;
    }
    await page.goto(base + "/dashboard");
    await page.locator("main h1").waitFor();
    await page.waitForFunction(() => !document.querySelector(".loading"));
  }
  await page.screenshot({ path: "tests/dashboard-mobile.png", fullPage: true });
  await ctx.close();
  for (const [role, route] of [
    ["INVENTARIO", "/hr"],
    ["RRHH", "/inventory"],
    ["UNKNOWN", "/dashboard"],
  ]) {
    const { ctx, page } = await context(role);
    await page.goto(base + route);
    await page.getByRole("heading", { name: "Acceso no disponible" }).waitFor();
    count++;
    await ctx.close();
  }
  const anon = await context(null);
  for (const route of routes.slice(0, -1)) {
    await anon.page.goto(base + route);
    await anon.page.getByRole("heading", { name: "Inicia sesión" }).waitFor();
    assert.ok(anon.page.url().endsWith("/login"));
    count++;
  }
  await anon.page.screenshot({ path: "tests/login.png", fullPage: true });
  await anon.ctx.close();
  for (const mode of ["empty", "error"]) {
    const { ctx, page } = await context("ADMINISTRADOR", mode);
    for (const route of routes.slice(0, -1)) {
      await page.goto(base + route);
      await page.waitForFunction(
        () =>
          document.querySelector("main") && !document.querySelector(".loading"),
      );
      assert.ok(
        (await page.locator("main").innerText()).length > 60,
        `${mode} ${route}`,
      );
      if (mode === "error")
        await page
          .getByRole("heading", { name: "No pudimos cargar la información" })
          .waitFor();
      count++;
    }
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    `PASS: ${count} comprobaciones de rutas, roles, formularios, estados y responsive. Sin excepciones del navegador.`,
  );
} finally {
  await browser.close();
}
