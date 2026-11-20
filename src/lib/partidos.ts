import type { Partido } from "./dataService";

/** The prototype's confirmed fixture times are Madrid local time. */
export function inicioPartido(partido: Partido): Date | null {
  if (/^\d{4}-\d{2}-\d{2}T/.test(partido.fechaHora)) {
    const fecha = new Date(partido.fechaHora);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
  const match = partido.fechaHora.match(/(\d{2})\/(\d{2})\/(\d{4}).*?(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, dia, mes, ano, hora, minuto] = match;
  // Fixtures in November use Madrid's winter offset, independent of device timezone.
  return new Date(`${ano}-${mes}-${dia}T${hora}:${minuto}:00+01:00`);
}

export function cuentaPartido(inicio: Date, ahora: Date) {
  if (ahora.getTime() >= inicio.getTime()) return { estado: ahora.getTime() < inicio.getTime() + 7200000 ? "en_juego" as const : "resultado_pendiente" as const, dias: 0, horas: 0, minutos: 0 };
  const madrid = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
  const minutos = Math.ceil((inicio.getTime() - ahora.getTime()) / 60000);
  return {
    estado: madrid(inicio) === madrid(ahora) ? "hoy" as const : "pendiente" as const,
    dias: Math.floor(minutos / 1440), horas: Math.floor((minutos % 1440) / 60), minutos: minutos % 60,
  };
}

export function directoPartido(partido:Partido,ahora:Date){const inicio=inicioPartido(partido);return partido.horaConfirmada!==false&&!!inicio&&ahora.getTime()>=inicio.getTime()&&ahora.getTime()<inicio.getTime()+7200000;}
export function minutosHastaPartido(inicio:Date,ahora:Date){return Math.max(0,Math.ceil((inicio.getTime()-ahora.getTime())/60000));}

export function proximoPartido(partidos: Partido[], ahora: Date): Partido | undefined {
  return partidos.filter(p => !p.jugado && (p.horaConfirmada === false ? !!inicioPartido(p) && fechaMadridCampos(p).fecha >= ahora.toLocaleDateString("en-CA",{timeZone:"Europe/Madrid"}) : (inicioPartido(p)?.getTime() ?? 0) > ahora.getTime())).sort((a,b) => (inicioPartido(a)?.getTime() ?? 0) - (inicioPartido(b)?.getTime() ?? 0))[0];
}
export function partidoEnCurso(partidos: Partido[], ahora: Date): Partido | undefined {
  return partidos.filter(p => !p.jugado && p.horaConfirmada !== false && inicioPartido(p) && (inicioPartido(p)?.getTime() ?? Infinity) <= ahora.getTime() && (inicioPartido(p)?.getTime() ?? 0) + 7200000 > ahora.getTime()).sort((a,b) => (inicioPartido(b)?.getTime() ?? 0) - (inicioPartido(a)?.getTime() ?? 0))[0];
}
export function ultimoPartido(partidos: Partido[]): Partido | undefined {
  return partidos.filter(p => p.jugado).sort((a,b) => (inicioPartido(b)?.getTime() ?? 0) - (inicioPartido(a)?.getTime() ?? 0))[0];
}
export function resultadoPartido(partido: Partido): 'V'|'E'|'D'|null {
  if (!partido.jugado || partido.golesLocal === null || partido.golesVisitante === null) return null;
  const favor = partido.esLocal ? partido.golesLocal : partido.golesVisitante;
  const contra = partido.esLocal ? partido.golesVisitante : partido.golesLocal;
  return favor > contra ? 'V' : favor === contra ? 'E' : 'D';
}
export function fechaMadridISO(fecha:string,hora:string): string {
  const naive = new Date(`${fecha}T${hora}:00Z`);
  if (Number.isNaN(naive.getTime())) throw new Error('Indica fecha y hora válidas.');
  const offset = (date:Date) => {
    const zone = new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Madrid',timeZoneName:'shortOffset'}).formatToParts(date).find(p=>p.type==='timeZoneName')?.value ?? 'GMT+1';
    const match = zone.match(/GMT([+-])(\d+)(?::(\d+))?/);
    return match ? (match[1]==='-'?-1:1)*(Number(match[2])*60+Number(match[3]??0))*60000 : 0;
  };
  return new Date(naive.getTime()-offset(new Date(naive.getTime()-offset(naive)))).toISOString();
}
export function fechaMadridCampos(partido:Partido) {
  const date=inicioPartido(partido);
  if(!date)return {fecha:'',hora:''};
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const get=(type:string)=>parts.find(p=>p.type===type)?.value??'';
  return {fecha:`${get('year')}-${get('month')}-${get('day')}`,hora:`${get('hour')}:${get('minute')}`};
}

export function calendarioPartido(partido: Partido): string | null {
  const inicio = inicioPartido(partido);
  if (!inicio || partido.horaConfirmada === false) return null;
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const stamp = inicio.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RUL//Partidos//ES", "BEGIN:VEVENT", `UID:${partido.id}-2026@rul`, `DTSTAMP:${stamp}`, `DTSTART:${stamp}`, `SUMMARY:${escape(`Concello de Guntín - R.U. Lucense vs ${partido.rival}`)}`, `LOCATION:${escape(partido.lugar)}`, `DESCRIPTION:${escape(partido.competicion || "")}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
}
/** Cloud returns newest first; presentation keeps newest at the right, with empty slots left. */
export function rachaCronologica(recientes:readonly string[]):(string|null)[]{
 const ultimos=recientes.slice(0,5).reverse();
 return [...Array<null>(5-ultimos.length).fill(null),...ultimos];
}

const madridParts=(d:Date)=>{const tz={timeZone:"Europe/Madrid"} as const;return {
  dia:d.toLocaleDateString("es-ES",{...tz,weekday:"short"}).replace(".",""),num:d.toLocaleDateString("es-ES",{...tz,day:"numeric"}),
  mes:d.toLocaleDateString("es-ES",{...tz,month:"short"}).replace(".",""),hora:d.toLocaleTimeString("es-ES",{...tz,hour:"2-digit",minute:"2-digit"})};};
/** "Fin de semana del 29 nov" when the date is a reference; otherwise "Sáb 28 nov · 18:30" (time only if confirmed). */
export function fechaPartidoTexto(partido:Partido):string{
  const d=inicioPartido(partido);if(!d)return "Fecha por confirmar";
  const p=madridParts(d);
  if(partido.fechaConfirmada===false)return `Fin de semana del ${p.num} ${p.mes}`;
  const base=`${p.dia.charAt(0).toUpperCase()}${p.dia.slice(1)} ${p.num} ${p.mes}`;
  return partido.horaConfirmada===false?base:`${base} · ${p.hora}`;
}
export function golesLiga(partidos:readonly Partido[]){
  let gf=0,gc=0;
  for(const p of partidos){if(!p.jugado||p.golesLocal===null||p.golesVisitante===null)continue;gf+=p.esLocal?p.golesLocal:p.golesVisitante;gc+=p.esLocal?p.golesVisitante:p.golesLocal;}
  return {gf,gc,dg:gf-gc};
}
export function textoDiferencia(dg:number){return dg>0?`+${dg}`:dg<0?`−${Math.abs(dg)}`:"0";}
/** Unplayed fixtures from the next one onward, by jornada, optionally home-only. */
export function proximosCalendario(partidos:readonly Partido[],ahora:Date,soloCasa=false,limite=3){
  const siguiente=proximoPartido([...partidos],ahora);
  const desde=siguiente?.jornada??Infinity;
  return [...partidos].filter(p=>!p.jugado&&(p.jornada??0)>=desde&&(!soloCasa||p.esLocal)).sort((a,b)=>(a.jornada??0)-(b.jornada??0)).slice(0,limite);
}
