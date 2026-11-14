import { describe, expect, it } from "vitest";
import { calendarioPartido, cuentaPartido, inicioPartido, proximoPartido, partidoEnCurso, ultimoPartido, resultadoPartido, fechaMadridISO } from "./partidos";
import type { Partido } from "./dataService";

const partido: Partido = { id: "m2", rival: "Abella F.C.", fechaHora: "sábado 14/11/2026 · 19:00", lugar: "Pabellón de Guntín", competicion: "Primera Futgal", esLocal: true, jugado: false, golesLocal: null, golesVisitante: null };
const inicio = new Date("2026-11-14T18:00:00Z");
describe("Fecha y cuenta atrás del partido", () => {
  it("interpreta el inicio ISO recibido de Cloud",()=>expect(inicioPartido({...partido,fechaHora:"2026-11-14T18:00:00Z"})?.toISOString()).toBe("2026-11-14T18:00:00.000Z"));
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

describe('Calendario automático de LIGA',()=>{
  const val:Partido={...partido,id:'real',jornada:7,rival:'Val do Sil Futsal Quiroga',fechaHora:'2026-11-14T17:30:00Z',lugar:'Pavillón Municipal de Guntín'};
  const siguiente:Partido={...val,id:'j8',jornada:8,fechaHora:'2026-11-21T17:30:00Z'};
  it('elige el futuro más cercano aunque el calendario venga en otro orden',()=>expect(proximoPartido([siguiente,val],new Date('2026-11-14T09:26:00Z'))?.id).toBe('real'));
  it('el partido empezado deja de ser futuro y queda en curso',()=>{expect(proximoPartido([val,siguiente],new Date('2026-11-14T17:30:00Z'))?.id).toBe('j8');expect(partidoEnCurso([val,siguiente],new Date('2026-11-14T17:30:00Z'))?.id).toBe('real');});
  it('está en juego durante exactamente dos horas',()=>{expect(cuentaPartido(new Date(val.fechaHora),new Date('2026-11-14T19:29:59Z')).estado).toBe('en_juego');expect(cuentaPartido(new Date(val.fechaHora),new Date('2026-11-14T19:30:00Z')).estado).toBe('resultado_pendiente');});
  it('guardar el resultado mueve Val do Sil a último y deja jornada 8 como próximo',()=>{const jugado={...val,jugado:true,golesLocal:2,golesVisitante:1};expect(ultimoPartido([jugado,siguiente])?.id).toBe('real');expect(proximoPartido([jugado,siguiente],new Date('2026-11-14T09:26:00Z'))?.jornada).toBe(8);});
  it('no inventa próximo si no hay jornada 8',()=>expect(proximoPartido([{...val,jugado:true}],new Date('2026-11-14T09:26:00Z'))).toBeUndefined());
  it('determina victoria, empate y derrota desde la perspectiva del club incluso fuera',()=>{expect(resultadoPartido({...val,jugado:true,esLocal:false,golesLocal:1,golesVisitante:2})).toBe('V');expect(resultadoPartido({...val,jugado:true,golesLocal:1,golesVisitante:1})).toBe('E');expect(resultadoPartido({...val,jugado:true,golesLocal:0,golesVisitante:1})).toBe('D');});
  it('convierte las 18:30 del 14 de noviembre en Madrid',()=>expect(fechaMadridISO('2026-11-14','18:30')).toBe('2026-11-14T17:30:00.000Z'));
  it('respeta la hora de verano al añadir partidos',()=>expect(fechaMadridISO('2027-04-14','18:30')).toBe('2027-04-14T16:30:00.000Z'));
});