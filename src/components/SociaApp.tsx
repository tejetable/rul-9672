import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, ChevronLeft, ChevronRight, FileText, Gift, IdCard } from "lucide-react";
import { carnetFrente as frente } from "@/assets/recursos";
import { escudo } from "@/assets/recursos";
import { fechaPartidoTexto, proximoPartido } from "@/lib/partidos";
import { Liga } from "@/components/PartidoTarjetas";
import { Galeria } from "@/components/Galeria";
import { SociaCabecera } from "@/components/SociaCabecera";
import { ventajasPdf as folleto } from "@/assets/recursos";
import { Carne } from "@/components/Carne";
import { Button } from "@/components/ui/button";
import { dataService, type DB, type Patrocinador, type Socio, useClubData, runAction } from "@/lib/dataService";
import { claseVista, useVista } from "@/lib/vista";

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
  const vista = useVista();
  useEffect(() => { runAction(() => dataService.marcarApertura(socio.id)); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [tab]);
  if (!db) return null;
  const tabCls = (on: boolean) => `member-tab relative flex h-auto min-h-16 flex-col items-center justify-center gap-1 ${on ? "is-on" : ""}`;
  const indicador = (on: boolean) => on && <span className="member-tab-bar" aria-hidden="true" />;

  return (
    <div className={`${claseVista(vista)} flex flex-1 flex-col`}>
      <SociaCabecera />
      <div className="flex-1 pb-24">
        {tab === "equipo" && <Equipo db={db} />}
        {tab === "ventajas" && <Ventajas db={db} onCarnet={() => setCarnet(true)} />}
      </div>
      <nav aria-label="Secciones de socio o socia" className="member-navigation fixed inset-x-0 mx-auto w-full max-w-[430px] bottom-0 z-20 grid grid-cols-3 border-t border-border bg-background pt-1">
        <Button variant="ghost" onClick={() => setTab("equipo")} aria-current={tab === "equipo" ? "page" : undefined} className={tabCls(tab === "equipo")}>
          {indicador(tab === "equipo")}
          <span className="relative">
            <BalonIcon />
          </span>
          El Equipo
        </Button>
        <Button variant="ghost" onClick={() => setCarnet(true)} className="member-tab flex h-auto min-h-16 flex-col items-center justify-end gap-1 pb-2" aria-label="Abrir carnet">
          <span className="member-carnet-key"><IdCard size={26} strokeWidth={2} /></span>
          Carnet
        </Button>
        <Button variant="ghost" onClick={() => setTab("ventajas")} aria-current={tab === "ventajas" ? "page" : undefined} className={tabCls(tab === "ventajas")}>
          {indicador(tab === "ventajas")}
          <Gift size={22} strokeWidth={1.75} />
          Ventajas
        </Button>
      </nav>
      {carnet && <CarnetSheet socio={socio} onClose={() => setCarnet(false)} onDondeUsar={() => { setCarnet(false); setTab("ventajas"); }} />}
      <Bienvenida db={db} />
    </div>
  );
}

function CarnetSheet({ socio, onClose, onDondeUsar }: { socio: Socio; onClose: () => void; onDondeUsar: () => void }) {
  const [dy, setDy] = useState(0);
  const [y0, setY0] = useState<number | null>(null);
  const [alCorriente, setAlCorriente] = useState<boolean | null>(null);
  const vista = useVista();
  useEffect(() => { let vivo = true; dataService.pagoTemporada(socio.id, socio.temporada).then((v) => { if (vivo) setAlCorriente(v); }).catch(() => {}); return () => { vivo = false; }; }, [socio.id, socio.temporada]);
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-primary/60" />
    <Dialog.Content aria-describedby={undefined} className={`${claseVista(vista)} animate-sheet carnet-overlay fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] flex-col overflow-y-auto bg-background px-4 pb-8`}
      style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: y0 === null ? "transform .2s" : "none" }}
      onTouchStart={(e) => setY0((e.touches[0]?.clientY ?? 0))}
      onTouchMove={(e) => y0 !== null && setDy(Math.max(0, (e.touches[0]?.clientY ?? 0) - y0))}
      onTouchEnd={() => { if (dy > 100) onClose(); else setDy(0); setY0(null); }}
    >
      <Button variant="ghost" onClick={onClose} aria-label="Cerrar carnet" className="mx-auto flex h-auto min-h-11 w-full flex-col items-center justify-center gap-1 pt-2">
        <span className="h-1 w-10 rounded-full bg-primary/30" />
        <ChevronDown size={20} strokeWidth={1.75} className="text-muted-foreground" />
      </Button>
      <Dialog.Title className="sr-only">Tu carnet</Dialog.Title>
      <div className="mt-4">
        <Carne nombre={socio.nombre} numero={socio.numeroSocio} temporada={socio.temporada} alCorriente={alCorriente} onDondeUsar={onDondeUsar} />
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

const iniciales = (n: string) => n.replace(/["'.]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
function LogoNegocio({ p }: { p: Patrocinador }) {
  return <span className="benefit-logo" aria-hidden="true">{p.logoUrl ? <img src={p.logoUrl} alt="" /> : iniciales(p.nombre)}</span>;
}

function Ventajas({ db, onCarnet }: { db: DB; onCarnet: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const pats = db.patrocinadores.filter((p) => p.activo);
  const p = pats.find((x) => x.id === sel);
  useEffect(() => { window.scrollTo(0, 0); }, [sel]);

  if (p) {
    const vs = db.ventajas.filter((v) => v.patrocinadorId === p.id && v.activa);
    const dir = p.direccion?.trim();
    const conDireccion = !!dir && !/pendiente/i.test(dir);
    return (
      <section className="px-4 pt-4 pb-32">
        <Button variant="ghost" onClick={() => setSel(null)} className="label-club -ml-2 flex h-11 items-center gap-1 px-2">
          <ChevronLeft size={18} strokeWidth={1.75} /> Ventajas
        </Button>
        <div className="mt-2 flex items-center gap-3">
          <LogoNegocio p={p} />
          <div className="min-w-0"><h1 className="text-section font-black leading-tight">{p.nombre}</h1><p className="label-club text-muted-foreground">{p.categoria}</p></div>
        </div>
        <h2 className="club-section-title mt-6">Qué te da</h2>
        <div className="surface-card benefit-detail divide-y divide-[var(--divider)]">
          {vs.map((v) => (
            <div key={v.id} className="py-3 first:pt-0">
              {v.destacado && <p className="benefit-deal">{v.destacado}</p>}
              <p className="text-item font-bold">{v.titulo}</p>
              <p className="mt-1">{v.descripcion}</p>
              {v.tarifas && (
                <table className="mt-3 w-full text-body-sm">
                  <thead><tr className="label-club text-muted-foreground"><th className="py-2 text-left">Servicio</th><th className="py-2 text-right">Normal</th><th className="py-2 text-right" aria-label="Socio o socia">Soci@</th></tr></thead>
                  <tbody>{v.tarifas.map((t) => (<tr key={t.servicio} className="border-t border-[var(--divider)]"><td className="py-2 pr-2">{t.servicio}</td><td className="py-2 text-right text-muted-foreground line-through">{t.normal}</td><td className="py-2 text-right font-black">{t.socio}</td></tr>))}</tbody>
                </table>
              )}
              {v.condiciones && <p className="mt-2 text-body-sm text-muted-foreground">{v.condiciones}</p>}
            </div>
          ))}
        </div>
        {conDireccion && <><h2 className="club-section-title mt-6">Dónde</h2><div className="surface-card benefit-place"><p>{dir}</p><Button asChild variant="outline" className="mt-3 h-10 rounded-control font-bold"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.nombre} ${dir}`)}`} target="_blank" rel="noopener noreferrer">Cómo llegar</a></Button></div></>}
        <div className="member-sticky-action"><Button onClick={onCarnet} className="h-14 w-full rounded-control text-base font-black">Enseñar carnet</Button></div>
      </section>
    );
  }

  return (
    <section className="px-4 pt-4">
      <h1 className="club-section-title">Negocios amigos</h1>
      <ul className="surface-card benefit-list">
        {pats.map((pt) => {
          const v = db.ventajas.find((x) => x.patrocinadorId === pt.id && x.activa);
          return (
            <li key={pt.id}>
              <button type="button" onClick={() => setSel(pt.id)} className="benefit-row">
                <LogoNegocio p={pt} />
                <span className="min-w-0 flex-1"><span className="block truncate text-item font-bold">{pt.nombre}</span><span className="label-club block truncate text-muted-foreground">{pt.categoria}</span></span>
                {v?.destacado && <span className="benefit-perk">{v.destacado}</span>}
                <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ul>
      <Button asChild variant="link" className="mt-4 h-11 px-0 font-bold text-accent"><a href={folleto.url} target="_blank" rel="noreferrer">Ver el folleto completo (PDF) →</a></Button>
    </section>
  );
}

const CLAVE_BIENVENIDA = "rul-bienvenida-socia-vista";
function Bienvenida({ db }: { db: DB }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => { try { if (!localStorage.getItem(CLAVE_BIENVENIDA)) setOpen(true); } catch { /* sin almacenamiento */ } }, []);
  if (!open) return null;
  const cerrar = () => { try { localStorage.setItem(CLAVE_BIENVENIDA, "1"); } catch { /* ignore */ } setOpen(false); };
  const negocios = db.patrocinadores.filter((p) => p.activo).slice(0, 3);
  const prox = proximoPartido(db.partidos, new Date());
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth));
  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-label="Bienvenida">
      <div className="flex h-11 justify-end"><Button variant="ghost" onClick={cerrar} className="h-11 px-2 font-bold">Saltar</Button></div>
      <div className="onboarding-track" onScroll={onScroll}>
        <section className="onboarding-slide">
          <h2>Este es tu carnet</h2>
          <img src={frente.url} alt="Carnet de socio o socia del R.U. Lucense" className="w-full max-w-[220px] rounded-tile" />
          <p>Enséñalo en los negocios amigos del club.</p>
        </section>
        <section className="onboarding-slide">
          <h2>Así ayudas al club</h2>
          <ul className="w-full max-w-[300px] divide-y divide-[var(--divider)] text-left">{negocios.map((n) => <li key={n.id} className="flex min-h-14 items-center gap-3"><LogoNegocio p={n} /><span className="font-bold">{n.nombre}</span></li>)}</ul>
          <p>Cada vez que lo enseñas, el negocio ve lo que le trae el club. Así siguen patrocinándonos.</p>
        </section>
        <section className="onboarding-slide">
          <h2>Sigue al equipo</h2>
          {prox && <div className="fixture-card w-full max-w-[300px]"><p className="fixture-kicker">Jornada {prox.jornada} · {prox.esLocal ? "En casa" : "Fuera"}</p><div className="mt-3 flex items-center justify-center gap-3"><img src={escudo.url} alt="" className="size-10 object-contain" /><span className="font-black">vs {prox.rival}</span></div><p className="mt-2 text-body-sm">{fechaPartidoTexto(prox)}</p></div>}
          <p>Próximo partido, resultados, fotos y la clasificación.</p>
          <Button onClick={cerrar} className="h-11 w-full max-w-[300px] rounded-control font-bold">Empezar</Button>
        </section>
      </div>
      <div className="onboarding-dots" aria-hidden="true">{[0, 1, 2].map((n) => <span key={n} className={n === i ? "is-active" : ""} />)}</div>
    </div>
  );
}
