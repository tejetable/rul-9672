import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, ChevronLeft, ChevronRight, FileText, Gift, IdCard, MapPin } from "lucide-react";
import { Liga } from "@/components/PartidoTarjetas";
import { Galeria } from "@/components/Galeria";
import { SociaCabecera } from "@/components/SociaCabecera";
import folleto from "@/assets/ventajas-socios-2026-27.pdf.asset.json";
import { Carne } from "@/components/Carne";
import { Button } from "@/components/ui/button";
import { dataService, type DB, type Socio, useClubData, runAction } from "@/lib/dataService";

type Tab = "equipo" | "ventajas";

function BalonIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7.5l4.3 3.1-1.6 5h-5.4l-1.6-5z" />
      <path d="M12 7.5V2.2M16.3 10.6l5-1.6M14.7 15.6l3.1 4.3M9.3 15.6l-3.1 4.3M7.7 10.6l-5-1.6" />
    </svg>
  );
}

export function SociaApp({ socio }: { socio: Socio }) {
  const [tab, setTab] = useState<Tab>("equipo");
  const db = useClubData();
  const [carnet, setCarnet] = useState(false);
  useEffect(() => { runAction(() => dataService.marcarApertura(socio.id)); }, []);
  if (!db) return null;
  const tabCls = (on: boolean) => `member-tab relative flex h-auto min-h-16 flex-col items-center justify-center gap-1 text-body-sm ${on ? "font-bold text-primary" : "font-normal text-muted-foreground"}`;
  const indicador = (on: boolean) => on && <span className="absolute top-1 h-[3px] w-5 rounded-full bg-accent" />;

  return (
    <div className="flex flex-1 flex-col">
      <SociaCabecera />
      <div className="flex-1 pb-24">
        {tab === "equipo" && <Equipo db={db} />}
        {tab === "ventajas" && <Ventajas db={db} />}
      </div>
      <nav aria-label="Secciones de socio" className="member-navigation fixed inset-x-0 mx-auto w-full max-w-[430px] bottom-0 z-20 grid grid-cols-3 border-t border-border bg-background pt-1">
        <Button variant="ghost" onClick={() => setTab("equipo")} aria-current={tab === "equipo" ? "page" : undefined} className={tabCls(tab === "equipo")}>
          {indicador(tab === "equipo")}
          <span className="relative">
            <BalonIcon />
          </span>
          El Equipo
        </Button>
        <Button variant="ghost" onClick={() => setCarnet(true)} className="member-tab flex h-auto min-h-16 flex-col items-center justify-end gap-1 pb-2 text-body-sm text-muted-foreground" aria-label="Abrir carnet">
          <span className={`-mt-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ${tab === "equipo" ? "ring-accent" : "ring-gold"}`}><IdCard size={26} strokeWidth={1.75} /></span>
          Carnet
        </Button>
        <Button variant="ghost" onClick={() => setTab("ventajas")} aria-current={tab === "ventajas" ? "page" : undefined} className={tabCls(tab === "ventajas")}>
          {indicador(tab === "ventajas")}
          <Gift size={22} strokeWidth={1.75} />
          Ventajas
        </Button>
      </nav>
      {carnet && <CarnetSheet socio={socio} onClose={() => setCarnet(false)} />}
    </div>
  );
}

function CarnetSheet({ socio, onClose }: { socio: Socio; onClose: () => void }) {
  const [dy, setDy] = useState(0);
  const [y0, setY0] = useState<number | null>(null);
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-primary/60" />
    <Dialog.Content aria-describedby={undefined} className="animate-sheet carnet-overlay fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] flex-col overflow-y-auto bg-background px-4 pb-8"
      style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: y0 === null ? "transform .2s" : "none" }}
      onTouchStart={(e) => setY0((e.touches[0]?.clientY ?? 0))}
      onTouchMove={(e) => y0 !== null && setDy(Math.max(0, (e.touches[0]?.clientY ?? 0) - y0))}
      onTouchEnd={() => { if (dy > 100) onClose(); else setDy(0); setY0(null); }}
    >
      <Button variant="ghost" onClick={onClose} aria-label="Cerrar carnet" className="mx-auto flex h-auto min-h-11 w-full flex-col items-center justify-center gap-1 pt-2">
        <span className="h-1 w-10 rounded-full bg-primary/30" />
        <ChevronDown size={20} strokeWidth={1.75} className="text-muted-foreground" />
      </Button>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border">
        <Dialog.Title className="club-section-title">Tu carnet</Dialog.Title>
        <span className="label-club pb-1 text-muted-foreground">{socio.temporada}</span>
      </div>
            <div className="mt-6">
        <Carne nombre={socio.nombre} numero={socio.numeroSocio} temporada={socio.temporada} />
      </div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  );
}

function Equipo({ db }: { db: DB }) {
  return (
    <section className="px-4 pt-6">
      <Liga />
      <div id="fotos-equipo" className="scroll-mt-20">
        <Galeria />
      </div>
    </section>
  );
}

function Ventajas({ db }: { db: DB }) {
  const [sel, setSel] = useState<string | null>(null);
  const pats = db.patrocinadores.filter((p) => p.activo);
  const p = pats.find((x) => x.id === sel);

  if (p) {
    const vs = db.ventajas.filter((v) => v.patrocinadorId === p.id && v.activa);
    return (
      <section className="px-4 pt-4">
        <Button variant="ghost" onClick={() => setSel(null)} className="label-club flex h-auto min-h-11 items-center gap-1">
          <ChevronLeft size={18} strokeWidth={1.75} /> Ventajas
        </Button>
        <p className="club-chip mt-2">{p.categoria}</p>
        <h1 className="club-section-title mt-3">{p.nombre}</h1>
                <div className="mt-6 space-y-3">
          {vs.map((v) => (
            <div key={v.id} className="rounded-panel bg-surface p-4">
              <p className="title-club text-heading text-accent">{v.destacado}</p>
              <p className="mt-2 text-item font-bold">{v.titulo}</p>
              <p className="mt-1">{v.descripcion}</p>
              {v.tarifas && (
                <table className="mt-4 w-full text-body-sm">
                  <thead>
                    <tr className="label-club text-muted-foreground">
                      <th className="py-2 text-left">Servicio</th>
                      <th className="py-2 text-right">Normal</th>
                      <th className="py-2 text-right">Socia/o</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.tarifas.map((t) => (
                      <tr key={t.servicio} className="border-t border-border">
                        <td className="py-2 pr-2">{t.servicio}</td>
                        <td className="py-2 text-right text-muted-foreground line-through">{t.normal}</td>
                        <td className="py-2 text-right font-black">{t.socio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="mt-3 text-body-sm text-muted-foreground">{v.condiciones}</p>
            </div>
          ))}
          <p className="flex items-center gap-2 text-body-sm text-muted-foreground"><MapPin size={16} strokeWidth={1.75} /> {p.direccion}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pt-4">
      <p className="text-muted-foreground">Negocios de nuestra tierra que empujan con nosotros.</p>
      <ul className="mt-6 space-y-3">
        {pats.map((pt) => {
          const vs = db.ventajas.filter((v) => v.patrocinadorId === pt.id && v.activa);
          return (
            <li key={pt.id}>
              <Button variant="ghost" onClick={() => setSel(pt.id)} className="flex h-auto w-full items-center gap-4 whitespace-normal rounded-panel bg-surface p-4 text-left transition-transform duration-200 active:scale-[.98]">
                <span className={`flex size-14 shrink-0 items-center justify-center rounded-control bg-primary font-black text-primary-foreground ${(vs[0]?.destacado?.length ?? 0) > 4 ? "text-[11px] uppercase" : "text-item"}`}>
                  {vs[0]?.destacado}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="label-club block text-muted-foreground">{pt.categoria}</span>
                  <span className="block font-black">{pt.nombre}</span>
                  <span className="block text-body-sm">{vs.length > 1 ? `${vs.length} ventajas` : vs[0]?.titulo}</span>
                </span>
                <ChevronRight size={20} strokeWidth={1.75} />
              </Button>
            </li>
          );
        })}
      </ul>
      <a href={folleto.url} target="_blank" rel="noreferrer" className="mt-6 flex h-auto min-h-12 items-center justify-center gap-2 rounded-panel btn-suave font-bold">
        <FileText size={18} strokeWidth={1.75} /> Ver el folleto completo (PDF)
      </a>
      <p className="mt-4 text-left text-body-sm text-muted-foreground">Enseña tu carnet en el mostrador. Así el negocio sabe que vienes por el club.</p>
    </section>
  );
}

