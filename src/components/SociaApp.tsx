import { useEffect, useState } from "react";
import { Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FileText, Gift, IdCard, Instagram, LogOut, MapPin, Twitch, X } from "lucide-react";
import { PhotoSlot } from "@/components/PhotoSlot";
import { ContactarClub } from "@/components/ContactarClub";
import { ListaAvisos } from "@/components/Avisos";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";
import pina from "@/assets/pina-equipo-ru-lucense.jpg.asset.json";
import folleto from "@/assets/ventajas-socios-2026-27.pdf.asset.json";
import { Carne } from "@/components/Carne";
import { Button } from "@/components/ui/button";
import { dataService, type Aviso, type DB, type Socio } from "@/lib/dataService";

type Tab = "equipo" | "ventajas";
const EQUIPO = "Concello de Guntín - R.U. Lucense";
const fecha = (f: string) => new Date(f).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

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
  const [db, setDb] = useState<DB | null>(null);
  const [leidos, setLeidos] = useState<string[]>([]);
  const [carnet, setCarnet] = useState(false);
  useEffect(() => { setDb(dataService.get()); setLeidos(dataService.avisosLeidos()); }, []);
  if (!db) return null;
  const avisos = dataService.avisosPara("socias");
  const sinLeer = avisos.filter((a) => !leidos.includes(a.id));
  const leer = (id: string) => { dataService.marcarAvisoLeido(id); setLeidos(dataService.avisosLeidos()); };

  const tabCls = (on: boolean) => `relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${on ? "font-bold text-primary" : "font-normal text-[rgba(13,70,49,.55)]"}`;
  const indicador = (on: boolean) => on && <span className="absolute top-1 h-[3px] w-5 rounded-full bg-accent" />;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-primary/15 px-5 py-4">
        <img src={escudo.url} alt="Escudo del R.U. Lucense" width={450} height={676} className="crest crest-blend h-10 w-auto" />
        <span className="flex-1"><span className="label-club block">R.U. Lucense</span><span className="text-xs text-muted-foreground">Somos familia.</span></span>
        <Button variant="ghost"
          onClick={() => {
            dataService.cerrarSesion();
            window.location.reload();
          }}
          className="flex min-h-11 items-center gap-1 text-xs font-bold text-muted-foreground hover:bg-primary/10"
        >
          <LogOut size={16} strokeWidth={1.75} /> Salir
        </Button>
      </header>
      <ContactarClub texto={`Hola, soy socia/o del R.U. Lucense y quería consultaros algo.`} />
      <div className="flex-1 pb-12">
        {tab === "equipo" && <Equipo db={db} avisos={avisos} sinLeer={sinLeer} onLeer={leer} />}
        {tab === "ventajas" && <Ventajas db={db} />}
      </div>
      <nav aria-label="Secciones de socio" className="member-navigation sticky bottom-0 z-20 grid grid-cols-3 border-t border-[rgba(13,70,49,.12)] bg-background pt-1">
        <button onClick={() => setTab("equipo")} aria-current={tab === "equipo" ? "page" : undefined} className={tabCls(tab === "equipo")}>
          {indicador(tab === "equipo")}
          <span className="relative">
            <BalonIcon />
            {sinLeer.length > 0 && <span aria-label="Avisos sin leer" className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent" />}
          </span>
          El Equipo
        </button>
        <button onClick={() => setCarnet(true)} className="flex flex-col items-center justify-end gap-1 pb-2 text-xs text-[rgba(13,70,49,.55)]" aria-label="Abrir carnet">
          <span className="-mt-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-gold"><IdCard size={26} strokeWidth={1.75} /></span>
          Carnet
        </button>
        <button onClick={() => setTab("ventajas")} aria-current={tab === "ventajas" ? "page" : undefined} className={tabCls(tab === "ventajas")}>
          {indicador(tab === "ventajas")}
          <Gift size={22} strokeWidth={1.75} />
          Ventajas
        </button>
      </nav>
      {carnet && <CarnetSheet socio={socio} onClose={() => setCarnet(false)} />}
    </div>
  );
}

function CarnetSheet({ socio, onClose }: { socio: Socio; onClose: () => void }) {
  const [dy, setDy] = useState(0);
  const [y0, setY0] = useState<number | null>(null);
  return (
    <div role="dialog" aria-label="Tu carnet" className="animate-sheet fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col overflow-y-auto bg-background px-5 pb-8"
      style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: y0 === null ? "transform .2s" : "none" }}
      onTouchStart={(e) => setY0((e.touches[0]?.clientY ?? 0))}
      onTouchMove={(e) => y0 !== null && setDy(Math.max(0, (e.touches[0]?.clientY ?? 0) - y0))}
      onTouchEnd={() => { if (dy > 100) onClose(); else setDy(0); setY0(null); }}
    >
      <button onClick={onClose} aria-label="Cerrar carnet" className="mx-auto flex min-h-11 w-full flex-col items-center justify-center gap-1 pt-2">
        <span className="h-1 w-10 rounded-full bg-primary/30" />
        <ChevronDown size={20} strokeWidth={1.75} className="text-muted-foreground" />
      </button>
      <div className="flex items-end justify-between gap-3">
        <h1 className="title-club text-4xl">Tu carnet.<br />Tu club.</h1>
        <span className="label-club pb-1 text-muted-foreground">{socio.temporada}</span>
      </div>
      <span className="gold-rule mt-4" />
      <div className="mt-6">
        <Carne nombre={socio.nombre} numero={socio.numeroSocio} temporada={socio.temporada} />
      </div>
    </div>
  );
}

function Equipo({ db, avisos, sinLeer, onLeer }: { db: DB; avisos: Aviso[]; sinLeer: Aviso[]; onLeer: (id: string) => void }) {
  const proximo = db.partidos.find((p) => !p.jugado);
  const [todos, setTodos] = useState(false);
  const destacado = sinLeer[0];
  if (todos) {
    return (
      <div>
        <button onClick={() => setTodos(false)} className="label-club mx-5 mt-4 flex min-h-11 items-center gap-1"><ChevronLeft size={18} strokeWidth={1.75} /> El Equipo</button>
        <ListaAvisos quien="socias" />
      </div>
    );
  }
  return (
    <section className="px-5 pt-6">
      {destacado && (
        <div className="animate-rise mb-6 flex items-start gap-3 rounded-2xl bg-primary p-4 text-primary-foreground">
          <Bell size={20} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-black">{destacado.titulo}</p>
            <p className="mt-1 line-clamp-2 text-sm opacity-90">{destacado.texto}</p>
            <p className="mt-2 text-xs opacity-70">{fecha(destacado.fecha)}</p>
          </div>
          <button onClick={() => onLeer(destacado.id)} aria-label="Marcar como leído" className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center"><X size={18} strokeWidth={1.75} /></button>
        </div>
      )}
      <p className="label-club text-accent">El Equipo</p>
      <h1 className="title-club mt-2 text-4xl">Vamos, que empieza.</h1>
      <span className="gold-rule mt-4" />

      <div className="mt-6 rounded-2xl bg-suave p-5">
        <p className="label-club text-muted-foreground">Último resultado</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="title-club flex-1 text-xl">R.U. Lucense</p>
          <p className="title-club text-5xl text-primary">18<span className="mx-1 text-muted-foreground">-</span>0</p>
          <p className="title-club flex-1 text-right text-xl">P.M. Friol</p>
        </div>
        <p className="mt-3 font-bold text-accent">¡Victoria! Gracias por empujar.</p>
      </div>

      {proximo && (
        <div className="mt-4 overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground">
          <p className="label-club opacity-80">Próximo partido</p>
          <p className="title-club mt-3 text-2xl">{EQUIPO}</p>
          <p className="label-club my-2 opacity-70">vs</p>
          <p className="title-club text-3xl">{proximo.rival}</p>
          <div className="mt-4 space-y-1 text-sm opacity-90">
            <p className="flex items-center gap-2"><CalendarDays size={16} strokeWidth={1.75} /> {proximo.fechaHora || "Fecha y hora por confirmar"}</p>
            <p className="flex items-center gap-2"><MapPin size={16} strokeWidth={1.75} /> {proximo.lugar}</p>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p className="label-club">Avisos</p>
        {avisos.length > 0 && <button onClick={() => setTodos(true)} className="min-h-11 text-sm font-bold text-accent">Ver todos</button>}
      </div>
      {avisos.length === 0 && <p className="mt-2 text-muted-foreground">Todavía no hay avisos.</p>}
      <ul className="mt-2 space-y-2">
        {avisos.slice(0, 3).map((a) => (
          <li key={a.id} className="rounded-2xl bg-suave p-4">
            <p className="text-xs text-muted-foreground">{fecha(a.fecha)}</p>
            <p className="font-black">{a.titulo}</p>
            <p className="line-clamp-2 text-sm">{a.texto}</p>
          </li>
        ))}
      </ul>

      <p className="label-club mt-8">Fotos y vídeos</p>
      <div className="-mx-5 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
        <img src={pina.url} alt="El equipo en el pabellón de Guntín" width={1920} height={1280} className="aspect-[3/2] w-[85%] shrink-0 snap-center rounded-2xl object-cover" />
        {["Celebración del 18-0", "Vídeo: resumen del partido", "La grada en Guntín"].map((t) => (
          <div key={t} className="w-[85%] shrink-0 snap-center"><PhotoSlot label={t} /></div>
        ))}
      </div>

      <p className="label-club mt-8">Síguenos</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <a href="https://www.instagram.com/realunionlucense/" target="_blank" rel="noreferrer" className="btn-suave flex min-h-14 items-center justify-center gap-2 rounded-2xl font-bold"><Instagram size={20} strokeWidth={1.75} /> Instagram</a>
        <a href="https://www.twitch.tv/adrifdez_10" target="_blank" rel="noreferrer" className="btn-suave flex min-h-14 items-center justify-center gap-2 rounded-2xl font-bold"><Twitch size={20} strokeWidth={1.75} /> Twitch</a>
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
      <section className="px-5 pt-4">
        <button onClick={() => setSel(null)} className="label-club flex min-h-11 items-center gap-1">
          <ChevronLeft size={18} strokeWidth={1.75} /> Ventajas
        </button>
        <p className="label-club mt-2 text-accent">{p.categoria}</p>
        <h1 className="title-club mt-2 text-4xl">{p.nombre}</h1>
        <span className="gold-rule mt-4" />
        <div className="mt-6 space-y-4">
          {vs.map((v) => (
            <div key={v.id} className="rounded-2xl bg-suave p-5">
              <p className="title-club text-4xl text-accent">{v.destacado}</p>
              <p className="mt-2 text-lg font-bold">{v.titulo}</p>
              <p className="mt-1">{v.descripcion}</p>
              {v.tarifas && (
                <table className="mt-4 w-full text-sm">
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
              <p className="mt-3 text-sm text-muted-foreground">{v.condiciones}</p>
            </div>
          ))}
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin size={16} strokeWidth={1.75} /> {p.direccion}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 pt-6">
      <p className="label-club text-accent">Ventajas 2026/27</p>
      <h1 className="title-club mt-2 text-4xl">Lo que te da ser de los nuestros</h1>
      <span className="gold-rule mt-4" />
      <p className="mt-4 text-muted-foreground">Negocios de nuestra tierra que empujan con nosotros.</p>
      <ul className="mt-6 space-y-3">
        {pats.map((pt) => {
          const vs = db.ventajas.filter((v) => v.patrocinadorId === pt.id && v.activa);
          return (
            <li key={pt.id}>
              <button onClick={() => setSel(pt.id)} className="flex w-full items-center gap-4 rounded-2xl bg-suave p-4 text-left transition-transform duration-200 active:scale-[.98]">
                <span className={`flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground ${(vs[0]?.destacado?.length ?? 0) > 4 ? "text-[11px] uppercase" : "text-lg"}`}>
                  {vs[0]?.destacado}
                </span>
                <span className="flex-1">
                  <span className="label-club block text-muted-foreground">{pt.categoria}</span>
                  <span className="block font-black">{pt.nombre}</span>
                  <span className="block text-sm">{vs.length > 1 ? `${vs.length} ventajas` : vs[0]?.titulo}</span>
                </span>
                <ChevronRight size={20} strokeWidth={1.75} />
              </button>
            </li>
          );
        })}
      </ul>
      <a href={folleto.url} target="_blank" rel="noreferrer" className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-2xl btn-suave font-bold">
        <FileText size={18} strokeWidth={1.75} /> Ver el folleto completo (PDF)
      </a>
      <p className="mt-4 text-center text-sm text-muted-foreground">Enseña tu carnet o di que eres socia/o al pedir cita.</p>
    </section>
  );
}

