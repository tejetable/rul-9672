import { describe, expect, it } from "vitest";
import { agruparAlbumes, fotosMosaico, type FotoGaleria } from "./galeria";

const foto = (id: string): FotoGaleria => ({ id, src: "real.webp", thumb: "thumb.webp", pos: "50% 50%" });
describe("Álbumes por partido", () => {
  it("envía las fotos sin partido a Últimos partidos", () => {
    expect(agruparAlbumes([foto("1")])[0]).toMatchObject({ id: "ultimos-partidos", titulo: "Últimos partidos", fotos: [{ id: "1" }] });
  });
  it("agrupa únicamente asignaciones explícitas y ordena por fecha", () => {
    const friol = { id: "friol", rival: "P.M. Friol", resultado: "18-0", fecha: "2026-11-07" };
    const anterior = { id: "otro", rival: "Rival de prueba", fecha: "2026-11-01" };
    const albumes = agruparAlbumes([{ ...foto("1"), partido: anterior }, { ...foto("2"), partido: friol }, { ...foto("3"), partido: friol }, foto("4")]);
    expect(albumes.map((a) => a.id)).toEqual(["friol", "otro", "ultimos-partidos"]);
    expect(albumes[0]?.fotos.map((f) => f.id)).toEqual(["2", "3"]);
  });
  it("muestra como máximo cinco fotos y cuenta las restantes para +N", () => {
    const album = agruparAlbumes(Array.from({ length: 12 }, (_, i) => foto(String(i))))[0];
    if (!album) throw new Error("Falta álbum");
    expect(fotosMosaico(album).fotos).toHaveLength(5);
    expect(fotosMosaico(album).adicionales).toBe(7);
  });
});
describe("srcsetFoto", () => {
  it("ofrece varios anchos de la miniatura de Drive", async () => {
    const { srcsetFoto } = await import("./galeria");
    const s = srcsetFoto("https://drive.google.com/thumbnail?id=abc&sz=w600")!;
    expect(s.split(", ")).toEqual([480, 800, 1200, 1600, 2048].map((w) => `https://drive.google.com/thumbnail?id=abc&sz=w${w} ${w}w`));
  });
  it("no toca las fotos que no son de Drive", async () => {
    const { srcsetFoto } = await import("./galeria");
    expect(srcsetFoto("/assets/foto.webp")).toBeUndefined();
  });
});
