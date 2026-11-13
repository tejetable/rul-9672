import pina from "@/assets/galeria/friol-pina-celebracion.webp";
import pinaThumb from "@/assets/galeria/friol-pina-celebracion-thumb.webp";
import cel from "@/assets/galeria/friol-celebracion-gol.webp";
import celThumb from "@/assets/galeria/friol-celebracion-gol-thumb.webp";
import jug from "@/assets/galeria/friol-jugada.webp";
import jugThumb from "@/assets/galeria/friol-jugada-thumb.webp";
import gol from "@/assets/galeria/friol-gol.webp";
import golThumb from "@/assets/galeria/friol-gol-thumb.webp";
import tir from "@/assets/galeria/friol-tiro.webp";
import tirThumb from "@/assets/galeria/friol-tiro-thumb.webp";

export interface FotoGaleria {
  id: string;
  src: string;
  thumb: string;
  pos: string;
  video?: boolean;
  partido?: { id: string; rival: string; resultado?: string; fecha: string };
}
export interface AlbumGaleria {
  id: string;
  titulo: string;
  detalle: string;
  fecha: string;
  fotos: FotoGaleria[];
}

// File names are legacy labels, not evidence of a photo's match.
// No per-photo match assignment has been provided; keep all five unassigned.
export const fotosGaleria: FotoGaleria[] = [
  { id: "image-14", src: pina, thumb: pinaThumb, pos: "50% 45%" },
  { id: "image-15", src: cel, thumb: celThumb, pos: "35% 35%" },
  { id: "image-16", src: jug, thumb: jugThumb, pos: "45% 40%" },
  { id: "image-17", src: gol, thumb: golThumb, pos: "60% 50%" },
  { id: "image-18", src: tir, thumb: tirThumb, pos: "60% 35%" },
];

export function agruparAlbumes(fotos: FotoGaleria[]): AlbumGaleria[] {
  const albumes = new Map<string, AlbumGaleria>();
  for (const foto of fotos) {
    const partido = foto.partido;
    const id = partido?.id || "ultimos-partidos";
    let album = albumes.get(id);
    if (!album) {
      const fecha = partido?.fecha || "";
      const dia = fecha ? new Date(`${fecha}T12:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).replaceAll(".", "").toUpperCase() : "";
      album = { id, titulo: partido ? `vs ${partido.rival}` : "Últimos partidos", detalle: [partido?.resultado, dia].filter(Boolean).join(" · "), fecha, fotos: [] };
      albumes.set(id, album);
    }
    album.fotos.push(foto);
  }
  return [...albumes.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function fotosMosaico(album: AlbumGaleria) {
  return { fotos: album.fotos.slice(0, 5), adicionales: Math.max(0, album.fotos.length - 5) };
}