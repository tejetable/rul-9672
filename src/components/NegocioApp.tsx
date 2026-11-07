import { useCallback, useEffect, useState } from "react";
import { Check, Delete, LogOut, MessageCircle, QrCode } from "lucide-react";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";
import { QrScanner } from "@/components/QrScanner";
import { dataService, type Patrocinador, type Socio, type Visita } from "@/lib/dataService";
import { desdeRango, estadisticas, fraseMes, porSemana, progresoObjetivo } from "@/lib/visitas";
import { waLink } from "@/lib/whatsapp";

export function NegocioApp() {
  const [neg, setNeg] = useState<Patrocinador | null | undefined>(undefined);
  const [tab, setTab] = useState<"registrar" | "mes">("registrar");
  useEffect(() => setNeg(dataService.negocioSesion()), []);
  if (neg === undefined) return null;
  if (!neg) return <Pin onOk={(p) => { dataService.abrirNegocio(p.id); setNeg(p); }} />;

  return (
    <div className="flex flex-1 flex-col pb-32">
      <header className="flex items-center gap-3 px-5 pt-5">
        <img src={escudo.url} alt="Escudo del R.U. Lucense" width={450} height={676} className="crest crest-blend h-10 w-auto" />
        <span className="flex-1">
          <span className="label-club block text-muted-foreground">Negocio amigo</span>
          <span className="block font-black">{neg.nombre}</span>
        </span>
        <button onClick={() => { dataService.cerrarNegocio(); setNeg(null); }} aria-label="Cerrar sesión" className="flex size-11 items-center justify-center">
          <LogOut size={20} strokeWidth={1.75} />
        </button>
      </header>
      <div className="mx-5 mt-4 grid grid-cols-2 rounded-2xl bg-roto p-1">
        {([["registrar", "Registrar visita"], ["mes", "Tu mes con el club"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`min-h-11 rounded-xl text-sm font-bold transition-colors duration-200 ${tab === id ? "bg-primary text-primary-foreground" : ""}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === "registrar" ? <Registrar neg={neg} /> : <TuMes neg={neg} />}
    </div>
  );
}

function Pin({ onOk }: { onOk: (p: Patrocinador) => void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const pulsar = (d: string) => {
    const n = (pin + d).slice(0, 4);
    setPin(n);
    setErr(false);
    if (n.length === 4) {
      const p = dataService.negocioPorPin(n);
      if (p) onOk(p);
      else {
        setErr(true);
        setPin("");
      }
    }
  };
  return (
    <section className="flex flex-1 flex-col items-center px-6 pb-32 pt-10 text-center">
      <img src={escudo.url} alt="Escudo del R.U. Lucense" width={450} height={676} className="crest crest-blend w-24" />
      <h1 className="title-club mt-6 text-3xl">Entra con tu PIN</h1>
      <span className="gold-rule mt-4" />
      <p className="mt-4 text-muted-foreground">El que te dio el club. Solo se pide una vez en este móvil.</p>
      <div className="mt-6 flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`size-4 rounded-full border-2 border-primary ${i < pin.length ? "bg-primary" : ""}`} />
        ))}
      </div>
      <p className="mt-3 min-h-6 text-sm font-bold">{err ? "Ese PIN no es de ningún negocio del club. Prueba otra vez." : ""}</p>
      <div className="mt-2 grid w-full max-w-xs grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((d) =>
          d === "" ? <span key="x" /> : (
            <button key={d} onClick={() => (d === "⌫" ? setPin(pin.slice(0, -1)) : pulsar(d))} className="flex min-h-14 items-center justify-center rounded-2xl bg-roto text-2xl font-black active:scale-95">
              {d === "⌫" ? <Delete size={22} strokeWidth={1.75} /> : d}
            </button>
          ),
        )}
      </div>
      <p className="label-club mt-6 text-muted-foreground">Demo: EFG Parquets · 1111</p>
    </section>
  );
}

type Paso = { k: "quien" } | { k: "noExiste" } | { k: "tipo"; socio: Socio | null; origen: Visita["origen"] } | { k: "hecho" };

function Registrar({ neg }: { neg: Patrocinador }) {
  const [paso, setPaso] = useState<Paso>({ k: "quien" });
  const [num, setNum] = useState("");
  const [socio, setSocio] = useState<Socio | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [scan, setScan] = useState(false);
  const [ultima, setUltima] = useState<{ id: string; t: number } | null>(null);
  const [hoy, setHoy] = useState<Visita[]>([]);
  const [, tick] = useState(0);

  const refrescar = useCallback(() => {
    const d = new Date().toDateString();
    setHoy(dataService.get().visitas.filter((v) => v.patrocinadorId === neg.id && new Date(v.fechaHora).toDateString() === d).reverse());
  }, [neg.id]);
  useEffect(refrescar, [refrescar]);

  useEffect(() => {
    if (!ultima) return;
    const i = setInterval(() => {
      tick((x) => x + 1);
      if (Date.now() - ultima.t > 10000) setUltima(null);
    }, 500);
    return () => clearInterval(i);
  }, [ultima]);

  const reset = () => { setPaso({ k: "quien" }); setNum(""); setSocio(null); setAviso(null); };

  const buscar = (n: string) => {
    setNum(n);
    setAviso(null);
    const s = n ? dataService.socioPorNumero(Number(n)) : null;
    setSocio(s);
    if (s && dataService.yaHoy(neg.id, s.id)) setAviso("Esta visita ya está registrada hoy.");
  };

  const seguir = (origen: Visita["origen"]) => {
    if (num && !socio) return setPaso({ k: "noExiste" });
    if (socio && dataService.yaHoy(neg.id, socio.id)) return;
    setPaso({ k: "tipo", socio, origen: socio ? origen : "sin_carne" });
  };

  const onScan = useCallback((n: number) => {
    setScan(false);
    const s = dataService.socioPorNumero(n);
    setNum(String(n));
    setSocio(s);
    if (!s) return setPaso({ k: "noExiste" });
    if (dataService.yaHoy(neg.id, s.id)) return setAviso("Esta visita ya está registrada hoy.");
    setPaso({ k: "tipo", socio: s, origen: "qr" });
  }, [neg.id]);

  const guardar = (tipo: Visita["tipoCliente"]) => {
    if (paso.k !== "tipo") return;
    const r = dataService.registrarVisita({ patrocinadorId: neg.id, socio: paso.socio, origen: paso.origen, tipoCliente: tipo });
    if (r === "duplicada") { setAviso("Esta visita ya está registrada hoy."); setPaso({ k: "quien" }); return; }
    setUltima({ id: r.id, t: Date.now() });
    setPaso({ k: "hecho" });
    refrescar();
    setTimeout(reset, 3000);
  };

  const big = "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-black uppercase transition-transform duration-200 active:scale-[.98]";

  return (
    <section className="px-5 pt-6">
      {scan && <QrScanner onResult={onScan} onClose={() => setScan(false)} />}

      {paso.k === "quien" && (
        <div className="animate-rise">
          <p className="label-club text-accent">Paso 1 · ¿Quién es?</p>
          <button onClick={() => setScan(true)} className={`${big} mt-3 min-h-20 bg-primary text-primary-foreground`}>
            <QrCode size={28} strokeWidth={1.75} /> Escanear carné
          </button>
          <label className="label-club mt-5 block">Nº de socio (opcional)</label>
          <div className="mt-1 flex gap-2">
            <input value={num} onChange={(e) => buscar(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Ej. 12" className="min-h-14 flex-1 rounded-2xl border-2 border-input bg-background px-4 text-2xl font-black" />
            <button onClick={() => seguir("numero")} disabled={!num || !!aviso} className="min-h-14 rounded-2xl bg-primary px-5 font-black uppercase text-primary-foreground disabled:opacity-40">
              Seguir
            </button>
          </div>
          {socio && !aviso && <p className="mt-3 flex items-center gap-2 text-lg font-black text-accent"><Check size={22} strokeWidth={2.5} /> {socio.nombre} · Socia nº {socio.numeroSocio}</p>}
          {aviso && <p className="mt-3 rounded-xl border-2 border-gold p-3 font-bold">{aviso}</p>}
          <button onClick={() => { setNum(""); setSocio(null); setPaso({ k: "tipo", socio: null, origen: "sin_carne" }); }} className="mt-4 min-h-11 text-sm font-bold underline">
            No tiene carné / viene de parte del club
          </button>
          {ultima && (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-roto p-3">
              <span className="text-sm">Visita registrada.</span>
              <button onClick={() => { dataService.anularVisita(ultima.id); setUltima(null); refrescar(); }} className="min-h-11 rounded-xl border-2 border-primary px-4 font-bold">
                Deshacer ({Math.max(0, 10 - Math.floor((Date.now() - ultima.t) / 1000))})
              </button>
            </div>
          )}
        </div>
      )}

      {paso.k === "noExiste" && (
        <div className="animate-rise">
          <p className="text-xl font-black">Ese número no está en el club. ¿Lo registramos sin número?</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => { setSocio(null); setNum(""); setPaso({ k: "tipo", socio: null, origen: "sin_carne" }); }} className={`${big} bg-primary text-primary-foreground`}>Sí</button>
            <button onClick={() => setPaso({ k: "quien" })} className={`${big} border-2 border-primary bg-background`}>Corregir</button>
          </div>
        </div>
      )}

      {paso.k === "tipo" && (
        <div className="animate-rise">
          <p className="label-club text-accent">Paso 2</p>
          <p className="title-club mt-2 text-3xl">¿Ya era clienta tuya antes?</p>
          <p className="mt-3 font-bold">{paso.socio ? `${paso.socio.nombre} · Socia nº ${paso.socio.numeroSocio}` : "Sin carné"}</p>
          {paso.socio && dataService.repite(neg.id, paso.socio.id) && (
            <span className="label-club mt-2 inline-block rounded-full bg-accent px-3 py-1 text-accent-foreground">Repite por el club</span>
          )}
          <div className="mt-5 flex flex-col gap-3">
            <button onClick={() => guardar("nueva")} className={`${big} min-h-20 bg-primary text-2xl text-primary-foreground`}>Nueva</button>
            <button onClick={() => guardar("ya_era_clienta")} className={`${big} min-h-20 border-2 border-primary bg-background text-2xl`}>Ya era clienta</button>
          </div>
          <button onClick={reset} className="mt-4 min-h-11 text-sm font-bold underline">Volver</button>
        </div>
      )}

      {paso.k === "hecho" && (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="animate-check flex size-24 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Check size={56} strokeWidth={3} />
          </span>
          <p className="title-club mt-6 text-2xl">Hecho. Gracias por apoyar a quien nos apoya.</p>
          {ultima && (
            <button onClick={() => { dataService.anularVisita(ultima.id); setUltima(null); refrescar(); reset(); }} className="mt-6 min-h-11 rounded-xl border-2 border-primary px-5 font-bold">
              Deshacer
            </button>
          )}
        </div>
      )}

      <h2 className="label-club mt-10 text-muted-foreground">Últimas visitas de hoy</h2>
      {hoy.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Todavía ninguna hoy.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border rounded-2xl bg-roto px-4">
          {hoy.map((v) => {
            const s = v.socioId ? dataService.get().socios.find((x) => x.id === v.socioId) : null;
            return (
              <li key={v.id} className={`flex flex-wrap items-center gap-2 py-3 ${v.anulada ? "opacity-40 line-through" : ""}`}>
                <span className="w-12 text-sm font-bold">{new Date(v.fechaHora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="flex-1 font-bold">{s ? s.nombre : "Sin carné"}</span>
                <span className="label-club rounded-full border border-primary px-2 py-0.5">{v.tipoCliente === "nueva" ? "Nueva" : "Ya era clienta"}</span>
                {v.repiteViaClub && <span className="label-club rounded-full bg-accent px-2 py-0.5 text-accent-foreground">Repite</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TuMes({ neg }: { neg: Patrocinador }) {
  const [rango, setRango] = useState<"mes" | "90" | "temporada">("mes");
  const vs = dataService.get().visitas;
  const s = estadisticas(vs, neg.id, desdeRango(rango));
  const mes = estadisticas(vs, neg.id, desdeRango("mes"));
  const prog = progresoObjetivo(vs, neg.id);
  const sem = porSemana(vs, neg.id);
  const max = Math.max(1, ...sem.map((w) => w.total));
  const frase = fraseMes(mes);
  const share = `${frase}\n\nVisitas por el club: ${s.visitas} · Clientas nuevas: ${s.nuevas} · Repiten: ${s.repiten}\n— Real Unión Lucense F.S.`;

  return (
    <section className="px-5 pt-6">
      <span className="label-club inline-block rounded-full border border-dashed border-primary px-3 py-1 text-muted-foreground">Datos de demostración</span>
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-roto p-1">
        {([["mes", "Este mes"], ["90", "90 días"], ["temporada", "Temporada"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => setRango(id)} className={`min-h-11 rounded-xl text-sm font-bold ${rango === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="label-club opacity-80">Clientas nuevas</p>
        <p className="text-7xl font-black leading-none text-gold">{s.nuevas}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[["Visitas por el club", s.visitas], ["Repiten por el club", s.repiten], ["% nuevas", `${s.pctNuevas}%`]].map(([l, n]) => (
          <div key={l} className="rounded-2xl bg-roto p-3">
            <p className="text-3xl font-black">{n}</p>
            <p className="label-club mt-1 text-[11px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm font-bold">
          <span>5 clientas nuevas en 90 días</span>
          <span>{prog.nuevas}/{prog.objetivo}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-roto">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${prog.pct}%` }} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-roto p-4">
        <p className="label-club text-muted-foreground">Visitas por semana</p>
        <div className="mt-3 flex h-32 items-end gap-2">
          {sem.map((w) => (
            <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-md bg-primary" style={{ height: `${(w.total / max) * 100}%`, minHeight: w.total ? 4 : 0 }}>
                <div className="w-full bg-accent" style={{ height: `${w.total ? (w.nuevas / w.total) * 100 : 0}%` }} />
              </div>
              <span className="text-[11px] font-bold">{w.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs font-bold">
          <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-primary" /> Visitas</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-accent" /> Nuevas</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-primary p-4">
          <p className="text-3xl font-black">{s.verificadas}</p>
          <p className="label-club mt-1 text-[11px]">Verificadas (con carné)</p>
        </div>
        <div className="rounded-2xl border-2 border-primary p-4">
          <p className="text-3xl font-black">{s.declaradas}</p>
          <p className="label-club mt-1 text-[11px]">Declaradas (sin carné)</p>
        </div>
      </div>

      <p className="mt-6 text-lg font-bold">{frase}</p>
      <a href={waLink(share, "")} target="_blank" rel="noreferrer" className="mt-4 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-black uppercase text-primary-foreground">
        <MessageCircle size={20} strokeWidth={1.75} /> Compartir por WhatsApp
      </a>
    </section>
  );
}
