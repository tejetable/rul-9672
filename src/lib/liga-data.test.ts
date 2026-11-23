import { describe, expect, it } from 'vitest';
import liga from '../data/liga-2026-27.json';

describe('Datos de liga aportados para 2026/27', () => {
  it('contiene los 16 equipos sin identificadores repetidos', () => {
    expect(liga.equipos).toHaveLength(16);
    expect(new Set(liga.equipos.map(e => e.id)).size).toBe(16);
    expect(liga.equipos.filter(e => e.esNuestro).map(e => e.id)).toEqual(['ru-lucense']);
  });
  it('contiene 240 partidos únicos con ocho por jornada', () => {
    expect(liga.partidos).toHaveLength(240);
    expect(new Set(liga.partidos.map(p => `${p.jornada}|${p.local}|${p.visitante}`)).size).toBe(240);
    for (let jornada = 1; jornada <= 30; jornada++) {
      expect(liga.partidos.filter(p => p.jornada === jornada)).toHaveLength(8);
    }
  });
  it('contiene exactamente 62 resultados completos y no negativos', () => {
    expect(liga.partidos.filter(p => p.golesLocal !== null)).toHaveLength(62);
    for (const p of liga.partidos) {
      expect(p.golesLocal === null).toBe(p.golesVisitante === null);
      if (p.golesLocal !== null) expect(p.golesLocal).toBeGreaterThanOrEqual(0);
      if (p.golesVisitante !== null) expect(p.golesVisitante).toBeGreaterThanOrEqual(0);
    }
  });
  it('conserva la única sanción del Friol B de menos tres puntos', () => {
    expect(liga.sanciones).toHaveLength(1);
    expect(liga.sanciones[0]).toMatchObject({ equipo: 'friol-b', puntos: -3 });
  });
  it('referencia equipos existentes y los 30 partidos del R.U. Lucense', () => {
    const ids = new Set(liga.equipos.map(e => e.id));
    for (const p of liga.partidos) {
      expect(ids.has(p.local)).toBe(true);
      expect(ids.has(p.visitante)).toBe(true);
      expect(p.local).not.toBe(p.visitante);
    }
    expect(liga.partidos.filter(p => p.local === 'ru-lucense' || p.visitante === 'ru-lucense')).toHaveLength(30);
  });
});