import { describe, expect, it } from 'vitest';
import { interpretarClasificacion } from './clasificacion';
describe('interpretarClasificacion', () => {
  it('lee posición, equipo y los siete números en orden', () => {
    const r = interpretarClasificacion('1\tA.D.C. A Piringalla\t18\t7\t6\t0\t1\t60\t30\n4º Concello de Guntín - R.U. Lucense 15 7 5 0 2 54 37 17\ncabecera Pos Equipo Pts');
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ posicion: 1, equipo: 'A.D.C. A Piringalla', puntos: 18, pj: 7, gc: 30, esNuestro: false });
    expect(r[1]).toMatchObject({ posicion: 4, puntos: 15, g: 5, e: 0, p: 2, gf: 54, gc: 37, esNuestro: true });
  });
});
