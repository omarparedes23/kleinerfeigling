-- Normaliza el carrito de session_data (JSONB) a una tabla de líneas,
-- y mueve la operación de "agregar cantidad" a una función atómica.
-- Elimina la condición de carrera entre el bot (server) y el cliente (Zustand),
-- que escribían de forma independiente sobre el mismo array JSONB.

create table public.kleiner_cart_items (
  id              uuid primary key default gen_random_uuid(),
  cart_id         uuid not null references public.kleiner_cart_sessions(id) on delete cascade,
  product_id      int not null references public.kleiner_products(id),
  volumen_ml      int not null,
  cantidad        int not null check (cantidad > 0 and cantidad <= 50),
  created_at      timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  unique (cart_id, product_id, volumen_ml)
);

alter table public.kleiner_cart_items enable row level security;

create policy "kleiner_cart_items - lectura propia"
  on public.kleiner_cart_items for select
  using (exists (
    select 1 from public.kleiner_cart_sessions cs
    where cs.id = cart_id and cs.usuario_id = auth.uid()
  ));

create policy "kleiner_cart_items - gestion propia"
  on public.kleiner_cart_items for all
  using (exists (
    select 1 from public.kleiner_cart_sessions cs
    where cs.id = cart_id and cs.usuario_id = auth.uid()
  ));

-- Backfill de carritos existentes. Clampeamos cantidad a [1,50] para limpiar
-- cualquier dato ya corrupto (ver caso real: cantidad = 2^71 en un carrito de prueba).
insert into public.kleiner_cart_items (cart_id, product_id, volumen_ml, cantidad, created_at)
select cs.id,
       ((elem->>'id')::bigint / 10000)::int,
       (elem->>'volumen_ml')::int,
       least(greatest((elem->>'cantidad')::numeric, 1), 50)::int,
       cs.created_at
from public.kleiner_cart_sessions cs,
     jsonb_array_elements(cs.session_data) as elem
where jsonb_typeof(cs.session_data) = 'array'
on conflict (cart_id, product_id, volumen_ml) do nothing;

alter table public.kleiner_cart_sessions drop column session_data;

-- Suma cantidad a un ítem existente o lo crea; crea el carrito activo si no existe.
-- security definer + chequeo manual de auth.uid() (necesario: security definer evita RLS).
-- Nota: los parámetros OUT de "returns table" se declaran como variables plpgsql
-- implícitas — si se llamaran igual que las columnas de la tabla (ej. "cart_id"),
-- el "on conflict (cart_id, ...)" queda ambiguo (¿variable o columna?). Por eso
-- los OUT se prefijan "out_".
create or replace function public.agregar_item_carrito(
  p_usuario_id uuid,
  p_product_id int,
  p_volumen_ml int,
  p_cantidad int
)
returns table (out_cart_id uuid, out_total_items int)
language plpgsql
security definer
as $$
declare
  v_cart_id uuid;
begin
  if p_usuario_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  select id into v_cart_id
  from public.kleiner_cart_sessions
  where usuario_id = p_usuario_id and activo = true
  for update;

  if v_cart_id is null then
    insert into public.kleiner_cart_sessions (usuario_id, activo)
    values (p_usuario_id, true)
    returning id into v_cart_id;
  end if;

  insert into public.kleiner_cart_items (cart_id, product_id, volumen_ml, cantidad)
  values (v_cart_id, p_product_id, p_volumen_ml, least(p_cantidad, 50))
  on conflict (cart_id, product_id, volumen_ml)
  do update set cantidad = least(kleiner_cart_items.cantidad + excluded.cantidad, 50),
                actualizado_en = now();

  return query
    select v_cart_id, coalesce(sum(cantidad), 0)::int
    from public.kleiner_cart_items
    where kleiner_cart_items.cart_id = v_cart_id;
end;
$$;
