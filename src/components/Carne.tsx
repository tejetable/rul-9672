import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeftRight } from "lucide-react";
import frente from "@/assets/carne-fisico-frente.jpg.asset.json";
import dorso from "@/assets/carne-fisico-reverso.jpg.asset.json";
import folleto from "@/assets/ventajas-socios-2026-27.pdf.asset.json";
import { Button } from "@/components/ui/button";

export function Carne({ nombre, numero, temporada = "2026/27" }: { nombre: string; numero: number; temporada?: string }) {
  const [reverso, setReverso] = useState(false);
  return (
    <div className="mx-auto w-full max-w-[390px]">
      <article className="digital-card relative isolate overflow-hidden rounded-lg text-primary" aria-label={reverso ? "Reverso del carnet: ventajas" : `Carnet digital de ${nombre}, nº ${String(numero).padStart(4, "0")}`}>
        <img key={reverso ? "reverso" : "frente"} src={reverso ? dorso.url : frente.url} alt={reverso ? "Ventajas del socio. Primer año, primera historia. Patrocinadores del Real Unión Lucense F.S." : "Carnet de socio. Real Unión Lucense F.S. Temporada 2026/27. Ayúdanos a que esta historia siga. Primera temporada."} className="h-full w-full object-contain" />
        {!reverso && <span className="physical-card-number">{String(numero).padStart(4, "0")}</span>}
        {reverso && <a href={folleto.url} target="_blank" rel="noreferrer" className="physical-card-benefits-qr rounded-md focus-visible:outline-2 focus-visible:outline-ring" aria-label="Abrir el folleto de ventajas"><QRCodeSVG value={folleto.url} size={160} className="card-qr-code h-full w-full" /></a>}
      </article>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="card-kicker text-muted-foreground">{reverso ? "02 / Ventajas" : "01 / Tu carnet"}</span>
        <Button variant="ghost" onClick={() => setReverso((v) => !v)} className="h-10 text-xs font-bold hover:bg-primary/10"><ArrowLeftRight /> {reverso ? "Ver carnet" : "Dar la vuelta"}</Button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 border-t border-primary/15 pt-4">
        <div className="min-w-0">
          <p className="card-kicker text-muted-foreground">Titular · Temporada {temporada}</p>
          <p className="card-member-name mt-1">{nombre}</p>
          <p className="mt-2 text-xs font-bold text-muted-foreground">Identificación · Nº {String(numero).padStart(4, "0")}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="rounded-md bg-roto p-2">
            <QRCodeSVG value={`RUL:${numero}`} size={80} className="card-qr-code" aria-label={`Identificación de socio ${numero}`} />
          </div>
          <p className="max-w-[104px] text-center text-[11px] font-bold leading-tight text-primary">Registra tu visita escaneando este QR</p>
        </div>
      </div>
    </div>
  );
}
