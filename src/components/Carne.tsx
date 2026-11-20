import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import frente from "@/assets/carne-fisico-frente.jpg.asset.json";
import dorso from "@/assets/carne-fisico-reverso.jpg.asset.json";
import folleto from "@/assets/ventajas-socios-2026-27.pdf.asset.json";
import { Button } from "@/components/ui/button";

export function Carne({ nombre, numero, temporada = "2026/27", alCorriente, onDondeUsar }: { nombre: string; numero: number; temporada?: string; alCorriente?: boolean | null; onDondeUsar?: () => void }) {
  const [reverso, setReverso] = useState(false);
  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div className="flex flex-col items-center text-center">
        <div className="qr-blanco self-center w-full max-w-[280px] rounded-tile p-4">
          <QRCodeSVG value={`RUL:${numero}`} size={240} marginSize={2} bgColor="#FFFFFF" fgColor="#0D4631" className="aspect-square h-auto w-full" aria-label={`Identificación de socio o socia ${numero}`} />
        </div>
        <p className="card-member-name mt-4 uppercase">{nombre}</p>
        <p className="mt-1 text-section font-black text-gold">Nº {String(numero).padStart(4, "0")}</p>
        <p aria-label={`Socio o socia de la temporada ${temporada}`} className="card-kicker mt-1 text-muted-foreground">Soci@ de la temporada {temporada}</p>
        {alCorriente != null && <p className="card-status mt-3"><span className={alCorriente ? "card-status-dot is-ok" : "card-status-dot is-pending"} aria-hidden="true" />{alCorriente ? `Al corriente · ${temporada}` : "Cuota pendiente"}</p>}
        {onDondeUsar && <Button variant="link" onClick={onDondeUsar} className="mt-2 h-11 px-0 font-bold text-accent">¿Dónde lo uso? →</Button>}
      </div>
      <div className="mx-auto mt-8 w-full max-w-[220px]">
        <article key={reverso ? "reverso" : "frente"} className="digital-card card-flip relative isolate overflow-hidden rounded-tile text-primary" aria-label={reverso ? "Reverso del carnet: ventajas" : `Carnet de ${nombre}, nº ${String(numero).padStart(4, "0")}`}>
          <img src={reverso ? dorso.url : frente.url} alt={reverso ? "Ventajas del socio o socia. Primer año, primera historia. Patrocinadores del Real Unión Lucense F.S." : "Carnet de socio o socia. Real Unión Lucense F.S. Temporada 2026/27. Ayúdanos a que esta historia siga. Primera temporada."} className="h-full w-full object-contain" />
          {!reverso && <span className="physical-card-number">{String(numero).padStart(4, "0")}</span>}
          {reverso && <a href={folleto.url} target="_blank" rel="noreferrer" className="physical-card-benefits-qr rounded-md focus-visible:outline-2 focus-visible:outline-ring" aria-label="Abrir el folleto de ventajas"><QRCodeSVG value={folleto.url} size={160} className="card-qr-code h-full w-full" /></a>}
        </article>
        <div className="mt-3 flex justify-center">
          <div className="seg-toggle" role="radiogroup" aria-label="Cara del carnet físico" data-state={reverso ? "b" : "a"}>
            <span className="seg-thumb" aria-hidden="true" />
            <button type="button" role="radio" aria-checked={!reverso} onClick={() => setReverso(false)}>Frente</button>
            <button type="button" role="radio" aria-checked={reverso} onClick={() => setReverso(true)}>Reverso</button>
          </div>
        </div>
      </div>
    </div>
  );
}
