import {Link} from "@tanstack/react-router";
import {useDriveGallery} from "@/hooks/use-drive-gallery";
import {dataService,useClubData} from "@/lib/dataService";
import { useEffect, useState } from "react";
import { ArrowRight, Twitch, MapPin, Navigation } from "lucide-react";
import escudo from "@/assets/escudo-rul-transparente.png.asset.json";
import { Button } from "@/components/ui/button";
import type { Partido } from "@/lib/dataService";
import { directoPartido,minutosHastaPartido, cuentaPartido, inicioPartido, proximoPartido, partidoEnCurso, ultimoPartido, resultadoPartido } from "@/lib/partidos";

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
        <h1 className="fixture-chip">PRÓXIMO PARTIDO</h1>
        {partido.jornada && <span className="fixture-chip">JORNADA {partido.jornada}</span>}<span className="fixture-chip">{partido.esLocal ? "EN CASA" : "FUERA"}</span>
      </div>
      <p className="fixture-subtitle">Concello de Guntín - R.U. Lucense · {partido.competicion}</p>
      <div className="fixture-matchup">
        {partido.esLocal ? <EquipoPartido /> : <EquipoPartido rival={partido.rival} />}
        <div className="min-w-0 text-center"><p className={partido.horaConfirmada === false ? "fixture-unconfirmed" : "fixture-time"}>{hora}</p>{live||cuenta?.estado==='hoy'?<span className="fixture-chip fixture-day-chip">{live?'EN JUEGO':'HOY'}</span>:<p className="fixture-date">{dia}</p>}</div>
        {partido.esLocal ? <EquipoPartido rival={partido.rival} /> : <EquipoPartido />}
      </div>
      <span className="fixture-gold" />
      <div className="fixture-countdown" aria-live="polite">
        {partido.horaConfirmada === false ? null : cuenta?.estado === "resultado_pendiente" ? <p className="font-bold">Resultado pendiente</p> : live ? null : cuenta?.estado === "hoy" ? <p className="text-body-sm font-bold">Empieza en {Math.floor(minutes/60)>0?`${Math.floor(minutes/60)} h `:''}{minutes%60} min</p> : <div className="grid w-full grid-cols-3 gap-2">
          {[[cuenta?.dias, "DÍAS"], [cuenta?.horas, "HORAS"], [cuenta?.minutos, "MIN"]].map(([numero, label]) => <div key={label} className="fixture-counter"><p>{numero ?? "—"}</p><span>{label}</span></div>)}
        </div>}
      </div>
      <p className="fixture-location"><MapPin size={16} strokeWidth={1.75} />{partido.lugar}</p>
      <div className={`mt-4 grid ${twitch?'grid-cols-2':'grid-cols-1'} gap-2`}>
        <Button asChild variant="ghost" className="fixture-directions"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partido.lugar)}`} target="_blank" rel="noopener noreferrer"><Navigation strokeWidth={1.75} />Cómo llegar</a></Button>
        {twitch&&<Button asChild variant="ghost" className="fixture-calendar"><a href={twitch} target="_blank" rel="noopener noreferrer"><Twitch strokeWidth={1.75}/>{live&&<span className="fixture-live-dot"/>}{live?'Ver en directo':'Ver en Twitch'}</a></Button>}
      </div>
    </div>
  </article>;
}

function EquipoPartido({rival}:{rival?:string}) {
  return <div className="fixture-team">{rival ? <span className="fixture-opponent">{rival.split(' ').slice(0,3).map(w=>w[0]).join('').toUpperCase()}</span> : <img src={escudo.url} alt="Escudo del R.U. Lucense" className="size-14 object-contain"/>}<p>{rival??'R.U. LUCENSE'}</p></div>;
}
export function UltimoResultado({partido}:{partido:Partido}) {
  const {data}=useDriveGallery();const album=data?.albumes.find(a=>a.partidoId===partido.id);
  const resultado=resultadoPartido(partido);
  const fecha=inicioPartido(partido)?.toLocaleDateString('es-ES',{timeZone:'Europe/Madrid',weekday:'short',day:'numeric',month:'short'}).replace(/[.,]/g,'');
  return <article className="result-card" aria-label="Último partido">
    <div className="flex items-center justify-between gap-2"><h2 className="result-kicker">ÚLTIMO PARTIDO</h2>{resultado&&<span className={`result-chip result-${resultado}`}>{resultado==='V'?'VICTORIA':resultado==='E'?'EMPATE':'DERROTA'}</span>}</div>
    <div className="result-matchup">
      <div className="result-team">{partido.esLocal&&<img src={escudo.url} alt="R.U. Lucense" className="size-9 object-contain"/>}<p>{partido.esLocal?'R.U. Lucense':partido.rival}</p></div>
      <p className="result-score">{partido.golesLocal} <span className="result-separator">–</span> {partido.golesVisitante}</p>
      <div className="result-team">{!partido.esLocal&&<img src={escudo.url} alt="R.U. Lucense" className="size-9 object-contain"/>}<p>{partido.esLocal?partido.rival:'R.U. Lucense'}</p></div>
    </div>
    <p className="mt-3 text-body-sm">{fecha} · Jornada {partido.jornada} · {partido.lugar}</p>
    {(album||partido.driveFolderId)&&<Button asChild variant="link" className="h-9 p-0 text-accent text-body-sm font-bold"><Link to="/galeria/$folderId" params={{folderId:album?.id??partido.driveFolderId??''}} search={{foto:''}}>Ver fotos del partido <ArrowRight/></Link></Button>}
  </article>;
}
export function Liga() {
  const db=useClubData();const [ahora,setAhora]=useState(()=>new Date());
  useEffect(()=>{const timer=setInterval(()=>setAhora(new Date()),30000);return()=>clearInterval(timer);},[]);
  const proximo=proximoPartido(db.partidos,ahora),enCurso=partidoEnCurso(db.partidos,ahora),ultimo=ultimoPartido(db.partidos);
  const stats=dataService.liga(),tabla=dataService.clasificacion();
  return <section aria-label="Liga">
    {enCurso&&<ProximoPartido partido={enCurso}/>}
    {proximo ? <div className={enCurso?'mt-4':''}><ProximoPartido partido={proximo}/></div> : <div className="mt-4 border-y border-border py-4"><p className="label-club">Próximo partido</p><p className="font-black">Por confirmar</p></div>}
    <div className="league-strip" aria-label="Nuestra liga"><div><p className="label-club">NUESTRA LIGA</p><p className="club-stat">{tabla?`${tabla.posicion}.º`:'—'}</p></div><div><p className="text-body-sm font-bold">{stats.puntos} PTS · {stats.g}G {stats.e}E {stats.p}P</p><div className="mt-2 flex items-center gap-2"><div className="flex gap-1" aria-label={`Racha: ${stats.racha.join(', ')||'sin resultados'}`}>{Array.from({length:5},(_,i)=><span key={i} title={stats.racha[i]==='V'?'Victoria':stats.racha[i]==='E'?'Empate':stats.racha[i]==='D'?'Derrota':'Sin resultado'} className={`league-dot ${stats.racha[i]?`result-${stats.racha[i]}`:''}`}/>)}</div><span className="league-caption">Últimos 5</span></div></div><Button asChild variant="link" className="league-link"><a href={dataService.ajustes().url_clasificacion_futgal} target="_blank" rel="noopener noreferrer">Clasificación ↗</a></Button></div>
    {ultimo&&<UltimoResultado partido={ultimo}/>}
  </section>;
}
