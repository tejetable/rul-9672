import {ListCard,ListRow} from './ListRow';
import {DirectivaFab} from './DirectivaFab';
import {GestionSheet} from './GestionPersonas';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Trash2, Bell } from "lucide-react";
import { dataService, type Aviso, useClubData, runAction } from "@/lib/dataService";

const PARA: Record<NonNullable<Aviso["para"]>, string> = { todos: "Todos", socias: "Socias/os", negocios: "Negocios" };
const TIPO: Record<Aviso["tipo"], string> = { club: "Club", ventaja: "Ventaja", otro: "Otro" };

export function ListaAvisos({ quien }: { quien: "socias" | "negocios" }) {
  const db = useClubData();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [selected,setSelected]=useState<Aviso|null>(null);
  useEffect(() => setAvisos(dataService.avisosPara(quien)), [quien, db]);
  return (
    <section className="px-4 pt-6">
      <h1 className="club-section-title">Avisos</h1>
            {avisos.length === 0 && <p className="mt-6 text-muted-foreground">Todavía no hay avisos.</p>}
      <ListCard label="Avisos" className="mt-6">{avisos.map(a=><ListRow key={a.id} leading={<Bell/>} name={a.titulo} subtitle={a.texto} chip={TIPO[a.tipo]} date={new Date(a.fecha).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'})} dateTime={a.fecha} onClick={()=>setSelected(a)}/>)}</ListCard>
      <GestionSheet title={selected?.titulo??'Aviso'} open={!!selected} onClose={()=>setSelected(null)}>{selected&&<p className="whitespace-pre-line">{selected.texto}</p>}</GestionSheet>
    </section>
  );
}

export function AvisosPanel() {
  const db = useClubData();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [selected,setSelected]=useState<Aviso|null>(null);
  const [form,setForm]=useState(false);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<Aviso["tipo"]>("club");
  const [para, setPara] = useState<NonNullable<Aviso["para"]>>("todos");
  const refrescar = () => setAvisos([...dataService.get().avisos].sort((a, b) => b.fecha.localeCompare(a.fecha)));
  useEffect(refrescar, [db]);

  const publicar = async () => {
    if (!titulo.trim() || !texto.trim()) return;
    await dataService.crearAviso({ titulo: titulo.trim(), texto: texto.trim(), tipo, para });
    setTitulo(""); setTexto(""); setForm(false); refrescar();
  };

  const chip = (on: boolean) => `club-button h-auto min-h-11 rounded-control px-3 text-body-sm font-bold ${on ? "bg-primary text-primary-foreground" : "btn-suave"}`;

  return (
    <section className="px-4 pb-32 pt-6">
      <h1 className="club-section-title">Avisos</h1>
      {!form&&<DirectivaFab label="Nuevo aviso" onClick={()=>setForm(true)}/>}
      <GestionSheet title="Nuevo aviso" open={form} onClose={()=>setForm(false)}>
      <h1 className="club-section-title mt-3">Nuevo aviso</h1>
            <label className="mt-3 block text-body-sm">Título<input aria-label="Título del aviso" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="mt-6 h-auto min-h-12 w-full rounded-panel club-input border-input px-4 font-bold" /></label>
      <label className="mt-3 block text-body-sm">Texto<textarea aria-label="Texto del aviso" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Qué queremos contar" rows={3} className="mt-3 w-full rounded-panel club-input border-input p-4" /></label>
      <p className="label-club mt-4">Tipo</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(TIPO) as Aviso["tipo"][]).map((k) => <Button variant="ghost" key={k} onClick={() => setTipo(k)} className={chip(tipo === k)}>{TIPO[k]}</Button>)}
      </div>
      <p className="label-club mt-4">Lo ven</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(PARA) as NonNullable<Aviso["para"]>[]).map((k) => <Button variant="ghost" key={k} onClick={() => setPara(k)} className={chip(para === k)}>{PARA[k]}</Button>)}
      </div>
      <Button variant="ghost" onClick={() => runAction(publicar)} disabled={!titulo.trim() || !texto.trim()} className="mt-6 h-auto min-h-14 w-full rounded-panel bg-primary font-black uppercase text-primary-foreground disabled:opacity-40">
        Publicar aviso
      </Button>

      </GestionSheet>
      <h2 className="label-club mt-6 text-muted-foreground">Avisos publicados</h2>
      <ListCard label="Avisos publicados" className="mt-2">{avisos.map(a=><ListRow key={a.id} leading={<Bell/>} name={a.titulo} subtitle={`${PARA[a.para??'todos']} · ${a.texto}`} chip={TIPO[a.tipo]} date={new Date(a.fecha).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'})} dateTime={a.fecha} onClick={()=>setSelected(a)}/>)}</ListCard>
      <GestionSheet title={selected?.titulo??'Aviso'} open={!!selected} onClose={()=>setSelected(null)}>{selected&&<><p className="label-club">{TIPO[selected.tipo]} · {PARA[selected.para??'todos']}</p><p className="whitespace-pre-line">{selected.texto}</p><Button variant="outline" onClick={()=>runAction(async()=>{await dataService.borrarAviso(selected.id);setSelected(null);refrescar();})}><Trash2/>Borrar aviso</Button></>}</GestionSheet>
    </section>
  );
}
