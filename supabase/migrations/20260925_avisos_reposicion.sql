-- Buzón compartido de reposición. Ejecutar en el SQL Editor de Supabase.
-- No modifica cantidades ni crea pedidos de compra.
begin;
create table if not exists public.avisos_reposicion (
  id bigint generated always as identity primary key,
  producto_id text not null,
  sucursal_id text not null,
  producto text not null,
  sucursal text not null,
  cantidad integer not null,
  minimo integer not null,
  enviado_por uuid not null,
  responsable text not null,
  created_at timestamptz not null default now(),
  visto_at timestamptz,
  visto_por uuid,
  constraint aviso_visto_coherente check ((visto_at is null) = (visto_por is null))
);
create unique index if not exists aviso_reposicion_pendiente
  on public.avisos_reposicion(producto_id, sucursal_id) where visto_at is null;
alter table public.avisos_reposicion enable row level security;
revoke all on public.avisos_reposicion from anon, authenticated;
grant select on public.avisos_reposicion to authenticated;
drop policy if exists leer_avisos_inventario on public.avisos_reposicion;
create policy leer_avisos_inventario on public.avisos_reposicion for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('ADMINISTRADOR', 'INVENTARIO'));

create or replace function public.enviar_aviso_reposicion(p_producto_id text, p_sucursal_id text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_producto public.productos%rowtype;
  v_sucursal public.sucursales%rowtype;
  v_cantidad integer;
  v_id bigint;
begin
  if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') not in ('ADMINISTRADOR', 'INVENTARIO') then
    raise exception 'No tienes permiso para enviar avisos de inventario';
  end if;
  -- Misma exclusión que la función de movimientos: consulta stock consistente.
  perform pg_advisory_xact_lock(hashtextextended(p_producto_id || ':' || p_sucursal_id, 0));
  select * into v_producto from public.productos where id::text = p_producto_id;
  if not found or not v_producto.activo then raise exception 'Producto no disponible'; end if;
  select * into v_sucursal from public.sucursales where id::text = p_sucursal_id;
  if not found then raise exception 'Sucursal no encontrada'; end if;
  select coalesce(sum(cantidad), 0)::integer into v_cantidad from public.inventarios
    where producto_id::text = p_producto_id and sucursal_id::text = p_sucursal_id;
  if v_cantidad > v_producto.stock_minimo then raise exception 'El stock ya está por encima del mínimo. Actualiza las existencias.'; end if;
  select id into v_id from public.avisos_reposicion
    where producto_id = p_producto_id and sucursal_id = p_sucursal_id and visto_at is null;
  if found then return v_id; end if;
  insert into public.avisos_reposicion(producto_id, sucursal_id, producto, sucursal, cantidad, minimo, enviado_por, responsable)
    values (p_producto_id, p_sucursal_id, v_producto.codigo || ' · ' || v_producto.nombre,
      v_sucursal.nombre, v_cantidad, v_producto.stock_minimo, auth.uid(),
      coalesce(nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
               nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
               auth.jwt() ->> 'email', 'Usuario de inventario')) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.marcar_aviso_reposicion_visto(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'ADMINISTRADOR' then
    raise exception 'Solo administración puede marcar el aviso como visto';
  end if;
  update public.avisos_reposicion set visto_at = now(), visto_por = auth.uid()
    where id = p_id and visto_at is null;
end;
$$;
revoke all on function public.enviar_aviso_reposicion(text, text) from public, anon;
revoke all on function public.marcar_aviso_reposicion_visto(bigint) from public, anon;
grant execute on function public.enviar_aviso_reposicion(text, text) to authenticated;
grant execute on function public.marcar_aviso_reposicion_visto(bigint) to authenticated;
commit;
