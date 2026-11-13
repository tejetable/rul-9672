import type { Partido } from "./dataService";

/** The prototype's confirmed fixture times are Madrid local time. */
export function inicioPartido(partido: Partido): Date | null {
  const match = partido.fechaHora.match(/(\d{2})\/(\d{2})\/(\d{4}).*?(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, dia, mes, ano, hora, minuto] = match;
  // Fixtures in November use Madrid's winter offset, independent of device timezone.
  return new Date(`${ano}-${mes}-${dia}T${hora}:${minuto}:00+01:00`);
}

export function cuentaPartido(inicio: Date, ahora: Date) {
  if (ahora.getTime() >= inicio.getTime()) return { estado: "en_juego" as const, dias: 0, horas: 0, minutos: 0 };
  const madrid = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
  const minutos = Math.ceil((inicio.getTime() - ahora.getTime()) / 60000);
  return {
    estado: madrid(inicio) === madrid(ahora) ? "hoy" as const : "pendiente" as const,
    dias: Math.floor(minutos / 1440), horas: Math.floor((minutos % 1440) / 60), minutos: minutos % 60,
  };
}

export function calendarioPartido(partido: Partido): string | null {
  const inicio = inicioPartido(partido);
  if (!inicio) return null;
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const stamp = inicio.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RUL//Partidos//ES", "BEGIN:VEVENT", `UID:${partido.id}-2026@rul`, `DTSTAMP:${stamp}`, `DTSTART:${stamp}`, `SUMMARY:${escape(`Concello de Guntín - R.U. Lucense vs ${partido.rival}`)}`, `LOCATION:${escape(partido.lugar)}`, `DESCRIPTION:${escape(partido.competicion || "")}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
}