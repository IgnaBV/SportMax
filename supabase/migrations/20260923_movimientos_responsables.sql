-- Muestra el nombre del autor sin exponer el directorio completo de usuarios.
create or replace function public.nombres_responsables_inventario()
returns table (responsable text, nombre text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
    not in ('ADMINISTRADOR', 'INVENTARIO') then
    raise exception 'No tienes permisos para consultar inventario';
  end if;
  return query
    select distinct u.id::text,
      coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
               nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
               nullif(btrim(u.raw_user_meta_data ->> 'nombre'), ''),
               u.email::text, 'Usuario sin nombre')
    from auth.users u
    inner join public.movimientos_inventario m on m.responsable::text = u.id::text;
end;
$$;
revoke all on function public.nombres_responsables_inventario() from public, anon;
grant execute on function public.nombres_responsables_inventario() to authenticated;
