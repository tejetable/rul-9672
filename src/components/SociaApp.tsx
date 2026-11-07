import { useEffect, useState } from "react";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, FileText, Gift, Home, IdCard, MapPin } from "lucide-react";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";
import folleto from "@/assets/ventajas-socios-2026-27.pdf.asset.json";
import { Carne } from "@/components/Carne";
import { PhotoSlot } from "@/components/PhotoSlot";
import { dataService, type DB, type Socio } from "@/lib/dataService";

type Tab = "inicio" | "carne" | "ventajas" | "avisos";
const EQUIPO = "Concello de Guntín - R.U. Lucense";

export function SociaApp({ socio }: { socio: Socio }) {
  const [tab, setTab] = useState<Tab>("inicio");
  const [db, setDb] = useState<DB | null>(null);
  useEffect(() => setDb(dataService.get()), []);
  if (!db) return null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-5 pt-5">
        <img src={escudo.url} alt="Escudo del R.U. Lucense" width={450} height={676} className="crest crest-blend h-10 w-auto" />
        <span className="label-club">R.U. Lucense</span>
      </header>
      <div className="flex-1 pb-36">
        {tab === "inicio" && <Inicio db={db} socio={socio} irA={setTab} />}
        {tab === "carne" && (
          <section className="px-6 pt-6">
            <p className="label-club text-accent">Tu carné</p>
            <h1 className="title-club mt-2 text-4xl">Eres de los nuestros.</h1>
            <div className="animate-rise mt-8">
              <Carne nombre={socio.nombre} numero={socio.numeroSocio} temporada={socio.temporada} />
            </div>
            <button onClick={() => setTab("ventajas")} className="mt-8 min-h-12 w-full rounded-2xl bg-primary font-black uppercase text-primary-foreground">
              Ver mis ventajas
            </button>
          </section>
        )}
        {tab === "ventajas" && <Ventajas db={db} />}
        {tab === "avisos" && <Avisos db={db} />}
      </div>
      <nav className="sticky bottom-0 grid grid-cols-4 border-t border-border bg-background pb-2 pt-1">
        {(
          [
            ["inicio", "Inicio", Home],
            ["carne", "Carné", IdCard],
            ["ventajas", "Ventajas", Gift],
            ["avisos", "Avisos", Bell],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-bold transition-opacity duration-200 ${tab === id ? "" : "opacity-55"}`}
          >
            <Icon size={22} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Inicio({ db, socio, irA }: { db: DB; socio: Socio; irA: (t: Tab) => void }) {
  const proximo = db.partidos.find((p) => !p.jugado);
  const nueva = db.ventajas.find((v) => v.activa);
  const patNueva = nueva && db.patrocinadores.find((p) => p.id === nueva.patrocinadorId);
  return (
    <section className="px-5 pt-6">
      <p className="label-club text-accent">Hola, {socio.nombre.split(" ")[0]}</p>
      <h1 className="title-club mt-2 text-4xl">Vamos, que empieza.</h1>
      <span className="gold-rule mt-4" />

      {proximo && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground">
          <p className="label-club opacity-80">Próximo partido</p>
          <p className="title-club mt-3 text-2xl">{EQUIPO}</p>
          <p className="label-club my-2 opacity-70">vs</p>
          <p className="title-club text-3xl">{proximo.rival}</p>
          <div className="mt-4 space-y-1 text-sm opacity-90">
            <p className="flex items-center gap-2"><CalendarDays size={16} strokeWidth={1.75} /> {proximo.fechaHora || "Fecha y hora por confirmar"}</p>
            <p className="flex items-center gap-2"><MapPin size={16} strokeWidth={1.75} /> {proximo.lugar}</p>
          </div>
          <p className="mt-4 font-bold">Te esperamos en Guntín.</p>
        </div>
      )}

      {nueva && patNueva && (
        <button onClick={() => irA("ventajas")} className="mt-4 flex w-full items-center gap-4 rounded-2xl bg-roto p-5 text-left">
          <span className="title-club text-3xl text-accent">{nueva.destacado}</span>
          <span className="flex-1">
            <span className="label-club block text-muted-foreground">{patNueva.nombre}</span>
            <span className="font-bold">{nueva.titulo}</span>
          </span>
          <ChevronRight size={20} strokeWidth={1.75} />
        </button>
      )}

      <PhotoSlot label="el equipo en el pabellón de Guntín" className="mt-4 aspect-[4/3] w-full" />
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
            <div key={v.id} className="rounded-2xl bg-roto p-5">
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
              <button onClick={() => setSel(pt.id)} className="flex w-full items-center gap-4 rounded-2xl bg-roto p-4 text-left transition-transform duration-200 active:scale-[.98]">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground">
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
      <a href={folleto.url} target="_blank" rel="noreferrer" className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-primary font-bold">
        <FileText size={18} strokeWidth={1.75} /> Ver el folleto completo (PDF)
      </a>
      <p className="mt-4 text-center text-sm text-muted-foreground">Enseña tu carné o di que eres socia/o al pedir cita.</p>
    </section>
  );
}

function Avisos({ db }: { db: DB }) {
  const avisos = [...db.avisos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return (
    <section className="px-5 pt-6">
      <h1 className="title-club text-4xl">Avisos</h1>
      <span className="gold-rule mt-4" />
      <ul className="mt-6 space-y-3">
        {avisos.map((a) => (
          <li key={a.id} className="rounded-2xl bg-roto p-4">
            <p className="label-club text-accent">{a.tipo}</p>
            <p className="mt-1 font-black">{a.titulo}</p>
            <p className="mt-1">{a.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
