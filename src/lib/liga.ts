/** Clasificación de la liga calculada a partir de los resultados (sin IA ni copiar tablas).
 *  Victoria 3, empate 1, derrota 0; las sanciones restan puntos. */
export interface EquipoLiga { id: string; nombre: string; corto: string; esNuestro?: boolean }
export interface PartidoLiga { jornada: number; fecha: string | null; local: string; visitante: string; golesLocal: number | null; golesVisitante: number | null; aplazado?: boolean }
export interface SancionLiga { equipo: string; puntos: number; motivo?: string }
export interface FilaLiga { posicion: number; equipo: EquipoLiga; puntos: number; pj: number; g: number; e: number; p: number; gf: number; gc: number; dg: number; sancion: number; empatado: boolean }

/**
 * Desempate entre equipos con los mismos puntos:
 * - "directo-primero" (lo que aplica hoy la federación): primero los partidos entre los empatados que ya se han
 *   jugado (puntos y diferencia de goles entre ellos), después diferencia de goles general y goles a favor.
 * - "general-primero": diferencia de goles y goles a favor; el enfrentamiento directo solo cuenta cuando ya se
 *   han jugado los dos partidos entre ellos, y entonces va primero.
 */
export type ReglaDesempate = "directo-primero" | "general-primero";

export const jugado = (p: PartidoLiga) => !p.aplazado && p.golesLocal != null && p.golesVisitante != null;

function vacio() { return { puntos: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 }; }
function sumar(t: ReturnType<typeof vacio>, gf: number, gc: number) {
  t.pj++; t.gf += gf; t.gc += gc;
  if (gf > gc) { t.g++; t.puntos += 3; } else if (gf === gc) { t.e++; t.puntos += 1; } else t.p++;
}

/** Mini-liga entre un grupo de equipos: solo sus partidos entre ellos ya jugados. */
function miniLiga(ids: string[], partidos: PartidoLiga[]) {
  const set = new Set(ids);
  const t = new Map(ids.map((id) => [id, vacio()]));
  let enfrentamientos = 0;
  for (const p of partidos) {
    if (!set.has(p.local) || !set.has(p.visitante) || !jugado(p)) continue;
    enfrentamientos++;
    sumar(t.get(p.local)!, p.golesLocal!, p.golesVisitante!);
    sumar(t.get(p.visitante)!, p.golesVisitante!, p.golesLocal!);
  }
  return { t, enfrentamientos };
}

export function calcularClasificacion(equipos: EquipoLiga[], partidos: PartidoLiga[], sanciones: SancionLiga[] = [], regla: ReglaDesempate = "directo-primero"): FilaLiga[] {
  const tabla = new Map(equipos.map((e) => [e.id, vacio()]));
  for (const p of partidos) {
    if (!jugado(p)) continue;
    const l = tabla.get(p.local), v = tabla.get(p.visitante);
    if (!l || !v) continue;
    sumar(l, p.golesLocal!, p.golesVisitante!);
    sumar(v, p.golesVisitante!, p.golesLocal!);
  }
  const sancion = new Map<string, number>();
  for (const s of sanciones) sancion.set(s.equipo, (sancion.get(s.equipo) ?? 0) + s.puntos);
  const filas = equipos.map((equipo) => {
    const t = tabla.get(equipo.id)!;
    const sanc = sancion.get(equipo.id) ?? 0;
    return { equipo, ...t, puntos: t.puntos + sanc, sancion: sanc, dg: t.gf - t.gc, posicion: 0, empatado: false };
  });

  // Ordenar por puntos y resolver cada grupo de empatados.
  const porPuntos = new Map<number, FilaLiga[]>();
  for (const f of filas) porPuntos.set(f.puntos, [...(porPuntos.get(f.puntos) ?? []), f]);
  const ordenadas: FilaLiga[] = [];
  for (const pts of [...porPuntos.keys()].sort((a, b) => b - a)) {
    const grupo = porPuntos.get(pts)!;
    if (grupo.length > 1) {
      const { t: mini, enfrentamientos } = miniLiga(grupo.map((f) => f.equipo.id), partidos);
      // Ida y vuelta completas entre todos los del grupo: n·(n−1) partidos.
      const completos = enfrentamientos === grupo.length * (grupo.length - 1);
      const usarDirecto = regla === "directo-primero" ? enfrentamientos > 0 : completos;
      const general = (a: FilaLiga, b: FilaLiga) => b.dg - a.dg || b.gf - a.gf;
      const directo = (a: FilaLiga, b: FilaLiga) => {
        const ma = mini.get(a.equipo.id)!, mb = mini.get(b.equipo.id)!;
        return mb.puntos - ma.puntos || (mb.gf - mb.gc) - (ma.gf - ma.gc);
      };
      grupo.sort((a, b) => (usarDirecto ? directo(a, b) || general(a, b) : general(a, b) || directo(a, b)) || a.equipo.nombre.localeCompare(b.equipo.nombre, "es"));
      grupo.forEach((f, i) => { f.empatado = i > 0 ? sinDesempate(grupo[i - 1]!, f, mini) : false; });
    }
    ordenadas.push(...grupo);
  }
  ordenadas.forEach((f, i) => { f.posicion = f.empatado ? ordenadas[i - 1]!.posicion : i + 1; });
  return ordenadas;
}

/** Dos equipos siguen igualados en todo: comparten puesto. */
function sinDesempate(a: FilaLiga, b: FilaLiga, mini: Map<string, ReturnType<typeof vacio>>) {
  const ma = mini.get(a.equipo.id)!, mb = mini.get(b.equipo.id)!;
  return a.dg === b.dg && a.gf === b.gf && ma.puntos === mb.puntos && ma.gf - ma.gc === mb.gf - mb.gc;
}

/** Última jornada con algún resultado. */
export function ultimaJornadaJugada(partidos: PartidoLiga[]) {
  return partidos.filter(jugado).reduce((m, p) => Math.max(m, p.jornada), 0);
}
