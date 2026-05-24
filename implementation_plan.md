# Implementation Plan - Rejey Visual Redesign

This plan details the visual overhaul for the Kleiner Feigling ecommerce store `rejey` to achieve an extremely professional, premium, and sleek designer aesthetic. It preserves the editorial gold/serif styling while introducing glassmorphism, depth, and fluid animations.

## 1. Global Styles (`src/app/globals.css`)
- **Designer Background Grid (`.lux-grid`)**:
  - Implement a multi-frequency blueprint grid using CSS gradients with extremely low opacities (2% white, 1.5% gold/yellow borders).
  - Designed to occupy laptop empty space elegantly and create a high-end luxury feel.
- **Premium Glass Card (`.glass-card-premium`)**:
  - Use frosted semi-transparent backgrounds with a heavy backdrop filter blur (`backdrop-filter: blur(16px)`).
  - Add ultra-thin glowing borders using white with 8% opacity.
  - Implement complex shadow layer: inset white reflections and deep smooth black drops (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_20px_50px_rgba(0,0,0,0.5)]`).
  - Set curves to `rounded-3xl` for modern premium softness.

## 2. Product Card (`src/components/product/product-card.tsx`)
- Apply `.glass-card-premium` and `rounded-3xl` to the main container.
- Replace the stark solid white rectangle with a frosted glass pedestal display stand:
  - Gradient: `from-white/95 to-neutral-50/90`.
  - Shadow: `shadow-[inset_0_2px_8px_rgba(255,255,255,0.8),0_10px_25px_rgba(0,0,0,0.06)]`.
  - Border: `border border-white/20`.
  - Curves: `rounded-3xl`.
- Make bottle PNGs blend perfectly (remove contrast overrides that make edges harsh) and add floating micro-animations on hover (`group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500`).
- Refactor the "Comprar" button to a beautiful pill capsule.
- Support flavor-specific small violet elements (dots/accents) when flavor is "Original" to pay homage to the classic Kleiner Feigling bottle cap and theme.

## 3. Product Detail Page (`src/components/product/product-detail.tsx`)
- Apply the identical frosted glass pedestal to the detailed main bottle display in the gallery.
- Make the main image float subtly with CSS micro-animations.
- Style the specifications cards (Volumen, Graduación, Stock) as three individual, elegant glass panels instead of a single box with thin dividers.

## 4. Homepage (`src/app/page.tsx`)
- Add the designer background grid `.lux-grid` to the page root.
- Enlarge the Voice Assistant AI chatbot button ("Asistente IA") in the hero and style it as an inviting, glossy, premium glass trigger with a subtle pulsate/glow.
- Add a persistent, gorgeous floating Voice Assistant glass trigger in the bottom-right corner of the screen.
- Refactor the three value prop cards ("Origen Certificado", etc.) into elegant, highly rounded (`rounded-3xl`), semi-transparent glass cards with subtle radial shadows and no cheap outline borders.

## 5. Catalog Catalog Page (`src/app/(shop)/productos/page.tsx` & `src/components/product/product-grid.tsx`)
- Redesign layout density of the product grid from 3-columns to a tight, beautiful 4-column layout on large screens (`grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`).
- Style category filter chips to match the glassmorphic aesthetics.

## 6. Navigation Bar (`src/components/layout/navbar.tsx`)
- Refactor the logo to be ultra-clean and polished. Mix geometric clean sans-serif for "KLEINER" with editorial serif italic for "Feigling".
