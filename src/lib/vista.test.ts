import { beforeEach, describe, expect, it } from "vitest";
import { claseVista, guardarVista, leerVista } from "./vista";

describe("vista de la app de soci@", () => {
  beforeEach(() => localStorage.clear());
  it("por defecto es Noche de partido", () => { expect(leerVista()).toBe("noche"); expect(claseVista("noche")).toBe("theme-noche"); });
  it("recuerda la vista de día", () => { guardarVista("dia"); expect(leerVista()).toBe("dia"); expect(claseVista("dia")).toBe("theme-dia"); });
});
