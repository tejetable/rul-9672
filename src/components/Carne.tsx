import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import frente from "@/assets/carne-fisico-frente.jpg.asset.json";
import dorso from "@/assets/carne-fisico-reverso.jpg.asset.json";
import folleto from "@/assets/ventajas-socios-2026-27.pdf.asset.json";
import { BotonDos, iconosCarnet } from "@/components/SwitchVista";

export function Carne({ nombre, numero, temporada = "2026/27", alCorriente, onDondeUsar }: { nombre: string; numero: number; temporada?: string; alCorriente?: boolean | null; onDondeUsar?: () => void }) {
  const [reverso, setReverso] = useState(false);
  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div className="flex flex-col items-center text-center">
        <div className="carnet-qr self-center w-full max-w-[280px]"><div className="qr-blanco rounded-tile p-4">
          <QRCodeSVG value={`RUL:${numero}`} size={240} marginSize={2} bgColor="#FFFFFF" fgColor="#0D4631" className="aspect-square h-auto w-full" aria-label={`Identificación de socio o socia ${numero}`} />
        </div></div>
        <p className="card-member-name mt-4">{nombre}</p>
        <p className="card-number" aria-label={`Número de socio o socia ${numero}`}><span className="card-number-pre">Nº</span>{String(numero).padStart(4, "0")}</p>
        <p aria-label={`Socio o socia de la temporada ${temporada}`} className="mt-2 text-body-sm text-muted-foreground">Soci@ de la temporada {temporada}</p>
        {alCorriente != null && <p className={`rul-chip mt-3 ${alCorriente ? "rul-chip--win" : "rul-chip--loss"}`}>{alCorriente ? `Al corriente · ${temporada}` : "Pendiente de pago"}</p>}
        {onDondeUsar && <button type="button" onClick={onDondeUsar} className="rul-btn rul-btn--secondary mt-4">¿Dónde lo uso?</button>}
      </div>
      <div className="mx-auto mt-8 w-full max-w-[220px]">
        <article key={reverso ? "reverso" : "frente"} className="digital-card card-flip relative isolate overflow-hidden rounded-tile text-primary" aria-label={reverso ? "Reverso del carnet: ventajas" : `Carnet de ${nombre}, nº ${String(numero).padStart(4, "0")}`}>
          <img src={reverso ? dorso.url : frente.url} alt={reverso ? "Ventajas del socio o socia. Primer año, primera historia. Patrocinadores del Real Unión Lucense F.S." : "Carnet de socio o socia. Real Unión Lucense F.S. Temporada 2026/27. Ayúdanos a que esta historia siga. Primera temporada."} className="h-full w-full object-contain" />
          {!reverso && <span className="physical-card-number">{String(numero).padStart(4, "0")}</span>}
          {reverso && <a href={folleto.url} target="_blank" rel="noreferrer" className="physical-card-benefits-qr rounded-md focus-visible:outline-2 focus-visible:outline-ring" aria-label="Abrir el folleto de ventajas"><QRCodeSVG value={folleto.url} size={160} className="card-qr-code h-full w-full" /></a>}
        </article>
        <div className="mt-3 flex justify-center">
          <BotonDos on={reverso} onChange={setReverso} label="Ver el reverso del carnet físico" offLabel="Frente" onLabel="Reverso" offIcon={iconosCarnet.off} onIcon={iconosCarnet.on} />
        </div>
      </div>
    </div>
  );
}
