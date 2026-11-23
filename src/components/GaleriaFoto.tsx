import {Play} from "lucide-react";
import { useState } from "react";
import { srcsetFoto, TAMANO_FOTO, type FotoGaleria } from "@/lib/galeria";

export function GaleriaFoto({ foto, alt, completa = false, preloaded = false, sizes }: { foto: FotoGaleria; alt: string; completa?: boolean; preloaded?: boolean; sizes?: string }) {
  const url = completa ? foto.src : foto.thumb;
  const [loaded, setLoaded] = useState(preloaded);
  const [error, setError] = useState(false);
  return <span className={`gallery-image ${loaded ? "is-loaded" : "is-loading"}`}>
    {!error && <img src={url} srcSet={srcsetFoto(url)} sizes={sizes ?? (completa ? TAMANO_FOTO.pantalla : TAMANO_FOTO.mitad)} alt={alt} loading={preloaded ? "eager" : "lazy"} draggable={false} onLoad={() => setLoaded(true)} onError={() => { setError(true); setLoaded(true); }} className={completa ? "gallery-full-image" : "gallery-crop-image"} style={{ objectPosition: foto.pos }} />}
    {foto.video && <Play className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-primary-foreground" aria-label="Vídeo"/>}
    {error && <span className="gallery-image-error">Foto no disponible</span>}
  </span>;
}