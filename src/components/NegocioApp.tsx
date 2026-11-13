import { ClubCabecera } from "@/components/ClubCabecera";
import { useCallback, useEffect, useState } from "react";
import { Check, Delete, LogOut, MessageCircle, QrCode } from "lucide-react";
import { ContactarClub } from "@/components/ContactarClub";
import { AvisosCampana } from "@/components/AvisosCampana";
import { Button } from "@/components/ui/button";
import { QrScanner } from "@/components/QrScanner";
import { dataService, type Patrocinador, type Socio, type Visita } from "@/lib/dataService";
import { desdeRango, estadisticas, fraseMes, progresoObjetivo, serieGrafico } from "@/lib/visitas";
import { waLink } from "@/lib/whatsapp";

export function NegocioApp() {
  const [neg, setNeg] = useState<Patrocinador | null | undefined>(undefined);
  const [tab, setTab] = useState<"registrar" | "mes">("registrar");
  useEffect(() => setNeg(dataService.negocioSesion()), []);
  if (neg === undefined) return null;
  if (!neg) return <Pin onOk={(p) => { dataService.abrirNegocio(p.id); setNeg(p); }} />;

  return (
    <div className="flex flex-1 flex-col pb-16">
      <ClubCabecera titulo={neg.nombre} etiqueta="Negocio amigo">
        <AvisosCampana quien="negocios" />
        <Button variant="ghost" size="icon" onClick={() => { dataService.cerrarNegocio(); setNeg(null); }} aria-label="Cerrar sesión" className="size-11"><LogOut size={20} strokeWidth={1.75} /></Button>
      </ClubCabecera>
      <ContactarClub texto={`Hola, os escribo desde ${neg.nombre} (negocio amigo del club).`} />
      <div className="club-tabs mx-5 mt-4 grid-cols-2">
        {([["registrar", "Registrar visita"], ["mes", "Tu mes con el club"]] as const).map(([id, l]) => (
          <Button variant="ghost" key={id} onClick={() => setTab(id)} className={`h-auto min-h-11 rounded-control text-body-sm font-bold transition-colors duration-200 ${tab === id ? "bg-primary text-primary-foreground" : ""}`}>
            {l}
          </Button>
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
    <div className="flex flex-1 flex-col"><ClubCabecera etiqueta="Negocio" /><section className="flex flex-1 flex-col items-center px-5 pb-8 pt-8 text-center">
      <span className="club-chip">Negocio amigo</span>
      <h1 className="title-club mt-6 text-heading">Entra con tu PIN</h1>
            <p className="mt-4 text-muted-foreground">El que te dio el club. Solo se pide una vez en este móvil.</p>
      <div className="mt-6 flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`size-4 rounded-full border-2 border-primary ${i < pin.length ? "bg-primary" : ""}`} />
        ))}
      </div>
      <p className="mt-3 min-h-6 text-body-sm font-bold">{err ? "Ese PIN no es de ningún negocio del club. Prueba otra vez." : ""}</p>
      <div className="mt-2 grid w-full max-w-xs grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((d) =>
          d === "" ? <span key="x" /> : (
            <Button variant="ghost" key={d} onClick={() => (d === "⌫" ? setPin(pin.slice(0, -1)) : pulsar(d))} className="flex h-auto min-h-14 items-center justify-center rounded-panel bg-surface text-section font-black active:scale-95">
              {d === "⌫" ? <Delete size={22} strokeWidth={1.75} /> : d}
            </Button>
          ),
        )}
      </div>
      <p className="label-club mt-6 text-muted-foreground">Demo: EFG Parquets · 1111</p>
    </section></div>
  );
}


function Registrar({ neg }: { neg: Patrocinador }) {
  const [num, setNum] = useState("");
  const [socio, setSocio] = useState<Socio | null>(null);
  const [origen, setOrigen] = useState<Visita["origen"]>("numero");
  const [aviso, setAviso] = useState<string | null>(null);
  const [sinCarnet, setSinCarnet] = useState(false);
  const [scan, setScan] = useState(false);
  const [hoy, setHoy] = useState<Visita[]>([]);
  const [reciente, setReciente] = useState<string | null>(null);

  const refrescar = useCallback(() => {
    const d = new Date().toDateString();
    setHoy(dataService.get().visitas.filter((v) => v.patrocinadorId === neg.id && new Date(v.fechaHora).toDateString() === d).reverse());
  }, [neg.id]);
  useEffect(refrescar, [refrescar]);

  const limpiar = () => { setNum(""); setSocio(null); setAviso(null); setSinCarnet(false); };

  useEffect(() => {
    if (!reciente) return;
    const t1 = setTimeout(limpiar, 3000);
    const t2 = setTimeout(() => setReciente(null), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reciente]);

  const buscar = (n: string, o: Visita["origen"] = "numero") => {
    setNum(n); setOrigen(o); setAviso(null); setSinCarnet(false); setReciente(null);
    const s = n ? dataService.socioPorNumero(Number(n)) : null;
    setSocio(s);
    if (s && dataService.yaHoy(neg.id, s.id)) setAviso("Esta visita ya está registrada hoy.");
  };

  const onScan = useCallback((n: number) => { setScan(false); buscar(String(n), "qr"); }, [neg.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const listo = (!!socio && !aviso) || sinCarnet;
  const repite = !!socio && dataService.repite(neg.id, socio.id);

  const guardar = (tipo: Visita["tipoCliente"]) => {
    if (!listo) return;
    const s = sinCarnet ? null : socio;
    const r = dataService.registrarVisita({ patrocinadorId: neg.id, socio: s, origen: s ? origen : "sin_carne", tipoCliente: tipo });
    if (r === "duplicada") return setAviso("Esta visita ya está registrada hoy.");
    refrescar();
    setReciente(r.id);
  };

  const big = "flex h-auto min-h-14 w-full items-center justify-center gap-2 rounded-control text-item font-black uppercase transition-transform duration-200 active:scale-[.98] disabled:opacity-40 [&_svg]:size-6";

  return (
    <section className="flex flex-1 flex-col px-5 pt-6">
      {scan && <QrScanner onResult={onScan} onClose={() => setScan(false)} />}
      {reciente && (
        <div className="animate-rise mb-4 flex items-center gap-3 rounded-panel bg-surface p-4">
          <span className="animate-check flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check size={28} strokeWidth={3} /></span>
          <p className="flex-1 font-bold">Hecho. Gracias por apoyar a quien nos apoya.</p>
          <Button variant="ghost" onClick={() => { dataService.anularVisita(reciente); setReciente(null); refrescar(); }} className="h-auto min-h-11 rounded-control btn-suave px-3 text-body-sm font-bold">Deshacer</Button>
        </div>
      )}
      <Button variant="ghost" onClick={() => setScan(true)} className={`${big} bg-primary text-primary-foreground`}>
        <QrCode size={28} strokeWidth={1.75} /> Escanear carnet
      </Button>
      <label htmlFor="num-socio" className="label-club mt-5 block">Nº de socio</label>
      <input id="num-socio" value={num} onChange={(e) => buscar(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="O escríbelo aquí" className="mt-1 h-auto min-h-14 w-full rounded-panel club-input border-input px-4 text-section font-black placeholder:text-base placeholder:font-normal" />
      {socio && !aviso && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-item font-black text-accent">
          <Check size={22} strokeWidth={2.5} /> {socio.nombre} · Socia nº {socio.numeroSocio}
          {repite && <span className="label-club rounded-full bg-accent px-3 py-1 text-accent-foreground">Repite por el club</span>}
        </p>
      )}
      {num && !socio && <p className="mt-3 text-body-sm font-bold">Ese número no está en el club. Revísalo.</p>}
      {aviso && <p className="mt-3 rounded-control border border-accent p-3 font-bold">{aviso}</p>}
      {sinCarnet ? (
        <p className="mt-3 text-body-sm text-muted-foreground">Sin carnet: la visita se guarda como declarada. <Button variant="ghost" onClick={() => setSinCarnet(false)} className="font-bold underline">Cancelar</Button></p>
      ) : (
        <Button variant="ghost" onClick={() => { limpiar(); setSinCarnet(true); setReciente(null); }} className="mt-3 h-auto min-h-11 self-start whitespace-normal px-0 text-left text-body-sm text-muted-foreground underline">Viene de parte del club pero no tiene carnet</Button>
      )}

      <h2 className="label-club mt-8 text-muted-foreground">Últimas visitas de hoy</h2>
      {hoy.length === 0 ? (
        <p className="mt-2 text-body-sm text-muted-foreground">Todavía ninguna hoy.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border rounded-panel bg-surface px-4">
          {hoy.map((v) => {
            const s = v.socioId ? dataService.get().socios.find((x) => x.id === v.socioId) : null;
            return (
              <li key={v.id} className={`flex flex-wrap items-center gap-2 py-3 ${v.anulada ? "opacity-40 line-through" : ""}`}>
                <span className="w-12 text-body-sm font-bold">{new Date(v.fechaHora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="flex-1 font-bold">{s ? s.nombre : "Sin carnet"}</span>
                <span className="label-club rounded-full border border-primary px-2 py-0.5">{v.tipoCliente === "nueva" ? "Nueva" : "Ya era clienta"}</span>
                {v.repiteViaClub && <span className="label-club rounded-full bg-accent px-2 py-0.5 text-accent-foreground">Repite</span>}
              </li>
            );
          })}
        </ul>
      )}

      <div className="sticky bottom-0 -mx-5 mt-auto bg-background px-5 pb-5 pt-4">
        {repite && !sinCarnet ? (
          <Button variant="ghost" onClick={() => guardar("ya_era_clienta")} disabled={!listo} className={`${big} bg-primary text-primary-foreground`}>Registrar visita</Button>
        ) : (
          <>
            <p className="label-club mb-2 text-center text-accent">{listo ? "¿Ya era clienta tuya antes? Pulsa y queda registrada" : "Escanea el carnet o escribe el número"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => guardar("nueva")} disabled={!listo} className={`${big} bg-primary text-primary-foreground`}>Nueva</Button>
              <Button variant="ghost" onClick={() => guardar("ya_era_clienta")} disabled={!listo} className={`${big} btn-suave text-item`}>Ya era clienta</Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function TuMes({ neg }: { neg: Patrocinador }) {
  const [rango, setRango] = useState<"mes" | "90" | "temporada">("mes");
  const vs = dataService.get().visitas;
  const s = estadisticas(vs, neg.id, desdeRango(rango));
  const prog = progresoObjetivo(vs, neg.id);
  const sem = serieGrafico(vs, neg.id, rango);
  const max = Math.max(1, ...sem.map((w) => w.total));
  const frase = fraseMes(s, rango);
  const share = `${frase}\n\nVisitas por el club: ${s.visitas} · Clientas nuevas: ${s.nuevas} · Repiten: ${s.repiten}\n— Real Unión Lucense F.S.`;

  return (
    <section className="px-5 pt-6">
      <h1 className="club-section-title mb-3">Tu mes con el club</h1>
      <span className="label-club inline-block rounded-full border border-dashed border-primary px-3 py-1 text-muted-foreground">Datos de demostración</span>
      <div className="mt-4 club-tabs grid-cols-3">
        {([["mes", "Este mes"], ["90", "90 días"], ["temporada", "Temporada"]] as const).map(([id, l]) => (
          <Button variant="ghost" key={id} onClick={() => setRango(id)} className={`h-auto min-h-11 rounded-control text-body-sm font-bold ${rango === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</Button>
        ))}
      </div>

      <div className="mt-5 rounded-panel bg-primary p-5 text-primary-foreground">
        <p className="label-club opacity-80">Clientas nuevas</p>
        <p className="text-heading font-black leading-none text-gold">{s.nuevas}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[["Visitas por el club", s.visitas], ["Repiten por el club", s.repiten], ["% nuevas", `${s.pctNuevas}%`]].map(([l, n]) => (
          <div key={l} className="rounded-panel bg-surface p-3">
            <p className="text-heading font-black">{n}</p>
            <p className="label-club mt-1 text-[11px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-body-sm font-bold">
          <span>5 clientas nuevas en 90 días</span>
          <span>{prog.nuevas}/{prog.objetivo}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-suave">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${prog.pct}%` }} />
        </div>
      </div>

      <div className="mt-6 border-y border-border py-4">
        <p className="label-club text-muted-foreground">{rango === "temporada" ? "Visitas por mes" : "Visitas por semana"}</p>
        <div className="mt-3 flex h-32 items-end gap-1">
          {sem.map((w) => (
            <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-md bg-primary" style={{ height: `${(w.total / max) * 100}%`, minHeight: w.total ? 4 : 0 }}>
                <div className="w-full bg-accent" style={{ height: `${w.total ? (w.nuevas / w.total) * 100 : 0}%` }} />
              </div>
              <span className="text-[10px] font-bold">{w.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-label font-bold">
          <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-primary" /> Visitas</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-accent" /> Nuevas</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-panel border border-border bg-surface p-4">
          <p className="text-heading font-black">{s.verificadas}</p>
          <p className="label-club mt-1 text-[11px]">Verificadas (con carnet)</p>
        </div>
        <div className="rounded-panel border border-border bg-surface p-4">
          <p className="text-heading font-black">{s.declaradas}</p>
          <p className="label-club mt-1 text-[11px]">Declaradas (sin carnet)</p>
        </div>
      </div>

      <p className="mt-6 text-item font-bold">{frase}</p>
      <a href={waLink(share, "")} target="_blank" rel="noreferrer" className="mt-4 flex h-auto min-h-14 items-center justify-center gap-2 rounded-panel bg-primary font-black uppercase text-primary-foreground">
        <MessageCircle size={20} strokeWidth={1.75} /> Compartir por WhatsApp
      </a>
    </section>
  );
}
