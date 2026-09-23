# Sport Max

Para instalar, ejecutar y modificar el proyecto en otra computadora, consulta [docTecnico.md](./docTecnico.md).

Frontend React + Vite + TypeScript, Tailwind, shadcn/Base UI y Supabase. Incluye únicamente Inventarios y Recursos Humanos.

## Ejecutar

```sh
npm install
npm run dev
npm run build
npm run lint
```

En `.env.local` configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Usa únicamente la URL HTTPS del proyecto y la clave pública. Nunca incluyas claves `secret` o `service_role` en variables VITE. Si una clave secreta estuvo en ese archivo, revócala en Supabase.

## Integración con Supabase

Se verificaron mediante la API las tablas y columnas utilizadas. Después de que se aplicó `supabase/setup.sql`, se comprobó que las diez tablas rechazan consultas anónimas (HTTP 401), y la función `registrar_movimiento_inventario` existe y rechaza invocaciones anónimas (42501). No se ejecutaron escrituras de prueba sobre los datos reales.

Para reproducir la configuración en otra instancia:

1. Revisa y ejecuta `supabase/setup.sql` como propietario en SQL Editor. Habilita RLS, limita acceso por rol y crea la función transaccional de inventario; no crea tablas ni cambia registros de negocio. Las políticas existentes restrictivas siguen aplicándose. Comprueba su compatibilidad con cualquier otra aplicación que use estas tablas.
2. Crea las cuentas de Supabase Auth y asigna `app_metadata.role` a `ADMINISTRADOR`, `INVENTARIO` o `RRHH` mediante una herramienta administrativa segura. No uses `user_metadata` para autorizaciones. Cierra y abre sesión después de cambiar el rol.
3. Prueba cada rol y confirma que anónimos no pueden consultar las tablas y que RRHH no puede acceder a Inventarios, ni viceversa.
4. Con una cuenta autorizada, valida creación/edición de registros y una entrada, salida y ajuste de prueba. Estos cambios no se ejecutaron automáticamente sobre datos reales.

La función de inventario usa una transacción, bloqueo por producto/sucursal, bloqueo de fila y comparación del stock esperado. Stock e historial se guardan juntos o se revierten juntos. Impide cantidades negativas y movimientos sin cambios. La identidad responsable proviene de `auth.uid()`. No se permite escritura directa al inventario desde el cliente tras aplicar el script.

Si la función aún no está instalada, la interfaz muestra un error explícito. No se implementa una alternativa de dos escrituras independientes, porque podría dejar inventario e historial inconsistentes.

## Rutas

- `/login`, `/dashboard`
- `/inventory`, `/inventory/products`, `/inventory/stock`, `/inventory/entries`, `/inventory/exits`, `/inventory/adjustments`, `/inventory/movements`
- `/hr`, `/hr/employees`, `/hr/attendance`, `/hr/permissions`, `/hr/vacations`, `/hr/documents`

Todas las rutas empresariales requieren sesión y un rol autorizado. Hay pantalla de acceso denegado, 404, estados vacíos, carga y error. La ruta raíz redirige al dashboard. En hosting estático configura la reescritura de rutas a `/index.html`.

## Organización

- `src/modules/*/services`: consultas y escrituras Supabase.
- `src/modules/*/pages` y `components`: pantallas y formularios de cada módulo.
- `src/context`: sesión y notificaciones.
- `src/components/common`: tabla paginada, formularios, diálogos y estados reutilizables.
- `src/types/entities.ts`: entidades del esquema proporcionado.

Los documentos se vinculan con URL HTTPS existente. No se suben archivos ni se asume un bucket público; los documentos privados necesitan enlaces con control de acceso. Los salarios se muestran solo en formularios/detalle de RRHH. No se crean ventas, compras, nómina ni tablas adicionales.

## Verificaciones

`npm run build` comprueba TypeScript e imports y genera producción. `npm run lint` comprueba ESLint. `tests/smoke.mjs` recorre las rutas con Playwright, verifica roles visuales, validación de formularios, confirmaciones, pestañas del trabajador, estados vacíos/error y anchos de escritorio, tablet y móvil. Las sesiones y respuestas de esta prueba son simuladas y aisladas; no se envían escrituras a Supabase.

Para repetir el smoke test, inicia Vite en `127.0.0.1:5173`, utiliza Playwright con Microsoft Edge instalado y ejecuta `node tests/smoke.mjs`. Si Playwright no está en el proyecto, `PLAYWRIGHT_MODULE` permite indicar la URL `file:///.../playwright/index.mjs` de una instalación externa, sin cambiar las dependencias. Las capturas en `tests/` contienen únicamente datos simulados.

La validación con usuarios reales y las escrituras autenticadas requieren una cuenta de Supabase Auth con el rol correspondiente. Las pruebas visuales no sustituyen una auditoría de las políticas RLS con sesiones reales de cada rol.

## Usuarios de prueba

Se crearon y verificaron los accesos de `admin@empresa.com` (ADMINISTRADOR), `inventario@empresa.com` (INVENTARIO) y `rrhh@empresa.com` (RRHH), con las contraseñas de prueba solicitadas. También se verificó con sesiones reales que Inventario no ve filas de RRHH y que RRHH no ve filas de Inventarios.

`scripts/create-test-users.mjs` utiliza la API administrativa oficial de Supabase para crear las cuentas, confirmar sus correos y asignar `app_metadata.role`. Lee la clave administrativa desde `.env.admin.local` y las contraseñas desde `.env.test-users.local`; ambos archivos están excluidos por la regla `*.local` de `.gitignore`. No importa estos archivos desde el frontend ni expone contraseñas en la interfaz. El script no restablece contraseñas de cuentas preexistentes que no coincidan con las indicadas.
