import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarioFila, CasaFiltro } from "@/components/PartidoTarjetas";
import { useClubData } from "@/lib/dataService";
import { proximoPartido } from "@/lib/partidos";

export const Route = createFileRoute("/calendario")({
  head: () => ({ meta: [
    { title: "Calendario de la temporada · R.U. Lucense" },
    { name: "description", content: "Las 30 jornadas del Real Unión Lucense F.S.: resultados y próximos partidos." },
    { property: "og:title", content: "Calendario de la temporada · R.U. Lucense" },
    { property: "og:description", content: "Primera y segunda vuelta del R.U. Lucense, con resultados y fechas." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Calendario,
});

function Calendario() {
  const db = useClubData();
  const [casa, setCasa] = useState(false);
  const [ahora] = useState(() => new Date());
  const partidos = [...db.partidos].sort((a, b) => (a.jornada ?? 0) - (b.jornada ?? 0)).filter((p) => !casa || p.esLocal);
  const proximo = proximoPartido(db.partidos, ahora);
  useEffect(() => { if (proximo?.jornada) document.getElementById(`jornada-${proximo.jornada}`)?.scrollIntoView({ block: "center" }); }, [proximo?.jornada, casa]);
  const vueltas: [string, typeof partidos][] = [["Primera vuelta", partidos.filter((p) => (p.jornada ?? 0) <= 15)], ["Segunda vuelta", partidos.filter((p) => (p.jornada ?? 0) > 15)]];
  return <div className="min-h-dvh bg-primary"><main className="mx-auto min-h-dvh max-w-[430px] bg-background pb-8">
    <header className="club-header"><Button asChild variant="ghost" size="icon"><Link to="/" aria-label="Volver a El Equipo"><ArrowLeft /></Link></Button><h1 className="club-section-title mb-0 flex-1">Calendario</h1><CasaFiltro casa={casa} onChange={setCasa} /></header>
    <div className="px-4">
      {!db.partidos.length && <p className="py-8 text-muted-foreground">Cargando partidos…</p>}
      {vueltas.map(([titulo, lista]) => lista.length > 0 && <section key={titulo} className="mt-6"><h2 className="club-section-title">{titulo}</h2><ul className="calendar-list">{lista.map((p) => <CalendarioFila key={p.id} partido={p} destacado={p.id === proximo?.id} />)}</ul></section>)}
    </div>
  </main></div>;
}
