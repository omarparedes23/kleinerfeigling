import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope;

// Extender ServiceWorkerGlobalScope para incluir __SW_MANIFEST
// (inyectado por el plugin de Serwist en build time)
interface ServiceWorkerGlobalScope {
  __SW_MANIFEST: Array<{
    url: string;
    revision: string | null;
  }>;
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
