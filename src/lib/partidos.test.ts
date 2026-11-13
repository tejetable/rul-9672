import { describe, expect, it } from "vitest";
import { calendarioPartido, cuentaPartido, inicioPartido } from "./partidos";
import type { Partido } from "./dataService";

const partido: Partido = { id: "m2", rival: "Abella F.C.", fechaHora: "sábado 14/11/2026 · 19:00", lugar: "Pabellón de Guntín", competicion: "Primera Futgal", esLocal: true, jugado: false, golesLocal: null, golesVisitante: null };
const inicio = new Date("2026-11-14T18:00:00Z");
describe("Fecha y cuenta atrás del partido", () => {
  it("interpreta las 19:00 en Madrid, no en la zona horaria del móvil", () => {
    expect(inicioPartido(partido)?.toISOString()).toBe("2026-11-14T18:00:00.000Z");
  });
  it("calcula días, horas y minutos restantes", () => {
    expect(cuentaPartido(inicio, new Date("2026-11-13T17:05:00Z"))).toEqual({ estado: "pendiente", dias: 1, horas: 0, minutos: 55 });
  });
  it("muestra hoy desde medianoche de Madrid", () => {
    expect(cuentaPartido(inicio, new Date("2026-11-13T23:01:00Z")).estado).toBe("hoy");
  });
  it("pasa a en juego a las 19:00", () => {
    expect(cuentaPartido(inicio, inicio).estado).toBe("en_juego");
  });
  it("actualiza el minuto restante al avanzar un minuto", () => {
    expect(cuentaPartido(inicio, new Date("2026-11-13T17:06:00Z")).minutos).toBe(54);
  });
});
describe("Descarga de calendario", () => {
  it("exporta el encuentro, la ubicación y el inicio confirmado", () => {
    const ics = calendarioPartido(partido);
    expect(ics).toContain("DTSTART:20261114T180000Z\r\n");
    expect(ics).toContain("SUMMARY:Concello de Guntín - R.U. Lucense vs Abella F.C.");
    expect(ics).toContain("LOCATION:Pabellón de Guntín");
    expect(ics).toContain("DESCRIPTION:Primera Futgal");
  });
});