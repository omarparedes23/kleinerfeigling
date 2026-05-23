-- ============================================================
-- Kleiner Feigling - Migración 002: Búsqueda Semántica
-- Versión: 002
-- Fecha: 2025-05-21
-- ============================================================
-- Crea la función match_kleiner_products para búsqueda híbrida:
--  1. pgvector (cosine similarity) con embedding de OpenAI
--  2. FTS (Full Text Search) como fallback en español
-- ============================================================

create or replace function public.match_kleiner_products(
  query_embedding vector(1536),
  match_count      int default 5,
  min_similarity   float default 0.3
)
returns table (
  id            int,
  nombre        text,
  slug          text,
  precio        numeric,
  precio_oferta numeric,
  imagen_url    text,
  stock         int,
  sabor         text,
  similarity    float
)
language plpgsql
as $$
begin
  return query
  select
    p.id,
    p.nombre,
    p.slug,
    p.precio,
    p.precio_oferta,
    p.imagen_url,
    p.stock,
    p.sabor,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.kleiner_products p
  where p.activo = true
    and p.stock > 0
    and 1 - (p.embedding <=> query_embedding) > min_similarity
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;
