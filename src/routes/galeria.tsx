import {useDriveGallery} from "@/hooks/use-drive-gallery";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GaleriaFoto } from "@/components/GaleriaFoto";
import { GaleriaVisor } from "@/components/GaleriaVisor";
import { dataService } from "@/lib/dataService";
import type { AlbumGaleria } from "@/lib/galeria";

export const Route = createFileRoute("/galeria")({
  validateSearch: (search: Record<string, unknown>) => ({ partido: typeof search["partido"] === "string" ? search["partido"] : "todos" }),
  head: () => ({ meta: [
    { title: "Fotos de los partidos · R.U. Lucense" },
    { name: "description", content: "Las fotos reales de los últimos partidos del Real Unión Lucense F.S., reunidas en álbumes." },
    { property: "og:title", content: "Fotos de los partidos · R.U. Lucense" },
    { property: "og:description", content: "La galería de nuestra familia: álbumes y fotos de los últimos partidos del R.U. Lucense." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GaleriaCompleta,
});

function GaleriaCompleta() {
  const {data,isPending}=useDriveGallery();
  const albumes=data?.albumes??[];
  return <div className="min-h-dvh bg-primary"><main className="mx-auto min-h-dvh max-w-[430px] bg-background pb-8">
    <header className="club-header"><Button asChild variant="ghost" size="icon"><Link to="/" aria-label="Volver a El Equipo"><ArrowLeft/></Link></Button><h1 className="club-section-title">Fotos</h1></header>
    <section className="space-y-3 px-4 py-6">
      {isPending && <div className="gallery-image is-loading aspect-[16/10]"/>}
      {!isPending && !albumes.length && <p className="py-8 text-muted-foreground">Todavía no hay álbumes disponibles.</p>}
      {albumes.map(album=><Button asChild key={album.id} variant="ghost" className="h-auto w-full flex-col overflow-hidden rounded-panel bg-surface p-0"><Link to="/galeria/$folderId" params={{folderId:album.id}} search={{foto:''}}>{album.fotos[0] && <span className="gallery-hero w-full"><GaleriaFoto foto={album.fotos[0]} alt={album.titulo}/></span>}<span className="w-full p-4 text-left"><strong className="block text-item">{album.titulo}</strong><span className="text-body-sm">{album.detalle} · {album.fotos.length} fotos/vídeos</span></span></Link></Button>)}
    </section>
  </main></div>;
}
