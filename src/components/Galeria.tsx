import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GaleriaFoto } from "@/components/GaleriaFoto";
import { GaleriaVisor } from "@/components/GaleriaVisor";
import { useDriveGallery } from '@/hooks/use-drive-gallery';

export function Galeria() {
  const {data,isPending}=useDriveGallery();
  const albumes=data?.albumes??[];
  return <section className="mt-6" aria-label="Fotos del equipo">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="club-section-title">Fotos</h2>
      <Button asChild variant="link" className="h-11 px-0 text-accent font-bold"><Link to="/galeria" search={{ partido: "todos" }}>Ver todas <ArrowRight strokeWidth={1.75} /></Link></Button>
    </div>
    {isPending ? <div className="gallery-image is-loading aspect-[16/10]"/> : !data?.destacadas.length ? <p className="py-6 text-body-sm text-muted-foreground">Todavía no hay fotos disponibles.</p> : <div className="gallery-mosaic">
      {data.destacadas.map(({foto,albumId},index)=>{const album=albumes.find(a=>a.id===albumId);if(!album)return null;return <Button asChild key={foto.id} variant="ghost" className={`gallery-tile ${index===0?'gallery-hero':'gallery-square'}`}><Link to="/galeria/$folderId" params={{folderId:albumId}} search={{foto:foto.id}} aria-label={`Ver foto: ${album.titulo}`}><GaleriaFoto foto={foto} alt={album.titulo}/><span className="gallery-caption"><strong>{album.titulo}</strong><span>{album.detalle}</span></span></Link></Button>;})}
    </div>}
  </section>;
}
