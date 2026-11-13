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
  const { partido } = Route.useSearch();
  const navigate = useNavigate();
  const albumes = dataService.albumes();
  const [visor, setVisor] = useState<{ album: AlbumGaleria; index: number } | null>(null);
  const visibles = partido === "todos" ? albumes : albumes.filter((a) => a.id === partido);
  return <div className="min-h-dvh bg-primary">
    <main className="mx-auto min-h-dvh max-w-[430px] bg-background pb-8">
      <header className="sticky top-0 z-20 border-b border-border bg-background px-4 py-2">
        <div className="flex h-11 items-center gap-2"><Button asChild variant="ghost" size="icon"><Link to="/" aria-label="Volver a El Equipo"><ArrowLeft strokeWidth={1.75} /></Link></Button><h1 className="text-xl font-black uppercase">Fotos</h1></div>
        <div className="gallery-filters" aria-label="Filtrar por partido">
          {[{ id: "todos", titulo: "Todas" }, ...albumes].map((album) => <Button key={album.id} variant="ghost" aria-pressed={partido === album.id} className={`gallery-filter ${partido === album.id ? "gallery-filter-active" : ""}`} onClick={() => navigate({ to: "/galeria", search: { partido: album.id }, replace: true })}>{album.titulo}</Button>)}
        </div>
      </header>
      {visibles.length === 0 && <p className="px-4 py-8 text-muted-foreground">No hay fotos en este álbum.</p>}
      <div className="gallery-complete-grid">
        {visibles.flatMap((album) => album.fotos.map((foto, index) => <Button key={foto.id} variant="ghost" className="gallery-tile gallery-square" aria-label={`Ver foto ${index + 1}: ${album.titulo}`} onClick={() => setVisor({ album, index })}><GaleriaFoto foto={foto} alt={`R.U. Lucense · ${album.titulo}`} /></Button>))}
      </div>
      {visor && <GaleriaVisor album={visor.album} inicial={visor.index} onClose={() => setVisor(null)} />}
    </main>
  </div>;
}