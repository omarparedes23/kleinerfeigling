# Kleiner Feigling (Rejey)

PWA de e-commerce para la marca de licores "Kleiner Feigling" (Green Lemon), con asistente de IA conversacional por texto/voz, pagos con Culqi y catálogo con búsqueda semántica.

## Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Estilos**: Tailwind CSS 4 + shadcn/ui
- **Estado**: Zustand 5 (carrito)
- **Backend / DB**: Supabase (Postgres + Auth + pgvector)
- **IA**: Vercel AI SDK v4, Groq (chat), embeddings para búsqueda semántica de productos
- **Voz**: transcripción (Whisper) + TTS (ElevenLabs)
- **Pagos**: Culqi (cargo + webhook)
- **PWA**: Serwist (service worker)

## Estructura

```
src/
  app/
    (auth)/         # login / callback
    (dashboard)/    # panel de cliente
    (shop)/         # tienda
    api/
      chat/         # endpoint del bot de IA
      pago/         # creación de cargo + webhook Culqi
      productos/    # búsqueda semántica
      transcripcion/ # STT
      tts/          # TTS (ElevenLabs)
  components/       # ai-bot, cart, home, layout, payment, product, ui
  hooks/
  lib/
    ai/
    culqi/
    supabase/
    voice/
  styles/
  types/
```

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar variables de entorno
npm run dev
```

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción
- `npm run lint` — linter

## Variables de entorno

Ver `.env.example` para la lista completa (Supabase, Groq, ElevenLabs, Culqi, etc.).
