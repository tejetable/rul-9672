import { z } from 'zod';

export const lecturaSchema = z.object({
  golesRul: z.number().int().min(0).nullable(),
  golesRival: z.number().int().min(0).nullable(),
  jugadores: z.array(z.object({
    nombre: z.string().min(1),
    goles: z.number().int().min(0).default(0),
    asistencias: z.number().int().min(0).default(0),
    amarillas: z.number().int().min(0).default(0),
    rojas: z.number().int().min(0).default(0),
  })).default([]),
});
export type LecturaPieza = z.infer<typeof lecturaSchema>;
export type LineaLeida = LecturaPieza['jugadores'][number];
type JugadorBase = { id: string; nombre: string; apodo: string };
type Fila = { jugadorId: string; goles: number; asistencias: number; amarillas: number; rojas: number };

export const normalizarNombre = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export function emparejarJugador<J extends JugadorBase>(jugadores: J[], nombre: string): J | undefined {
  const n = normalizarNombre(nombre);
  return jugadores.find(j => normalizarNombre(j.apodo) === n) ?? jugadores.find(j => normalizarNombre(j.nombre) === n);
}

/** Builds counters from a reading; never touches stored data. */
export function aplicarLectura(jugadores: JugadorBase[], lectura: LecturaPieza) {
  const filas: Record<string, Fila> = {};
  const sinEmparejar: LineaLeida[] = [];
  for (const l of lectura.jugadores) {
    const j = emparejarJugador(jugadores, l.nombre);
    if (!j) { sinEmparejar.push(l); continue; }
    filas[j.id] = sumarLinea(filas[j.id] ?? { jugadorId: j.id, goles: 0, asistencias: 0, amarillas: 0, rojas: 0 }, l);
  }
  return { filas, sinEmparejar };
}
export const sumarLinea = (f: Fila, l: LineaLeida): Fila => ({ ...f, goles: f.goles + l.goles, asistencias: f.asistencias + l.asistencias, amarillas: f.amarillas + l.amarillas, rojas: f.rojas + l.rojas });

export function resultadoCoincide(lectura: Pick<LecturaPieza, 'golesRul' | 'golesRival'>, favor: number | null | undefined, contra: number | null | undefined) {
  if (lectura.golesRul === null || lectura.golesRival === null) return true;
  return lectura.golesRul === favor && lectura.golesRival === contra;
}
