import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ListCard, ListRow } from './ListRow';
import { DirectivaFab } from './DirectivaFab';
import { GestionSheet } from './GestionPersonas';
import { dataService, runAction, type Jugador } from '@/lib/dataService';

export function PlantillaPanel() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState({ nombre: '', apodo: '', dorsal: '' });
  const cargar = () => runAction(async () => setJugadores(await dataService.jugadores()));
  useEffect(() => { void cargar(); }, []);
  return <section className="px-4 pt-4 pb-32">
    <h2 className="club-section-title">Plantilla</h2>
    <ListCard label="Jugadores">{jugadores.map(j => <ListRow key={j.id} leading={j.dorsal ?? '–'} name={j.apodo} subtitle={j.nombre} status={j.activo ? 'active' : 'off'} statusLabel={j.activo ? 'Activo' : 'Inactivo'} />)}</ListCard>
    <DirectivaFab label="Añadir jugador" onClick={() => setNuevo(true)} />
    <GestionSheet title="Añadir jugador" open={nuevo} onClose={() => setNuevo(false)}>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); void runAction(async () => { await dataService.crearJugador({ nombre: form.nombre || form.apodo, apodo: form.apodo, dorsal: form.dorsal ? Number(form.dorsal) : null }); setForm({ nombre: '', apodo: '', dorsal: '' }); setNuevo(false); await cargar(); }); }}>
        <label className="block text-body-sm">Apodo<input required maxLength={60} value={form.apodo} onChange={e => setForm({ ...form, apodo: e.target.value })} className="club-input mt-2 w-full p-3" /></label>
        <label className="block text-body-sm">Nombre<input maxLength={120} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="club-input mt-2 w-full p-3" /></label>
        <label className="block text-body-sm">Dorsal (opcional)<input type="number" min="0" step="1" value={form.dorsal} onChange={e => setForm({ ...form, dorsal: e.target.value })} className="club-input mt-2 w-full p-3" /></label>
        <Button type="submit">Añadir jugador</Button>
      </form>
    </GestionSheet>
  </section>;
}
