# Kleiner Feigling PWA — Especificación Técnica

> **Versión:** 1.0  
> **Fecha:** 2025-05-21  
> **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel AI SDK  
> **Pagos:** Culqi (tarjetas, Yape, Plin)  
> **IA:** Vercel AI SDK + OpenAI (GPT-4o mini + Whisper + text-embedding-3-small)  
> **Estado:** ✅ Aprobado por Arquitecto — Listo para codificar

---

## Índice

1. [Arquitectura de Carpetas](#1-arquitectura-de-carpetas)
2. [Esquema de Base de Datos (Supabase)](#2-esquema-de-base-de-datos-supabase)
3. [RPC Seguro: `decrementar_stock_seguro`](#3-rpc-seguro-decrementar_stock_seguro)
4. [Dependencias y Paquetes](#4-dependencias-y-paquetes)
5. [Flujo de Datos: Voice-to-Payment](#5-flujo-de-datos-voice-to-payment)
6. [Bot IA — Tool Calling](#6-bot-ia--tool-calling)
7. [PWA con Serwist](#7-pwa-con-serwist)
8. [Seguridad y RLS](#8-seguridad-y-rls)

---

## 1. Arquitectura de Carpetas

```
kleiner-feigling/
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── spec.md                          ← Fuente de verdad (este archivo)
│
├── public/
│   ├── manifest.json
│   ├── icons/                       # 192x192, 512x512, maskable
│   └── images/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   ├── manifest.json            # PWA manifest (Next.js Metadata)
│   │   ├── sw.ts                    # Service Worker (Serwist)
│   │   │
│   │   ├── (shop)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── producto/[slug]/page.tsx
│   │   │   └── carrito/page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── registro/page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── perfil/page.tsx
│   │   │   ├── pedidos/page.tsx
│   │   │   └── pedido/[id]/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/callback/route.ts
│   │       ├── chat/route.ts
│   │       ├── transcripcion/route.ts
│   │       ├── productos/busqueda-semantica/route.ts
│   │       └── pago/
│   │           ├── crear-cargo/route.ts
│   │           └── webhook/route.ts
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── cart-badge.tsx
│   │   ├── product/
│   │   │   ├── product-card.tsx
│   │   │   ├── product-grid.tsx
│   │   │   └── product-detail.tsx
│   │   ├── cart/
│   │   │   ├── cart-provider.tsx
│   │   │   ├── cart-drawer.tsx
│   │   │   └── checkout-form.tsx
│   │   ├── ai-bot/
│   │   │   ├── chat-bot.tsx
│   │   │   ├── chat-message.tsx
│   │   │   └── voice-button.tsx
│   │   └── payment/
│   │       ├── culqi-checkout.tsx
│   │       └── payment-status.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts
│   │   ├── ai/
│   │   │   ├── chat-config.ts
│   │   │   ├── tools.ts
│   │   │   └── prompts.ts
│   │   ├── culqi/
│   │   │   └── client.ts
│   │   ├── voice/
│   │   │   └── recorder.ts
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── use-cart.ts
│   │   ├── use-voice.ts
│   │   └── use-culqi.ts
│   │
│   ├── types/
│   │   ├── database.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── chat.ts
│   │
│   └── styles/
│       └── globals.css
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Migración completa del esquema
│   └── seed.sql
│
└── scripts/
    └── generate-embeddings.ts
```

---

## 2. Esquema de Base de Datos (Supabase)

### 2.1. `kleiner_profiles`

```sql
create table kleiner_profiles (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  nombre        text not null,
  apellido      text not null,
  telefono      text,
  direccion     text,
  distrito_id   int references kleiner_distritos(id),
  role          text not null default 'cliente' check (role in ('cliente', 'admin')),
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Trigger: auto-crear perfil al registrarse con Supabase Auth
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into kleiner_profiles (id, email, nombre, apellido)
  values (new.id, new.email, '', '');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

### 2.2. `kleiner_distritos`

```sql
create table kleiner_distritos (
  id            serial primary key,
  nombre        text not null unique,
  tarifa_envio  numeric(6,2) not null check (tarifa_envio >= 0),
  tiempo_estimado text,                  -- ej: "30-45 min"
  disponible    boolean not null default true,
  created_at    timestamptz not null default now()
);
```

### 2.3. `kleiner_categories`

```sql
create table kleiner_categories (
  id            serial primary key,
  nombre        text not null,
  slug          text not null unique,
  descripcion   text,
  imagen_url    text,
  orden         int not null default 0,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);
```

### 2.4. `kleiner_products`

```sql
create table kleiner_products (
  id               serial primary key,
  nombre           text not null,
  slug             text not null unique,
  descripcion      text,
  descripcion_corta text,
  precio           numeric(8,2) not null check (precio > 0),
  precio_oferta    numeric(8,2) check (precio_oferta is null or (precio_oferta > 0 and precio_oferta < precio)),
  categoria_id     int references kleiner_categories(id),
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

create index idx_kleiner_products_categoria on kleiner_products(categoria_id);
create index idx_kleiner_products_activo on kleiner_products(activo) where activo = true;
create index idx_kleiner_products_destacado on kleiner_products(destacado) where destacado = true;
create index idx_kleiner_products_embedding on kleiner_products using hnsw (embedding vector_cosine_ops);
create index idx_kleiner_products_fts on kleiner_products
  using gin(to_tsvector('spanish', coalesce(nombre, '') || ' ' || coalesce(descripcion, '')));
```

### 2.5. `kleiner_orders` (con correcciones de trazabilidad)

```sql
create table kleiner_orders (
  id                serial primary key,
  usuario_id        uuid not null references kleiner_profiles(id),
  codigo_pedido     text not null unique,           -- KF-20250521-0001
  estado            text not null default 'pendiente'
                    check (estado in (
                      'pendiente','confirmado','en_preparacion',
                      'en_camino','entregado','cancelado','reembolsado'
                    )),
  subtotal          numeric(10,2) not null check (subtotal > 0),
  tarifa_envio      numeric(6,2) not null check (tarifa_envio >= 0),
  descuento         numeric(10,2) not null default 0 check (descuento >= 0),
  total             numeric(10,2) not null check (total > 0),
  distrito_id       int references kleiner_distritos(id),
  direccion_envio   text not null,
  notas             text,
  -- Pago (Culqi)
  culqi_charge_id   text,
  metodo_pago       text check (metodo_pago in ('tarjeta','yape','plin')),
  pago_estado       text default 'pendiente'
                    check (pago_estado in ('pendiente','procesando','exitoso','fallido','reembolsado')),
  pago_metadata     jsonb,                          -- 🔥 Respuesta CRUDA de Culqi (auditoría)
  pagado_en         timestamptz,
  -- Delivery / Logística
  estado_delivery   text check (estado_delivery in (
                      'pendiente','asignado','recogido','en_ruta','entregado','fallido'
                    )),
  repartidor_asignado text,                         -- Nombre o ID del motorizado
  tracking_delivery   jsonb,                        -- 🔥 Historial de tracking: [{ubicacion, timestamp, nota}]
  -- Metadata
  origen            text default 'web' check (origen in ('web','bot_ia','voz')),
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create index idx_kleiner_orders_usuario on kleiner_orders(usuario_id);
create index idx_kleiner_orders_estado on kleiner_orders(estado);
create index idx_kleiner_orders_creado on kleiner_orders(creado_en desc);
create index idx_kleiner_orders_codigo on kleiner_orders(codigo_pedido);
```

### 2.6. `kleiner_order_items`

```sql
create table kleiner_order_items (
  id              serial primary key,
  order_id        int not null references kleiner_orders(id) on delete cascade,
  product_id      int not null references kleiner_products(id),
  cantidad        int not null check (cantidad > 0),
  precio_unitario numeric(8,2) not null check (precio_unitario > 0),
  subtotal        numeric(10,2) not null check (subtotal > 0),
  created_at      timestamptz not null default now()
);

create index idx_kleiner_order_items_order on kleiner_order_items(order_id);
```

### 2.7. `kleiner_chat_logs`

```sql
create table kleiner_chat_logs (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid references kleiner_profiles(id) on delete set null,
  session_id      text not null,
  role            text not null check (role in ('user','assistant','system','tool')),
  content         text not null,
  tool_calls      jsonb,
  metadata        jsonb,
  origen          text default 'texto' check (origen in ('texto','voz')),
  audio_url       text,
  created_at      timestamptz not null default now()
);

create index idx_kleiner_chat_logs_session on kleiner_chat_logs(session_id);
create index idx_kleiner_chat_logs_usuario on kleiner_chat_logs(usuario_id);
create index idx_kleiner_chat_logs_creado on kleiner_chat_logs(created_at);
```

### 2.8. `kleiner_cart_sessions`

```sql
create table kleiner_cart_sessions (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid references kleiner_profiles(id) on delete cascade,
  session_data    jsonb not null,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  constraint one_active_cart_per_user unique (usuario_id) where activo = true
);
```

---

## 3. RPC Seguro: `decrementar_stock_seguro`

> 🔥 **Corrección #1 del Arquitecto:** Prevención de Race Conditions en el stock.

Esta función RPC utiliza **row-level locking** (`FOR UPDATE`) dentro de una transacción para garantizar que dos pedidos simultáneos no vendan la misma última unidad.

```sql
-- ============================================================
-- decrementar_stock_seguro(p_product_id, p_cantidad)
-- ============================================================
-- Uso:   SELECT * FROM decrementar_stock_seguro(42, 2);
-- Retorna: (exitoso bool, stock_restante int, mensaje text)
-- ============================================================

create or replace function decrementar_stock_seguro(
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
  -- 1. Bloqueamos LA FILA para evitar lecturas concurrentes
  select stock into v_stock_actual
  from kleiner_products
  where id = p_product_id
  for update;                              -- ← Row-level lock

  -- 2. Validamos stock suficiente
  if v_stock_actual is null then
    return query select false, 0::int, 'Producto no encontrado'::text;
    return;
  end if;

  if v_stock_actual < p_cantidad then
    return query select false, v_stock_actual, format(
      'Stock insuficiente. Disponible: %s, solicitado: %s',
      v_stock_actual, p_cantidad
    )::text;
    return;
  end if;

  -- 3. Decrementamos (esto ocurre dentro de la transacción bloqueada)
  update kleiner_products
  set stock = stock - p_cantidad,
      actualizado_en = now()
  where id = p_product_id
  returning stock into v_stock_actual;

  -- 4. Retornamos éxito
  return query select true, v_stock_actual, 'Stock actualizado correctamente'::text;
end;
$$;
```

**Uso desde Server Action:**
```typescript
const { data, error } = await supabaseAdmin.rpc('decrementar_stock_seguro', {
  p_product_id: 42,
  p_cantidad: 2,
});

if (data?.exitoso) {
  // ✅ Stock descontado — proceder con el pedido
} else {
  // ❌ Stock insuficiente — informar al usuario
}
```

---

## 4. Dependencias y Paquetes

### Producción

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `next` | `^15.x` | Framework React App Router |
| `react` / `react-dom` | `^19.x` | UI Library |
| `@supabase/supabase-js` | `^2.x` | Cliente Supabase |
| `@supabase/ssr` | `^1.x` | Auth SSR con cookies |
| `ai` | `^4.x` | Vercel AI SDK Core |
| `@ai-sdk/openai` | `^1.x` | Provider OpenAI |
| `openai` | `^4.x` | Whisper + Embeddings |
| `@serwist/next` | `^9.x` | 🔥 **PWA moderna** (sucesor de next-pwa) |
| `serwist` | `^9.x` | 🔥 Core de Serwist (devDependency) |
| `zustand` | `^5.x` | Estado global del carrito |
| `tailwind-merge` | `^2.x` | Merge condicional de Tailwind |
| `clsx` | `^2.x` | Conditional classnames |
| `sonner` | `^1.x` | Toast notifications |
| `lucide-react` | `^0.x` | Iconos SVG |
| `@vercel/analytics` | `^1.x` | Analytics |
| `date-fns` | `^4.x` | Fechas |
| `zod` | `^4.x` | Validación de schemas |

### Desarrollo

| Paquete | Propósito |
|---------|-----------|
| `typescript` | Type checking |
| `@types/node` / `@types/react` | Tipados |
| `tailwindcss` / `postcss` / `autoprefixer` | CSS |
| `eslint` / `eslint-config-next` | Linting |
| `prettier` / `prettier-plugin-tailwindcss` | Formateo |
| `supabase` (CLI) | Migraciones locales |

### shadcn/ui (componentes base)

```bash
npx shadcn@latest init
npx shadcn@latest add button card input sheet dialog badge separator
```

---

## 5. Flujo de Datos: Voice-to-Payment

```
🎤 USUARIO              🖥️ FRONTEND                    ⚡ BACKEND / API
─────────               ────────────                    ───────────────

1. Presiona botón 🎤
      │
      ▼
   MediaRecorder.start()
   (graba ~15s en webm/ogg)
      │
2. Suelta botón 🎤
      │
      ▼
   MediaRecorder.stop()
   → Blob → FormData
      │
      ▼
   POST /api/transcripcion ──────────────────────► 3. OpenAI Whisper
      │                                               model: "whisper-1"
      │                                               ← "Quiero 2 Green Lemon"
      │
4. ◄───────── texto transcrito ───────────────────
      │
      ▼
   useChat.append({ role: "user", content: "..." })
      │
      ▼
   POST /api/chat ────────────────────────────────► 5. Vercel AI SDK
      │                                               streamText({ model, tools, prompt })
      │                                               │
      │                                               ├─ Tool: buscar_producto("Green Lemon")
      │                                               │   → pgvector + FTS híbrido
      │                                               │
      │                                               ├─ Tool: verificar_stock(id, 2)
      │                                               │   → SELECT stock FROM products
      │                                               │
      │                                               ├─ Tool: calcular_envio(distrito)
      │                                               │   → SELECT tarifa_envio FROM distritos
      │                                               │
      │                                               └─ Tool: agregar_al_carrito(id, 2)
      │                                                   → UPSERT en cart_sessions
      │
6. ◄───────── stream respuesta IA ─────────────────
   "¡Perfecto! 2 botellas = S/ 37.98.
    ¿A qué distrito?" 🚚
      │
7. Usuario confirma
      │
      ▼
   Culqi.checkout() ──────────────────────────────► Genera token
      │
      ▼
   POST /api/pago/crear-cargo ────────────────────► 8. Culqi API
      │                                               POST /v2/charges
      │                                               ← charge_id + status
      │                                               │
      │                                               ▼
      │                                            Supabase RPC:
      │                                            decrementar_stock_seguro()
      │                                               │
      │                                               ▼
      │                                            INSERT orders + order_items
      │                                               │
      │                                               ▼
      │                                            Guardar pago_metadata ← raw response Culqi
      │
9. ◄───────── pedido confirmado ──────────────────
   "🎉 Pedido KF-20250521-0001"
      │
      ▼
   ─── Webhook Culqi POST /api/pago/webhook ────► 10. Actualizar pago_estado
                                                     Notificar admin + usuario
```

---

## 6. Bot IA — Tool Calling

### Tools del Vercel AI SDK

```typescript
// src/lib/ai/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export const tools = {
  buscar_producto: tool({
    description: 'Busca productos por nombre, sabor o descripción usando búsqueda semántica',
    parameters: z.object({
      query: z.string().describe('Nombre o descripción del producto'),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ query, limit }) => {
      // 1. Generar embedding con OpenAI
      // 2. Búsqueda híbrida: pgvector (cosine) + FTS (tsvector)
      // 3. Retornar productos con precio, stock, imagen
    },
  }),

  verificar_stock: tool({
    description: 'Verifica el stock disponible de un producto',
    parameters: z.object({
      product_id: z.number(),
      cantidad: z.number(),
    }),
    execute: async ({ product_id, cantidad }) => {
      // SELECT stock FROM products WHERE id = product_id
      // Retornar: disponible, stock_actual
    },
  }),

  calcular_envio: tool({
    description: 'Calcula la tarifa de envío para un distrito',
    parameters: z.object({
      distrito: z.string(),
    }),
    execute: async ({ distrito }) => {
      // SELECT tarifa_envio, tiempo_estimado FROM distritos
    },
  }),

  agregar_al_carrito: tool({
    description: 'Agrega productos al carrito de compras',
    parameters: z.object({
      product_id: z.number(),
      cantidad: z.number(),
      session_id: z.string(),
    }),
    execute: async ({ product_id, cantidad, session_id }) => {
      // UPSERT en cart_sessions
    },
  }),

  buscar_receta: tool({
    description: 'Sugiere recetas de cócteles con los productos disponibles',
    parameters: z.object({
      producto: z.string().optional(),
    }),
    execute: async ({ producto }) => {
      // Retornar recetas predefinidas o generadas
    },
  }),
};
```

### System Prompt del Bot

```
Eres "Kleiner", el asistente virtual de ventas de Kleiner Feigling en Perú. 🥂

PERSONALIDAD:
- Eres amigable, fiestero y entusiasta, pero profesional.
- Usas emojis con moderación.
- Hablas en español peruano ("pues", "causa", "bacán").
- Conoces bien los sabores: Original, Green Lemon, Red Berry Sour, Coco Biscuit, Cherrie.

REGLAS DE NEGOCIO:
1. Siempre confirma el distrito del usuario para calcular envío.
2. Los precios están en soles (S/).
3. El delivery aplica solo en Lima metropolitana por ahora.
4. Stock limitado - si un producto no está disponible, sugiere alternativas.
5. El pago es con Culqi (tarjetas, Yape, Plin).
6. Puedes sugerir recetas de cócteles con los productos.

FLUJO DE VENTA:
1. Pregunta qué desea el usuario.
2. Sugiere productos basado en sus preferencias.
3. Confirma productos, cantidades y distrito.
4. Calcula el total (productos + envío).
5. Pide confirmación final.
6. Deriva al checkout con Culqi.
```

---

## 7. PWA con Serwist

> 🔥 **Corrección #2 del Arquitecto:** Reemplazar `sw.js` manual por `@serwist/next`.

### Instalación

```bash
npm i @serwist/next
npm i -D serwist
```

### Configuración (`next.config.ts`)

```typescript
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
});

export default withSerwist({
  // next config...
});
```

### Service Worker (`src/app/sw.ts`)

```typescript
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

### PWA Manifest (vía Next.js Metadata en `layout.tsx`)

```typescript
export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kleiner Feigling',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  // ...
};
```

### `public/manifest.json`

```json
{
  "name": "Kleiner Feigling Peru",
  "short_name": "KF Peru",
  "description": "Compra Kleiner Feigling con IA. Delivery en Lima.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### `.gitignore`

```gitignore
# Serwist (archivos generados)
public/sw*
public/swe-worker*
```

---

## 8. Seguridad y RLS

### Políticas Row Level Security

```sql
-- PRODUCTS
alter table kleiner_products enable row level security;
create policy "kleiner_products - visibles para todos (activos)" on kleiner_products
  for select using (activo = true);
create policy "kleiner_products - admin full access" on kleiner_products
  for all using (auth.role() = 'service_role');

-- ORDERS
alter table kleiner_orders enable row level security;
create policy "kleiner_orders - usuarios ven sus pedidos" on kleiner_orders
  for select using (auth.uid() = usuario_id);
create policy "kleiner_orders - admin ve todos los pedidos" on kleiner_orders
  for all using (auth.role() = 'service_role');
create policy "kleiner_orders - usuarios crean pedidos" on kleiner_orders
  for insert with check (auth.uid() = usuario_id);

-- ORDER_ITEMS
alter table kleiner_order_items enable row level security;
create policy "kleiner_order_items - acceso vía order padre" on kleiner_order_items
  for select using (
    exists (select 1 from kleiner_orders where kleiner_orders.id = kleiner_order_items.order_id and kleiner_orders.usuario_id = auth.uid())
  );

-- PROFILES
alter table kleiner_profiles enable row level security;
create policy "kleiner_profiles - lectura propia" on kleiner_profiles
  for select using (auth.uid() = id);
create policy "kleiner_profiles - actualización propia" on kleiner_profiles
  for update using (auth.uid() = id);

-- CHAT_LOGS
alter table kleiner_chat_logs enable row level security;
create policy "kleiner_chat_logs - lectura propia" on kleiner_chat_logs
  for select using (auth.uid() = usuario_id);
create policy "kleiner_chat_logs - creación propia" on kleiner_chat_logs
  for insert with check (auth.uid() = usuario_id);

-- CART_SESSIONS
alter table kleiner_cart_sessions enable row level security;
create policy "kleiner_cart_sessions - lectura propia" on kleiner_cart_sessions
  for select using (auth.uid() = usuario_id);
create policy "kleiner_cart_sessions - gestión propia" on kleiner_cart_sessions
  for all using (auth.uid() = usuario_id);
```

---

## Variables de Entorno (`.env.example`)

```env
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# === OpenAI ===
OPENAI_API_KEY=sk-...

# === Culqi (Pagos) ===
NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_test_...
CULQI_SECRET_KEY=sk_test_...

# === Vercel ===
VERCEL_URL=...
```

---

## Checklist de Implementación

- [x] Análisis de sistema aprobado
- [ ] `npx create-next-app@latest` con TypeScript + Tailwind + App Router
- [ ] Configurar shadcn/ui
- [ ] Configurar Serwist (PWA)
- [ ] Estructura de carpetas completa
- [ ] Variables de entorno
- [ ] Clientes Supabase (browser, server, admin)
- [ ] Tipos de base de datos generados
- [ ] Migración SQL inicial
- [ ] Componentes base (layout, navbar, footer)
- [ ] Página de catálogo (Server Component)
- [ ] Página de detalle de producto
- [ ] Carrito con Zustand
- [ ] Checkout con Culqi
- [ ] Bot de IA con Vercel AI SDK + Tool Calling
- [ ] Botón de voz con Whisper
- [ ] RPC `decrementar_stock_seguro`
- [ ] Webhook de Culqi
- [ ] Auth con Supabase (magic link / email)
- [ ] RLS policies
- [ ] PWA manifest + Service Worker (Serwist)
- [ ] Dashboard de perfil y pedidos
- [ ] Página 404, error, loading personalizadas
