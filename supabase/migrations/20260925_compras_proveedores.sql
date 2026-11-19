  -- Requiere las tablas originales y supabase/setup.sql.
  -- Compras recibidas: registro y entrada de stock en una misma transacción.
  begin;
  create table if not exists public.proveedores (
    id bigint generated always as identity primary key,
    nombre text not null check (length(btrim(nombre)) > 0),
    identificacion_fiscal text,
    contacto text,
    email text,
    telefono text,
    direccion text,
    notas text,
    activo boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by uuid
  );
  create unique index if not exists proveedores_nombre_unico on public.proveedores(lower(btrim(nombre)));
  alter table public.productos add column if not exists proveedor_id bigint references public.proveedores(id);
  create index if not exists productos_proveedor_idx on public.productos(proveedor_id);

  -- Reutiliza los tipos reales de los IDs de producto y sucursal.
  do $crear_compras$
  declare product_type text; branch_type text;
  begin
    select format_type(atttypid, atttypmod) into product_type from pg_attribute
      where attrelid = 'public.productos'::regclass and attname = 'id';
    select format_type(atttypid, atttypmod) into branch_type from pg_attribute
      where attrelid = 'public.sucursales'::regclass and attname = 'id';
    execute format('create table if not exists public.compras (
      id uuid primary key,
      proveedor_id bigint not null references public.proveedores(id),
      producto_id %s not null references public.productos(id),
      sucursal_id %s not null references public.sucursales(id),
      proveedor_nombre text not null,
      producto_nombre text not null,
      sucursal_nombre text not null,
      cantidad integer not null check (cantidad > 0),
      costo_unitario numeric(12,2) not null check (costo_unitario >= 0),
      total numeric(22,2) generated always as (cantidad::numeric * costo_unitario) stored,
      moneda text not null default ''BOB'' check (moneda = ''BOB''),
      fecha_recepcion date not null,
      comprobante text,
      observacion text,
      responsable_id uuid not null,
      responsable text not null,
      created_at timestamptz not null default now()
    )', product_type, branch_type);
  end;
  $crear_compras$;
  alter table public.proveedores enable row level security;
  alter table public.compras enable row level security;
  revoke all on public.proveedores, public.compras from anon, authenticated;
  grant select, insert, update on public.proveedores to authenticated;
  grant usage on sequence public.proveedores_id_seq to authenticated;
  grant select on public.compras to authenticated;
  drop policy if exists proveedores_lectura on public.proveedores;
  create policy proveedores_lectura on public.proveedores for select to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('ADMINISTRADOR', 'INVENTARIO'));
  drop policy if exists proveedores_alta on public.proveedores;
  create policy proveedores_alta on public.proveedores for insert to authenticated
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMINISTRADOR');
  drop policy if exists proveedores_edicion on public.proveedores;
  create policy proveedores_edicion on public.proveedores for update to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMINISTRADOR')
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMINISTRADOR');
  drop policy if exists compras_lectura on public.compras;
  create policy compras_lectura on public.compras for select to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMINISTRADOR');

  create or replace function public.auditar_proveedor() returns trigger
  language plpgsql set search_path = '' as $auditar_proveedor$
  begin
    new.updated_at := now();
    new.updated_by := auth.uid();
    return new;
  end;
  $auditar_proveedor$;
  drop trigger if exists proveedor_auditoria on public.proveedores;
  create trigger proveedor_auditoria before insert or update on public.proveedores
    for each row execute function public.auditar_proveedor();

  create or replace function public.registrar_compra_recibida(
    p_id uuid, p_proveedor_id bigint, p_producto_id text, p_sucursal_id text,
    p_cantidad integer, p_costo_unitario numeric, p_fecha_recepcion date,
    p_comprobante text, p_observacion text, p_cantidad_esperada integer
  ) returns uuid language plpgsql security definer set search_path = '' as $registrar_compra$
  declare
    v_producto public.productos%rowtype;
    v_proveedor public.proveedores%rowtype;
    v_sucursal public.sucursales%rowtype;
    v_existing public.compras%rowtype;
  begin
    if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'ADMINISTRADOR' then
      raise exception 'Solo el administrador puede registrar compras';
    end if;
    if p_id is null then raise exception 'Falta el identificador de la operación'; end if;
    perform pg_advisory_xact_lock(hashtextextended('compra:' || p_id::text, 0));
    select * into v_existing from public.compras where id = p_id;
    if found then
      if v_existing.proveedor_id is distinct from p_proveedor_id
        or v_existing.producto_id::text is distinct from p_producto_id
        or v_existing.sucursal_id::text is distinct from p_sucursal_id
        or v_existing.cantidad is distinct from p_cantidad
        or v_existing.costo_unitario is distinct from p_costo_unitario
        or v_existing.fecha_recepcion is distinct from p_fecha_recepcion
        or v_existing.comprobante is distinct from nullif(btrim(p_comprobante), '')
        or v_existing.observacion is distinct from nullif(btrim(p_observacion), '')
        or v_existing.responsable_id is distinct from auth.uid() then
        raise exception 'Esta operación ya fue registrada con otros datos. Actualiza el historial antes de continuar.';
      end if;
      return v_existing.id;
    end if;
    if p_cantidad is null or p_cantidad <= 0 then raise exception 'Cantidad inválida'; end if;
    if p_costo_unitario is null or p_costo_unitario::text in ('NaN', 'Infinity', '-Infinity')
      or p_costo_unitario < 0 or p_costo_unitario > 9999999999.99
      or p_costo_unitario <> round(p_costo_unitario, 2) then raise exception 'Costo unitario inválido (máximo dos decimales)'; end if;
    if p_fecha_recepcion is null or p_fecha_recepcion > (now() at time zone 'America/La_Paz')::date then
      raise exception 'La fecha de recepción no puede ser futura';
    end if;
    select * into v_producto from public.productos where id::text = p_producto_id for share;
    if not found or not v_producto.activo then raise exception 'Producto no disponible'; end if;
    select * into v_proveedor from public.proveedores where id = p_proveedor_id for share;
    if not found or not v_proveedor.activo then raise exception 'Proveedor no disponible'; end if;
    if v_producto.proveedor_id is distinct from p_proveedor_id then raise exception 'Vincula el producto al proveedor seleccionado antes de comprar'; end if;
    select * into v_sucursal from public.sucursales where id::text = p_sucursal_id;
    if not found then raise exception 'Sucursal no encontrada'; end if;
    insert into public.compras(id, proveedor_id, producto_id, sucursal_id, proveedor_nombre, producto_nombre,
      sucursal_nombre, cantidad, costo_unitario, fecha_recepcion, comprobante, observacion, responsable_id, responsable)
      values(p_id, p_proveedor_id, v_producto.id, v_sucursal.id, v_proveedor.nombre,
        v_producto.codigo || ' · ' || v_producto.nombre, v_sucursal.nombre, p_cantidad, p_costo_unitario,
        p_fecha_recepcion, nullif(btrim(p_comprobante), ''), nullif(btrim(p_observacion), ''), auth.uid(),
        coalesce(nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), auth.jwt() ->> 'email', 'Administrador'));
    perform public.registrar_movimiento_inventario(p_producto_id, p_sucursal_id, 'ENTRADA', p_cantidad,
      'Compra #' || p_id::text || ' · ' || v_proveedor.nombre || coalesce(' · Comprobante: ' || nullif(btrim(p_comprobante), ''), ''), p_cantidad_esperada);
    return p_id;
  end;
  $registrar_compra$;
  revoke all on function public.registrar_compra_recibida(uuid,bigint,text,text,integer,numeric,date,text,text,integer) from public, anon;
  grant execute on function public.registrar_compra_recibida(uuid,bigint,text,text,integer,numeric,date,text,text,integer) to authenticated;

  -- Proveedores iniciales. Completar los datos de contacto desde la aplicación.
  insert into public.proveedores(nombre, identificacion_fiscal, contacto, email, telefono, direccion, notas)
  values
    ('Nike', null, null, null, null, null, null),
    ('Adidas', null, null, null, null, null, null),
    ('Supreme', null, null, null, null, null, null)
  on conflict do nothing;
  -- No se asignan proveedores a productos existentes por su nombre: debe confirmarse en el catálogo.
  commit;
