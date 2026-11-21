import { useEffect, useState } from "react";

// Registro del service worker. No se registra dentro de un iframe (la vista previa de Lovable) ni en desarrollo.
export function registrarServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV || window.self !== window.top) return;
  window.addEventListener("load", () => { void navigator.serviceWorker.register("/sw.js").catch(() => {}); }, { once: true });
}

type AvisoInstalacion = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let aviso: AvisoInstalacion | null = null;
const oyentes = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); aviso = e as AvisoInstalacion; oyentes.forEach((f) => f()); });
  window.addEventListener("appinstalled", () => { aviso = null; oyentes.forEach((f) => f()); });
}

export function enModoApp() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
function esIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Estado de «Instalar la app»: en Android/Chrome usa el aviso nativo; en iPhone hay que hacerlo desde Compartir. */
export function useInstalarApp() {
  const [, refrescar] = useState(0);
  const [montado, setMontado] = useState(false);
  useEffect(() => { setMontado(true); const f = () => refrescar((n) => n + 1); oyentes.add(f); return () => { oyentes.delete(f); }; }, []);
  if (!montado || enModoApp()) return { disponible: false as const };
  if (aviso) {
    const a = aviso;
    return { disponible: true as const, ios: false, instalar: async () => { await a.prompt(); await a.userChoice; aviso = null; oyentes.forEach((f) => f()); } };
  }
  if (esIOS()) return { disponible: true as const, ios: true, instalar: async () => {} };
  return { disponible: false as const };
}
