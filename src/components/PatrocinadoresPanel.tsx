import {ListCard,ListRow} from './ListRow';
import {InitialPassword,PersonPassword} from './PasswordManagement';
import {emailSchema} from '@/lib/email-validation';
import {useServerFn} from '@tanstack/react-start';
import {setClubUserPassword} from '@/lib/password.functions';
import {passwordSchema} from '@/lib/password-access';
import { BajaForm } from "@/components/BajaForm";
import { adaptarStats, emptyStats, type ClubSummary } from "@/lib/club-stats";
import { categoriasVisitas } from "@/lib/visitas";
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
    ["Visitas", summary.visitas],
    ["Soci@s en activo", summary.socios_activos],
    ["Activos semana", summary.activos_semana],
  ] as const;
  if(preview)return <NegocioApp onExit={()=>runAction(async()=>{await dataService.salirNegocioPrueba();setPreview(false);})}/>;
  return (
    <section className="px-4 pb-28 pt-4">
      <div className="club-tabs grid-cols-3">
        {([["mes", "Este mes"], ["90", "90 días"], ["temporada", "Temporada"]] as const).map(([id, l]) => (
          <Button variant="ghost" key={id} onClick={() => setRango(id)} className={`h-auto min-h-11 rounded-control text-body-sm font-bold ${rango === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</Button>
        ))}
      </div>
      <div className="month-hero mt-4">
        <p className="month-hero-label">Para los patrocinadores</p>
        <p className="month-hero-num">{summary.nuevas_verificadas}</p>
        <p className="month-hero-unit">{summary.nuevas_verificadas === 1 ? "persona nueva con carnet" : "personas nuevas con carnet"}</p>
      </div>
      <div className="surface-card month-stats mt-3">
        {club.map(([l, n]) => (
          <div key={l}><p className="month-stat-num">{n}</p><p className="month-stat-label">{l}</p></div>
        ))}
      </div>
      
      <GestionSheet title="Nuevo patrocinador" open={form} onClose={()=>setForm(false)}>{form&&<NuevoPatrocinador onDone={() => { setForm(false); setV((x) => x + 1); }}/>}</GestionSheet>
      {!form&&!selected&&!baja&&<DirectivaFab label="Nuevo patrocinador" onClick={()=>setForm(true)}/>}
      {baja && <BajaForm negocio onCancel={() => setBaja(null)} onSave={async (fecha,motivo,detalle) => {await dataService.bajaPatrocinador(baja,fecha,motivo,detalle);setBaja(null);}} />}
      <h2 className="club-section-title mt-6">Negocios</h2>
      <p className="sponsor-list-note">Ordenados por el que va más lejos del objetivo: 5 personas nuevas con carnet en 90 días.</p>
      <ul className="surface-card sponsor-list" aria-label="Patrocinadores">{[...db.patrocinadores].sort((x,y)=>Number(!!x.esPrueba)-Number(!!y.esPrueba)||Number(y.activo)-Number(x.activo)||((summary.patrocinadores[x.id]?.objetivo_nuevas_90d??0)-(summary.patrocinadores[y.id]?.objetivo_nuevas_90d??0))||x.nombre.localeCompare(y.nombre)).map(p=>{const raw=summary.patrocinadores[p.id]??emptyStats;const prog=Math.min(5,raw.objetivo_nuevas_90d);return <li key={p.id}><button type="button" className={`sponsor-row ${p.activo?'':'is-off'}`} onClick={()=>setSelected(p.id)}>
        <span className="min-w-0 flex-1"><span className="sponsor-name">{p.nombre}</span><span className="sponsor-meta">{p.activo?p.categoria:'De baja'} · {p.esPrueba?'Prueba':`${raw.visitas} ${raw.visitas===1?'visita':'visitas'}`}</span>
          {!p.esPrueba&&<span className="sponsor-bar" role="img" aria-label={`${prog} de 5 personas nuevas con carnet en 90 días`}><span style={{width:`${prog*20}%`}}/></span>}</span>
        {!p.esPrueba&&<span className="sponsor-goal"><b>{prog}</b>/5</span>}
      </button></li>;})}</ul>
      <details className="surface-card fold-card mt-6"><summary>Bajas ({["no ve retorno","precio","cierre del negocio","otro"].reduce((t,m)=>t+(summary.bajas[m]??0),0)})</summary><div className="grid grid-cols-2 gap-2 px-4 pb-4">{["no ve retorno","precio","cierre del negocio","otro"].map(m => <div key={m} className="rounded-control bg-[color-mix(in_oklab,var(--verde)_5%,transparent)] p-3"><p className="font-black">{summary.bajas[m] ?? 0}</p><p className="text-body-sm">{m}</p></div>)}</div></details>
      <GestionSheet title={pat?.nombre??'Negocio'} open={!!pat} onClose={()=>setSelected(null)}>{pat&&(()=>{const raw=summary.patrocinadores[pat.id]??emptyStats;const cat=categoriasVisitas(raw);const dir=pat.direccion?.trim();const sinDir=!dir||/pendiente/i.test(dir);const pruebas=db.visitas.filter(v=>v.patrocinadorId===pat.id&&v.esPrueba).length;return <>
        <p className="sponsor-sheet-meta">{pat.categoria}{sinDir?<span className="sponsor-missing"> · Falta la dirección</span>:<> · {dir}</>}</p>
        <div className="sponsor-goal-card"><p className="sponsor-goal-title">Objetivo · últimos 90 días</p><p className="sponsor-goal-big"><b>{Math.min(5,raw.objetivo_nuevas_90d)}</b> de 5 personas nuevas con carnet</p><span className="sponsor-bar"><span style={{width:`${Math.min(5,raw.objetivo_nuevas_90d)*20}%`}}/></span></div>
        <div className="sponsor-cats">{([["Nuevas","con carnet",cat.nuevas],["Ya clientes","con carnet",cat.yaClientes],["Sin carnet","declaradas",cat.sinCarnet]] as const).map(([l,sub,n])=><div key={l}><p className="month-stat-num">{n}</p><p className="month-stat-label">{l}</p><p className="month-stat-sub">{sub}</p></div>)}</div>
        <p className="month-total">{cat.total} {cat.total===1?'visita':'visitas'} en el periodo elegido</p>
        <h3 className="club-section-title mt-6">Acceso del negocio</h3>
        <EmailNegocio id={pat.id} email={pat.emailAcceso??''}/><ContactoNegocio key={pat.id} pat={pat}/><PersonPassword email={pat.emailAcceso??''}/>
        {dataService.esSuper()&&<><h3 className="club-section-title mt-6">Pruebas</h3><Button disabled={!pat.activo} onClick={()=>enter(pat.id)}><LogIn/>Acceder como este negocio</Button><p className="text-body-sm text-muted-foreground">{pruebas} {pruebas===1?'visita':'visitas'} de prueba (no cuentan en ninguna cifra)</p>{pruebas>0&&<Button variant="outline" onClick={()=>{if(window.confirm('¿Borrar todas las visitas de prueba de este negocio?'))runAction(()=>dataService.borrarVisitasPrueba(pat.id));}}>Borrar visitas de prueba</Button>}</>}
        {pat.activo&&<><h3 className="club-section-title mt-6">Zona de riesgo</h3><Button variant="outline" className="sponsor-danger" onClick={()=>{setBaja(pat.id);setSelected(null);}}>Dar de baja este negocio</Button></>}
      </>;})()}</GestionSheet>
      <Button variant="outline" onClick={exportarCSV} className="mt-6 flex h-auto min-h-11 w-full items-center justify-center gap-2 rounded-control font-bold">
        <Download size={18} strokeWidth={1.75} /> Exportar CSV
      </Button>
    </section>
  );
}


function NuevoPatrocinador({ onDone }: { onDone: () => void }) {
 const savePassword=useServerFn(setClubUserPassword);const [initial,setInitial]=useState('');
  const [f, setF] = useState({ importe: "", nombre: "", categoria: "", direccion: "", emailAcceso: "", telefono: "", horario: "", web: "", logoUrl: "", titulo: "", descripcion: "", condiciones: "Enseña tu carnet en el mostrador." });
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
      { nombre: f.nombre.trim(), categoria: f.categoria.trim(), direccion: f.direccion.trim() || "[Dirección pendiente]", emailAcceso: checked.data, telefono: f.telefono.trim(), horario: f.horario.trim(), web: f.web.trim(), logoUrl: f.logoUrl, importePatrocinio:Number(f.importe)||0 },
      { titulo: f.titulo.trim(), descripcion: f.descripcion.trim(), condiciones: f.condiciones.trim() },
    );
    if (r === "pin_usado") return setErr("No se pudo guardar.");
    if(dataService.esSuper())await savePassword({data:{email:checked.data,password:initial,mode:'initial'}});
    onDone();
  };
  const inp = "mt-1 h-auto min-h-12 w-full rounded-control club-input border-input px-3";
  const campo = (k: keyof typeof f, l: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <label className="mt-3 block"><span className="label-club">{l}</span><input value={f[k]} onChange={set(k)} className={inp} {...extra} /></label>
  );
  return (
    <div className="mt-4 border-y border-border py-4">
      {campo("nombre", "Nombre")}
      {campo("categoria", "Categoría")}
      <label className="mt-3 block"><span className="label-club">Logo</span><input type="file" accept="image/*" onChange={logo} className="mt-1 block w-full text-body-sm" /></label>
      {f.logoUrl && <img src={f.logoUrl} alt="Logo del patrocinador" className="mt-2 h-14 w-auto object-contain" />}
      {campo("direccion", "Dirección")}
      {campo("telefono", "Teléfono (opcional)", {type:"tel",maxLength:30})}
      {campo("horario", "Horario (opcional)", {maxLength:300})}
      {campo("web", "Web (opcional)", {type:"url",maxLength:300,placeholder:"https://"})}
      {campo("emailAcceso", "Email de acceso del negocio", {type:"email",required:true})}
      <InitialPassword email={f.emailAcceso} value={initial} onChange={setInitial}/>{campo("importe", "Importe patrocinio (€)", {type:"number",min:0,step:"0.01"})}
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

function ContactoNegocio({pat}:{pat:{id:string;telefono?:string|null;horario?:string|null;web?:string|null}}){const [c,setC]=useState({telefono:pat.telefono??'',horario:pat.horario??'',web:pat.web??''});return <form className="mt-3 space-y-2" onSubmit={e=>{e.preventDefault();runAction(()=>dataService.contactoPatrocinador(pat.id,c));}}><label className="block label-club">Teléfono<input type="tel" maxLength={30} value={c.telefono} onChange={e=>setC({...c,telefono:e.target.value})} className="club-input mt-2 w-full p-3"/></label><label className="block label-club">Horario<input maxLength={300} value={c.horario} onChange={e=>setC({...c,horario:e.target.value})} className="club-input mt-2 w-full p-3"/></label><label className="block label-club">Web<input type="url" maxLength={300} placeholder="https://" value={c.web} onChange={e=>setC({...c,web:e.target.value})} className="club-input mt-2 w-full p-3"/></label><Button type="submit" variant="outline">Guardar contacto</Button></form>;}
