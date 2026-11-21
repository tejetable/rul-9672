export interface FilaClasificacion { posicion: number; equipo: string; puntos: number; pj: number; g: number; e: number; p: number; gf: number; gc: number; esNuestro: boolean }

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const esNuestroEquipo = (equipo: string) => /lucense|guntin/.test(norm(equipo));

/** Parses a pasted table: one row per team: position, team, points, PJ, G, E, P, GF, GC (extra trailing columns ignored). */
export function interpretarClasificacion(texto: string): FilaClasificacion[] {
  const filas: FilaClasificacion[] = [];
  for (const linea of texto.split(/\r?\n/)) {
    const t = linea.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
    const m = t.match(/^(\d+)[º°.ª]?\s+(.+?)\s+((?:-?\d+\s+){6,}-?\d+)$/);
    if (!m) continue;
    const nums = m[3]!.trim().split(' ').map(Number);
    const [puntos, pj, g, e, p, gf, gc] = nums as [number, number, number, number, number, number, number];
    const equipo = m[2]!.trim();
    filas.push({ posicion: Number(m[1]), equipo, puntos, pj, g, e, p, gf, gc, esNuestro: esNuestroEquipo(equipo) });
  }
  return filas;
}
