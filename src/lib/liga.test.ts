import { describe, expect, it } from "vitest";
import datos from "@/data/liga-2026-27.json";
import { calcularClasificacion, ultimaJornadaJugada, type PartidoLiga } from "./liga";

const partidos = datos.partidos as PartidoLiga[];
// Clasificación oficial de la federación tras los partidos jugados hasta el 22/11/2026.
const oficial: [string, number, number, number, number, number, number, number][] = [
  ["cubelas", 19, 8, 6, 1, 1, 46, 12], ["begonte-b", 19, 7, 6, 1, 0, 36, 20], ["ru-lucense", 18, 8, 6, 0, 2, 61, 41],
  ["trabada", 16, 8, 5, 1, 2, 39, 34], ["castroverde", 15, 8, 5, 0, 3, 37, 30], ["pasarela-ribeira-b", 15, 7, 5, 0, 2, 40, 17],
  ["samos", 13, 7, 4, 1, 2, 30, 29], ["luisitalia", 12, 8, 4, 0, 4, 44, 43], ["piringalla", 12, 8, 4, 0, 4, 37, 37],
  ["cospeito", 9, 7, 3, 0, 4, 27, 24], ["val-do-sil", 9, 8, 3, 0, 5, 34, 37], ["abella", 8, 8, 2, 2, 4, 39, 42],
  ["outeiro-de-rei-b", 7, 8, 2, 1, 5, 37, 56], ["fonte-do-rei", 6, 8, 2, 0, 6, 18, 36], ["pastoricense", 4, 8, 1, 1, 6, 25, 62],
  ["friol-b", -3, 8, 0, 0, 8, 30, 60],
];

describe("clasificación calculada", () => {
  const tabla = calcularClasificacion(datos.equipos, partidos, datos.sanciones);
  it("coincide con la de la federación, fila a fila y en el mismo orden", () => {
    expect(tabla.map((f) => [f.equipo.id, f.puntos, f.pj, f.g, f.e, f.p, f.gf, f.gc])).toEqual(oficial);
  });
  it("aplica la sanción del Friol B", () => {
    const friol = tabla.find((f) => f.equipo.id === "friol-b")!;
    expect(friol.sancion).toBe(-3);
    expect(friol.puntos).toBe(-3);
  });
  it("con empate a puntos y un partido entre ellos, manda el enfrentamiento directo (Castroverde por delante de Ribeira B)", () => {
    const ids = tabla.map((f) => f.equipo.id);
    expect(ids.indexOf("castroverde")).toBeLessThan(ids.indexOf("pasarela-ribeira-b"));
  });
  it("con la regla general primero, Ribeira B pasaría por delante por diferencia de goles", () => {
    const ids = calcularClasificacion(datos.equipos, partidos, datos.sanciones, "general-primero").map((f) => f.equipo.id);
    expect(ids.indexOf("pasarela-ribeira-b")).toBeLessThan(ids.indexOf("castroverde"));
  });
  it("los partidos aplazados no cuentan", () => {
    const conAplazado = partidos.map((p) => (p.jornada === 8 && p.local === "cubelas" ? { ...p, aplazado: true } : p));
    const ru = calcularClasificacion(datos.equipos, conAplazado, datos.sanciones).find((f) => f.equipo.id === "ru-lucense")!;
    expect(ru.pj).toBe(7);
    expect(ru.puntos).toBe(15);
  });
  it("sabe cuál es la última jornada con resultados", () => {
    expect(ultimaJornadaJugada(partidos)).toBe(8);
  });
  it("tiene las 30 jornadas con 8 partidos cada una", () => {
    expect(partidos.length).toBe(240);
    for (let j = 1; j <= 30; j++) expect(partidos.filter((p) => p.jornada === j).length).toBe(8);
  });
});
