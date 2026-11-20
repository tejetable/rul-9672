import {Link} from "@tanstack/react-router";
import {useDriveGallery} from "@/hooks/use-drive-gallery";
import {dataService,useClubData} from "@/lib/dataService";
import { useEffect, useRef, useState } from "react";
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
      <ProximosEnCard partidos={db.partidos} siguienteId={partido?.id} ahora={ref}/>
    </div>
    <Link to="/calendario" className="sc-calendar-link">Calendario completo<ArrowRight size={16} strokeWidth={2} aria-hidden="true"/></Link>
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
  const url=dataService.ajustes().url_clasificacion_futgal;
  return <section className="sc-league" aria-label="Nuestra liga">
    <a className="sc-pos-tile" href={url} target="_blank" rel="noopener noreferrer" aria-label={tabla?`${tabla.posicion}º en la liga. Ver la clasificación completa`:'Ver la clasificación'}>
      <span className="sc-pos-num">{tabla?tabla.posicion:'—'}<sup>{tabla?'º':''}</sup></span>
      <ArrowUpRight className="sc-pos-go" size={14} strokeWidth={2.25} aria-hidden="true"/>
    </a>
    <div className="sc-league-body">
      <p className="sc-points"><strong>{stats.puntos}</strong> pts <span className="sc-sep">·</span> {stats.g}G {stats.e}E {stats.p}P</p>
      <p className="sc-goals">Goles {goles.gf}–{goles.gc} <span className="sc-sep">·</span> <span className={goles.dg>0?'sc-dg-pos':goles.dg<0?'sc-dg-neg':''}>{textoDiferencia(goles.dg)}</span></p>
      <div className="sc-form" role="img" aria-label={`Últimos cinco, del más antiguo al más reciente: ${racha.filter(Boolean).map(nombre).join(', ')||'sin resultados'}`}>
        {racha.map((r,i)=><span key={i} title={nombre(r)} className={`sc-form-dot ${r?`is-${r}`:''}`}>{r??''}</span>)}
      </div>
    </div>
  </section>;
}

/** Navegación entre partidos jugados (flechas, «Último» y deslizar). La comparten la pista y las paletas. */
function useNavegadorResultados(partidos:Partido[]){
  const jugados=[...partidos].filter(p=>p.jugado).sort((a,b)=>(inicioPartido(a)?.getTime()??0)-(inicioPartido(b)?.getTime()??0));
  const [idx,setIdx]=useState<number|null>(null);const [x0,setX0]=useState<number|null>(null);const [dir,setDir]=useState<0|1|-1>(0);
  const last=jugados.length-1,i=Math.max(0,Math.min(idx??last,last)),partido=jugados[i];
  const ir=(n:number)=>{if(n<0||n>last||n===i)return;setDir(n>i?1:-1);setIdx(n);};
  const irA=(id:string)=>{const n=jugados.findIndex(p=>p.id===id);if(n>=0)ir(n);};
  const swipe={onTouchStart:(e:React.TouchEvent)=>setX0(e.touches[0]?.clientX??null),onTouchEnd:(e:React.TouchEvent)=>{if(x0===null)return;const dx=(e.changedTouches[0]?.clientX??x0)-x0;if(Math.abs(dx)>40)ir(dx<0?i+1:i-1);setX0(null);}};
  return {partido,i,last,dir,ir,irA,swipe};
}
type Nav=ReturnType<typeof useNavegadorResultados>;
function NavFlechas({nav,etiqueta}:{nav:Nav;etiqueta:string}){
  const {i,last,ir,partido}=nav;
  return <div className="sc-results-head">
    <p className="sc-label">{i===last?etiqueta:`Jornada ${partido?.jornada??''}`}</p>
    <div className="sc-pager">
      {i!==last&&<button type="button" className="sc-latest" onClick={()=>ir(last)}>Último</button>}
      <button type="button" className="sc-arrow" aria-label="Partido anterior" disabled={i===0} onClick={()=>ir(i-1)}><ChevronLeft size={18} strokeWidth={2}/></button>
      <button type="button" className="sc-arrow" aria-label="Partido siguiente" disabled={i===last} onClick={()=>ir(i+1)}><ChevronRight size={18} strokeWidth={2}/></button>
    </div>
  </div>;
}
function fechaCorta(p:Partido){const d=inicioPartido(p)?.toLocaleDateString('es-ES',{timeZone:'Europe/Madrid',weekday:'short',day:'numeric',month:'short'}).replace(/[.,]/g,'')??'';return d.charAt(0).toUpperCase()+d.slice(1);}
function equipos(p:Partido){
  const local=p.esLocal?'R.U. Lucense':nombreCorto(p.rival),visit=p.esLocal?nombreCorto(p.rival):'R.U. Lucense';
  const gl=p.golesLocal??0,gv=p.golesVisitante??0;
  return {local,visit,gl,gv,pierdeLocal:gl<gv,pierdeVisit:gv<gl};
}

/** La pista de Guntín vista desde arriba: cada equipo en su campo, con sus goles. El azul es imagen, no color de interfaz. */
function PistaSVG(){
  return <svg className="court-lines" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true" fill="none">
    <g className="court-basket"><path d="M8 18H44A84 84 0 0 1 44 182H8"/><path d="M392 18H356A84 84 0 0 0 356 182H392"/></g>
    <g className="court-futsal"><rect x="8" y="8" width="384" height="184" rx="2"/><line x1="200" y1="8" x2="200" y2="192"/><circle cx="200" cy="100" r="22"/>
      <path d="M8 72A28 28 0 0 1 36 100A28 28 0 0 1 8 128"/><path d="M392 72A28 28 0 0 0 364 100A28 28 0 0 0 392 128"/></g>
    <circle cx="200" cy="100" r="2.5" className="court-spot"/>
  </svg>;
}
function MarcadorPista({partido,dir}:{partido:Partido;dir:0|1|-1}){
  const {local,visit,gl,gv,pierdeLocal,pierdeVisit}=equipos(partido);
  return <div className="court" role="img" aria-label={`${local} ${gl}, ${visit} ${gv}`}>
    <PistaSVG/>
    <span className="court-side is-l" aria-hidden="true">Local</span><span className="court-side is-r" aria-hidden="true">Visitante</span>
    <div key={partido.id} className={`court-halves ${dir>0?'from-right':dir<0?'from-left':''}`} aria-hidden="true">
      <div className={`court-half ${pierdeLocal?'is-loser':''}`}><span className="court-goals">{gl}</span><span className="court-team">{local}</span></div>
      <div className={`court-half ${pierdeVisit?'is-loser':''}`}><span className="court-goals">{gv}</span><span className="court-team">{visit}</span></div>
    </div>
  </div>;
}

function ResultadosCarrusel({partidos}:{partidos:Partido[]}){
  const {data}=useDriveGallery();
  const nav=useNavegadorResultados(partidos);
  const partido=nav.partido;
  if(!partido)return null;
  const r=resultadoPartido(partido);
  const album=data?.albumes.find(a=>a.partidoId===partido.id);
  const folder=album?.id??partido.driveFolderId;
  return <section className="sc-results" aria-label="Resultados" {...nav.swipe}>
    <NavFlechas nav={nav} etiqueta="Último resultado"/>
    <MarcadorPista partido={partido} dir={nav.dir}/>
    <div className="sc-score-foot">
      <p>{r&&<span className={`sc-result-word is-${r}`}>{r==='V'?'Victoria':r==='E'?'Empate':'Derrota'}</span>}<span>{fechaCorta(partido)}{partido.jornada?` · J${partido.jornada}`:''}</span></p>
      {folder&&<Link className="sc-photos" to="/galeria/$folderId" params={{folderId:folder}} search={{foto:''}}>Fotos<ArrowRight size={14} strokeWidth={2} aria-hidden="true"/></Link>}
    </div>
  </section>;
}

/** Marcador de paletas (calendario completo). Se mueve la paleta, no el texto: la mitad de arriba cae y la de abajo
 *  aparece, como en un marcador mecánico. Los goles pasan por todos los números intermedios y los nombres por varios
 *  carteles antes de quedarse en el bueno. */
const PASO_MS=150;
function reduceMotion(){return typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
function pasosNumero(desde:number,hasta:number){const out:number[]=[];const d=hasta>desde?1:-1;for(let n=desde+d;d>0?n<=hasta:n>=hasta;n+=d)out.push(n);return out;}
function pasosNombre(hasta:string,pool:string[],desde:string){const otros=pool.filter(n=>n!==hasta&&n!==desde);const out:string[]=[];for(let k=0;k<3&&otros.length;k++){out.push(otros.splice(Math.floor(Math.random()*otros.length),1)[0]!);}out.push(hasta);return out;}
function Paleta({valor,pasos,clase='',retraso=0}:{valor:string|number;pasos:(desde:string|number)=>(string|number)[];clase?:string;retraso?:number}){
  const [actual,setActual]=useState<string|number>(valor);
  const [anterior,setAnterior]=useState<string|number>(valor);
  const [vuelta,setVuelta]=useState(0);
  const actualRef=useRef(valor);
  useEffect(()=>{
    if(valor===actualRef.current)return;
    if(reduceMotion()){actualRef.current=valor;setAnterior(valor);setActual(valor);return;}
    const cola=pasos(actualRef.current);
    const timers:number[]=[];
    cola.forEach((v,k)=>{timers.push(window.setTimeout(()=>{setAnterior(actualRef.current);actualRef.current=v;setActual(v);setVuelta(n=>n+1);},retraso+k*PASO_MS));});
    timers.push(window.setTimeout(()=>setAnterior(actualRef.current),retraso+cola.length*PASO_MS));
    return()=>timers.forEach(clearTimeout);
  },[valor]); // eslint-disable-line react-hooks/exhaustive-deps
  const cayendo=anterior!==actual;
  return <span className={`flap-tile ${clase}`}>
    <span className="flap-half is-top"><span className="flap-text">{actual}</span></span>
    <span className="flap-half is-bottom"><span className="flap-text">{cayendo?anterior:actual}</span></span>
    {cayendo&&<span key={`t${vuelta}`} className="flap-half is-top flap-leaf-top"><span className="flap-text">{anterior}</span></span>}
    {cayendo&&<span key={`b${vuelta}`} className="flap-half is-bottom flap-leaf-bottom"><span className="flap-text">{actual}</span></span>}
  </span>;
}
export function MarcadorPaletas({partidos,elegido}:{partidos:Partido[];elegido?:{id:string;n:number}|null}){
  const nav=useNavegadorResultados(partidos);
  useEffect(()=>{if(elegido)nav.irA(elegido.id);},[elegido]); // eslint-disable-line react-hooks/exhaustive-deps
  const partido=nav.partido;
  if(!partido)return null;
  const {local,visit,gl,gv,pierdeLocal,pierdeVisit}=equipos(partido);
  const r=resultadoPartido(partido);
  const pool=[...new Set(['R.U. Lucense',...partidos.map(p=>nombreCorto(p.rival))])];
  const num=(hasta:number)=>(desde:string|number)=>pasosNumero(Number(desde),hasta);
  const nom=(hasta:string)=>(desde:string|number)=>pasosNombre(hasta,pool,String(desde));
  return <section className="flap-board surface-card" aria-label="Resultados" {...nav.swipe}>
    <NavFlechas nav={nav} etiqueta="Último resultado"/>
    <div className="flap" role="img" aria-label={`Jornada ${partido.jornada}: ${local} ${gl}, ${visit} ${gv}`}>
      <div className={`flap-row ${pierdeLocal?'is-loser':''}`} aria-hidden="true"><Paleta valor={local} pasos={nom(local)} clase="is-name"/><Paleta valor={gl} pasos={num(gl)} clase="is-num" retraso={60}/></div>
      <div className={`flap-row ${pierdeVisit?'is-loser':''}`} aria-hidden="true"><Paleta valor={visit} pasos={nom(visit)} clase="is-name" retraso={90}/><Paleta valor={gv} pasos={num(gv)} clase="is-num" retraso={150}/></div>
      <div className="flap-meta"><span>J{partido.jornada} · {fechaCorta(partido)}</span>{r&&<span className={`sc-result-word is-${r}`}>{r==='V'?'Victoria':r==='E'?'Empate':'Derrota'}</span>}</div>
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
/** Los siguientes partidos después del próximo, dentro de la tarjeta de temporada. */
function ProximosEnCard({partidos,siguienteId,ahora}:{partidos:Partido[];siguienteId?:string|undefined;ahora:Date}){
  const lista=proximosCalendario(partidos,ahora,false,4).filter(p=>p.id!==siguienteId).slice(0,3);
  if(!lista.length)return null;
  return <section className="sc-upcoming" aria-label="Después">
    <p className="sc-label">Después</p>
    <ul>{lista.map(p=><li key={p.id} className="sc-up-row">
      <span className="sc-up-j">J{p.jornada}</span>
      <span className="min-w-0 flex-1"><span className="sc-up-rival">{nombreCorto(p.rival)}</span><span className="sc-up-date">{fechaPartidoTexto(p)}</span></span>
      <span className={`sc-up-where ${p.esLocal?'is-home':''}`}>{p.esLocal?'Casa':'Fuera'}</span>
    </li>)}</ul>
  </section>;
}

/** Un partido del calendario completo, en su propia tarjeta. Los jugados enseñan el resultado. */
export function CalendarioCard({partido,destacado=false,onVer}:{partido:Partido;destacado?:boolean;onVer?:(id:string)=>void}){
  const r=resultadoPartido(partido);
  const favor=partido.esLocal?partido.golesLocal:partido.golesVisitante,contra=partido.esLocal?partido.golesVisitante:partido.golesLocal;
  const ver=r&&onVer?()=>onVer(partido.id):undefined;
  return <li id={`jornada-${partido.jornada}`} className={`cal-card ${destacado?'is-next':''} ${r?'is-played':''} ${ver?'is-tappable':''}`} aria-current={destacado?'true':undefined} onClick={ver} onKeyDown={ver?(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ver();}}:undefined} tabIndex={ver?0:undefined} role={ver?'button':undefined} aria-label={ver?`Ver en el marcador la jornada ${partido.jornada}`:undefined}>
    <span className="cal-j"><span>J</span>{partido.jornada}</span>
    <span className="min-w-0 flex-1">
      {destacado&&<span className="cal-next-tag">Próximo partido</span>}
      <span className="cal-rival">{nombreCorto(partido.rival)}</span>
      <span className="cal-meta">{fechaPartidoTexto(partido)} · {partido.esLocal?'Casa':'Fuera'}</span>
    </span>
    {r?<span className={`cal-result is-${r}`} aria-label={`${r==='V'?'Victoria':r==='E'?'Empate':'Derrota'} ${favor} a ${contra}`}><span className="cal-result-letter">{r}</span><span className="cal-result-score">{favor}–{contra}</span></span>
      :null}
  </li>;
}
