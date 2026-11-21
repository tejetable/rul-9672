import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { dataService, runAction, type Jugador, type Partido } from '@/lib/dataService';
import { leerPiezaConvocatoria } from '@/lib/pieza-resultado.functions';
import { emparejarJugador } from '@/lib/pieza-resultado';

export function ConvocatoriaForm({ partido }: { partido: Partido }) {
  const leer = useServerFn(leerPiezaConvocatoria);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [imagenPath, setImagenPath] = useState<string | null>(null);
  const [publicada, setPublicada] = useState(false);
  const [sinEmparejar, setSinEmparejar] = useState<string[]>([]);
  const [leyendo, setLeyendo] = useState(false), [busy, setBusy] = useState(false), [leida, setLeida] = useState(false);
  useEffect(() => { void runAction(async () => {
    const [js, c] = await Promise.all([dataService.jugadores(), dataService.convocatoriaGestion(partido.id)]);
    setJugadores(js); setMarcados(c.jugadores); setImagenPath(c.imagenPath); setPublicada(c.publicada);
  }); }, [partido.id]);
  const lista = jugadores.filter(j => j.activo || marcados.includes(j.id)).sort((a, b) => (a.dorsal ?? 999) - (b.dorsal ?? 999));
  const orden = (ids: string[]) => lista.map(j => j.id).filter(id => ids.includes(id));
  const toggle = (id: string) => setMarcados(m => m.includes(id) ? m.filter(x => x !== id) : orden([...m, id]));
  const subir = (file: File) => runAction(async () => {
    setLeyendo(true);
    try {
      const path = await dataService.subirPiezaConvocatoria(partido.id, file);
      setImagenPath(path);
      const r = await leer({ data: { path } });
      const ids: string[] = [], fuera: string[] = [];
      for (const n of r.nombres) { const j = emparejarJugador(jugadores, n); if (j) { if (!ids.includes(j.id)) ids.push(j.id); } else fuera.push(n); }
      setMarcados(ids); setSinEmparejar(fuera); setLeida(true);
    } finally { setLeyendo(false); }
  });
  return <section className="mt-6 border-t border-border pt-4">
    <h2 className="club-section-title">Convocatoria</h2>
    <label className="mt-3 inline-flex">
      <input type="file" accept="image/jpeg,image/png" className="sr-only" disabled={leyendo} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) subir(f); }} />
      <Button asChild variant="outline"><span><Upload />{leyendo ? 'Leyendo la pieza…' : 'Subir pieza de convocatoria'}</span></Button>
    </label>
    {leida && <p className="text-body-sm mt-2">Convocados marcados desde la pieza. Revísalos antes de guardar.</p>}
    {sinEmparejar.length > 0 && <p className="text-body-sm mt-2">Sin emparejar: {sinEmparejar.join(', ')}</p>}
    <p className="text-body-sm mt-2">{marcados.length} convocados</p>
    <ul className="mt-2 space-y-2">{lista.map(j => <li key={j.id}><label className="flex items-center gap-2"><input type="checkbox" checked={marcados.includes(j.id)} onChange={() => toggle(j.id)} />{j.dorsal != null ? `${j.dorsal} · ` : ''}{j.apodo}</label></li>)}</ul>
    <label className="mt-4 flex items-center gap-2 text-body-sm"><Switch checked={publicada} onCheckedChange={setPublicada} />Publicar convocatoria</label>
    <Button className="mt-4" disabled={busy || leyendo} onClick={() => runAction(async () => { setBusy(true); try { await dataService.guardarConvocatoria(partido.id, { jugadores: orden(marcados), imagenPath, publicada }); setLeida(false); setSinEmparejar([]); } finally { setBusy(false); } })}>{busy ? 'Guardando…' : 'Guardar convocatoria'}</Button>
  </section>;
}
