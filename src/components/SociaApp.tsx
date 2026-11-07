import { useEffect, useState } from "react";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, FileText, Gift, IdCard, Instagram, LogOut, MapPin, Twitch, Volleyball } from "lucide-react";
import { PhotoSlot } from "@/components/PhotoSlot";
import { ContactarClub } from "@/components/ContactarClub";
import { ListaAvisos } from "@/components/Avisos";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";
import pina from "@/assets/pina-equipo-ru-lucense.jpg.asset.json";
import folleto from "@/assets/ventajas-socios-2026-27.pdf.asset.json";
import { Carne } from "@/components/Carne";
import { Button } from "@/components/ui/button";
import { dataService, type DB, type Socio } from "@/lib/dataService";

type Tab = "equipo" | "carne" | "ventajas" | "avisos";
const EQUIPO = "Concello de Guntín - R.U. Lucense";

export function SociaApp({ socio }: { socio: Socio }) {
  const [tab, setTab] = useState<Tab>("carne");
  const [db, setDb] = useState<DB | null>(null);
  useEffect(() => setDb(dataService.get()), []);
  if (!db) return null;

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
        {tab === "equipo" && <Equipo db={db} />}
        {tab === "carne" && (
          <section className="px-5 pt-5">
            <div className="flex items-end justify-between gap-3">
              <h1 className="title-club text-4xl">Tu carnet.<br />Tu club.</h1>
              <span className="label-club pb-1 text-muted-foreground">{socio.temporada}</span>
            </div>
            <span className="gold-rule mt-4" />
            <div className="animate-rise mt-6">
              <Carne nombre={socio.nombre} numero={socio.numeroSocio} temporada={socio.temporada} />
            </div>
          </section>
        )}
        {tab === "ventajas" && <Ventajas db={db} />}
        {tab === "avisos" && <Avisos db={db} />}
      </div>
      <nav aria-label="Secciones de socio" className="member-navigation sticky bottom-0 z-20 grid grid-cols-4 border-t border-primary/15 bg-background pb-2 pt-1">
        {(
          [
            ["carne", "Carnet", IdCard],
            ["equipo", "El Equipo", Volleyball],
            ["ventajas", "Ventajas", Gift],
            ["avisos", "Avisos", Bell],
          ] as const
        ).map(([id, label, Icon]) => (
          <Button variant="ghost"
            key={id}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-none text-xs font-bold hover:bg-primary/5 [&_svg]:size-[22px] ${tab === id ? "border-t-2 border-primary bg-primary/5 text-primary" : "border-t-2 border-transparent text-muted-foreground"}`}
          >
            <Icon size={22} strokeWidth={1.75} />
            {label}
          </Button>
        ))}
      </nav>
    </div>
  );
}

function Equipo({ db }: { db: DB }) {
  const proximo = db.partidos.find((p) => !p.jugado);
  return (
    <section className="px-5 pt-6">
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
      <p className="mt-4 text-center text-sm text-muted-foreground">Enseña tu carné o di que eres socia/o al pedir cita.</p>
    </section>
  );
}

function Avisos({ db: _db }: { db: DB }) {
  return <ListaAvisos quien="socias" />;
}
