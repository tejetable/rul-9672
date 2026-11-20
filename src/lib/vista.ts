import { useSyncExternalStore } from "react";

/** Vista de la app de soci@: «dia» (Light, por defecto) o «noche» (Strong, Noche de partido).
 *  Se guarda en el móvil y se copia en <html data-vista> para que la pantalla de carga salga ya con su color
 *  (un script en <head> la pone antes del primer pintado: ver SCRIPT_VISTA en __root). */
export type Vista = "noche" | "dia";
const CLAVE = "rul-vista";
const EVENTO = "rul-vista-cambio";

export function leerVista(): Vista {
  try { return localStorage.getItem(CLAVE) === "noche" ? "noche" : "dia"; } catch { return "dia"; }
}

export function guardarVista(v: Vista) {
  try { localStorage.setItem(CLAVE, v); } catch { /* sin almacenamiento: dura hasta recargar */ }
  try { document.documentElement.dataset["vista"] = v; } catch { /* sin DOM */ }
  window.dispatchEvent(new Event(EVENTO));
}

function suscribir(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso);
  return () => { window.removeEventListener(EVENTO, aviso); window.removeEventListener("storage", aviso); };
}

/** En el servidor y al hidratar devuelve «dia»; en el móvil, la guardada. Sin parpadeo en lo que se pinta solo en cliente. */
export function useVista(): Vista {
  return useSyncExternalStore(suscribir, leerVista, () => "dia");
}

export const claseVista = (v: Vista) => (v === "dia" ? "theme-dia" : "theme-noche");

/** Se ejecuta en <head> antes de pintar: marca <html data-vista> para el fondo y la pantalla de carga. */
export const SCRIPT_VISTA = `try{document.documentElement.dataset.vista=localStorage.getItem("${CLAVE}")==="noche"?"noche":"dia"}catch(e){}`;
