import {ListCard,ListRow} from './ListRow';
import {InitialPassword,PersonPassword} from './PasswordManagement';
import {emailSchema} from '@/lib/email-validation';
import {useServerFn} from '@tanstack/react-start';
import {setClubUserPassword} from '@/lib/password.functions';
import {passwordSchema} from '@/lib/password-access';
import { BajaForm } from "@/components/BajaForm";
import { adaptarStats, emptyStats, type ClubSummary } from "@/lib/club-stats";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Download, LogIn, Store } from "lucide-react";
import {DirectivaFab} from './DirectivaFab';
import {GestionSheet} from './GestionPersonas';
import {NegocioApp} from './NegocioApp';
import { dataService, useClubData, runAction } from "@/lib/dataService";
import { type Rango } from "@/lib/visitas";

function exportarCSV() {
  const db = dataService.get();
  const head = ["fechaHora", "patrocinador", "numeroSocio", "nombre", "origen", "tipoCliente", "repiteViaClub", "verificada", "anulada"];
  const rows = db.visitas.filter(v=>!v.esPrueba).map((v) => [
    v.fechaHora,
    db.patrocinadores.find((p) => p.id === v.patrocinadorId)?.nombre ?? "",
    v.numeroSocio ?? "",
    db.socios.find((s) => s.id === v.socioId)?.nombre ?? "",
    v.origen,
    v.tipoCliente,
    v.repiteViaClub,
    v.verificada,
    v.anulada,
  ]);
  const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "visitas-ru-lucense.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function PatrocinadoresPanel() {
  const [, setV] = useState(0);
  const [rango, setRango] = useState<Rango>("mes");
  const [form, setForm] = useState(false);
  const db = useClubData();
  const [selected,setSelected]=useState<string|null>(null);
  const [preview,setPreview]=useState(false);
  const pat=db.patrocinadores.find(p=>p.id===selected);
  const enter=(id:string)=>runAction(async()=>{await dataService.accederComoNegocio(id);setSelected(id);setPreview(true);});
  const [baja, setBaja] = useState<string | null>(null);
  const [summary, setSummary] = useState<ClubSummary>({socios_activos:0,activos_semana:0,visitas:0,nuevas_verificadas:0,patrocinadores:{},bajas:{}});
  useEffect(() => { runAction(async () => setSummary(await dataService.statsClub(rango))); }, [db, rango]);
  const club = [
    ["Socias/os activos", summary.socios_activos],
    ["Activos esta semana", summary.activos_semana],
    ["Visitas del mes", summary.visitas],
  ] as const;
  if(preview)return <NegocioApp onExit={()=>runAction(async()=>{await dataService.salirNegocioPrueba();setPreview(false);})}/>;
  return (
    <section className="px-4 pb-28 pt-4">
            <div className="mt-6 grid grid-cols-2 gap-3">
        {club.map(([l, n]) => (
          <div key={l} className="rounded-panel bg-surface p-4">
            <p className="text-heading font-black leading-none">{n}</p>
            <p className="label-club mt-2 text-[11px] text-muted-foreground">{l}</p>
          </div>
        ))}
        <div className="rounded-panel bg-primary p-4 text-primary-foreground">
          <p className="text-heading font-black leading-none text-gold">{summary.nuevas_verificadas}</p>
          <p className="label-club mt-2 text-[11px] opacity-80">Clientas nuevas del mes (verificadas)</p>
        </div>
      </div>
      <div className="mt-6 club-tabs grid-cols-3">
        {([["mes", "Este mes"], ["90", "90 días"], ["temporada", "Temporada"]] as const).map(([id, l]) => (
          <Button variant="ghost" key={id} onClick={() => setRango(id)} className={`h-auto min-h-11 rounded-control text-body-sm font-bold ${rango === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</Button>
        ))}
      </div>

      <span className="label-club mt-3 inline-block rounded-full border border-dashed border-primary px-3 py-1 text-muted-foreground">Datos de demostración</span>
      <GestionSheet title="Nuevo patrocinador" open={form} onClose={()=>setForm(false)}>{form&&<NuevoPatrocinador onDone={() => { setForm(false); setV((x) => x + 1); }}/>}</GestionSheet>
      {!form&&!selected&&!baja&&<DirectivaFab label="Nuevo patrocinador" onClick={()=>setForm(true)}/>}
      {baja && <BajaForm negocio onCancel={() => setBaja(null)} onSave={async (fecha,motivo,detalle) => {await dataService.bajaPatrocinador(baja,fecha,motivo,detalle);setBaja(null);}} />}
      <h2 className="club-section-title mt-6">Bajas</h2><div className="mt-2 grid grid-cols-2 gap-2">{["no ve retorno","precio","cierre del negocio","otro"].map(m => <div key={m} className="rounded-panel bg-surface p-4"><p className="font-black">{summary.bajas[m] ?? 0}</p><p className="text-body-sm">{m}</p></div>)}</div>
      <ListCard label="Patrocinadores" className="mt-6">{db.patrocinadores.map(p=>{const stats=adaptarStats(summary.patrocinadores[p.id]??emptyStats);return <ListRow key={p.id} leading={<Store/>} name={p.nombre} subtitle={p.emailAcceso||p.categoria} date={`${stats.visitas} visitas`} status={p.activo?'active':'off'} onClick={()=>setSelected(p.id)}/>;})}</ListCard>
      <GestionSheet title={pat?.nombre??'Negocio'} open={!!pat} onClose={()=>setSelected(null)}>{pat&&<><p>{pat.categoria}</p><p>{pat.direccion}</p><div className="grid grid-cols-2 gap-3">{(()=>{const raw=summary.patrocinadores[pat.id]??emptyStats;const stats=adaptarStats(raw);return [["Visitas",stats.visitas],["Nuevas verif.",stats.nuevasVerificadas],["Nuevas decl.",stats.nuevasDeclaradas],["Repiten",stats.repiten],["% nuevas",`${stats.pctNuevas}%`],["90 días",`${raw.objetivo_nuevas_90d}/5`]].map(([label,value])=><div key={label} className="py-2"><p className="font-black">{value}</p><p className="label-club">{label}</p></div>);})()}</div><EmailNegocio id={pat.id} email={pat.emailAcceso??''}/>{pat.activo&&<Button variant="outline" onClick={()=>{setBaja(pat.id);setSelected(null);}}>Desactivar</Button>}<PersonPassword email={pat.emailAcceso??''}/>{dataService.esSuper()&&<><Button disabled={!pat.activo} onClick={()=>enter(pat.id)}><LogIn/>Acceder como este negocio</Button><p>{db.visitas.filter(v=>v.patrocinadorId===pat.id&&v.esPrueba).length} visitas de prueba</p><Button variant="outline" onClick={()=>{if(window.confirm('¿Borrar todas las visitas de prueba de este negocio?'))runAction(()=>dataService.borrarVisitasPrueba(pat.id));}}>Borrar visitas de prueba</Button></>}</>}</GestionSheet>
      <Button variant="ghost" onClick={exportarCSV} className="mt-6 flex h-auto min-h-12 w-full items-center justify-center gap-2 rounded-panel bg-primary font-black uppercase text-primary-foreground">
        <Download size={18} strokeWidth={1.75} /> Exportar CSV
      </Button>
    </section>
  );
}


function NuevoPatrocinador({ onDone }: { onDone: () => void }) {
 const savePassword=useServerFn(setClubUserPassword);const [initial,setInitial]=useState('');
  const [f, setF] = useState({ importe: "", nombre: "", categoria: "", direccion: "", emailAcceso: "", logoUrl: "", titulo: "", descripcion: "", condiciones: "Enseña tu carnet en el mostrador." });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const logo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setF((x) => ({ ...x, logoUrl: String(r.result) }));
    r.readAsDataURL(file);
  };
  const guardar = async () => {
    if (!f.nombre.trim() || !f.titulo.trim()) return setErr("Pon al menos el nombre y la ventaja.");
    const checked=emailSchema.safeParse(f.emailAcceso);if(!checked.success)return setErr("Dirección de email no válida.");if(initial&&!passwordSchema.safeParse(initial).success)return setErr("Usa al menos 8 caracteres.");
    const r = await dataService.crearPatrocinador(
      { nombre: f.nombre.trim(), categoria: f.categoria.trim(), direccion: f.direccion.trim() || "[Dirección pendiente]", emailAcceso: checked.data, logoUrl: f.logoUrl, importePatrocinio:Number(f.importe)||0 },
      { titulo: f.titulo.trim(), descripcion: f.descripcion.trim(), condiciones: f.condiciones.trim() },
    );
    if (r === "pin_usado") return setErr("No se pudo guardar.");
    if(initial&&dataService.esSuper())await savePassword({data:{email:checked.data,password:initial,mode:'initial'}});
    onDone();
  };
  const inp = "mt-1 h-auto min-h-12 w-full rounded-control club-input border-input px-3";
  const campo = (k: keyof typeof f, l: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <label className="mt-3 block"><span className="label-club">{l}</span><input value={f[k]} onChange={set(k)} className={inp} {...extra} /></label>
  );
  return (
    <div className="mt-4 border-y border-border py-4">
      <p className="font-black">Nuevo patrocinador</p>
      {campo("nombre", "Nombre")}
      {campo("categoria", "Categoría")}
      <label className="mt-3 block"><span className="label-club">Logo</span><input type="file" accept="image/*" onChange={logo} className="mt-1 block w-full text-body-sm" /></label>
      {f.logoUrl && <img src={f.logoUrl} alt="Logo del patrocinador" className="mt-2 h-14 w-auto object-contain" />}
      {campo("direccion", "Dirección")}
      {campo("emailAcceso", "Email de acceso del negocio", {type:"email",required:true})}
      <InitialPassword value={initial} onChange={setInitial}/>{campo("importe", "Importe patrocinio (€)", {type:"number",min:0,step:"0.01"})}
      <p className="label-club mt-6 text-accent">Ventaja</p>
      {campo("titulo", "Título")}
      {campo("descripcion", "Descripción")}
      {campo("condiciones", "Condiciones")}
      {err && <p className="mt-3 text-body-sm font-bold">{err}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="ghost" onClick={() => runAction(guardar)} className="h-auto min-h-12 rounded-panel bg-primary font-black uppercase text-primary-foreground">Guardar</Button>
        <Button variant="ghost" onClick={onDone} className="h-auto min-h-12 rounded-panel btn-suave font-black uppercase">Cancelar</Button>
      </div>
    </div>
  );
}

function EmailNegocio({id,email}:{id:string;email:string}){const [value,setValue]=useState(email);return <form className="mt-3 space-y-2" onSubmit={e=>{e.preventDefault();runAction(()=>dataService.emailNegocio(id,value));}}><label className="block label-club">Email de acceso del negocio<input required type="email" value={value} onChange={e=>setValue(e.target.value)} className="club-input mt-2 w-full p-3"/></label><Button type="submit" variant="outline">Guardar acceso</Button></form>;}
