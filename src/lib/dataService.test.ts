import { beforeEach, describe, expect, it } from "vitest";
import { dataService } from "./dataService";

beforeEach(() => window.localStorage.clear());

describe("Próximo partido", () => {
  it("guarda Abella el sábado 14 de noviembre a las 19:00 en Guntín", () => {
    const partido = dataService.get().partidos.find((p) => !p.jugado);
    expect(partido).toMatchObject({ rival: "Abella F.C.", fechaHora: "sábado 14/11/2026 · 19:00", lugar: "Pabellón de Guntín", competicion: "Primera Futgal" });
  });
  it("actualiza también la fecha y hora del aviso", () => {
    const aviso = dataService.get().avisos.find((a) => a.id === "a2");
    expect(aviso?.texto).toContain("sábado 14/11/2026 · 19:00");
  });
  it("actualiza prototipos existentes sin perder socios o avisos propios", () => {
    const db = dataService.get();
    const partido = db.partidos.find((p) => p.id === "m2");
    const aviso = db.avisos.find((a) => a.id === "a2");
    if (!partido || !aviso) throw new Error("Faltan datos del partido");
    partido.fechaHora = "";
    delete partido.competicion;
    aviso.texto = "Fecha y hora por confirmar";
    const socio = db.socios[0];
    if (!socio) throw new Error("Falta socio de demostración");
    socio.nombre = "Nombre conservado";
    window.localStorage.setItem("rul-demo-db-v6", JSON.stringify(db));
    const actualizado = dataService.get();
    expect(actualizado.partidos.find((p) => p.id === "m2")?.fechaHora).toBe("sábado 14/11/2026 · 19:00");
    expect(actualizado.avisos.find((a) => a.id === "a2")?.texto).toContain("19:00");
    expect(actualizado.socios[0]?.nombre).toBe("Nombre conservado");
  });
});

describe("Lectura de avisos por audiencia", () => {
  it.each(["socias", "negocios"] as const)("marca los avisos de %s sin marcar los de la otra audiencia", (quien) => {
    const db = dataService.get();
    db.avisos.push(
      { id: "solo-socias", titulo: "Socias", texto: "Aviso", fecha: new Date().toISOString(), tipo: "club", para: "socias" },
      { id: "solo-negocios", titulo: "Negocios", texto: "Aviso", fecha: new Date().toISOString(), tipo: "club", para: "negocios" },
    );
    window.localStorage.setItem("rul-demo-db-v6", JSON.stringify(db));
    expect(dataService.avisosLeidos()).toEqual([]);
    dataService.marcarAvisosLeidos(quien);
    expect(dataService.avisosLeidos()).toContain("solo-" + quien);
    expect(dataService.avisosLeidos()).toContain("a2");
    expect(dataService.avisosLeidos()).not.toContain(quien === "socias" ? "solo-negocios" : "solo-socias");
  });
});