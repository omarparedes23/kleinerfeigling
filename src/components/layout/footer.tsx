"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter, Shield, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-neutral-900 bg-black text-neutral-400 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand block */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="text-2xl font-black tracking-widest text-white">
              KLEINER<span className="text-amber-400">FEIGLING</span>
            </Link>
            <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
              Licores importados de Alemania. La mejor experiencia de compra con IA y entrega express en Lima Metropolitana.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-amber-400 hover:text-amber-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-amber-400 hover:text-amber-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-amber-400 hover:text-amber-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links block */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest text-white uppercase">
              Explorar
            </h3>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/#productos" className="hover:text-amber-400 transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/#cocteles" className="hover:text-amber-400 transition-colors">
                  Cócteles
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="hover:text-amber-400 transition-colors">
                  Mi Carrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal block */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest text-white uppercase">
              Soporte y Legal
            </h3>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link href="/terminos" className="hover:text-amber-400 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-amber-400 transition-colors">
                  Políticas de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/libro-reclamaciones" className="hover:text-amber-400 transition-colors">
                  Libro de Reclamaciones
                </Link>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-amber-400/80">
                  <Shield className="h-3.5 w-3.5" />
                  Compra 100% Segura
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="my-8 border-t border-neutral-900" />

        {/* Warning text */}
        <div className="w-full text-center space-y-4">
          <div className="inline-block border border-neutral-800 bg-neutral-950 px-6 py-3 rounded-xl text-[10px] sm:text-xs font-medium tracking-[0.1em] text-neutral-500 uppercase">
            Tomar bebidas alcohólicas en exceso es dañino. Prohibida la venta a menores de 18 años.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-neutral-600 font-semibold pt-4">
            <p>© {currentYear} Kleiner Feigling Perú. Todos los derechos reservados.</p>
            <p className="flex items-center gap-1">
              Hecho con <Heart className="h-3 w-3 text-amber-400 fill-amber-400" /> para los amantes del buen sabor.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
