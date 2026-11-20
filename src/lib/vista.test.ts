import { beforeEach, describe, expect, it } from "vitest";
import { claseVista, guardarVista, leerVista } from "./vista";

describe("vista de la app de soci@", () => {
  beforeEach(() => localStorage.clear());
  it("por defecto es Light (día)", () => { expect(leerVista()).toBe("dia"); expect(claseVista("dia")).toBe("theme-dia"); });
  it("recuerda Strong y lo marca en <html> para la pantalla de carga", () => {
    guardarVista("noche");
    expect(leerVista()).toBe("noche");
    expect(document.documentElement.dataset["vista"]).toBe("noche");
    expect(claseVista("noche")).toBe("theme-noche");
  });
});
