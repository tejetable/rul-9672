import { useState } from "react";
import { X } from "lucide-react";
import { PhotoSlot } from "@/components/PhotoSlot";
import pinaG from "@/assets/galeria/friol-pina-celebracion.webp";
import pinaT from "@/assets/galeria/friol-pina-celebracion-thumb.webp";
import celG from "@/assets/galeria/friol-celebracion-gol.webp";
import celT from "@/assets/galeria/friol-celebracion-gol-thumb.webp";
import jugG from "@/assets/galeria/friol-jugada.webp";
import jugT from "@/assets/galeria/friol-jugada-thumb.webp";
import golG from "@/assets/galeria/friol-gol.webp";
import golT from "@/assets/galeria/friol-gol-thumb.webp";
import tirG from "@/assets/galeria/friol-tiro.webp";
import tirT from "@/assets/galeria/friol-tiro-thumb.webp";

const PIE = "R.U. Lucense · vs P.M. Friol";
export const ALBUM = { titulo: "vs P.M. Friol · 18-0 · 07/11/2026" };
// La primera es la portada y la pieza grande (2×2). object-position centra a las personas.
export const FOTOS = [
  { src: pinaG, thumb: pinaT, pos: "50% 45%" },
  { src: celG, thumb: celT, pos: "35% 35%" },
  { src: jugG, thumb: jugT, pos: "45% 40%" },
  { src: golG, thumb: golT, pos: "60% 50%" },
  { src: tirG, thumb: tirT, pos: "60% 35%" },
];
const CELDAS = 5; // 1 grande + 4 pequeñas

export function Galeria() {
  const [abierta, setAbierta] = useState<number | null>(null);
  const huecos = Math.max(0, CELDAS - FOTOS.length);
  const f = abierta !== null ? FOTOS[abierta] : null;
  return (
    <div className="mt-3">
      <p className="text-sm font-bold">{ALBUM.titulo}</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {FOTOS.slice(0, CELDAS).map((x, i) => (
          <button key={x.src} onClick={() => setAbierta(i)} aria-label={`Ver foto ${i + 1}: ${PIE}`}
            className={`overflow-hidden rounded-xl ${i === 0 ? "col-span-2 row-span-2" : ""} aspect-square`}>
            <img src={i === 0 ? x.src : x.thumb} alt={PIE} loading="lazy" className="size-full object-cover" style={{ objectPosition: x.pos }} />
          </button>
        ))}
        {Array.from({ length: huecos }, (_, i) => <PhotoSlot key={i} label="Próximamente" className="aspect-square !p-2" />)}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{PIE}</p>
      {f && (
        <div role="dialog" aria-label={PIE} onClick={() => setAbierta(null)} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary/95 p-4">
          <button aria-label="Cerrar" className="absolute right-3 top-3 flex size-11 items-center justify-center text-primary-foreground"><X size={22} strokeWidth={1.75} /></button>
          <img src={f.src} alt={PIE} className="max-h-[80vh] w-full max-w-[430px] rounded-xl object-contain" />
          <p className="mt-3 text-sm text-primary-foreground">{PIE}</p>
        </div>
      )}
    </div>
  );
}
