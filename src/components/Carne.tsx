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
      <div className="flex flex-col items-center">
        <div className="qr-blanco rounded-xl p-5 shadow-sm">
          <QRCodeSVG value={`RUL:${numero}`} size={240} marginSize={2} bgColor="#FFFFFF" fgColor="#0D4631" className="size-60" aria-label={`Identificación de socio ${numero}`} />
        </div>
        <p className="mt-3 text-sm font-bold text-primary">Enséñaselo en el mostrador</p>
        <p className="card-member-name mt-3 text-center uppercase">{nombre}</p>
        <p className="mt-1 text-xl font-black text-gold">Nº {String(numero).padStart(4, "0")}</p>
        <p className="card-kicker mt-1 text-muted-foreground">Temporada {temporada}</p>
      </div>
      <div className="mx-auto mt-6 w-full max-w-[240px]">
        <article className="digital-card relative isolate overflow-hidden rounded-lg text-primary" aria-label={reverso ? "Reverso del carnet: ventajas" : `Carnet de ${nombre}, nº ${String(numero).padStart(4, "0")}`}>
          <img key={reverso ? "reverso" : "frente"} src={reverso ? dorso.url : frente.url} alt={reverso ? "Ventajas del socio. Primer año, primera historia. Patrocinadores del Real Unión Lucense F.S." : "Carnet de socio. Real Unión Lucense F.S. Temporada 2026/27. Ayúdanos a que esta historia siga. Primera temporada."} className="h-full w-full object-contain" />
          {!reverso && <span className="physical-card-number">{String(numero).padStart(4, "0")}</span>}
          {reverso && <a href={folleto.url} target="_blank" rel="noreferrer" className="physical-card-benefits-qr rounded-md focus-visible:outline-2 focus-visible:outline-ring" aria-label="Abrir el folleto de ventajas"><QRCodeSVG value={folleto.url} size={160} className="card-qr-code h-full w-full" /></a>}
        </article>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="card-kicker text-muted-foreground">{reverso ? "Ventajas" : "Tu carnet"}</span>
          <Button variant="ghost" onClick={() => setReverso((v) => !v)} className="h-10 text-xs font-bold hover:bg-primary/10"><ArrowLeftRight /> {reverso ? "Ver carnet" : "Dar la vuelta"}</Button>
        </div>
      </div>
    </div>
  );
}
