import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dataService, runAction } from '@/lib/dataService';
import { interpretarClasificacion, type FilaClasificacion } from '@/lib/clasificacion';

const NUMS: [keyof FilaClasificacion, string][] = [['posicion', 'Pos'], ['puntos', 'Pts'], ['pj', 'PJ'], ['g', 'G'], ['e', 'E'], ['p', 'P'], ['gf', 'GF'], ['gc', 'GC']];

export function ClasificacionForm({ jornada: inicial, onClose }: { jornada: number; onClose: () => void }) {
  const [jornada, setJornada] = useState(inicial);
  const [texto, setTexto] = useState('');
  const [filas, setFilas] = useState<FilaClasificacion[]>([]);
  const [aviso, setAviso] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { void runAction(async () => { const c = await dataService.clasificacionCopiada(); if (c) setFilas(c.filas); }); }, []);
  const set = (i: number, patch: Partial<FilaClasificacion>) => setFilas(f => f.map((x, k) => k === i ? { ...x, ...patch } : patch.esNuestro ? { ...x, esNuestro: false } : x));
  const nuestros = filas.filter(f => f.esNuestro).length;
  return <div className="space-y-3">
    <label className="block text-body-sm">Jornada<input type="number" min="1" value={jornada} onChange={e => setJornada(Number(e.target.value))} className="club-input mt-2 w-full p-3" /></label>
    <label className="block text-body-sm">Pega la clasificación<textarea rows={6} value={texto} onChange={e => setTexto(e.target.value)} placeholder="1  Equipo  Pts  PJ  G  E  P  GF  GC" className="club-input mt-2 w-full p-3" /></label>
    <Button type="button" variant="outline" onClick={() => { const r = interpretarClasificacion(texto); setAviso(r.length ? `${r.length} equipos leídos. Revisa la tabla antes de guardar.` : 'No se reconoció ninguna fila. Cada línea debe tener posición, equipo, puntos, PJ, G, E, P, GF y GC.'); if (r.length) setFilas(r); }}>Interpretar</Button>
    {aviso && <p className="text-body-sm">{aviso}</p>}
    {filas.length > 0 && <div className="overflow-x-auto"><table className="text-body-sm">
      <thead><tr><th>Nuestro</th><th className="text-left">Equipo</th>{NUMS.map(([, l]) => <th key={l}>{l}</th>)}<th /></tr></thead>
      <tbody>{filas.map((f, i) => <tr key={i}>
        <td><input type="radio" name="nuestro" aria-label={`${f.equipo} es nuestro equipo`} checked={f.esNuestro} onChange={() => set(i, { esNuestro: true })} /></td>
        <td><input aria-label="Equipo" value={f.equipo} onChange={e => set(i, { equipo: e.target.value })} className="club-input w-40 p-1" /></td>
        {NUMS.map(([k, l]) => <td key={k}><input aria-label={`${l} de ${f.equipo}`} type="number" min={k === 'puntos' ? undefined : 0} value={f[k] as number} onChange={e => set(i, { [k]: Number(e.target.value) })} className="club-input w-12 p-1" /></td>)}
        <td><Button type="button" size="icon" variant="ghost" aria-label={`Quitar ${f.equipo}`} onClick={() => setFilas(x => x.filter((_, k) => k !== i))}><Trash2 /></Button></td>
      </tr>)}</tbody></table></div>}
    <Button type="button" variant="ghost" onClick={() => setFilas(f => [...f, { posicion: f.length + 1, equipo: '', puntos: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, esNuestro: false }])}><Plus />Añadir fila</Button>
    {filas.length > 0 && nuestros !== 1 && <p role="alert" className="font-bold text-destructive">Marca qué fila es el R.U. Lucense.</p>}
    <div><Button disabled={busy || !filas.length || nuestros !== 1 || filas.some(f => !f.equipo.trim())} onClick={() => runAction(async () => { setBusy(true); try { await dataService.guardarClasificacion(jornada, filas.map(f => ({ ...f, equipo: f.equipo.trim() }))); onClose(); } finally { setBusy(false); } })}>{busy ? 'Guardando…' : 'Guardar clasificación'}</Button><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button></div>
  </div>;
}
