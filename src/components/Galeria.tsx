import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GaleriaFoto } from "@/components/GaleriaFoto";
import { GaleriaVisor } from "@/components/GaleriaVisor";
import { dataService } from "@/lib/dataService";
import { fotosMosaico, type AlbumGaleria } from "@/lib/galeria";

export function Galeria() {
  const albumes = dataService.albumes();
  const reciente = albumes[0];
  const [visor, setVisor] = useState<{ album: AlbumGaleria; index: number } | null>(null);
  if (!reciente) return null;
  const mosaico = fotosMosaico(reciente);
  return <section className="mt-6" aria-label="Fotos del equipo">
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-black uppercase">Fotos</h2>
      <Button asChild variant="link" className="h-11 px-0 text-accent font-bold"><Link to="/galeria" search={{ partido: "todos" }}>Ver todas <ArrowRight strokeWidth={1.75} /></Link></Button>
    </div>
    <div className="gallery-mosaic">
      {mosaico.fotos.map((foto, index) => <Button key={foto.id} variant="ghost" className={`gallery-tile ${index === 0 ? "gallery-hero" : "gallery-square"}`} aria-label={`Ver foto ${index + 1}: ${reciente.titulo}`} onClick={() => setVisor({ album: reciente, index })}>
        <GaleriaFoto foto={foto} alt={`R.U. Lucense · ${reciente.titulo}`} />
        {index === 0 && <span className="gallery-caption"><strong>{reciente.titulo}</strong>{reciente.detalle && <span>{reciente.detalle}</span>}</span>}
        {index === 4 && mosaico.adicionales > 0 && <span className="gallery-more">+{mosaico.adicionales}</span>}
      </Button>)}
    </div>
    {albumes.length > 1 && <div className="gallery-album-strip" aria-label="Otros álbumes">
      {albumes.slice(1).map((album) => {
        const portada = album.fotos[0];
        if (!portada) return null;
        return <Button asChild key={album.id} variant="ghost" className="gallery-album-card"><Link to="/galeria" search={{ partido: album.id }}>
          <GaleriaFoto foto={portada} alt={album.titulo} /><span className="gallery-caption"><strong>{album.titulo}</strong></span>
        </Link></Button>;
      })}
    </div>}
    {visor && <GaleriaVisor album={visor.album} inicial={visor.index} onClose={() => setVisor(null)} />}
  </section>;
}
