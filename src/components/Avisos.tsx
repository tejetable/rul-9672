import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { dataService, type Aviso, useClubData, runAction } from "@/lib/dataService";

const PARA: Record<NonNullable<Aviso["para"]>, string> = { todos: "Todos", socias: "Socias/os", negocios: "Negocios" };
const TIPO: Record<Aviso["tipo"], string> = { club: "Club", partido: "Partido", ventaja: "Ventaja" };

export function ListaAvisos({ quien }: { quien: "socias" | "negocios" }) {
  const db = useClubData();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  useEffect(() => setAvisos(dataService.avisosPara(quien)), [quien, db]);
  return (
    <section className="px-5 pt-6">
      <h1 className="title-club text-heading">Avisos</h1>
            {avisos.length === 0 && <p className="mt-6 text-muted-foreground">Todavía no hay avisos.</p>}
      <ul className="mt-6 space-y-3">
        {avisos.map((a) => (
          <li key={a.id} className="rounded-panel bg-surface p-4">
            <p className="label-club text-accent">{TIPO[a.tipo]} · {new Date(a.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</p>
            <p className="mt-1 font-black">{a.titulo}</p>
            <p className="mt-1 whitespace-pre-line">{a.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AvisosPanel() {
  const db = useClubData();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<Aviso["tipo"]>("club");
  const [para, setPara] = useState<NonNullable<Aviso["para"]>>("todos");
  const refrescar = () => setAvisos([...dataService.get().avisos].sort((a, b) => b.fecha.localeCompare(a.fecha)));
  useEffect(refrescar, [db]);

  const publicar = async () => {
    if (!titulo.trim() || !texto.trim()) return;
    await dataService.crearAviso({ titulo: titulo.trim(), texto: texto.trim(), tipo, para });
    setTitulo(""); setTexto(""); refrescar();
  };

  const chip = (on: boolean) => `club-button h-auto min-h-11 rounded-control px-3 text-body-sm font-bold ${on ? "bg-primary text-primary-foreground" : "btn-suave"}`;

  return (
    <section className="px-5 pb-32 pt-6">
      <span className="club-chip">Directiva</span>
      <h1 className="club-title mt-2">Nuevo aviso</h1>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="mt-5 h-auto min-h-12 w-full rounded-panel club-input border-input px-4 font-bold" />
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Qué queremos contar" rows={3} className="mt-3 w-full rounded-panel club-input border-input p-4" />
      <p className="label-club mt-4">Tipo</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(TIPO) as Aviso["tipo"][]).map((k) => <Button variant="ghost" key={k} onClick={() => setTipo(k)} className={chip(tipo === k)}>{TIPO[k]}</Button>)}
      </div>
      <p className="label-club mt-4">Lo ven</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(PARA) as NonNullable<Aviso["para"]>[]).map((k) => <Button variant="ghost" key={k} onClick={() => setPara(k)} className={chip(para === k)}>{PARA[k]}</Button>)}
      </div>
      <Button variant="ghost" onClick={() => runAction(publicar)} disabled={!titulo.trim() || !texto.trim()} className="mt-5 h-auto min-h-14 w-full rounded-panel bg-primary font-black uppercase text-primary-foreground disabled:opacity-40">
        Publicar aviso
      </Button>

      <h2 className="label-club mt-8 text-muted-foreground">Avisos publicados</h2>
      <ul className="mt-2 space-y-3">
        {avisos.map((a) => (
          <li key={a.id} className="flex items-start gap-3 rounded-panel bg-surface p-4">
            <div className="flex-1">
              <p className="label-club text-accent">{TIPO[a.tipo]} · {PARA[a.para ?? "todos"]}</p>
              <p className="mt-1 font-black">{a.titulo}</p>
              <p className="mt-1 text-body-sm">{a.texto}</p>
            </div>
            <Button variant="ghost" onClick={() => { runAction(async () => { await dataService.borrarAviso(a.id); refrescar(); }); }} aria-label="Borrar aviso" className="flex size-11 items-center justify-center">
              <Trash2 size={18} strokeWidth={1.75} />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
