import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GaleriaFoto } from "@/components/GaleriaFoto";
import type { AlbumGaleria } from "@/lib/galeria";

export function GaleriaVisor({ album, inicial, onClose, siguiente }: { album: AlbumGaleria; inicial: number; onClose: () => void; siguiente?: AlbumGaleria | undefined }) {
  const [index, setIndex] = useState(inicial);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const foto = album.fotos[index];
  const mover = (delta: number) => setIndex((actual) => Math.max(0, Math.min(album.fotos.length, actual + delta)));
  const final = index === album.fotos.length;
  if (!foto && !final) return null;
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="gallery-viewer-overlay" />
      <Dialog.Content aria-describedby={undefined} className="gallery-viewer" onKeyDown={(e) => { if (e.key === "ArrowRight") mover(1); if (e.key === "ArrowLeft") mover(-1); }}>
        <Dialog.Title className="sr-only">Fotos · {album.titulo}</Dialog.Title>
        <div className="gallery-viewer-top"><p aria-live="polite">{Math.min(index + 1,album.fotos.length)} / {album.fotos.length}</p><Dialog.Close asChild><Button variant="ghost" size="icon" className="gallery-viewer-control" aria-label="Cerrar foto"><X strokeWidth={1.75} /></Button></Dialog.Close></div>
        <div className="gallery-viewer-stage" onPointerDown={(e) => { setStart({ x: e.clientX, y: e.clientY }); e.currentTarget.setPointerCapture(e.pointerId); }} onPointerUp={(e) => {
          if (!start) return;
          const dx = e.clientX - start.x, dy = e.clientY - start.y;
          setStart(null);
          if (dy > 80 && dy > Math.abs(dx)) onClose();
          else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) mover(dx < 0 ? 1 : -1);
        }} onPointerCancel={() => setStart(null)}>
          {final ? <div className="px-8 text-center"><p className="font-black">{siguiente ? `Siguiente partido: ${siguiente.titulo}` : 'Fin del álbum'}</p>{siguiente && <Button asChild variant="ghost" className="gallery-viewer-control mt-4"><Link to="/galeria/$folderId" params={{folderId:siguiente.id}} search={{foto:''}} onClick={onClose}>Siguiente partido ›</Link></Button>}</div> : foto?.video ? <iframe title={`Vídeo · ${album.titulo}`} src={`https://drive.google.com/file/d/${encodeURIComponent(foto.id)}/preview`} allow="autoplay; fullscreen" className="h-full w-full border-0"/> : foto && <GaleriaFoto key={foto.id} foto={foto} alt={`R.U. Lucense · ${album.titulo}`} completa />}
        </div>
        <div className="gallery-viewer-bottom"><Button variant="ghost" size="icon" className="gallery-viewer-control" aria-label="Foto anterior" disabled={index === 0} onClick={() => mover(-1)}><ChevronLeft strokeWidth={1.75} /></Button><p>{album.titulo}{album.detalle && <span>{album.detalle}</span>}</p><Button variant="ghost" size="icon" className="gallery-viewer-control" aria-label="Foto siguiente" disabled={final} onClick={() => mover(1)}><ChevronRight strokeWidth={1.75} /></Button></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}