import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dataService, runAction, useClubData, type LigaResultado } from "@/lib/dataService";
import { calcularClasificacion, type PartidoLiga } from "@/lib/liga";
import { EstadisticasForm } from "./EstadisticasForm";

type Equipo = { id: string; nombre: string; corto: string; es_nuestro: boolean };
type Fila = { local: string; visitante: string; gl: string; gv: string; aplazado: boolean; fecha: string | null; partidoId: string | null };

const hoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
const num = (v: string) => (v.trim() === "" ? null : Number(v));

/** Jornada por defecto: la última que ya ha empezado (su primer partido es hoy o antes). */
export function jornadaPorDefecto(partidos: { jornada: number; fecha: string | null }[], dia = hoy()) {
  const empezadas = partidos.filter((p) => p.fecha && p.fecha <= dia).map((p) => p.jornada);
  return empezadas.length ? Math.max(...empezadas) : 1;
}

/** Resultados de toda una jornada de liga: los 8 partidos, aplazados incluidos. Con ellos se calcula la clasificación.
 *  Nuestro partido guarda además el resultado en la ficha del partido y, guardado, permite meter goleadores y asistentes. */
export function JornadaForm({ inicial, onClose }: { inicial?: number; onClose: () => void }) {
  const db = useClubData();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [todos, setTodos] = useState<Awaited<ReturnType<typeof dataService.ligaPartidos>>>([]);
  const [sanciones, setSanciones] = useState<Awaited<ReturnType<typeof dataService.ligaSanciones>>>([]);
  const [jornada, setJornada] = useState<number | null>(inicial ?? null);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [busy, setBusy] = useState(false);
  const [guardada, setGuardada] = useState(false);

  useEffect(() => {
    void runAction(async () => {
      const [e, p, s] = await Promise.all([dataService.ligaEquipos(), dataService.ligaPartidos(), dataService.ligaSanciones()]);
      setEquipos(e as Equipo[]); setTodos(p); setSanciones(s);
      setJornada((j) => j ?? jornadaPorDefecto(p));
    });
  }, []);
  useEffect(() => {
    if (jornada === null) return;
    setGuardada(false);
    setFilas(todos.filter((p) => p.jornada === jornada).map((p) => ({ local: p.local, visitante: p.visitante, gl: p.goles_local?.toString() ?? "", gv: p.goles_visitante?.toString() ?? "", aplazado: p.aplazado, fecha: p.fecha, partidoId: p.partido_id })));
  }, [jornada, todos]);

  const nombre = useMemo(() => new Map(equipos.map((e) => [e.id, e.es_nuestro ? "R.U. Lucense" : e.corto || e.nombre])), [equipos]);
  const nuestroId = equipos.find((e) => e.es_nuestro)?.id;
  const nuestra = filas.find((f) => f.local === nuestroId || f.visitante === nuestroId);
  const partidoNuestro = nuestra && (db.partidos.find((p) => p.id === nuestra.partidoId) ?? db.partidos.find((p) => p.jornada === jornada));
  const incompleto = filas.some((f) => !f.aplazado && (f.gl.trim() === "") !== (f.gv.trim() === ""));
  const set = (i: number, cambio: Partial<Fila>) => setFilas((fs) => fs.map((f, k) => (k === i ? { ...f, ...cambio } : f)));

  const guardar = () => runAction(async () => {
    if (jornada === null) return;
    setBusy(true);
    try {
      const resultados: LigaResultado[] = filas.map((f) => ({ local: f.local, visitante: f.visitante, goles_local: f.aplazado ? null : num(f.gl), goles_visitante: f.aplazado ? null : num(f.gv), aplazado: f.aplazado }));
      await dataService.guardarJornada(jornada, resultados);
      // Nuestro partido también va a su ficha (tarjeta de temporada, racha) con la posición que sale de la tabla nueva.
      if (nuestra && partidoNuestro && !nuestra.aplazado && num(nuestra.gl) !== null && num(nuestra.gv) !== null) {
        const local = nuestra.local === nuestroId;
        const nuevos: PartidoLiga[] = todos.map((p) => {
          const r = p.jornada === jornada ? resultados.find((x) => x.local === p.local && x.visitante === p.visitante) : undefined;
          return { jornada: p.jornada, fecha: p.fecha, local: p.local, visitante: p.visitante, golesLocal: r ? r.goles_local : p.goles_local, golesVisitante: r ? r.goles_visitante : p.goles_visitante, aplazado: r ? r.aplazado : p.aplazado };
        });
        const tabla = calcularClasificacion(equipos.map((e) => ({ id: e.id, nombre: e.nombre, corto: e.corto, esNuestro: e.es_nuestro })), nuevos, sanciones.map((s) => ({ equipo: s.equipo, puntos: s.puntos })));
        const posicion = tabla.find((f) => f.equipo.id === nuestroId)?.posicion ?? null;
        await dataService.guardarResultado(partidoNuestro.id, local ? num(nuestra.gl)! : num(nuestra.gv)!, local ? num(nuestra.gv)! : num(nuestra.gl)!, posicion);
      } else await dataService.refresh();
      setTodos(await dataService.ligaPartidos());
      setGuardada(true);
    } finally { setBusy(false); }
  });

  if (jornada === null) return <p className="mt-4 text-body-sm" aria-busy="true">Cargando la jornada…</p>;
  return <div className="mt-4 space-y-4">
    <div className="jornada-nav">
      <Button type="button" variant="ghost" size="icon" aria-label="Jornada anterior" disabled={jornada <= 1} onClick={() => setJornada(jornada - 1)}><ChevronLeft /></Button>
      <p><strong>Jornada {jornada}</strong>{filas[0]?.fecha && <span>{new Date(`${filas[0].fecha}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>}</p>
      <Button type="button" variant="ghost" size="icon" aria-label="Jornada siguiente" disabled={jornada >= 30} onClick={() => setJornada(jornada + 1)}><ChevronRight /></Button>
    </div>
    {filas.length === 0 ? <p className="text-body-sm">No hay partidos cargados para esta jornada.</p> :
      <ul className="jornada-lista" aria-label={`Resultados de la jornada ${jornada}`}>
        {filas.map((f, i) => {
          const es = f.local === nuestroId || f.visitante === nuestroId;
          return <li key={`${f.local}-${f.visitante}`} className={`jornada-fila ${es ? "is-nuestro" : ""} ${f.aplazado ? "is-aplazado" : ""}`}>
            <span className="jornada-equipo is-local">{nombre.get(f.local) ?? f.local}</span>
            <input inputMode="numeric" pattern="[0-9]*" aria-label={`Goles de ${nombre.get(f.local) ?? f.local}`} disabled={f.aplazado} value={f.gl} onChange={(e) => set(i, { gl: e.target.value.replace(/\D/g, "").slice(0, 2) })} className="club-input jornada-goles" />
            <span aria-hidden="true">–</span>
            <input inputMode="numeric" pattern="[0-9]*" aria-label={`Goles de ${nombre.get(f.visitante) ?? f.visitante}`} disabled={f.aplazado} value={f.gv} onChange={(e) => set(i, { gv: e.target.value.replace(/\D/g, "").slice(0, 2) })} className="club-input jornada-goles" />
            <span className="jornada-equipo">{nombre.get(f.visitante) ?? f.visitante}</span>
            <label className="jornada-aplazado"><input type="checkbox" checked={f.aplazado} onChange={(e) => set(i, { aplazado: e.target.checked })} />Aplazado</label>
          </li>;
        })}
      </ul>}
    {incompleto && <p role="alert" className="text-body-sm font-bold">Hay un resultado a medias: pon los dos marcadores o deja los dos vacíos.</p>}
    <p className="text-body-sm text-muted-foreground">Deja los dos marcadores vacíos si el partido aún no se ha jugado. La clasificación se calcula sola con estos resultados.</p>
    <div className="sheet-actions">
      <Button type="button" disabled={busy || incompleto || filas.length === 0} onClick={() => void guardar()}>{busy ? "Guardando…" : "Guardar jornada"}</Button>
      <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
    </div>
    {guardada && <p role="status" className="font-bold">Jornada {jornada} guardada.</p>}
    {guardada && partidoNuestro && db.partidos.find((p) => p.id === partidoNuestro.id)?.jugado && <div className="border-t border-border pt-4">
      <h3 className="club-section-title">Nuestros goleadores y asistentes</h3>
      <EstadisticasForm key={partidoNuestro.id} partido={db.partidos.find((p) => p.id === partidoNuestro.id)!} />
    </div>}
  </div>;
}
