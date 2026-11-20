import { useEffect, useState } from "react";

/** Vista de la app de soci@: «noche» (Noche de partido, por defecto) o «dia» (claro con letra dorada). Se guarda en el móvil. */
export type Vista = "noche" | "dia";
const CLAVE = "rul-vista";
const EVENTO = "rul-vista-cambio";

export function leerVista(): Vista {
  try { return localStorage.getItem(CLAVE) === "dia" ? "dia" : "noche"; } catch { return "noche"; }
}

export function guardarVista(v: Vista) {
  try { localStorage.setItem(CLAVE, v); } catch { /* sin almacenamiento: dura hasta recargar */ }
  window.dispatchEvent(new Event(EVENTO));
}

export function useVista(): Vista {
  const [vista, setVista] = useState<Vista>("noche");
  useEffect(() => {
    const leer = () => setVista(leerVista());
    leer();
    window.addEventListener(EVENTO, leer);
    window.addEventListener("storage", leer);
    return () => { window.removeEventListener(EVENTO, leer); window.removeEventListener("storage", leer); };
  }, []);
  return vista;
}

export const claseVista = (v: Vista) => (v === "dia" ? "theme-dia" : "theme-noche");
