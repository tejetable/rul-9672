import { describe, expect, it } from 'vitest';
import { aplicarLectura, resultadoCoincide } from './pieza-resultado';
const js = [{ id: 'r', nombre: 'Rubén', apodo: 'Rubi' }, { id: 'g', nombre: 'Goás', apodo: 'Goás' }];
const l = (nombre: string, goles = 0) => ({ nombre, goles, asistencias: 0, amarillas: 0, rojas: 0 });
describe('pieza de resultado', () => {
  it('empareja por apodo o nombre sin tildes ni mayúsculas', () => {
    const r = aplicarLectura(js, { golesRul: 3, golesRival: 1, jugadores: [l('RUBEN', 2), l('goas', 1)] });
    expect(r.filas['r']?.goles).toBe(2); expect(r.filas['g']?.goles).toBe(1); expect(r.sinEmparejar).toEqual([]);
  });
  it('deja sin emparejar los nombres desconocidos', () => {
    expect(aplicarLectura(js, { golesRul: 1, golesRival: 0, jugadores: [l('Pepe', 1)] }).sinEmparejar[0]?.nombre).toBe('Pepe');
  });
  it('detecta resultado distinto al del partido', () => {
    expect(resultadoCoincide({ golesRul: 10, golesRival: 6 }, 10, 6)).toBe(true);
    expect(resultadoCoincide({ golesRul: 9, golesRival: 6 }, 10, 6)).toBe(false);
  });
});
