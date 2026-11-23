import { useEffect, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { dataService } from "@/lib/dataService";
import { IconoBalon, IconoBota } from "./GoleadoresPartido";

/** Liga en El Equipo: tres pestañas (Clasificación, Goleadores, Asistencias) dentro de la propia pantalla.
 *  Al cambiar de pestaña solo se carga y se pinta su contenido. */
export type Pestana = "clasificacion" | "goles" | "asistencias";
export const PESTANAS_LIGA: Pestana[] = ["clasificacion", "goles", "asistencias"];
const EVENTO = "rul:liga";

/** La ficha del 4º abre la pestaña Clasificación y baja hasta ella. */
export function abrirLiga(p: Pestana = "clasificacion") {
  window.dispatchEvent(new CustomEvent<Pestana>(EVENTO, { detail: p }));
  document.getElementById("liga-pestanas")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Clasificación: podio en los colores del club, mismo estilo que los iconos de goles y asistencias. */
export function IconoTabla() {
  return <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="22.5" fill="#0D4631" stroke="#B98E4A" strokeWidth="1.5" />
    <rect x="18" y="13" width="12" height="22" rx="1.5" fill="#D9B77A" stroke="#0D4631" strokeWidth="1.5" />
    <rect x="7.5" y="20" width="11" height="15" rx="1.5" fill="#FFFFFF" stroke="#0D4631" strokeWidth="1.5" />
    <rect x="29.5" y="24" width="11" height="11" rx="1.5" fill="#FFFFFF" stroke="#0D4631" strokeWidth="1.5" />
    <path d="M7 35.5h34" stroke="#D9B77A" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}

const PESTANAS: { id: Pestana; texto: string; Icono: ComponentType }[] = [
  { id: "clasificacion", texto: "Clasificación", Icono: IconoTabla },
  { id: "goles", texto: "Goleadores", Icono: IconoBalon },
  { id: "asistencias", texto: "Asistencias", Icono: IconoBota },
];

type Clasificacion = Awaited<ReturnType<typeof dataService.clasificacionCompleta>>;
type Lider = Awaited<ReturnType<typeof dataService.maximosGoleadores>>[number];
let clasificacion: Promise<Clasificacion> | null = null;
let lideres: Promise<Lider[]> | null = null;
const cargarClasificacion = () => (clasificacion ??= dataService.clasificacionCompleta().catch((e) => { clasificacion = null; throw e; }));
const cargarLideres = () => (lideres ??= dataService.maximosGoleadores().catch((e) => { lideres = null; throw e; }));

function useDatos<T>(cargar: () => Promise<T>) {
  const [estado, setEstado] = useState<{ ok: boolean; error: boolean; datos?: T }>({ ok: false, error: false });
  useEffect(() => {
    let vivo = true;
    cargar().then((datos) => { if (vivo) setEstado({ ok: true, error: false, datos }); }).catch(() => { if (vivo) setEstado({ ok: false, error: true }); });
    return () => { vivo = false; };
  }, [cargar]);
  return estado;
}

/** compacta (El Equipo): un trozo de cada lista y «Ver … completa». completa (/liga): todo, con podio. */
export function LigaPestanas({ completa = false, inicial = "clasificacion" }: { completa?: boolean; inicial?: Pestana }) {
  const [activa, setActiva] = useState<Pestana>(inicial);
  const refs = useRef<Record<Pestana, HTMLButtonElement | null>>({ clasificacion: null, goles: null, asistencias: null });
  useEffect(() => {
    const abrir = (e: Event) => setActiva((e as CustomEvent<Pestana>).detail ?? "clasificacion");
    window.addEventListener(EVENTO, abrir);
    return () => window.removeEventListener(EVENTO, abrir);
  }, []);
  const teclado = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = PESTANAS.findIndex((p) => p.id === activa);
    const sig = PESTANAS[(i + (e.key === "ArrowRight" ? 1 : PESTANAS.length - 1)) % PESTANAS.length]!.id;
    setActiva(sig);
    refs.current[sig]?.focus();
  };
  return <section id={completa ? undefined : "liga-pestanas"} className={`liga-tabs surface-card ${completa ? "is-completa" : ""}`} aria-label="Liga">
    <div role="tablist" aria-label="Liga" className="liga-tablist" onKeyDown={teclado}>
      {PESTANAS.map(({ id, texto, Icono }) => <button key={id} ref={(el) => { refs.current[id] = el; }} type="button" role="tab" id={`liga-tab-${id}`} aria-controls="liga-panel" aria-selected={activa === id} tabIndex={activa === id ? 0 : -1} className="liga-tab" onClick={() => setActiva(id)}><Icono />{texto}</button>)}
    </div>
    <div role="tabpanel" id="liga-panel" aria-labelledby={`liga-tab-${activa}`} className="liga-panel">
      {activa === "clasificacion" ? <TablaLiga completa={completa} /> : <Ranking campo={activa} completa={completa} />}
      {!completa && <Link to="/liga" search={{ vista: activa }} className="liga-mas">{activa === "clasificacion" ? "Ver la clasificación completa" : activa === "goles" ? "Ver todos los goleadores" : "Ver todos los asistentes"}<ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></Link>}
    </div>
  </section>;
}

function TablaLiga({ completa }: { completa: boolean }) {
  const { ok, error, datos } = useDatos(cargarClasificacion);
  const futgal = dataService.ajustes().url_clasificacion_futgal;
  if (error) return <p className="liga-vacio">No hemos podido cargar la clasificación. Inténtalo de nuevo en un rato.</p>;
  if (!ok) return <p className="liga-vacio" aria-busy="true">Cargando la clasificación…</p>;
  if (!datos || !datos.filas.length) return <p className="liga-vacio">La directiva todavía no ha metido la clasificación.{futgal && <> <a href={futgal} target="_blank" rel="noopener noreferrer">Verla en la web de la federación</a>.</>}</p>;
  const nuestro = datos.filas.findIndex((f) => f.esNuestro);
  // En El Equipo, cinco filas alrededor de la nuestra; en /liga, la tabla entera con todas las columnas.
  const desde = completa || nuestro < 0 ? 0 : Math.max(0, Math.min(nuestro - 2, datos.filas.length - 5));
  const filas = completa ? datos.filas : datos.filas.slice(desde, desde + 5);
  return <>
    <div className={completa ? "liga-table-scroll" : undefined}>
    <table className={`liga-table ${completa ? "is-completa" : ""}`}>
      <caption className="sr-only">Clasificación tras la jornada {datos.jornada}</caption>
      <thead><tr><th scope="col">#</th><th scope="col">Equipo</th><th scope="col" className="is-num">PJ</th>{completa && <><th scope="col" className="is-num">G</th><th scope="col" className="is-num">E</th><th scope="col" className="is-num">P</th><th scope="col" className="is-num"><abbr title="Diferencia de goles">DG</abbr></th></>}<th scope="col" className="is-num">Pts</th></tr></thead>
      <tbody>{filas.map((f) => <tr key={f.equipo} className={f.esNuestro ? "is-nuestro" : undefined}><td className="liga-pos">{f.posicion}</td><th scope="row">{f.esNuestro ? "R.U. Lucense" : f.equipo}</th><td className="is-num">{f.pj}</td>{completa && <><td className="is-num">{f.g}</td><td className="is-num">{f.e}</td><td className="is-num">{f.p}</td><td className="is-num">{f.gf - f.gc > 0 ? `+${f.gf - f.gc}` : f.gf - f.gc}</td></>}<td className="is-num liga-pts">{f.puntos}</td></tr>)}</tbody>
    </table>
    </div>
    <p className="liga-nota">Tras la jornada {datos.jornada}</p>
  </>;
}

type Fila = Lider & { puesto: number };
function Ranking({ campo, completa }: { campo: "goles" | "asistencias"; completa: boolean }) {
  const { ok, error, datos } = useDatos(cargarLideres);
  if (error) return <p className="liga-vacio">No hemos podido cargar los datos. Inténtalo de nuevo en un rato.</p>;
  if (!ok) return <p className="liga-vacio" aria-busy="true">Cargando…</p>;
  const orden = (datos ?? []).filter((j) => j[campo] > 0).sort((a, b) => b[campo] - a[campo] || a.apodo.localeCompare(b.apodo, "es"));
  if (!orden.length) return <p className="liga-vacio">Todavía no hay {campo === "goles" ? "goles" : "asistencias"} registrados.</p>;
  // Los empates comparten puesto (Buján y Guille, 3º con 8 goles).
  const filas: Fila[] = orden.map((j) => ({ ...j, puesto: 1 + orden.filter((o) => o[campo] > j[campo]).length }));
  const etiqueta = campo === "goles" ? "Máximos goleadores" : "Máximos asistentes";
  const grupos: Fila[][] = [];
  for (const f of filas) { const g = grupos.find((x) => x[0]!.puesto === f.puesto); if (g) g.push(f); else grupos.push([f]); }
  const podio = grupos.slice(0, 3);
  // En El Equipo, solo el podio; en /liga, el podio y el resto del ranking.
  if (!completa) return <Podio grupos={podio} campo={campo} />;
  const resto = grupos.slice(3).flat();
  return <>
    <Podio grupos={podio} campo={campo} />
    {resto.length > 0 && <ListaRanking filas={resto} campo={campo} etiqueta={`${etiqueta}, desde el ${resto[0]!.puesto}º`} />}
  </>;
}

function ListaRanking({ filas, campo, etiqueta }: { filas: Fila[]; campo: "goles" | "asistencias"; etiqueta: string }) {
  return <ol className="liga-ranking" aria-label={etiqueta}>
    {filas.map((j) => <li key={j.jugadorId} className={j.puesto === 1 ? "is-lider" : undefined}>
      <span className="liga-pos" aria-label={`${j.puesto}º`}>{j.puesto}</span>
      <span className="liga-dorsal" aria-hidden="true">{j.dorsal ?? "–"}</span>
      <span className="liga-nombre">{j.apodo}</span>
      <span className="liga-valor">{j[campo]}<span className="sr-only"> {campo}</span></span>
    </li>)}
  </ol>;
}

/** Podio: 2º a la izquierda, 1º en el centro (más alto, en verde) y 3º a la derecha. Con empate, los nombres comparten escalón. */
function Podio({ grupos, campo }: { grupos: Fila[][]; campo: "goles" | "asistencias" }) {
  const sitio = [1, 0, 2].filter((i) => i < grupos.length);
  return <ol className="liga-podio" aria-label={campo === "goles" ? "Podio de goleadores" : "Podio de asistentes"}>
    {sitio.map((i) => {
      const g = grupos[i]!;
      const primero = g[0]!;
      return <li key={primero.puesto} className={`liga-podio-escalon is-${i + 1}`}>
        <span className="liga-podio-dorsales" aria-hidden="true">{g.map((j) => <span key={j.jugadorId} className="liga-dorsal">{j.dorsal ?? "–"}</span>)}</span>
        <span className="liga-podio-nombre">{g.map((j) => j.apodo).join(" · ")}</span>
        <span className="liga-podio-bloque">
          <span className="liga-podio-valor">{primero[campo]}<span className="sr-only"> {campo}</span></span>
          <span className="liga-podio-puesto">{primero.puesto}º</span>
        </span>
      </li>;
    })}
  </ol>;
}
