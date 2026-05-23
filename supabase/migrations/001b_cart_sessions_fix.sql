-- Fix: kleiner_cart_sessions (partial unique constraint must be a separate index)

CREATE TABLE public.kleiner_cart_sessions (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null references public.kleiner_profiles(id) on delete cascade,
  session_data    jsonb not null,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

-- Partial unique index (equivalent to the inline constraint, but actually supported)
CREATE UNIQUE INDEX one_active_cart_per_user
  ON public.kleiner_cart_sessions(usuario_id)
  WHERE activo = true;

-- Trigger updated_at
CREATE TRIGGER set_updated_at_kleiner_cart_sessions
  BEFORE UPDATE ON public.kleiner_cart_sessions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- RLS
ALTER TABLE public.kleiner_cart_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kleiner_cart_sessions - lectura propia"
  ON public.kleiner_cart_sessions FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "kleiner_cart_sessions - gestion propia"
  ON public.kleiner_cart_sessions FOR ALL
  USING (auth.uid() = usuario_id);
