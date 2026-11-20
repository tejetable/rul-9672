import { describe, expect, it } from "vitest";
import { fechaHumana } from "./fechas";
describe("fechaHumana", () => {
  it("formatea como Dom 22 nov · 12:00", () => {
    expect(fechaHumana("2026-11-22T11:00:00Z", true)).toBe("Dom 22 nov · 12:00");
  });
  it("acepta fechas sin hora", () => { expect(fechaHumana("2026-11-22")).toBe("Dom 22 nov"); });
});
