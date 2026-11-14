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