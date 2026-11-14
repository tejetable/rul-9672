import {Play} from "lucide-react";
import { useState } from "react";
import type { FotoGaleria } from "@/lib/galeria";

export function GaleriaFoto({ foto, alt, completa = false, preloaded = false }: { foto: FotoGaleria; alt: string; completa?: boolean; preloaded?: boolean }) {
  const [loaded, setLoaded] = useState(preloaded);
  const [error, setError] = useState(false);
  return <span className={`gallery-image ${loaded ? "is-loaded" : "is-loading"}`}>
    {!error && <img src={completa ? foto.src : foto.thumb} alt={alt} loading={preloaded ? "eager" : "lazy"} draggable={false} onLoad={() => setLoaded(true)} onError={() => { setError(true); setLoaded(true); }} className={completa ? "gallery-full-image" : "gallery-crop-image"} style={{ objectPosition: foto.pos }} />}
    {foto.video && <Play className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-primary-foreground" aria-label="Vídeo"/>}
    {error && <span className="gallery-image-error">Foto no disponible</span>}
  </span>;
}