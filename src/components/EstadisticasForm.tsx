import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dataService, runAction, type EstadisticaJugador, type Jugador, type Partido } from '@/lib/dataService';

type Campo = 'goles' | 'asistencias' | 'amarillas';
const CAMPOS: [Campo, string][] = [['goles', 'Goles'], ['asistencias', 'Asistencias'], ['amarillas', 'Amarillas']];

export function EstadisticasForm({ partido }: { partido: Partido }) {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [filas, setFilas] = useState<Record<string, EstadisticaJugador>>({});
  const [busy, setBusy] = useState(false);
  const favor = (partido.esLocal ? partido.golesLocal : partido.golesVisitante) ?? 0;
  useEffect(() => { void runAction(async () => {
    const [js, es] = await Promise.all([dataService.jugadores(), dataService.estadisticasPartido(partido.id)]);
    setJugadores(js.filter(j => j.activo));
    setFilas(Object.fromEntries(es.map(e => [e.jugadorId, e])));
  }); }, [partido.id]);
  const fila = (id: string): EstadisticaJugador => filas[id] ?? { jugadorId: id, goles: 0, asistencias: 0, amarillas: 0, rojas: 0 };
  const total = Object.values(filas).reduce((n, f) => n + f.goles, 0);
  const cambiar = (id: string, c: Campo, d: number) => setFilas(prev => { const f = fila(id); return { ...prev, [id]: { ...f, [c]: Math.max(0, f[c] + d) } }; });
  return <section className="mt-6 border-t border-border pt-4">
    <h2 className="club-section-title">Goles y asistencias</h2>
    <p className="text-body-sm mt-1">Goles asignados: {total} de {favor}</p>
    <ul className="mt-3 space-y-3">{jugadores.map(j => <li key={j.id}>
      <p className="font-bold">{j.dorsal != null ? `${j.dorsal} · ` : ''}{j.apodo}</p>
      <div className="mt-1 grid grid-cols-3 gap-2">{CAMPOS.map(([c, label]) => <div key={c} className="text-body-sm">
        <span className="label-club">{label}</span>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="outline" aria-label={`Quitar ${label.toLowerCase()} a ${j.apodo}`} onClick={() => cambiar(j.id, c, -1)}><Minus /></Button>
          <span className="w-6 text-center font-bold">{fila(j.id)[c]}</span>
          <Button type="button" size="icon" variant="outline" aria-label={`Sumar ${label.toLowerCase()} a ${j.apodo}`} disabled={c === 'goles' && total >= favor} onClick={() => cambiar(j.id, c, 1)}><Plus /></Button>
        </div></div>)}</div>
    </li>)}</ul>
    <Button className="mt-4" disabled={busy || total > favor} onClick={() => runAction(async () => { setBusy(true); try { await dataService.guardarEstadisticas(partido.id, Object.values(filas)); } finally { setBusy(false); } })}>{busy ? 'Guardando…' : 'Guardar'}</Button>
  </section>;
}
