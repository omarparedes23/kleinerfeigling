-- ============================================================
-- Kleiner Feigling - Migración Inicial
-- Versión: 001
-- Fecha: 2025-05-21
-- ============================================================

-- 0. Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- ============================================================
-- 1. TABLAS
-- ============================================================

-- 1.1. Distritos (tarifas de envío)
create table public.kleiner_distritos (
  id              serial primary key,
  nombre          text not null unique,
  tarifa_envio    numeric(6,2) not null check (tarifa_envio >= 0),
  tiempo_estimado text,
  disponible      boolean not null default true,
  created_at      timestamptz not null default now()
);

-- 1.2. Perfiles de usuario
create table public.kleiner_profiles (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  nombre          text not null default '',
  apellido        text not null default '',
  telefono        text,
  direccion       text,
  distrito_id     int references public.kleiner_distritos(id),
  role            text not null default 'cliente' check (role in ('cliente', 'admin')),
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

-- 1.3. Categorías
create table public.kleiner_categories (
  id            serial primary key,
  nombre        text not null,
  slug          text not null unique,
  descripcion   text,
  imagen_url    text,
  orden         int not null default 0,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- 1.4. Productos
create table public.kleiner_products (
  id               serial primary key,
  nombre           text not null,
  slug             text not null unique,
  descripcion      text,
  descripcion_corta text,
  precio           numeric(8,2) not null check (precio > 0),
  precio_oferta    numeric(8,2) check (precio_oferta is null or (precio_oferta > 0 and precio_oferta < precio)),
  categoria_id     int references public.kleiner_categories(id),
  imagen_url       text,
  imagen_urls      text[],
  volumen_ml       int,
  graduacion       numeric(4,1),
  sabor            text,
  stock            int not null default 0 check (stock >= 0),
  activo           boolean not null default true,
  destacado        boolean not null default false,
  embedding        vector(1536),
  created_at       timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

-- 1.5. Pedidos
create table public.kleiner_orders (
  id                serial primary key,
  usuario_id        uuid not null references public.kleiner_profiles(id),
  codigo_pedido     text not null unique,
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente','confirmado','en_preparacion','en_camino','entregado','cancelado','reembolsado')),
  subtotal          numeric(10,2) not null check (subtotal > 0),
  tarifa_envio      numeric(6,2) not null check (tarifa_envio >= 0),
  descuento         numeric(10,2) not null default 0 check (descuento >= 0),
  total             numeric(10,2) not null check (total > 0),
  distrito_id       int references public.kleiner_distritos(id),
  direccion_envio   text not null,
  notas             text,
  -- Pago (Culqi)
  culqi_charge_id   text,
  metodo_pago       text check (metodo_pago in ('tarjeta','yape','plin')),
  pago_estado       text not null default 'pendiente'
                    check (pago_estado in ('pendiente','procesando','exitoso','fallido','reembolsado')),
  pago_metadata     jsonb,
  pagado_en         timestamptz,
  -- Delivery / Logística
  estado_delivery   text check (estado_delivery in ('pendiente','asignado','recogido','en_ruta','entregado','fallido')),
  repartidor_asignado text,
  tracking_delivery   jsonb,
  -- Metadata
  origen            text not null default 'web' check (origen in ('web','bot_ia','voz')),
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

-- 1.6. Detalle de pedidos
create table public.kleiner_order_items (
  id              serial primary key,
  order_id        int not null references public.kleiner_orders(id) on delete cascade,
  product_id      int not null references public.kleiner_products(id),
  cantidad        int not null check (cantidad > 0),
  precio_unitario numeric(8,2) not null check (precio_unitario > 0),
  subtotal        numeric(10,2) not null check (subtotal > 0),
  created_at      timestamptz not null default now()
);

-- 1.7. Logs de conversación del bot IA
create table public.kleiner_chat_logs (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid references public.kleiner_profiles(id) on delete set null,
  session_id      text not null,
  role            text not null check (role in ('user','assistant','system','tool')),
  content         text not null,
  tool_calls      jsonb,
  metadata        jsonb,
  origen          text not null default 'texto' check (origen in ('texto','voz')),
  audio_url       text,
  created_at      timestamptz not null default now()
);

-- 1.8. Carritos de compra
create table public.kleiner_cart_sessions (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null references public.kleiner_profiles(id) on delete cascade,
  session_data    jsonb not null,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  constraint one_active_cart_per_user unique (usuario_id) where activo = true
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

-- Products
create index idx_kleiner_products_categoria on public.kleiner_products(categoria_id);
create index idx_kleiner_products_activo on public.kleiner_products(activo) where activo = true;
create index idx_kleiner_products_destacado on public.kleiner_products(destacado) where destacado = true;
create index idx_kleiner_products_fts on public.kleiner_products
  using gin(to_tsvector('spanish', coalesce(nombre, '') || ' ' || coalesce(descripcion, '')));

-- Índice vectorial para búsqueda semántica (HNSW)
create index idx_kleiner_products_embedding on public.kleiner_products
  using hnsw (embedding vector_cosine_ops);

-- Orders
create index idx_kleiner_orders_usuario on public.kleiner_orders(usuario_id);
create index idx_kleiner_orders_estado on public.kleiner_orders(estado);
create index idx_kleiner_orders_creado on public.kleiner_orders(creado_en desc);
create index idx_kleiner_orders_codigo on public.kleiner_orders(codigo_pedido);

-- Order items
create index idx_kleiner_order_items_order on public.kleiner_order_items(order_id);

-- Chat logs
create index idx_kleiner_chat_logs_session on public.kleiner_chat_logs(session_id);
create index idx_kleiner_chat_logs_usuario on public.kleiner_chat_logs(usuario_id);
create index idx_kleiner_chat_logs_creado on public.kleiner_chat_logs(created_at);

-- ============================================================
-- 3. FUNCIÓN RPC: decrementar_stock_seguro
-- ============================================================
-- Previene race conditions usando row-level locking (FOR UPDATE)
-- dentro de una transacción segura.
-- ============================================================
create or replace function public.decrementar_stock_seguro(
  p_product_id int,
  p_cantidad int
)
returns table (
  exitoso       boolean,
  stock_restante int,
  mensaje       text
)
language plpgsql
security definer
as $$
declare
  v_stock_actual int;
begin
  -- Bloqueamos la fila para evitar lecturas concurrentes
  select stock into v_stock_actual
  from public.kleiner_products
  where id = p_product_id
  for update;

  -- Validar si el producto existe
  if v_stock_actual is null then
    return query select false, 0::int, 'Producto no encontrado'::text;
    return;
  end if;

  -- Validar stock suficiente
  if v_stock_actual < p_cantidad then
    return query select false, v_stock_actual,
      format('Stock insuficiente. Disponible: %s, solicitado: %s', v_stock_actual, p_cantidad)::text;
    return;
  end if;

  -- Decrementar (dentro de la transacción bloqueada)
  update public.kleiner_products
  set stock = stock - p_cantidad,
      actualizado_en = now()
  where id = p_product_id
  returning stock into v_stock_actual;

  return query select true, v_stock_actual, 'Stock actualizado correctamente'::text;
end;
$$;

-- ============================================================
-- 4. TRIGGER: Auto-crear perfil al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.kleiner_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 5. TRIGGER: Actualizar updated_at automáticamente
-- ============================================================
create or replace function public.trigger_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger set_updated_at_kleiner_profiles
  before update on public.kleiner_profiles
  for each row execute function public.trigger_set_updated_at();

create trigger set_updated_at_kleiner_products
  before update on public.kleiner_products
  for each row execute function public.trigger_set_updated_at();

create trigger set_updated_at_kleiner_orders
  before update on public.kleiner_orders
  for each row execute function public.trigger_set_updated_at();

create trigger set_updated_at_kleiner_cart_sessions
  before update on public.kleiner_cart_sessions
  for each row execute function public.trigger_set_updated_at();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

-- Products: visibles para todos si activos; solo admin escribe
alter table public.kleiner_products enable row level security;

create policy "kleiner_products - lectura pública (activos)"
  on public.kleiner_products for select
  using (activo = true);

create policy "kleiner_products - admin full access"
  on public.kleiner_products for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Orders: usuarios ven las suyas; admin todo
alter table public.kleiner_orders enable row level security;

create policy "kleiner_orders - usuarios ven sus pedidos"
  on public.kleiner_orders for select
  using (auth.uid() = usuario_id);

create policy "kleiner_orders - admin full access"
  on public.kleiner_orders for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "kleiner_orders - usuarios crean pedidos"
  on public.kleiner_orders for insert
  with check (auth.uid() = usuario_id);

-- Order items: a través del order padre
alter table public.kleiner_order_items enable row level security;

create policy "kleiner_order_items - acceso vía order padre"
  on public.kleiner_order_items for select
  using (
    exists (
      select 1 from public.kleiner_orders
      where kleiner_orders.id = kleiner_order_items.order_id
        and kleiner_orders.usuario_id = auth.uid()
    )
  );

create policy "kleiner_order_items - admin full access"
  on public.kleiner_order_items for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Profiles: cada usuario ve y edita su perfil
alter table public.kleiner_profiles enable row level security;

create policy "kleiner_profiles - lectura propia"
  on public.kleiner_profiles for select
  using (auth.uid() = id);

create policy "kleiner_profiles - actualización propia"
  on public.kleiner_profiles for update
  using (auth.uid() = id);

-- Chat logs: usuarios ven y crean sus chats
alter table public.kleiner_chat_logs enable row level security;

create policy "kleiner_chat_logs - lectura propia"
  on public.kleiner_chat_logs for select
  using (auth.uid() = usuario_id);

create policy "kleiner_chat_logs - creación propia"
  on public.kleiner_chat_logs for insert
  with check (auth.uid() = usuario_id);

-- Cart sessions: usuarios gestionan su carrito
alter table public.kleiner_cart_sessions enable row level security;

create policy "kleiner_cart_sessions - lectura propia"
  on public.kleiner_cart_sessions for select
  using (auth.uid() = usuario_id);

create policy "kleiner_cart_sessions - gestión propia"
  on public.kleiner_cart_sessions for all
  using (auth.uid() = usuario_id);

-- Distritos y categorías: lectura pública
alter table public.kleiner_distritos enable row level security;
create policy "kleiner_distritos - lectura pública"
  on public.kleiner_distritos for select
  using (true);

alter table public.kleiner_categories enable row level security;
create policy "kleiner_categories - lectura pública (activas)"
  on public.kleiner_categories for select
  using (activo = true);

-- ============================================================
-- 7. SEED DATA: Distritos de Lima
-- ============================================================
insert into public.kleiner_distritos (nombre, tarifa_envio, tiempo_estimado) values
  ('Miraflores', 5.00, '30-45 min'),
  ('San Isidro', 5.00, '30-45 min'),
  ('Barranco', 5.00, '30-45 min'),
  ('Surco', 7.00, '40-60 min'),
  ('San Borja', 7.00, '40-60 min'),
  ('La Molina', 10.00, '50-70 min'),
  ('Jesus Maria', 7.00, '40-60 min'),
  ('Lince', 7.00, '40-60 min'),
  ('Magdalena', 7.00, '40-60 min'),
  ('Pueblo Libre', 7.00, '40-60 min'),
  ('San Miguel', 7.00, '40-60 min'),
  ('Cercado de Lima', 8.00, '45-65 min'),
  ('Surquillo', 5.00, '30-45 min')
on conflict (nombre) do nothing;
