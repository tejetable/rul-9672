import { useEffect, useId, useState } from "react";
import { dataService } from "@/lib/dataService";

/** Goleadores (balón) y asistentes (bota) de un partido jugado. Se usa bajo el último resultado y bajo el marcador
 *  de paletas del calendario. Si el partido no tiene estadísticas, no pinta nada. */
type Linea = { apodo: string; n: number };
type Datos = { goles: Linea[]; asistencias: Linea[] };

const cache = new Map<string, Datos>();
let apodos: Promise<Map<string, string>> | null = null;
function cargarApodos() {
  apodos ??= dataService.jugadores().then((js) => new Map(js.map((j) => [j.id, j.apodo]))).catch((e) => { apodos = null; throw e; });
  return apodos;
}
function ordenar(l: Linea[]) {
  return l.sort((a, b) => b.n - a.n || a.apodo.localeCompare(b.apodo, "es"));
}

/** Gol: jugador con balón blanco de pentágonos verdes. Colores del club; todo dentro del círculo. */
export function IconoBalon() {
  const id = useId();
  return <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="22.5" fill="#0D4631" stroke="#B98E4A" strokeWidth="1.5" /><circle cx="19.5" cy="15.5" r="6" fill="#D9B77A" /><path d="M10 35.5v-4.5a8 8 0 0 1 8-8h3a8 8 0 0 1 8 8v4.5z" fill="#D9B77A" />
    <g transform="translate(31 31) scale(.75) translate(-33 -33)"><clipPath id={id}><circle cx="33" cy="33" r="10" /></clipPath><circle cx="33" cy="33" r="10" fill="#FFFFFF" /><g clipPath={`url(#${id})`}><path d="M33.00 26.40L30.81 24.81L31.65 22.24L34.35 22.24L35.19 24.81z M39.28 30.96L40.11 28.39L42.82 28.39L43.65 30.96L41.46 32.55z M36.88 38.34L39.58 38.34L40.42 40.91L38.23 42.50L36.04 40.91z M29.12 38.34L29.96 40.91L27.77 42.50L25.58 40.91L26.42 38.34z M26.72 30.96L24.54 32.55L22.35 30.96L23.18 28.39L25.89 28.39z" fill="#0D4631" /></g><path d="M33.00 29.40L36.42 31.89L35.12 35.91L30.88 35.91L29.58 31.89z" fill="#0D4631" /><path d="M33.00 29.40L33.00 26.40 M36.42 31.89L39.28 30.96 M35.12 35.91L36.88 38.34 M30.88 35.91L29.12 38.34 M29.58 31.89L26.72 30.96" stroke="#0D4631" strokeWidth="1.2" /><circle cx="33" cy="33" r="10" fill="none" stroke="#0D4631" strokeWidth="2.67" /></g>
  </svg>;
}

/** Asistencia: jugador con bota de fútbol sala blanca (contorno verde, sin tacos). Colores del club; todo dentro del círculo. */
export function IconoBota() {
  return <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="22.5" fill="#0D4631" stroke="#B98E4A" strokeWidth="1.5" /><circle cx="19.5" cy="15.5" r="6" fill="#D9B77A" /><path d="M10 35.5v-4.5a8 8 0 0 1 8-8h3a8 8 0 0 1 8 8v4.5z" fill="#D9B77A" />
    <g transform="translate(16 36) scale(.72) translate(-13 -41.5)"><path d="M13 41.5h31v-3.4c0-1.7-1-2.8-2.4-3.2l-2.6-.6-2-4c-.5-.9-1.4-1.1-2.2-.7l-4.1 2c-3.6 1.7-7.8 2.6-11.8 2.9-1.3.1-1.9 1.1-1.9 2.3z" fill="#fff" stroke="#0D4631" strokeWidth="2.8" strokeLinejoin="round" /><path d="M27 33.4l1.5 2.6M30.4 31.9l1.5 2.6" stroke="#0D4631" strokeWidth="2" strokeLinecap="round" /></g>
  </svg>;
}

export function GoleadoresPartido({ partidoId }: { partidoId: string }) {
  const [datos, setDatos] = useState<Datos | null>(() => cache.get(partidoId) ?? null);
  useEffect(() => {
    let vivo = true;
    const guardado = cache.get(partidoId);
    if (guardado) { setDatos(guardado); return; }
    setDatos(null);
    Promise.all([dataService.estadisticasPartido(partidoId), cargarApodos()])
      .then(([filas, nombres]) => {
        const apodo = (id: string) => nombres.get(id) ?? "—";
        const d: Datos = {
          goles: ordenar(filas.filter((f) => f.goles > 0).map((f) => ({ apodo: apodo(f.jugadorId), n: f.goles }))),
          asistencias: ordenar(filas.filter((f) => f.asistencias > 0).map((f) => ({ apodo: apodo(f.jugadorId), n: f.asistencias }))),
        };
        cache.set(partidoId, d);
        if (vivo) setDatos(d);
      })
      .catch(() => { if (vivo) setDatos({ goles: [], asistencias: [] }); });
    return () => { vivo = false; };
  }, [partidoId]);

  if (!datos || (!datos.goles.length && !datos.asistencias.length)) return null;
  return <div className="match-scorers">
    {datos.goles.length > 0 && <p><IconoBalon /><span className="match-scorers-list"><span className="sr-only">Goles: </span>{datos.goles.map((g) => <span key={g.apodo}>{g.apodo}{g.n > 1 && <b> ×{g.n}<span className="sr-only"> goles</span></b>}</span>)}</span></p>}
    {datos.asistencias.length > 0 && <p><IconoBota /><span className="match-scorers-list"><span className="sr-only">Asistencias: </span>{datos.asistencias.map((a) => <span key={a.apodo}>{a.apodo}{a.n > 1 && <b> ×{a.n}<span className="sr-only"> asistencias</span></b>}</span>)}</span></p>}
  </div>;
}
