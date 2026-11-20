/** Fecha legible para personas: "Dom 22 nov" (y " · 12:00" si se pide hora). Zona Europe/Madrid. */
export function fechaHumana(valor: string | Date, conHora = false): string {
  const d = typeof valor === "string" ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? `${valor}T12:00:00` : valor) : valor;
  if (Number.isNaN(d.getTime())) return "";
  const tz = { timeZone: "Europe/Madrid" } as const;
  const dia = d.toLocaleDateString("es-ES", { ...tz, weekday: "short" }).replace(".", "");
  const num = d.toLocaleDateString("es-ES", { ...tz, day: "numeric" });
  const mes = d.toLocaleDateString("es-ES", { ...tz, month: "short" }).replace(".", "");
  const base = `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${num} ${mes}`;
  return conHora ? `${base} · ${d.toLocaleTimeString("es-ES", { ...tz, hour: "2-digit", minute: "2-digit" })}` : base;
}
