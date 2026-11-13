import { useEffect, useState } from "react";
import { ArrowRight, CalendarPlus, MapPin, Navigation } from "lucide-react";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";
import { Button } from "@/components/ui/button";
import type { Partido } from "@/lib/dataService";
import { calendarioPartido, cuentaPartido, inicioPartido } from "@/lib/partidos";

function LugoSilueta() {
  return <svg className="fixture-silhouette" viewBox="0 0 260 130" aria-hidden="true" fill="currentColor">
    <path d="M0 130V96h12V87h13v9h16V87h13v9h17V87h13v9h17V87h13v9h17V87h13v9h17V87h13v9h17V87h13v9h17v34zM128 100V47h7V31h6V19h5V7h3v12h5v12h6v16h7v53zm62 0V47h7V31h6V19h5V7h3v12h5v12h6v16h7v53zM163 103V57l16-16 16 16v46z" />
    <path d="M20 130V82h5V72h26v10h5v48zm190 0V82h5V72h26v10h5v48z" />
  </svg>;
}

export function ProximoPartido({ partido }: { partido: Partido }) {
  const [ahora, setAhora] = useState<Date | null>(null);
  useEffect(() => {
    setAhora(new Date());
    const timer = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const inicio = inicioPartido(partido);
  const cuenta = inicio && ahora ? cuentaPartido(inicio, ahora) : null;
  const hora = inicio?.toLocaleTimeString("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }) || "[pendiente]";
  const dia = inicio?.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", weekday: "short", day: "2-digit", month: "short" }).replace(/[.,]/g, "").toUpperCase() || "[pendiente]";
  const descargar = () => {
    const ics = calendarioPartido(partido);
    if (!ics) return;
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url; enlace.download = "ru-lucense-abella-14-nov.ics";
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <article className="fixture-card" aria-label="Próximo partido">
    <LugoSilueta />
    <div className="relative z-10">
      <div className="flex items-center justify-between gap-2">
        <h1 className="fixture-chip">PRÓXIMO PARTIDO</h1>
        <span className="fixture-chip">{partido.esLocal ? "EN CASA" : "FUERA"}</span>
      </div>
      <p className="fixture-subtitle">Concello de Guntín - R.U. Lucense · {partido.competicion}</p>
      <div className="fixture-matchup">
        <div className="fixture-team"><img src={escudo.url} alt="Escudo del R.U. Lucense" className="size-14 object-contain" /><p>R.U. LUCENSE</p></div>
        <div className="text-center"><p className="fixture-time">{hora}</p><p className="fixture-date">{dia}</p></div>
        <div className="fixture-team"><span className="fixture-opponent">AFC</span><p>{partido.rival.toUpperCase()}</p></div>
      </div>
      <span className="fixture-gold" />
      <div className="fixture-countdown" aria-live="polite">
        {cuenta?.estado === "en_juego" ? <span className="fixture-chip"><span className="fixture-live-dot" />EN JUEGO</span> : cuenta?.estado === "hoy" ? <p className="font-black text-xl">HOY · {hora}</p> : <div className="grid w-full grid-cols-3 gap-2">
          {[[cuenta?.dias, "DÍAS"], [cuenta?.horas, "HORAS"], [cuenta?.minutos, "MIN"]].map(([numero, label]) => <div key={label} className="fixture-counter"><p>{numero ?? "—"}</p><span>{label}</span></div>)}
        </div>}
      </div>
      <p className="fixture-location"><MapPin size={16} strokeWidth={1.75} />{partido.lugar}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button asChild variant="ghost" className="fixture-directions"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partido.lugar)}`} target="_blank" rel="noopener noreferrer"><Navigation strokeWidth={1.75} />Cómo llegar</a></Button>
        <Button variant="ghost" className="fixture-calendar" disabled={!inicio} onClick={descargar}><CalendarPlus strokeWidth={1.75} />Al calendario</Button>
      </div>
    </div>
  </article>;
}

export function UltimoResultado() {
  return <article className="result-card" aria-label="Último resultado">
    <div className="flex items-center justify-between gap-2"><h2 className="result-kicker">ÚLTIMO RESULTADO · 07 NOV</h2><span className="result-victory">VICTORIA</span></div>
    <div className="result-matchup">
      <div className="result-team"><img src={escudo.url} alt="Escudo del R.U. Lucense" className="size-9 object-contain" /><p>R.U. Lucense</p></div>
      <p className="result-score">18 <span className="result-separator">–</span> <span className="result-loser">0</span></p>
      <div className="result-team"><span className="result-opponent">PMF</span><p>P.M. Friol</p></div>
    </div>
    <Button asChild variant="link" className="h-9 p-0 text-accent text-sm font-bold"><a href="#fotos-equipo">Ver fotos del partido <ArrowRight strokeWidth={1.75} /></a></Button>
  </article>;
}