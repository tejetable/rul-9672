import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeftRight, ArrowUpRight, Crown, FileText } from "lucide-react";
import escudo from "@/assets/escudo-carne.png";
import textura from "@/assets/carne-textura.jpg";
import folleto from "@/assets/ventajas-socios-2026-27.pdf.asset.json";
import { Button } from "@/components/ui/button";

export function Carne({ nombre, numero, temporada = "2026/27" }: { nombre: string; numero: number; temporada?: string }) {
  const [reverso, setReverso] = useState(false);
  return (
    <div className="mx-auto w-full max-w-[370px]">
      <article className="digital-card relative isolate overflow-hidden rounded-lg text-primary" aria-label={reverso ? "Reverso del carné: ventajas" : "Carné digital de socio"}>
        <img src={textura} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div key={reverso ? "reverso" : "frente"} className="card-content animate-rise">
          <div className="flex items-center justify-between border-b border-primary/20 pb-3">
            <span className="card-kicker">Real Unión Lucense F.S.</span>
            <Crown size={16} strokeWidth={1.5} aria-hidden="true" />
          </div>
          {!reverso ? <>
            <div className="mt-5 flex items-center gap-4">
              <img src={escudo} alt="Escudo del Real Unión Lucense F.S." className="h-28 w-24 shrink-0 object-contain" />
              <div className="min-w-0">
                <p className="label-club">Carné de</p>
                <p className="title-club mt-1 text-[38px]">Socia/o</p>
                <p className="card-kicker mt-3 text-accent">Temporada {temporada}</p>
              </div>
            </div>
            <div className="mt-6 border-t border-primary/20 pt-4">
              <p className="card-kicker text-muted-foreground">Somos de los nuestros</p>
              <p className="card-member-name mt-2">{nombre}</p>
            </div>
            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="card-kicker">Nº de socio</p>
                <p className="mt-1 text-[42px] font-black leading-none tabular-nums">{String(numero).padStart(4, "0")}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs font-bold"><span className="size-1.5 rounded-full bg-accent" /> Carné de temporada</p>
              </div>
              <div className="card-qr shrink-0 rounded-md bg-roto p-2.5">
                <QRCodeSVG value={`RUL:${numero}`} size={88} className="card-qr-code" />
                <p className="mt-1 text-center text-[9px] font-bold uppercase">Identificación</p>
              </div>
            </div>
            <p className="card-motto mt-6">Ayúdanos a que<br />esta historia siga.</p>
          </> : <>
            <div className="mt-5 flex items-center gap-3">
              <img src={escudo} alt="Escudo del Real Unión Lucense F.S." className="h-20 w-16 shrink-0 object-contain" />
              <div><p className="label-club">Ventajas de</p><p className="title-club mt-1 text-4xl">Socia/o</p></div>
            </div>
            <p className="card-motto mt-5">Primer año,<br />primera historia.</p>
            <p className="card-kicker mt-6 border-b border-primary/20 pb-3">Quienes empujan con nosotros</p>
            <ul className="mt-3 space-y-2 text-sm font-bold">
              <li>EFG Parquets</li><li>Noel López Pinín · Nutrición</li><li>BajoCero · Mauro Busi</li><li>Clínica Dinam</li><li>Psicotécnico San Roque</li>
            </ul>
            <Button asChild className="mt-5 min-h-11 w-full"><a href={folleto.url} target="_blank" rel="noreferrer"><FileText /> Folleto de ventajas <ArrowUpRight /></a></Button>
          </>}
        </div>
      </article>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="card-kicker text-muted-foreground">{reverso ? "02 / Ventajas" : "01 / Tu carné"}</span>
        <Button variant="ghost" onClick={() => setReverso((v) => !v)} className="h-10 text-xs font-bold hover:bg-primary/10"><ArrowLeftRight /> {reverso ? "Ver carné" : "Dar la vuelta"}</Button>
      </div>
    </div>
  );
}
