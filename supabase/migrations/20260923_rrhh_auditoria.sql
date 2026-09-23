-- Sport Max: ficha de personal, horarios y trazabilidad.
-- Esquema inspeccionado: las cinco tablas ya tienen id y created_at;
-- horarios tiene trabajador_id bigint, horas time y activo boolean.
-- No crea tablas, no altera roles ni desactiva RLS.
begin;

do $$
declare t text;
begin
  foreach t in array array['trabajadores','asistencias','horarios','solicitudes','documentos_trabajador'] loop
    execute format('alter table public.%I add column if not exists updated_at timestamptz', t);
    execute format('alter table public.%I add column if not exists updated_by uuid', t);
    execute format('alter table public.%I add column if not exists updated_by_label text', t);
    execute format('alter table public.%I add column if not exists historial jsonb not null default ''[]''::jsonb', t);
  end loop;
end $$;

-- Los registros anteriores mantienen responsable/fecha de modificación desconocidos.
-- El historial se genera en el servidor; el cliente no puede atribuirse otro autor.
create or replace function public.registrar_auditoria_rrhh()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_old jsonb := null;
  v_history jsonb := '[]'::jsonb;
  v_action text := 'REGISTRO';
begin
  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old) - array['historial','updated_at','updated_by','updated_by_label'];
    v_history := coalesce(old.historial,'[]'::jsonb);
    v_action := 'ACTUALIZACION';
  end if;
  if tg_table_name = 'solicitudes' then
    if new.estado is null or new.estado not in ('PENDIENTE','APROBADO','RECHAZADO') then
      raise exception 'Estado de solicitud inválido';
    end if;
    if tg_op = 'INSERT' and new.estado <> 'PENDIENTE' then
      raise exception 'Una solicitud nueva debe quedar pendiente';
    end if;
    if tg_op = 'UPDATE' then
      if old.estado <> 'PENDIENTE' then raise exception 'La solicitud ya fue resuelta y no puede modificarse'; end if;
      if new.estado <> old.estado then v_action := new.estado; end if;
    end if;
    if new.fecha_fin <= new.fecha_inicio then raise exception 'La fecha final debe ser posterior a la inicial'; end if;
  end if;
  if tg_table_name = 'horarios' then
    if new.hora_entrada = new.hora_salida then
      raise exception 'Las horas de entrada y salida deben ser distintas';
    end if;
  end if;
  new.updated_at := clock_timestamp();
  new.updated_by := auth.uid();
  new.updated_by_label := coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'Operación administrativa');
  new.historial := v_history || jsonb_build_array(jsonb_build_object(
    'fecha', new.updated_at, 'usuario_id', new.updated_by, 'responsable', new.updated_by_label,
    'accion', v_action, 'anterior', v_old,
    'nuevo', to_jsonb(new) - array['historial','updated_at','updated_by','updated_by_label']
  ));
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['trabajadores','asistencias','horarios','solicitudes','documentos_trabajador'] loop
    execute format('drop trigger if exists sport_max_auditoria_rrhh on public.%I', t);
    execute format('create trigger sport_max_auditoria_rrhh before insert or update on public.%I for each row execute function public.registrar_auditoria_rrhh()', t);
  end loop;
end $$;

-- Si aparecieron duplicados entre la inspección y la ejecución, se revierte todo.
create unique index if not exists horarios_unico_vigente on public.horarios(trabajador_id) where activo = true;

do $$
declare seq text;
begin
  seq := pg_get_serial_sequence('public.horarios','id');
  if seq is not null then execute format('grant usage on sequence %s to authenticated',seq); end if;
end $$;

create or replace function public.actualizar_horario_rrhh(
  p_trabajador_id bigint, p_hora_entrada time, p_hora_salida time,
  p_horario_id bigint default null, p_version timestamptz default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_horario public.horarios%rowtype;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','') not in ('ADMINISTRADOR','RRHH') then
    raise exception 'No tienes permisos para modificar horarios';
  end if;
  if p_hora_entrada is null or p_hora_salida is null or p_hora_entrada = p_hora_salida then
    raise exception 'Introduce horas distintas y válidas';
  end if;
  perform id from public.trabajadores where id=p_trabajador_id for update;
  if not found then raise exception 'Trabajador no encontrado o no autorizado'; end if;
  select * into v_horario from public.horarios where trabajador_id=p_trabajador_id and activo=true for update;
  if v_horario.id is distinct from p_horario_id or v_horario.updated_at is distinct from p_version then
    raise exception 'El horario cambió. Actualiza la ficha antes de guardar.';
  end if;
  if v_horario.id is null then
    insert into public.horarios(trabajador_id,hora_entrada,hora_salida,activo)
      values(p_trabajador_id,p_hora_entrada,p_hora_salida,true) returning * into v_horario;
  else
    update public.horarios set hora_entrada=p_hora_entrada,hora_salida=p_hora_salida
      where id=v_horario.id returning * into v_horario;
  end if;
  return to_jsonb(v_horario);
end $$;
revoke all on function public.actualizar_horario_rrhh(bigint,time,time,bigint,timestamptz) from public,anon;
grant execute on function public.actualizar_horario_rrhh(bigint,time,time,bigint,timestamptz) to authenticated;
notify pgrst, 'reload schema';
commit;

