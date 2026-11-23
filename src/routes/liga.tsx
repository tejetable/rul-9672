import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { LigaPestanas, PESTANAS_LIGA } from "@/components/LigaPestanas";
import { claseVista, useVista } from "@/lib/vista";

export const Route = createFileRoute("/liga")({
  validateSearch: (value: Record<string, unknown>) => z.object({ vista: z.enum(PESTANAS_LIGA as [string, ...string[]]).optional().catch(undefined) }).parse(value),
  head: () => ({ meta: [
    { title: "Liga · R.U. Lucense" },
    { name: "description", content: "Clasificación, máximos goleadores y asistentes del Real Unión Lucense F.S." },
    { property: "og:title", content: "Liga · R.U. Lucense" },
    { property: "og:description", content: "Clasificación, máximos goleadores y asistentes del Real Unión Lucense F.S." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Liga,
});

function Liga() {
  const vista = useVista();
  const { vista: pestana } = Route.useSearch();
  return <div className="min-h-dvh bg-primary"><main className={`${claseVista(vista)} mx-auto min-h-dvh max-w-[430px] bg-background pb-8`}>
    <header className="club-header"><Button asChild variant="ghost" size="icon"><Link to="/" aria-label="Volver a El Equipo"><ArrowLeft /></Link></Button><h1 className="club-section-title mb-0 flex-1">Liga</h1></header>
    <div className="px-4 pt-2">
      <LigaPestanas completa inicial={(pestana as "clasificacion" | "goles" | "asistencias" | undefined) ?? "clasificacion"} />
    </div>
  </main></div>;
}
