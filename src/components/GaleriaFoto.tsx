import { useState } from "react";
import type { FotoGaleria } from "@/lib/galeria";

export function GaleriaFoto({ foto, alt, completa = false }: { foto: FotoGaleria; alt: string; completa?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  return <span className={`gallery-image ${loaded ? "is-loaded" : "is-loading"}`}>
    {!error && <img src={completa ? foto.src : foto.thumb} alt={alt} loading="lazy" draggable={false} onLoad={() => setLoaded(true)} onError={() => { setError(true); setLoaded(true); }} className={completa ? "gallery-full-image" : "gallery-crop-image"} style={{ objectPosition: foto.pos }} />}
    {error && <span className="gallery-image-error">Foto no disponible</span>}
  </span>;
}