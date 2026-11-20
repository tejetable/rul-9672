import { describe, expect, it } from "vitest";
import type { Partido } from "./dataService";
import { fechaPartidoTexto, golesLiga, proximosCalendario, textoDiferencia } from "./partidos";
const base = { id: "", lugar: "", golesLocal: null, golesVisitante: null, jugado: false } as const;
const jugados: Partido[] = [[5,6,true],[12,9,true],[7,4,true],[3,6,false],[9,2,true],[10,6,false],[8,4,true]].map(([f,c,l],i)=>({ ...base, id:`j${i+1}`, jornada:i+1, rival:"R", fechaHora:`2026-10-0${i+1}T10:00:00Z`, esLocal:!!l, jugado:true, golesLocal:l?Number(f):Number(c), golesVisitante:l?Number(c):Number(f) }));
const j8: Partido = { ...base, id:"j8", jornada:8, rival:"CD Cubelas FS", fechaHora:"2026-11-22T11:00:00Z", esLocal:false, horaConfirmada:false };
const j9: Partido = { ...base, id:"j9", jornada:9, rival:"Luisitalia", fechaHora:"2026-11-29T11:00:00Z", esLocal:true, horaConfirmada:false, fechaConfirmada:false };
const ahora = new Date("2026-11-20T18:00:00Z");
describe("calendario y liga", () => {
  it("suma GF 54, GC 37, DG +17", () => { const g = golesLiga(jugados); expect(g).toEqual({ gf:54, gc:37, dg:17 }); expect(textoDiferencia(g.dg)).toBe("+17"); });
  it("fecha no confirmada", () => { expect(fechaPartidoTexto(j9)).toBe("Fin de semana del 29 nov"); });
  it("fecha y hora confirmadas", () => { expect(fechaPartidoTexto({ ...j9, fechaConfirmada:true, horaConfirmada:true, fechaHora:"2026-11-28T17:30:00Z" })).toBe("Sáb 28 nov · 18:30"); });
  it("próximo es J8 y en casa J9", () => {
    expect(proximosCalendario([...jugados,j8,j9],ahora)[0]?.jornada).toBe(8);
    expect(proximosCalendario([...jugados,j8,j9],ahora,true)[0]?.jornada).toBe(9);
  });
});
