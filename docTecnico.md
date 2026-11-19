# Sport Max — Documento técnico

Esta guía permite instalar, ver y modificar el proyecto en otra computadora. La aplicación administra Inventarios y Recursos Humanos; utiliza React, TypeScript, Vite, Tailwind y Supabase.

## 1. Qué necesitas

- Node.js 24 con npm. El proyecto se desarrolló y compiló con esta versión.
- Git instalado y acceso al repositorio del proyecto.
- Un editor de código, por ejemplo Visual Studio Code.
- Un navegador e internet para instalar dependencias y conectarte a Supabase.
- La URL del repositorio y la URL y clave **pública** de Supabase, proporcionadas por el responsable.

No necesitas instalar PostgreSQL ni ejecutar un servidor backend local. La base de datos y la autenticación están en Supabase.

## 2. Instalar y ejecutar por primera vez

### Paso 1: clonar el repositorio

Abre una terminal en la carpeta donde quieras descargar el proyecto. Comprueba que Git, Node.js y npm estén instalados:

```sh
git --version
node --version
npm --version
```

Clona el repositorio y entra en la carpeta descargada:

```sh
git clone URL_DEL_REPOSITORIO sistema-empresarial
cd sistema-empresarial
```

Reemplaza `URL_DEL_REPOSITORIO` por la dirección real entregada por el responsable. Si el repositorio es privado, necesitas una cuenta con acceso. Abre la carpeta `sistema-empresarial` con el editor; en su raíz deben aparecer `package.json` y `package-lock.json`.

### Paso 2: instalar dependencias

```sh
npm ci
```

Este comando instala las versiones registradas en `package-lock.json` y crea `node_modules`. No ejecutes `create-vite`: el proyecto ya está creado.

### Paso 3: configurar Supabase

Copia `.env.example` con el nombre `.env.local`, en la misma carpeta que `package.json`. En PowerShell puedes ejecutar:

```powershell
Copy-Item .env.example .env.local
```

En macOS, Linux o Git Bash, utiliza `cp .env.example .env.local`. El archivo `.env.local` está excluido de Git, por lo que debes crearlo después de clonar el repositorio.

Completa el archivo con los valores que entregue el responsable:

```dotenv
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

Los valores del ejemplo son marcadores: debes reemplazarlos. La primera variable es una URL; la segunda es la clave pública publishable. No pongas claves `secret` ni `service_role` en estas variables.

Si utilizas el mismo proyecto Supabase, las tablas, la función de inventario y las cuentas de prueba ya están configuradas. No vuelvas a ejecutar los scripts SQL para abrir el frontend.

### Paso 4: iniciar la aplicación

```sh
npm run dev
```

Abre la dirección que indique la terminal, normalmente `http://localhost:5173`. Si el puerto está ocupado, Vite puede utilizar otro: abre el que aparezca en la terminal.

Mantén la terminal abierta mientras trabajas. Para detener el servidor, presiona `Ctrl + C`. Para volver a usarlo otro día, entra en la carpeta y ejecuta nuevamente `npm run dev`; no necesitas reinstalar dependencias cada vez.

No abras `index.html` con doble clic: utiliza el servidor de Vite.

## 3. Entrar y recorrer el sistema

En el Supabase original se crearon estas cuentas de prueba:

- **Administrador:** `admin@empresa.com`, contraseña `admin123`. Accede a ambos módulos.
- **Inventario:** `inventario@empresa.com`, contraseña `inventario123`. Accede a Inventarios.
- **Recursos Humanos:** `rrhh@empresa.com`, contraseña `rrhh123`. Accede a RRHH.

Son credenciales de demostración. Si el responsable las cambia o entrega otra instancia de Supabase, solicita los nuevos accesos.

Desde el menú puedes revisar:

- **Dashboard:** indicadores y accesos rápidos.
- **Inventarios:** productos, existencias por sucursal, entradas, salidas, ajustes y movimientos.
- **RRHH:** listado con búsqueda por nombre/identificación y filtros por área, cargo y estado. «Ver ficha» abre una ficha única con Información, Asistencia, Permisos, Vacaciones, Horario y Documentos.

En la ficha puedes editar información, registrar asistencia y solicitudes, asignar o actualizar el horario, y registrar o editar documentos. Se muestra la fecha y el responsable de las modificaciones registradas desde que se instaló la auditoría. En permisos y vacaciones, «Consultar» no modifica datos; «Aprobar» y «Rechazar» requieren una confirmación independiente.

La comparación de asistencia utiliza el horario actualmente vigente como referencia y no reconstruye horarios pasados. Los cambios de horario se conservan en su historial.

Cerrar sesión permite probar otro rol. La aplicación comprueba el rol guardado en `app_metadata.role`; Supabase también limita el acceso mediante políticas RLS.

**Las operaciones realizadas desde tu computadora se guardan en la base remota configurada.** Si varias personas usan la misma conexión, comparten los datos. Utiliza registros de prueba acordados con el responsable.

## 4. Dónde modificar cada cosa

- `src/pages/Login.tsx`: pantalla de inicio de sesión.
- `src/pages/Dashboard.tsx`: dashboard general y resúmenes de módulos.
- `src/components/layout/Sidebar.tsx`: marca, enlaces del menú y cierre de sesión.
- `src/components/layout/Header.tsx`: encabezado superior.
- `src/components/layout/AppLayout.tsx`: estructura general y pie de página.
- `src/index.css`: colores, tamaños, espaciados y adaptación a pantallas pequeñas.
- `src/modules/inventory/pages/`: pantallas de Inventarios.
- `src/modules/inventory/components/MovementForm.tsx`: formulario compartido de entrada, salida y ajuste.
- `src/modules/inventory/services/inventory.ts`: consultas y operaciones de Inventarios.
- `src/modules/hr/pages/` y `src/modules/hr/components/`: pantallas, solicitudes y detalle del trabajador.
- `src/modules/hr/services/hr.ts`: consultas y operaciones de RRHH.
- `src/modules/hr/components/EmployeeDetail.tsx`: ficha centralizada, accesible en `/hr/employees/ID` utilizando el ID real del trabajador.
- `src/modules/hr/components/SchedulePanel.tsx`: consulta y actualización del horario.
- `src/modules/hr/components/Audit.tsx`: fecha, responsable e historial de cambios.
- `src/modules/hr/permissions.ts`: capacidades de acceso a RRHH; no habilita un módulo de Gerencia.
- `src/components/common/UI.tsx`: tablas, formularios, diálogos y estados reutilizables.
- `src/routes/AppRoutes.tsx`: rutas y control visual de acceso por rol.
- `src/types/entities.ts`: tipos TypeScript de las entidades.
- `src/lib/supabase.ts`: cliente Supabase; obtiene su configuración del entorno.
- `src/context/AuthProvider.tsx`: recuperación y seguimiento de la sesión.
- `index.html`: título de la pestaña. `public/favicon.svg`: icono del sitio.

El alias `@/` equivale a la carpeta `src/`. Por ejemplo, `@/lib/supabase` apunta a `src/lib/supabase.ts`.

### Ejemplo de modificación: cambiar un texto

1. Ejecuta `npm run dev` y abre la aplicación.
2. Abre `src/pages/Login.tsx` en el editor.
3. Cambia el texto «Ingresa con tu cuenta empresarial para continuar».
4. Guarda el archivo y revisa `/login` sin una sesión iniciada. Vite actualiza la página durante el desarrollo.
5. Ejecuta las comprobaciones del apartado siguiente antes de entregar tus cambios.

Para modificar datos, trabaja en los archivos `services`; para cambiar la presentación, en páginas, componentes y estilos. Si agregas una pantalla, crea su componente, registra su ruta y añade el enlace al menú respetando el rol correspondiente.

No actualices `inventarios` directamente desde un componente: los movimientos utilizan la función `registrar_movimiento_inventario`, que guarda stock e historial juntos y comprueba las cantidades.

## 5. Comprobar y ver la versión compilada

Después de modificar código, ejecuta:

```sh
npm run lint
npm run build
```

- `lint` revisa problemas de código mediante ESLint.
- `build` verifica TypeScript e imports y genera la aplicación en `dist/`. Corrige los errores antes de entregar.

Para ver localmente el resultado compilado:

```sh
npm run preview
```

Abre la dirección mostrada, normalmente `http://localhost:4173`. Si modificas código después, ejecuta otra vez `npm run build` para actualizar `dist/`. `preview` no publica el sitio en internet.

No es necesario ejecutar `tests/smoke.mjs` para usar o modificar el proyecto. Esa prueba adicional necesita Playwright y Microsoft Edge; sus requisitos están en `README.md`.

## 6. Problemas habituales

- **«npm no se reconoce»:** instala Node.js con npm y vuelve a abrir la terminal.
- **PowerShell bloquea `npm.ps1`:** usa `npm.cmd ci`, `npm.cmd run dev` y el mismo formato para los demás comandos, o abre una terminal CMD.
- **No encuentra `package.json`:** la terminal está en otra carpeta. Entra en la raíz del proyecto.
- **Aparece «Conexión pendiente»:** revisa `.env.local`, sus dos variables y sus valores. Después de editarlo, detén Vite y vuelve a iniciarlo.
- **No inicia sesión:** verifica correo, contraseña y que la conexión apunte al proyecto Supabase donde se crearon las cuentas.
- **«Acceso no disponible»:** la cuenta no tiene el rol requerido. El responsable debe revisar `app_metadata.role`; después cierra y abre sesión.
- **No hay datos:** puede ser un estado vacío normal. Quita los filtros y comprueba con el responsable si existen registros en esa base.
- **Error de permisos al consultar o guardar:** revisa el rol y las políticas RLS con el responsable. No desactives RLS para evitar el error.
- **Falta la función transaccional:** la instancia conectada no tiene instalada `registrar_movimiento_inventario`; requiere configuración administrativa.
- **Error al instalar dependencias:** comprueba internet y Node.js 24. Conserva `package-lock.json`; no lo borres para ocultar incompatibilidades.

## 7. Trabajar con Git y actualizar el proyecto

Antes de modificar código, puedes crear una rama de trabajo:

```sh
git switch -c mi-cambio
```

Revisa tus cambios con `git status` y `git diff`. Después de ejecutar `npm run lint` y `npm run build`, agrega los archivos modificados y crea un commit:

```sh
git add src/pages/Login.tsx
git commit -m "Actualiza el texto de inicio de sesión"
git push -u origin mi-cambio
```

La ruta y el mensaje anteriores son ejemplos: adáptalos a tus cambios. Para enviar la rama necesitas permisos de escritura; si no los tienes, coordina con el responsable cómo entregar la modificación.

Para descargar nuevas versiones en tu rama actual, primero guarda tus cambios en un commit o apártalos con `git stash`. Luego ejecuta:

```sh
git pull --ff-only
npm ci
npm run dev
```

`git pull --ff-only` actualiza la rama desde su seguimiento remoto sin crear una mezcla automática de cambios. Si Git informa que las ramas divergieron o que no existe seguimiento remoto, revisa la rama con el responsable antes de continuar.

El repositorio debe incluir el código fuente, la configuración, `package.json`, `package-lock.json`, `.env.example` y la documentación. `node_modules/`, `dist/` y los archivos `*.local` están excluidos mediante `.gitignore` y no se descargan al clonar si no fueron versionados previamente.

Solicita por separado la URL y la clave pública de Supabase. No subas `.env.admin.local` ni otras claves administrativas: no son necesarias para ejecutar o modificar el frontend. `.gitignore` no elimina archivos que ya hayan sido agregados al historial del repositorio.

Para usar una base nueva, hace falta obtener del responsable el esquema de las tablas existentes y configurar Supabase Auth y sus roles. **`supabase/setup.sql` no crea las tablas:** instala políticas y la función de inventario sobre una base ya preparada. `supabase/seed.sql` está vacío; no es una copia de la base de datos.

En una instancia nueva, después de preparar las tablas y aplicar `supabase/setup.sql`, aplica también `supabase/migrations/20260923_rrhh_auditoria.sql` desde SQL Editor para disponer de horarios editables e historial de RRHH. En el Supabase actual ya está aplicada. Esta migración reutiliza las tablas existentes y registra el usuario autenticado como responsable.

El script `scripts/create-test-users.mjs` es una herramienta administrativa opcional para crear las cuentas, no un paso del arranque normal. Puedes trabajar con las cuentas ya creadas sin recibir la clave administrativa.

## Buzón de reposición

Aplica `supabase/migrations/20260925_avisos_reposicion.sql` en el SQL Editor de Supabase para habilitar los avisos entre Inventario y Administración. Crea únicamente la tabla de avisos y sus funciones con permisos por rol; no cambia existencias ni genera pedidos.

El buzón está en `/inventory/notifications`. Los usuarios de Inventario ven alertas por producto activo y sucursal cuando la cantidad es menor o igual al mínimo (sin registro de inventario se considera cero). Pueden avisar al administrador desde Existencias o desde el buzón. No se duplica un aviso que ya está pendiente para el mismo producto y sucursal. Administración puede marcarlo como visto; esa acción es compartida entre administradores y no confirma una reposición. Una vez visto, Inventario puede enviar otro aviso si el stock continúa bajo.

La campana se actualiza al registrar movimientos, al recuperar el foco y cada 30 segundos con la aplicación visible. Las alertas de stock desaparecen cuando se supera el mínimo; los avisos enviados conservan su historial. Son notificaciones dentro de la aplicación, sin correo ni notificaciones del sistema operativo. Antes de aplicar la migración se pueden consultar las alertas de stock, pero no enviar ni recibir avisos compartidos.

## Proveedores y compras recibidas

Ejecuta `supabase/migrations/20260925_compras_proveedores.sql` en el SQL Editor de Supabase, después de `supabase/setup.sql`. Reutiliza los tipos de ID de productos y sucursales, agrega `productos.proveedor_id`, las tablas `proveedores` y `compras`, las políticas por rol y la función transaccional `registrar_compra_recibida`. No requiere volver a ejecutar las migraciones anteriores que ya estén aplicadas.

1. Inicia sesión como ADMINISTRADOR y abre **Proveedores**. Puedes registrar, editar o desactivar proveedores. Se incluyen Nike (demo), Adidas (demo) y Supreme (demo) con identificación, contacto, correo, teléfono, dirección y notas de demostración. Sus datos son ficticios, no pertenecen a distribuidores oficiales y deben reemplazarse antes del uso real.
2. En **Productos → Editar**, asigna el proveedor principal. No se enlazan automáticamente los productos existentes para evitar asociaciones incorrectas. El catálogo de proveedores puede ser consultado por Inventario para vincular productos; solo Administración puede modificar proveedores o consultar costos de compras.
3. Desde **Compras y reposición**, **Existencias → Reponer con compra**, el buzón o el enlace de Registrar entrada, registra una compra recibida. Selecciona proveedor, producto, sucursal, unidades, costo unitario en Bs y fecha de recepción; el comprobante y la observación son opcionales.
4. Revisa el total y el stock previsto, y confirma. Se guardan compra y movimiento ENTRADA juntos: un error revierte ambos. El movimiento incluye el identificador de compra en su motivo. El historial conserva los nombres originales aunque se edite el proveedor. Cada registro corresponde a un producto; no envía pedidos, mensajes ni pagos al proveedor.

El stock esperado se valida para detectar operaciones concurrentes. Los reintentos de la misma confirmación usan el mismo identificador para no duplicar una compra. Si el stock cambió, cancela y actualiza el historial antes de crear otra operación; ante una respuesta de red incierta, reintenta la misma confirmación o consulta el historial. Los avisos del buzón se marcan como vistos por separado; la alerta de stock desaparece cuando la cantidad supera el mínimo.
