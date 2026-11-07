import { describe, expect, it } from "vitest";
import { estadisticas, progresoObjetivo, repiteViaClub, yaRegistradaHoy, type Visita } from "./visitas";

const v = (p: Partial<Visita>): Visita => ({
  id: Math.random().toString(),
  patrocinadorId: "p1",
  fechaHora: "2026-11-05T10:00:00",
  origen: "numero",
  tipoCliente: "nueva",
  repiteViaClub: false,
  verificada: true,
  anulada: false,
  ...p,
});

describe("visitas", () => {
  it("bloquea una segunda visita del mismo socio en el mismo negocio el mismo día", () => {
    const vs = [v({ socioId: "s1", fechaHora: "2026-11-07T09:00:00" })];
    expect(yaRegistradaHoy(vs, "p1", "s1", new Date("2026-11-07T18:00:00"))).toBe(true);
    expect(yaRegistradaHoy(vs, "p2", "s1", new Date("2026-11-07T18:00:00"))).toBe(false);
  });

  it("una visita anulada no cuenta para el límite diario ni para repetir", () => {
    const vs = [v({ socioId: "s1", fechaHora: "2026-11-07T09:00:00", anulada: true })];
    expect(yaRegistradaHoy(vs, "p1", "s1", new Date("2026-11-07T18:00:00"))).toBe(false);
    expect(repiteViaClub(vs, "p1", "s1", new Date("2026-11-08T10:00:00"))).toBe(false);
  });

  it("repite por el club si ya tenía una visita anterior en ese negocio", () => {
    const vs = [v({ socioId: "s1", fechaHora: "2026-10-01T10:00:00" })];
    expect(repiteViaClub(vs, "p1", "s1", new Date("2026-11-01T10:00:00"))).toBe(true);
  });

  it("separa nuevas verificadas (con carnet) de declaradas (sin carnet)", () => {
    const vs = [v({}), v({ verificada: false, origen: "sin_carne" }), v({ tipoCliente: "ya_era_clienta" })];
    const s = estadisticas(vs, "p1", new Date("2026-01-01"));
    expect(s).toMatchObject({ visitas: 3, nuevas: 2, nuevasVerificadas: 1, nuevasDeclaradas: 1, pctNuevas: 67 });
  });

  it("el objetivo es 5 clientas nuevas en 90 días", () => {
    const ahora = new Date("2026-11-07T12:00:00");
    const vs = [...Array(3)].map(() => v({ fechaHora: "2026-11-01T10:00:00" })).concat(v({ fechaHora: "2026-07-01T10:00:00" }));
    expect(progresoObjetivo(vs, "p1", ahora)).toEqual({ nuevas: 3, objetivo: 5, pct: 60 });
  });
});
