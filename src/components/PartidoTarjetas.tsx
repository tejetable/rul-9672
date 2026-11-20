import {Link} from "@tanstack/react-router";
import {useDriveGallery} from "@/hooks/use-drive-gallery";
import {dataService,useClubData} from "@/lib/dataService";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Twitch, MapPin, Navigation } from "lucide-react";
import escudo from "@/assets/escudo-rul-transparente.png.asset.json";
import { Button } from "@/components/ui/button";
import type { Partido } from "@/lib/dataService";
import { fechaPartidoTexto, golesLiga, proximosCalendario, textoDiferencia, rachaCronologica, directoPartido,minutosHastaPartido, cuentaPartido, inicioPartido, proximoPartido, partidoEnCurso, resultadoPartido } from "@/lib/partidos";

function LugoSilueta() {
  return <svg className="fixture-silhouette" viewBox="0 0 260 130" aria-hidden="true" fill="currentColor">
    <path d="M0 130V96h12V87h13v9h16V87h13v9h17V87h13v9h17V87h13v9h17V87h13v9h17V87h13v9h17V87h13v9h17v34zM128 100V47h7V31h6V19h5V7h3v12h5v12h6v16h7v53zm62 0V47h7V31h6V19h5V7h3v12h5v12h6v16h7v53zM163 103V57l16-16 16 16v46z" />
    <path d="M20 130V82h5V72h26v10h5v48zm190 0V82h5V72h26v10h5v48z" />
  </svg>;
}

export function ProximoPartido({ partido }: { partido: Partido }) {
  useClubData();
  const [ahora, setAhora] = useState<Date | null>(null);
  useEffect(() => {
    setAhora(new Date());
    const timer = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const inicio = inicioPartido(partido);
  const cuenta = inicio && ahora ? cuentaPartido(inicio, ahora) : null;
  const hora = partido.horaConfirmada === false ? "Hora por confirmar" : inicio?.toLocaleTimeString("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }) || "[pendiente]";
  const dia = inicio?.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", weekday: "short", day: "2-digit", month: "short" }).replace(/[.,]/g, "").toUpperCase() || "[pendiente]";
  const twitch=dataService.ajustes().url_twitch;
  const live=!!ahora&&directoPartido(partido,ahora);
  const minutes=inicio&&ahora?minutosHastaPartido(inicio,ahora):0;
  return <article className="fixture-card" aria-label="Próximo partido">
    <LugoSilueta />
    <div className="relative z-10">
      <div className="fixture-heading">
        <h1 className="fixture-kicker">{partido.jornada ? `Jornada ${partido.jornada} · ` : ""}{partido.esLocal ? "En casa" : "Fuera"}</h1>
      </div>
      <div className="fixture-matchup">
        {partido.esLocal ? <EquipoPartido /> : <EquipoPartido rival={partido.rival} />}
        <div className="min-w-0 text-center"><p className={partido.horaConfirmada === false ? "fixture-unconfirmed" : "fixture-time"}>{hora}</p>{live||cuenta?.estado==='hoy'?<span className="fixture-chip fixture-day-chip">{live?'EN JUEGO':'HOY'}</span>:<p className="fixture-date">{partido.fechaConfirmada===false?fechaPartidoTexto(partido):dia}</p>}</div>
        {partido.esLocal ? <EquipoPartido rival={partido.rival} /> : <EquipoPartido />}
      </div>
      <span className="fixture-gold" />
      <div className="fixture-countdown" aria-live="polite">
        {partido.horaConfirmada === false || partido.fechaConfirmada === false ? null : cuenta?.estado === "resultado_pendiente" ? <p className="font-bold">Resultado pendiente</p> : live ? null : cuenta?.estado === "hoy" ? <p className="text-body-sm font-bold">Empieza en {Math.floor(minutes/60)>0?`${Math.floor(minutes/60)} h `:''}{minutes%60} min</p> : <div className="grid w-full grid-cols-3 gap-2">
          {[[cuenta?.dias, "DÍAS"], [cuenta?.horas, "HORAS"], [cuenta?.minutos, "MIN"]].map(([numero, label]) => <div key={label} className="fixture-counter"><p>{numero ?? "—"}</p><span>{label}</span></div>)}
        </div>}
      </div>
      {partido.lugar.trim()&&<p className="fixture-location"><MapPin size={16} strokeWidth={1.75} />{partido.lugar}</p>}
      <div className={`mt-4 grid ${twitch&&partido.lugar.trim()?'grid-cols-2':'grid-cols-1'} gap-2`}>
        {partido.lugar.trim()&&<Button asChild variant="ghost" className="fixture-directions"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partido.lugar)}`} target="_blank" rel="noopener noreferrer"><Navigation strokeWidth={1.75} />Cómo llegar</a></Button>}
        {twitch&&<Button asChild variant="ghost" className="fixture-calendar"><a href={twitch} target="_blank" rel="noopener noreferrer"><Twitch strokeWidth={1.75}/>{live&&<span className="fixture-live-dot"/>}{live?'Ver en directo':'Ver en Twitch'}</a></Button>}
      </div>
    </div>
  </article>;
}

function EquipoPartido({rival}:{rival?:string}) {
  return <div className="fixture-team">{rival ? <span className="fixture-opponent">{rival.split(' ').slice(0,3).map(w=>w[0]).join('').toUpperCase()}</span> : <img src={escudo.url} alt="Escudo del R.U. Lucense" className="size-14 object-contain"/>}<p>{rival??'R.U. LUCENSE'}</p></div>;
}
function Escudo36({rival}:{rival?:string|undefined}){return rival?<span className="result-opponent">{rival.replace(/["'.]/g,'').split(' ').filter(Boolean).slice(0,3).map(w=>w[0]).join('').toUpperCase()}</span>:<img src={escudo.url} alt="Escudo del R.U. Lucense" className="size-9 object-contain"/>;}
export function UltimoResultado({partidos}:{partidos:Partido[]}) {
  const {data}=useDriveGallery();
  const jugados=[...partidos].filter(p=>p.jugado).sort((a,b)=>(inicioPartido(a)?.getTime()??0)-(inicioPartido(b)?.getTime()??0));
  const [idx,setIdx]=useState<number|null>(null);const [fade,setFade]=useState(false);const [x0,setX0]=useState<number|null>(null);
  if(!jugados.length)return null;
  const last=jugados.length-1,i=Math.min(idx??last,last),partido=jugados[i]!;
  const ir=(n:number)=>{if(n<0||n>last||n===i)return;setFade(true);setTimeout(()=>{setIdx(n);setFade(false);},100);};
  const album=data?.albumes.find(a=>a.partidoId===partido.id);
  const resultado=resultadoPartido(partido);
  const f=inicioPartido(partido)?.toLocaleDateString('es-ES',{timeZone:'Europe/Madrid',weekday:'short',day:'numeric',month:'short'}).replace(/[.,]/g,'')??'';
  const fecha=f.charAt(0).toUpperCase()+f.slice(1);
  const folder=album?.id??partido.driveFolderId;
  return <><article className="result-card" aria-label="Resultado del partido" onTouchStart={e=>setX0(e.touches[0]?.clientX??null)} onTouchEnd={e=>{if(x0===null)return;const d=(e.changedTouches[0]?.clientX??x0)-x0;if(Math.abs(d)>40)ir(d<0?i+1:i-1);setX0(null);}}>
    <div className="result-nav">
      <button type="button" className="result-arrow" aria-label="Partido anterior" disabled={i===0} onClick={()=>ir(i-1)}>‹</button>
      <div className="flex min-w-0 items-center justify-center gap-2 whitespace-nowrap"><h2 className="result-kicker">{`JORNADA ${partido.jornada??'—'}`}</h2>{resultado&&<span className={`result-chip result-${resultado}`}>{resultado==='V'?'VICTORIA':resultado==='E'?'EMPATE':'DERROTA'}</span>}</div>
      <button type="button" className="result-arrow" aria-label="Partido siguiente" disabled={i===last} onClick={()=>ir(i+1)}>›</button>
    </div>
    <div className="result-body" style={{opacity:fade?0:1}}>
      <div className="result-matchup">
        <div className="result-team"><Escudo36 rival={partido.esLocal?undefined:partido.rival}/><p>{partido.esLocal?'R.U. Lucense':partido.rival}</p></div>
        <p className="result-score">{partido.golesLocal} <span className="result-separator">–</span> {partido.golesVisitante}</p>
        <div className="result-team"><Escudo36 rival={partido.esLocal?partido.rival:undefined}/><p>{partido.esLocal?partido.rival:'R.U. Lucense'}</p></div>
      </div>
      <p className="mt-3 text-center text-body-sm">{fecha} · Jornada {partido.jornada} · {partido.lugar}</p>
      {folder&&<div className="flex justify-center"><Button asChild variant="link" className="h-9 p-0 text-accent text-body-sm font-bold"><Link to="/galeria/$folderId" params={{folderId:folder}} search={{foto:''}}>Ver fotos del partido <ArrowRight/></Link></Button></div>}
    </div>
  </article>
  <div className="result-pager">{jugados.length>8?<p className="text-body-sm font-bold">J{partido.jornada??i+1} / {jugados.length}</p>:<div className="result-dots" aria-hidden="true">{jugados.map((p,n)=><span key={p.id} className={n===i?'is-active':''}/>)}</div>}{i!==last&&<button type="button" className="result-latest" onClick={()=>ir(last)}>Ir al último ›</button>}</div></>;
}
export function Liga() {
  useClubData();
  return <section aria-label="Liga">
    <TemporadaCard/>
    <CalendarioResumen/>
  </section>;
}

const iniciales=(n:string)=>n.replace(/["'.]/g,'').split(/\s+/).filter(Boolean).slice(0,3).map(w=>w[0]).join('').toUpperCase();
function Emblema({rival,size='lg'}:{rival?:string|undefined;size?:'lg'|'sm'}){
  return rival?<span className={`sc-emblem sc-emblem-${size}`} aria-hidden="true">{iniciales(rival)}</span>:<img src={escudo.url} alt="" className={`sc-crest sc-crest-${size}`}/>;
}
function nombreCorto(n:string){return n.replace(/\s+F\.?S\.?(\s|$)/i,' ').replace(/\s+/g,' ').trim();}

/** Próximo partido, liga y resultados en una sola pieza: talón oscuro arriba, temporada en claro abajo. */
export function TemporadaCard(){
  const db=useClubData();
  const [ahora,setAhora]=useState<Date|null>(null);
  useEffect(()=>{setAhora(new Date());const t=setInterval(()=>setAhora(new Date()),30000);return()=>clearInterval(t);},[]);
  const ref=ahora??new Date();
  const enCurso=partidoEnCurso(db.partidos,ref);
  const partido=enCurso??proximoPartido(db.partidos,ref);
  return <article className="season-card" aria-label="Temporada">
    {partido?<SiguienteTalon partido={partido} ahora={ahora}/>:<div className="sc-next sc-next-empty"><p className="sc-kicker">Próximo partido</p><p className="sc-tbd">Por confirmar</p></div>}
    <div className="sc-perf" aria-hidden="true"/>
    <div className="sc-lower">
      <TablaResumen/>
      <ResultadosCarrusel partidos={db.partidos}/>
    </div>
  </article>;
}

function SiguienteTalon({partido,ahora}:{partido:Partido;ahora:Date|null}){
  const inicio=inicioPartido(partido);
  const cuenta=inicio&&ahora?cuentaPartido(inicio,ahora):null;
  const live=!!ahora&&directoPartido(partido,ahora);
  const sinHora=partido.horaConfirmada===false||partido.fechaConfirmada===false;
  const hora=sinHora?null:inicio?.toLocaleTimeString('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'});
  const dia=inicio?.toLocaleDateString('es-ES',{timeZone:'Europe/Madrid',weekday:'short',day:'numeric',month:'short'}).replace(/[.,]/g,'')??'';
  const fecha=partido.fechaConfirmada===false?fechaPartidoTexto(partido):dia.charAt(0).toUpperCase()+dia.slice(1);
  const twitch=dataService.ajustes().url_twitch;
  const lugar=partido.lugar.trim();
  const min=inicio&&ahora?minutosHastaPartido(inicio,ahora):0;
  let falta:string|null=null;
  if(!sinHora&&cuenta&&!live){
    if(cuenta.estado==='resultado_pendiente')falta='Resultado pendiente';
    else if(cuenta.estado==='hoy')falta=`Hoy · empieza en ${Math.floor(min/60)>0?`${Math.floor(min/60)} h `:''}${min%60} min`;
    else if(cuenta.estado==='pendiente')falta=cuenta.dias>0?`Faltan ${cuenta.dias} d ${cuenta.horas} h`:`Faltan ${cuenta.horas} h ${cuenta.minutos} min`;
  }
  const local=partido.esLocal;
  return <div className="sc-next">
    <LugoSilueta/>
    <div className="sc-next-inner">
      <div className="sc-topline">
        <span className="sc-kicker">{live?<><span className="sc-live-dot"/>En juego</>:'Próximo partido'}</span>
        <span className="sc-meta">{partido.jornada?`J${partido.jornada} · `:''}{local?'En casa':'Fuera'}</span>
      </div>
      <div className="sc-matchup">
        <div className="sc-team"><Emblema rival={local?undefined:partido.rival}/><p>{local?'R.U. Lucense':nombreCorto(partido.rival)}</p></div>
        <div className="sc-when">
          {hora?<p className="sc-time">{hora}</p>:<p className="sc-time sc-time-tbd">Hora<br/>por confirmar</p>}
          <p className="sc-date">{fecha}</p>
        </div>
        <div className="sc-team"><Emblema rival={local?partido.rival:undefined}/><p>{local?nombreCorto(partido.rival):'R.U. Lucense'}</p></div>
      </div>
      {(falta||lugar)&&<div className="sc-facts">
        {falta&&<p className="sc-countdown" aria-live="polite">{falta}</p>}
        {lugar&&<p className="sc-place"><MapPin size={14} strokeWidth={1.75} aria-hidden="true"/>{lugar}</p>}
      </div>}
      {(lugar||twitch)&&<div className={`sc-actions ${lugar&&twitch?'is-two':''}`}>
        {lugar&&<a className="sc-btn sc-btn-light" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`} target="_blank" rel="noopener noreferrer"><Navigation size={16} strokeWidth={1.75} aria-hidden="true"/>Cómo llegar</a>}
        {twitch&&<a className="sc-btn sc-btn-ghost" href={twitch} target="_blank" rel="noopener noreferrer"><Twitch size={16} strokeWidth={1.75} aria-hidden="true"/>{live&&<span className="sc-live-dot"/>}{live?'Ver en directo':'Ver en Twitch'}</a>}
      </div>}
    </div>
  </div>;
}

function TablaResumen(){
  const db=useClubData();
  const stats=dataService.liga(),tabla=dataService.clasificacion(),racha=rachaCronologica(stats.racha),goles=golesLiga(db.partidos);
  const nombre=(r:string|null)=>r==='V'?'Victoria':r==='E'?'Empate':r==='D'?'Derrota':'Sin resultado';
  return <section className="sc-league" aria-label="Nuestra liga">
    <div className="sc-pos"><span className="sc-pos-num">{tabla?tabla.posicion:'—'}<sup>{tabla?'º':''}</sup></span><span className="sc-pos-label">en la liga</span></div>
    <div className="sc-league-body">
      <p className="sc-points"><strong>{stats.puntos}</strong> pts <span className="sc-sep">·</span> {stats.g}G {stats.e}E {stats.p}P</p>
      <p className="sc-goals">Goles {goles.gf}–{goles.gc} · <span className={goles.dg>0?'sc-dg-pos':goles.dg<0?'sc-dg-neg':''}>{textoDiferencia(goles.dg)}</span></p>
      <div className="sc-form" aria-label={`Últimos cinco, del más antiguo al más reciente: ${racha.filter(Boolean).map(nombre).join(', ')||'sin resultados'}`}>
        {racha.map((r,i)=><span key={i} title={nombre(r)} className={`sc-form-dot ${r?`is-${r}`:''}`}>{r??''}</span>)}
      </div>
    </div>
    <a className="sc-table-link" href={dataService.ajustes().url_clasificacion_futgal} target="_blank" rel="noopener noreferrer" aria-label="Ver la clasificación completa">Clasificación<ArrowUpRight size={14} strokeWidth={2} aria-hidden="true"/></a>
  </section>;
}

function ResultadosCarrusel({partidos}:{partidos:Partido[]}){
  const {data}=useDriveGallery();
  const jugados=[...partidos].filter(p=>p.jugado).sort((a,b)=>(inicioPartido(a)?.getTime()??0)-(inicioPartido(b)?.getTime()??0));
  const [idx,setIdx]=useState<number|null>(null);const [x0,setX0]=useState<number|null>(null);const [dir,setDir]=useState<0|1|-1>(0);
  if(!jugados.length)return null;
  const last=jugados.length-1,i=Math.min(idx??last,last),partido=jugados[i]!;
  const ir=(n:number)=>{if(n<0||n>last||n===i)return;setDir(n>i?1:-1);setIdx(n);};
  const r=resultadoPartido(partido);
  const album=data?.albumes.find(a=>a.partidoId===partido.id);
  const folder=album?.id??partido.driveFolderId;
  const d=inicioPartido(partido)?.toLocaleDateString('es-ES',{timeZone:'Europe/Madrid',weekday:'short',day:'numeric',month:'short'}).replace(/[.,]/g,'')??'';
  const fecha=d.charAt(0).toUpperCase()+d.slice(1);
  const local=partido.esLocal;
  const ganaLocal=(partido.golesLocal??0)>(partido.golesVisitante??0),ganaVisit=(partido.golesVisitante??0)>(partido.golesLocal??0);
  return <section className="sc-results" aria-label="Resultados"
    onTouchStart={e=>setX0(e.touches[0]?.clientX??null)}
    onTouchEnd={e=>{if(x0===null)return;const dx=(e.changedTouches[0]?.clientX??x0)-x0;if(Math.abs(dx)>40)ir(dx<0?i+1:i-1);setX0(null);}}>
    <div className="sc-results-head">
      <p className="sc-label">{i===last?'Último resultado':`Jornada ${partido.jornada??''}`}</p>
      <div className="sc-pager">
        {i!==last&&<button type="button" className="sc-latest" onClick={()=>ir(last)}>Último</button>}
        <button type="button" className="sc-arrow" aria-label="Partido anterior" disabled={i===0} onClick={()=>ir(i-1)}><ChevronLeft size={18} strokeWidth={2}/></button>
        <button type="button" className="sc-arrow" aria-label="Partido siguiente" disabled={i===last} onClick={()=>ir(i+1)}><ChevronRight size={18} strokeWidth={2}/></button>
      </div>
    </div>
    <div key={partido.id} className={`sc-score ${dir>0?'from-right':dir<0?'from-left':''}`}>
      {r&&<span className={`sc-result-bar is-${r}`} aria-hidden="true"/>}
      <p className={`sc-score-row ${ganaVisit?'is-loser':''}`}><Emblema rival={local?undefined:partido.rival} size="sm"/><span className="sc-score-name">{local?'R.U. Lucense':nombreCorto(partido.rival)}</span><span className="sc-score-goals">{partido.golesLocal}</span></p>
      <p className={`sc-score-row ${ganaLocal?'is-loser':''}`}><Emblema rival={local?partido.rival:undefined} size="sm"/><span className="sc-score-name">{local?nombreCorto(partido.rival):'R.U. Lucense'}</span><span className="sc-score-goals">{partido.golesVisitante}</span></p>
    </div>
    <div className="sc-score-foot">
      <p>{r&&<span className={`sc-result-word is-${r}`}>{r==='V'?'Victoria':r==='E'?'Empate':'Derrota'}</span>}<span>{fecha}{partido.jornada?` · J${partido.jornada}`:''}</span></p>
      {folder&&<Link className="sc-photos" to="/galeria/$folderId" params={{folderId:folder}} search={{foto:''}}>Fotos<ArrowRight size={14} strokeWidth={2} aria-hidden="true"/></Link>}
    </div>
  </section>;
}
export function CasaFiltro({casa,onChange}:{casa:boolean;onChange:(v:boolean)=>void}){
  return <div className="calendar-filter" role="group" aria-label="Filtrar partidos">{[["Todos",false],["En casa",true]].map(([l,v])=><button key={String(l)} type="button" aria-pressed={casa===v} className={casa===v?'is-active':''} onClick={()=>onChange(!!v)}>{l}</button>)}</div>;
}
export function CalendarioFila({partido,destacado=false}:{partido:Partido;destacado?:boolean}){
  const r=resultadoPartido(partido);
  const favor=partido.esLocal?partido.golesLocal:partido.golesVisitante,contra=partido.esLocal?partido.golesVisitante:partido.golesLocal;
  return <li id={`jornada-${partido.jornada}`} className={`calendar-row ${destacado?'is-next':''}`} aria-current={destacado?'true':undefined}>
    <span className="calendar-j">J{partido.jornada}</span>
    <span className="min-w-0 flex-1"><span className="calendar-rival">vs {partido.rival}</span><span className="calendar-date">{fechaPartidoTexto(partido)}</span></span>
    {r?<span className="calendar-score"><span className={`league-dot result-${r}`} aria-label={r==='V'?'Victoria':r==='E'?'Empate':'Derrota'}/>{favor}–{contra}</span>:<span className={partido.esLocal?'calendar-home':'calendar-away'}>{partido.esLocal?'Casa':'Fuera'}</span>}
  </li>;
}
function CalendarioResumen(){
  const db=useClubData();const [casa,setCasa]=useState(false);const [ahora]=useState(()=>new Date());
  const siguiente=partidoEnCurso(db.partidos,ahora)??proximoPartido(db.partidos,ahora);
  const lista=proximosCalendario(db.partidos,ahora,casa,4).filter(p=>p.id!==siguiente?.id).slice(0,3);
  if(!db.partidos.length)return null;
  return <section className="mt-6" aria-label="Calendario">
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="club-section-title mb-0">Calendario</h2><CasaFiltro casa={casa} onChange={setCasa}/></div>
    {lista.length?<ul className="calendar-list surface-card">{lista.map(p=><CalendarioFila key={p.id} partido={p}/>)}</ul>:<p className="py-4 text-body-sm text-muted-foreground">No quedan partidos.</p>}
    <Button asChild variant="link" className="mt-1 h-11 px-0 text-accent font-bold"><Link to="/calendario">Ver todo el calendario <ArrowRight strokeWidth={1.75}/></Link></Button>
  </section>;
}
