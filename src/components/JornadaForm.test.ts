import { describe, expect, it } from "vitest";
import { jornadaPorDefecto } from "./JornadaForm";

describe("jornadaPorDefecto", () => {
  const partidos = [
    { jornada: 8, fecha: "2026-11-21" },
    { jornada: 8, fecha: "2026-11-22" },
    { jornada: 9, fecha: "2026-11-28" },
    { jornada: 10, fecha: null },
  ];
  it("abre la última jornada que ya ha empezado", () => {
    expect(jornadaPorDefecto(partidos, "2026-11-23")).toBe(8);
    expect(jornadaPorDefecto(partidos, "2026-11-28")).toBe(9);
  });
  it("sin jornadas empezadas, la 1", () => {
    expect(jornadaPorDefecto(partidos, "2026-09-01")).toBe(1);
  });
});
