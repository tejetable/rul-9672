import { useEffect, useState } from 'react';
import { Minus, Plus, Upload } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { dataService, runAction, type EstadisticaJugador, type Jugador, type Partido } from '@/lib/dataService';
import { leerPiezaResultado } from '@/lib/pieza-resultado.functions';
import { aplicarLectura, resultadoCoincide, sumarLinea, type LecturaPieza, type LineaLeida } from '@/lib/pieza-resultado';

type Campo = 'goles' | 'asistencias' | 'amarillas';
const CAMPOS: [Campo, string][] = [['goles', 'Goles'], ['asistencias', 'Asistencias'], ['amarillas', 'Amarillas']];
const vacia = (id: string): EstadisticaJugador => ({ jugadorId: id, goles: 0, asistencias: 0, amarillas: 0, rojas: 0 });

export function EstadisticasForm({ partido }: { partido: Partido }) {
  const leer = useServerFn(leerPiezaResultado);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [filas, setFilas] = useState<Record<string, EstadisticaJugador>>({});
  const [sinEmparejar, setSinEmparejar] = useState<LineaLeida[]>([]);
  const [lectura, setLectura] = useState<LecturaPieza | null>(null);
  const [busy, setBusy] = useState(false), [leyendo, setLeyendo] = useState(false);
  const favor = (partido.esLocal ? partido.golesLocal : partido.golesVisitante) ?? 0;
  const contra = (partido.esLocal ? partido.golesVisitante : partido.golesLocal) ?? 0;
  useEffect(() => { void runAction(async () => {
    const [js, es] = await Promise.all([dataService.jugadores(), dataService.estadisticasPartido(partido.id)]);
    setJugadores(js);
    setFilas(Object.fromEntries(es.map(e => [e.jugadorId, e])));
  }); }, [partido.id]);
  const fila = (id: string) => filas[id] ?? vacia(id);
  const total = Object.values(filas).reduce((n, f) => n + f.goles, 0);
  const cambiar = (id: string, c: Campo, d: number) => setFilas(prev => { const f = prev[id] ?? vacia(id); return { ...prev, [id]: { ...f, [c]: Math.max(0, f[c] + d) } }; });
  const descuadre = lectura !== null && !resultadoCoincide(lectura, favor, contra);
  const pendientes = sinEmparejar.length > 0;
  const asignar = (i: number, j: Jugador) => { const l = sinEmparejar[i]; if (!l) return; setFilas(prev => ({ ...prev, [j.id]: sumarLinea(prev[j.id] ?? vacia(j.id), l) })); setSinEmparejar(s => s.filter((_, k) => k !== i)); };
  const subir = (file: File) => runAction(async () => {
    setLeyendo(true);
    try {
      const path = await dataService.subirPiezaResultado(partido.id, file);
      const r = await leer({ data: { path } });
      const app = aplicarLectura(jugadores, r);
      setFilas(app.filas); setSinEmparejar(app.sinEmparejar); setLectura(r);
    } finally { setLeyendo(false); }
  });
  const activos = jugadores.filter(j => j.activo || filas[j.id]);
  return <section className="mt-6 border-t border-border pt-4">
    <h2 className="club-section-title">Goles y asistencias</h2>
    <label className="mt-3 inline-flex">
      <input type="file" accept="image/jpeg,image/png" className="sr-only" disabled={leyendo} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) subir(f); }} />
      <Button asChild variant="outline"><span><Upload />{leyendo ? 'Leyendo la pieza…' : 'Subir pieza de resultado'}</span></Button>
    </label>
    {lectura && <p className="text-body-sm mt-2">Datos leídos de la pieza. Revísalos antes de guardar.</p>}
    {descuadre && <p role="alert" className="mt-2 font-bold text-destructive">La pieza dice {lectura?.golesRul} – {lectura?.golesRival}, pero el partido tiene {favor} – {contra}. Corrige el resultado del partido o los datos antes de guardar. <button type="button" className="underline" onClick={() => setLectura(null)}>El resultado del partido es correcto</button></p>}
    <p className="text-body-sm mt-2">Goles asignados: {total} de {favor}</p>
    {sinEmparejar.map((l, i) => <div key={`${l.nombre}-${i}`} className="mt-3 text-body-sm">
      <p className="font-bold">Sin emparejar: {l.nombre}</p>
      <p>{[l.goles && `${l.goles} G`, l.asistencias && `${l.asistencias} A`, l.amarillas && `${l.amarillas} TA`, l.rojas && `${l.rojas} TR`].filter(Boolean).join(' · ')}</p>
      <select aria-label={`Jugador para ${l.nombre}`} className="club-input mt-1 w-full p-2" value="" onChange={e => {
        const v = e.target.value;
        if (v === '__crear') void runAction(async () => { await dataService.crearJugador({ nombre: l.nombre, apodo: l.nombre, dorsal: null }); const js = await dataService.jugadores(); setJugadores(js); const nuevo = js.find(j => j.apodo === l.nombre.trim()); if (nuevo) asignar(i, nuevo); });
        else if (v === '__ignorar') setSinEmparejar(s => s.filter((_, k) => k !== i));
        else { const j = jugadores.find(x => x.id === v); if (j) asignar(i, j); }
      }}>
        <option value="" disabled>Elegir jugador…</option>
        {jugadores.map(j => <option key={j.id} value={j.id}>{j.dorsal != null ? `${j.dorsal} · ` : ''}{j.apodo}</option>)}
        <option value="__crear">Crear jugador «{l.nombre}»</option>
        <option value="__ignorar">Descartar</option>
      </select>
    </div>)}
    <ul className="mt-3 space-y-3">{activos.map(j => <li key={j.id}>
      <p className="font-bold">{j.dorsal != null ? `${j.dorsal} · ` : ''}{j.apodo}</p>
      <div className="mt-1 grid grid-cols-3 gap-2">{CAMPOS.map(([c, label]) => <div key={c} className="text-body-sm">
        <span className="label-club">{label}</span>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="outline" aria-label={`Quitar ${label.toLowerCase()} a ${j.apodo}`} onClick={() => cambiar(j.id, c, -1)}><Minus /></Button>
          <span className="w-6 text-center font-bold">{fila(j.id)[c]}</span>
          <Button type="button" size="icon" variant="outline" aria-label={`Sumar ${label.toLowerCase()} a ${j.apodo}`} disabled={c === 'goles' && total >= favor} onClick={() => cambiar(j.id, c, 1)}><Plus /></Button>
        </div></div>)}</div>
    </li>)}</ul>
    {total > favor && <p role="alert" className="mt-3 font-bold text-destructive">Hay {total} goles asignados y el partido tiene {favor}.</p>}
    {pendientes && <p className="mt-3 text-body-sm">Empareja o descarta los nombres sin emparejar para guardar.</p>}
    <Button className="mt-4" disabled={busy || leyendo || total > favor || descuadre || pendientes} onClick={() => runAction(async () => { setBusy(true); try { await dataService.guardarEstadisticas(partido.id, Object.values(filas)); setLectura(null); } finally { setBusy(false); } })}>{busy ? 'Guardando…' : 'Guardar'}</Button>
  </section>;
}
