-- Sport Max: integración mínima sobre las tablas existentes.
-- Ejecutar con el propietario de la base en Supabase SQL Editor.
-- No crea tablas ni modifica datos de negocio.
begin;

-- Lectura/escritura por rol confiable, definido exclusivamente en app_metadata.role.
-- La política RESTRICTIVE impide que políticas permisivas anteriores eludan el rol.
do $$
declare t text; predicate text;
begin
  foreach t in array array['sucursales','categorias','productos','inventarios','movimientos_inventario','trabajadores','horarios','asistencias','solicitudes','documentos_trabajador'] loop
    predicate := case when t in ('trabajadores','horarios','asistencias','solicitudes','documentos_trabajador')
      then '(auth.jwt() -> ''app_metadata'' ->> ''role'') in (''ADMINISTRADOR'', ''RRHH'')'
      else '(auth.jwt() -> ''app_metadata'' ->> ''role'') in (''ADMINISTRADOR'', ''INVENTARIO'')' end;
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format('drop policy if exists mist_role_boundary on public.%I', t);
    execute format('create policy mist_role_boundary on public.%I as restrictive for all to public using (%s) with check (%s)', t, predicate, predicate);
    execute format('drop policy if exists mist_role_access on public.%I', t);
    execute format('create policy mist_role_access on public.%I as permissive for all to authenticated using (%s) with check (%s)', t, predicate, predicate);
  end loop;
end $$;

-- Las secuencias de las tablas existentes necesitan USAGE para insertar IDs.
do $$
declare t text; seq text;
begin
  foreach t in array array['productos','movimientos_inventario','trabajadores','asistencias','solicitudes','documentos_trabajador','inventarios'] loop
    seq := pg_get_serial_sequence('public.' || t, 'id');
    if seq is not null then execute format('grant usage on sequence %s to authenticated', seq); end if;
  end loop;
end $$;

create or replace function public.registrar_movimiento_inventario(
  p_producto_id text,
  p_sucursal_id text,
  p_tipo text,
  p_cantidad integer,
  p_motivo text,
  p_cantidad_esperada integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_producto public.productos%rowtype;
  v_sucursal public.sucursales%rowtype;
  v_inventario public.inventarios%rowtype;
  v_movimiento public.movimientos_inventario%rowtype;
  v_anterior integer;
  v_nueva integer;
  v_count integer;
  v_role text := auth.jwt() -> 'app_metadata' ->> 'role';
begin
  if auth.uid() is null or v_role is null or v_role not in ('ADMINISTRADOR', 'INVENTARIO') then
    raise exception 'No tienes permisos para modificar inventario';
  end if;
  if p_tipo is null or p_tipo not in ('ENTRADA','SALIDA','AJUSTE') then raise exception 'Tipo de movimiento inválido'; end if;
  if p_cantidad is null or p_cantidad < 0 or (p_tipo <> 'AJUSTE' and p_cantidad = 0) then raise exception 'Cantidad inválida'; end if;
  if p_cantidad_esperada is null or p_cantidad_esperada < 0 then raise exception 'Stock esperado inválido'; end if;
  if p_motivo is null or length(btrim(p_motivo)) = 0 then raise exception 'El motivo es obligatorio'; end if;
  select * into v_producto from public.productos where id::text = p_producto_id;
  if not found then raise exception 'Producto no encontrado'; end if;
  if not v_producto.activo and p_tipo <> 'AJUSTE' then raise exception 'El producto está inactivo'; end if;
  select * into v_sucursal from public.sucursales where id::text = p_sucursal_id;
  if not found then raise exception 'Sucursal no encontrada'; end if;
  -- Serializa también el caso en que aún no exista una fila de inventario.
  perform pg_advisory_xact_lock(hashtextextended(p_producto_id || ':' || p_sucursal_id, 0));
  select count(*) into v_count from public.inventarios where producto_id = v_producto.id and sucursal_id = v_sucursal.id;
  if v_count > 1 then raise exception 'Existen inventarios duplicados para este producto y sucursal. Revisa los datos antes de continuar.'; end if;
  select * into v_inventario from public.inventarios where producto_id = v_producto.id and sucursal_id = v_sucursal.id for update;
  v_anterior := coalesce(v_inventario.cantidad,0);
  if v_anterior <> p_cantidad_esperada then raise exception 'El stock cambió desde tu consulta. Actualiza la página y revisa la operación.'; end if;
  v_nueva := case p_tipo when 'ENTRADA' then v_anterior + p_cantidad when 'SALIDA' then v_anterior - p_cantidad else p_cantidad end;
  if v_nueva < 0 then raise exception 'Stock insuficiente'; end if;
  if v_nueva = v_anterior then raise exception 'El movimiento no modifica el stock'; end if;
  if v_inventario.id is null then
    insert into public.inventarios(producto_id,sucursal_id,cantidad,updated_at) values(v_producto.id,v_sucursal.id,v_nueva,now());
  else
    update public.inventarios set cantidad=v_nueva,updated_at=now() where id=v_inventario.id;
  end if;
  -- Convierte al tipo real de las columnas (texto/enum y texto/uuid).
  select * into v_movimiento from jsonb_populate_record(null::public.movimientos_inventario,
    jsonb_build_object('tipo',p_tipo,'responsable',auth.uid()::text));
  insert into public.movimientos_inventario(producto_id,sucursal_id,tipo,cantidad,cantidad_anterior,cantidad_nueva,motivo,responsable)
    values(v_producto.id,v_sucursal.id,v_movimiento.tipo,abs(v_nueva-v_anterior),v_anterior,v_nueva,btrim(p_motivo),v_movimiento.responsable);
  return jsonb_build_object('cantidad_anterior',v_anterior,'cantidad_nueva',v_nueva);
end;
$$;

-- El cliente solo cambia stock mediante la función anterior.
revoke insert, update, delete on public.inventarios, public.movimientos_inventario from authenticated;
revoke all on function public.registrar_movimiento_inventario(text,text,text,integer,text,integer) from public, anon;
grant execute on function public.registrar_movimiento_inventario(text,text,text,integer,text,integer) to authenticated;
commit;
