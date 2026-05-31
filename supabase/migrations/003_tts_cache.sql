-- TTS Cache: content-addressed audio indexed by MD5 hash
-- Audio files live in Cloudflare R2; this table holds hash → URL mapping.
-- No RLS — only accessed via service_role from server.
create table public.kleiner_tts_cache (
  text_hash    text primary key,
  r2_url       text not null,
  text_content text,
  char_count   int,
  hit_count    int not null default 0,
  created_at   timestamptz not null default now()
);

create index kleiner_tts_cache_created_at_idx on public.kleiner_tts_cache (created_at);
