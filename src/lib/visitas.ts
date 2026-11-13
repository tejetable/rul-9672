// Reglas de las visitas que el club trae a cada negocio. Funciones puras (testeadas).

export interface Visita {
  id: string;
  patrocinadorId: string;
  fechaHora: string;
  numeroSocio?: number | undefined;
  socioId?: string | undefined;
  origen: "qr" | "numero" | "sin_carne";
  tipoCliente: "nueva" | "ya_era_clienta";
  repiteViaClub: boolean;
  verificada: boolean;
  ventajaId?: string | undefined;
  anulada: boolean;
}

export const OBJETIVO_NUEVAS = 5;
export const VENTANA_OBJETIVO_DIAS = 90;
export const INICIO_TEMPORADA = "2026-09-01";

const vivas = (vs: Visita[], patId: string | null) => vs.filter((v) => !v.anulada && (patId === null || v.patrocinadorId === patId));

const mismoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** true si ese socio ya tenía una visita anterior (no anulada) en este negocio */
export function repiteViaClub(vs: Visita[], patId: string, socioId: string, antesDe = new Date()) {
  return vivas(vs, patId).some((v) => v.socioId === socioId && new Date(v.fechaHora) < antesDe);
}

/** Máximo 1 visita por socio, negocio y día */
export function yaRegistradaHoy(vs: Visita[], patId: string, socioId: string, ahora = new Date()) {
  return vivas(vs, patId).some((v) => v.socioId === socioId && mismoDia(new Date(v.fechaHora), ahora));
}

export function desdeRango(rango: "mes" | "90" | "temporada", ahora = new Date()) {
  if (rango === "mes") return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  if (rango === "90") return new Date(ahora.getTime() - VENTANA_OBJETIVO_DIAS * 86400000);
  return new Date(INICIO_TEMPORADA);
}

export function estadisticas(vs: Visita[], patId: string | null, desde: Date) {
  const r = vivas(vs, patId).filter((v) => new Date(v.fechaHora) >= desde);
  const nuevas = r.filter((v) => v.tipoCliente === "nueva");
  return {
    visitas: r.length,
    nuevas: nuevas.length,
    nuevasVerificadas: nuevas.filter((v) => v.verificada).length,
    nuevasDeclaradas: nuevas.filter((v) => !v.verificada).length,
    repiten: r.filter((v) => v.repiteViaClub).length,
    pctNuevas: r.length ? Math.round((nuevas.length / r.length) * 100) : 0,
    verificadas: r.filter((v) => v.verificada).length,
    declaradas: r.filter((v) => !v.verificada).length,
  };
}

export function progresoObjetivo(vs: Visita[], patId: string, ahora = new Date()) {
  const n = estadisticas(vs, patId, desdeRango("90", ahora)).nuevas;
  return { nuevas: n, objetivo: OBJETIVO_NUEVAS, pct: Math.min(100, Math.round((n / OBJETIVO_NUEVAS) * 100)) };
}

export function porSemana(vs: Visita[], patId: string | null, ahora = new Date(), semanas = 8) {
  const r = vivas(vs, patId);
  return Array.from({ length: semanas }, (_, i) => {
    const fin = new Date(ahora.getTime() - (semanas - 1 - i) * 7 * 86400000);
    const ini = new Date(fin.getTime() - 7 * 86400000);
    const w = r.filter((v) => {
      const d = new Date(v.fechaHora);
      return d > ini && d <= fin;
    });
    return { label: `S${i + 1}`, total: w.length, nuevas: w.filter((v) => v.tipoCliente === "nueva").length };
  });
}

export type Rango = "mes" | "90" | "temporada";

/** Barras del gráfico según el filtro: semanas del mes, ~13 semanas o meses de temporada */
export function serieGrafico(vs: Visita[], patId: string | null, rango: Rango, ahora = new Date()) {
  const r = vivas(vs, patId);
  const tramo = (label: string, ini: Date, fin: Date) => {
    const w = r.filter((v) => { const d = new Date(v.fechaHora); return d >= ini && d < fin; });
    return { label, total: w.length, nuevas: w.filter((v) => v.tipoCliente === "nueva").length };
  };
  if (rango === "temporada") {
    const out = [];
    const ini = new Date(INICIO_TEMPORADA + "T00:00:00");
    for (let d = new Date(ini.getFullYear(), ini.getMonth(), 1); d <= ahora; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      out.push(tramo(d.toLocaleDateString("es-ES", { month: "short" }).replace(".", ""), d, new Date(d.getFullYear(), d.getMonth() + 1, 1)));
    }
    return out;
  }
  if (rango === "mes") {
    const out = [];
    const m0 = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    for (let i = 0; ; i++) {
      const ini = new Date(m0.getFullYear(), m0.getMonth(), 1 + i * 7);
      if (ini > ahora || ini.getMonth() !== m0.getMonth()) break;
      const fin = new Date(m0.getFullYear(), m0.getMonth(), 1 + (i + 1) * 7);
      out.push(tramo(`S${i + 1}`, ini, fin));
    }
    return out;
  }
  const fin = new Date(ahora.getTime() + 1);
  return Array.from({ length: 13 }, (_, i) => {
    const f = new Date(fin.getTime() - (12 - i) * 7 * 86400000);
    return tramo(`S${i + 1}`, new Date(f.getTime() - 7 * 86400000), f);
  });
}

const PREFIJO: Record<Rango, string> = { mes: "Este mes", "90": "En los últimos 90 días", temporada: "Esta temporada" };

export function fraseMes(s: { visitas: number; nuevas: number; repiten: number }, rango: Rango = "mes") {
  return `${PREFIJO[rango]}, ${s.visitas} personas de nuestra familia han pasado por tu casa. ${s.nuevas} por primera vez, y ${s.repiten} ya han vuelto.`;
}
