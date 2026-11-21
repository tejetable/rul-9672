import {BusinessAccountMenu} from './PasswordManagement';
import {ListCard,ListRow} from './ListRow';
import {VerComo} from "@/components/VerComo";
import { ClubCabecera } from "@/components/ClubCabecera";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, MessageCircle, QrCode } from "lucide-react";
import { ContactarClub } from "@/components/ContactarClub";
import { AvisosCampana } from "@/components/AvisosCampana";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { QrScanner } from "@/components/QrScanner";
import { dataService, type Patrocinador, type Socio, type Visita, useClubData, runAction } from "@/lib/dataService";
import { categoriasVisitas, fraseMes } from "@/lib/visitas";
import { adaptarStats, emptyStats, type ClubStats } from "@/lib/club-stats";
import { waLink } from "@/lib/whatsapp";

export function NegocioApp({onExit}:{onExit?:()=>void}={}) {
  useClubData();
  const [neg, setNeg] = useState<Patrocinador | null | undefined>(undefined);
  const [tab, setTab] = useState<"registrar" | "mes">("registrar");
  useEffect(() => setNeg(dataService.negocioSesion()), []);
  if (neg === undefined) return null;
  if (!neg) return <p className="p-6">El club debe asociar tu email a un negocio.</p>;

  return (
    <div className={`flex flex-1 flex-col pb-16 ${onExit?'business-test-view':''}`}>
      {onExit&&<div className="business-test-banner"><span>Accediendo como {neg.nombre}</span><span>·</span><Button variant="link" onClick={onExit}>Salir</Button></div>}
      <ClubCabecera titulo={neg.nombre} etiqueta="Negocio amigo">
        {!onExit&&<VerComo/>}<AvisosCampana quien="negocios" />
        {!onExit&&<BusinessAccountMenu/>}
      </ClubCabecera>
      <div className="club-tabs mx-4 mt-4 grid-cols-2">
        {([["registrar", "Registrar visita"], ["mes", "Tu mes con el club"]] as const).map(([id, l]) => (
          <Button variant="ghost" key={id} onClick={() => setTab(id)} className={`h-auto min-h-11 rounded-control text-body-sm font-bold transition-colors duration-150 ${tab === id ? "bg-primary text-primary-foreground" : ""}`}>
            {l}
          </Button>
        ))}
      </div>
      {tab === "registrar" ? <Registrar neg={neg} /> : <TuMes neg={neg} />}
      <div className="business-contact mx-4 mt-8"><ContactarClub texto={`Hola, os escribo desde ${neg.nombre} (negocio amigo del club).`} /></div>
    </div>
  );
}

/** En el mostrador basta el nombre y la inicial del apellido para comprobar quién es. */
export function nombreDiscreto(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length < 2) return nombre.trim();
  return `${partes[0]} ${partes[1]!.charAt(0).toUpperCase()}.`;
}

function Registrar({ neg }: { neg: Patrocinador }) {
  const db = useClubData();
  const lookupVersion = useRef(0);
  const [num, setNum] = useState("");
  const [socio, setSocio] = useState<Socio | null>(null);
  const [repite, setRepite] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [origen, setOrigen] = useState<Visita["origen"]>("numero");
  const [aviso, setAviso] = useState<string | null>(null);
  const [sinCarnet, setSinCarnet] = useState(false);
  const [scan, setScan] = useState(false);
  const [hoy, setHoy] = useState<Visita[]>([]);
  const [reciente, setReciente] = useState<string | null>(null);
  const [gasto,setGasto]=useState('');

  const refrescar = useCallback(() => {
    const dia=(value:Date)=>value.toLocaleDateString('en-CA',{timeZone:'Europe/Madrid'});
    setHoy(dataService.get().visitas.filter((v) => v.patrocinadorId === neg.id && !!v.esPrueba===!!dataService.negocioPrueba() && dia(new Date(v.fechaHora)) === dia(new Date())).reverse());
  }, [neg.id]);
  useEffect(refrescar, [refrescar, db]);

  const limpiar = () => { setRepite(false); setNum(""); setSocio(null); setAviso(null); setSinCarnet(false); };

  useEffect(() => {
    if (!reciente) return;
    const t1 = setTimeout(limpiar, 3000);
    const t2 = setTimeout(() => setReciente(null), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reciente]);

  const buscar = async (n: string, o: Visita["origen"] = "numero") => {
    setNum(n); setOrigen(o); setAviso(null); setSinCarnet(false); setReciente(null);
    const lookup=++lookupVersion.current;setSocio(null);setRepite(false);setBuscando(true);
    const s = n ? await dataService.socioPorNumero(Number(n)) : null;
    if(lookup!==lookupVersion.current)return;
    setBuscando(false); setRepite(!!s?.repite);
    setSocio(s);
    if (s?.yaHoy) setAviso("Esta visita ya está registrada hoy.");
  };

  const onScan = useCallback((n: number) => { setScan(false); runAction(() => buscar(String(n), "qr")); }, [neg.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const listo = !buscando && !guardando && ((!!socio && !aviso) || sinCarnet);

  const guardar = async (tipo: Visita["tipoCliente"]) => {
    if (!listo) return;
    const s = sinCarnet ? null : socio;
    setGuardando(true);
    try {
    const r = await dataService.registrarVisita({ patrocinadorId: neg.id, socio: s, origen: s ? origen : "sin_carne", tipoCliente: tipo,gasto });
    if (r === "duplicada") return setAviso("Esta visita ya está registrada hoy.");
    refrescar();
    setReciente(r.id);
    } finally { setGuardando(false); }
  };

  const big = "visit-big flex h-auto w-full items-center justify-center gap-2 rounded-control font-black transition-transform duration-150 active:scale-[.98] disabled:opacity-40 [&_svg]:size-6";

  return (
    <section className="flex flex-1 flex-col px-4 pt-6">
      {scan && <QrScanner onResult={onScan} onClose={() => setScan(false)} />}
      {reciente && (
        <div className="animate-rise mb-4 flex items-center gap-3 rounded-panel bg-surface p-4">
          <span className="animate-check flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check size={28} strokeWidth={3} /></span>
          <p className="flex-1 font-bold">Hecho. Gracias por apoyar a quien nos apoya.</p>
          <Button variant="ghost" onClick={() => { runAction(async () => { await dataService.anularVisita(reciente); setReciente(null); limpiar(); refrescar(); }); }} className="h-auto min-h-11 rounded-control btn-suave px-3 text-body-sm font-bold">Deshacer</Button>
        </div>
      )}
      <div className="surface-card visit-step">
        <p className="visit-step-label"><span>1</span>Identifica al soci@</p>
        <Button variant="ghost" onClick={() => setScan(true)} className={`${big} mt-3 bg-primary text-primary-foreground`}>
          <QrCode size={28} strokeWidth={1.75} /> Escanear carnet
        </Button>
        <label htmlFor="num-socio" className="visit-or">o escribe el nº de soci@</label>
        <input id="num-socio" aria-label="Número de socio o socia" value={num} onChange={(e) => runAction(() => buscar(e.target.value.replace(/\D/g, "")))} inputMode="numeric" placeholder="Ej.: 11" className="visit-number club-input" />
        {num && !socio && !buscando && <p className="mt-3 text-body-sm font-bold">Ese número no está en el club. Revísalo.</p>}
        {aviso && <p className="mt-3 rounded-control border border-accent p-3 font-bold">{aviso}</p>}
        {sinCarnet ? (
          <p className="mt-3 text-body-sm text-muted-foreground">Sin carnet: la visita se guarda como declarada. <Button variant="ghost" onClick={() => setSinCarnet(false)} className="font-bold underline">Cancelar</Button></p>
        ) : (
          <Button variant="ghost" onClick={() => { limpiar(); setSinCarnet(true); setReciente(null); }} className="mt-2 h-auto min-h-11 self-start whitespace-normal px-0 text-left text-body-sm text-muted-foreground underline">No tiene carnet</Button>
        )}
      </div>

      {((!!socio && !aviso) || sinCarnet) && (
        <div className="surface-card visit-step animate-rise mt-3">
          <p className="visit-step-label"><span>2</span>{sinCarnet ? "Visita sin carnet" : "Registra la visita"}</p>
          {socio && !sinCarnet && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-item font-black">
              <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check size={16} strokeWidth={3} /></span>
              {nombreDiscreto(socio.nombre)} <span className="font-bold text-muted-foreground">· nº {socio.numeroSocio}</span>
              {repite && <span className="visit-repeat">Repite por el club</span>}
            </p>
          )}
          <div className="mt-4" role="group" aria-label="Gasto aproximado (opcional)">
            <p className="text-body-sm text-muted-foreground">Gasto aproximado <span className="opacity-70">(opcional)</span></p>
            <div className="visit-chips mt-2">
              {([["lt20","< 20 €"],["20_50","20–50 €"],["50_100","50–100 €"],["gt100","> 100 €"]] as const).map(([v,l])=>(
                <button key={v} type="button" aria-pressed={gasto===v} className={gasto===v?"is-on":""} onClick={()=>setGasto(gasto===v?"":v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            {repite && !sinCarnet ? (
              <Button variant="ghost" onClick={() => runAction(() => guardar("ya_era_clienta"))} disabled={!listo} className={`${big} bg-primary text-primary-foreground`}>Registrar visita</Button>
            ) : (
              <>
                <p className="mb-2 text-body-sm font-bold">¿Es la primera vez que viene?</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="ghost" onClick={() => runAction(() => guardar("nueva"))} disabled={!listo} className={`${big} visit-choice`}>Primera vez</Button>
                  <Button variant="ghost" onClick={() => runAction(() => guardar("ya_era_clienta"))} disabled={!listo} className={`${big} visit-choice`}>Ya venía</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <h2 className="club-section-title mt-8">Últimas visitas de hoy</h2>
      {hoy.length === 0 ? (
        <p className="surface-card px-4 py-5 text-body-sm text-muted-foreground">Todavía ninguna visita hoy. Escanea el carnet de la primera.</p>
      ) : (
        <ListCard label="Últimas visitas de hoy">{hoy.map(v=>{const s=v.socioId?db.socios.find(x=>x.id===v.socioId):null;return <ListRow key={v.id} leading={v.numeroSocio??'—'} name={nombreDiscreto(s?.nombre||(v.socioId?dataService.nombreVisita(v.socioId):''))||'Sin carnet'} chip={v.repiteViaClub?'REPITE':v.tipoCliente==='nueva'?'NUEVA':'YA CLIENTE'} subtitle={v.anulada?'Anulada':v.verificada?'Verificada · con carnet':'Declarada · sin carnet'} date={new Date(v.fechaHora).toLocaleTimeString('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'})} dateTime={v.fechaHora} status={v.anulada?'off':v.verificada?'active':'pending'} statusLabel={v.anulada?'Anulada':v.verificada?'Verificada':'Declarada'}/>;})}</ListCard>
      )}
    </section>
  );
}

function TuMes({ neg }: { neg: Patrocinador }) {
  const [incluir,setIncluir]=useState(false);
  const [rango, setRango] = useState<"mes" | "90" | "temporada">("mes");
  const db = useClubData();
  const [stats, setStats] = useState<ClubStats>(emptyStats);
  useEffect(() => {if(incluir&&!dataService.negocioPrueba())return;let alive=true;runAction(async () => {const result=await dataService.statsPatrocinador(neg.id, rango,incluir);if(alive)setStats(result);});return()=>{alive=false;};}, [neg.id, rango, db,incluir]);
  const s = adaptarStats(stats);
  const prog = { nuevas: stats.objetivo_nuevas_90d, objetivo: 5, pct: Math.min(100, stats.objetivo_nuevas_90d * 20) };
  const sem = stats.serie;
  const max = Math.max(1, ...sem.map((w) => w.total));
  const frase = fraseMes(s, rango);
  const cat = categoriasVisitas(s);
  const share = `${frase}\n\nNuevas con carnet: ${cat.nuevas} · Ya clientes con carnet: ${cat.yaClientes} · Sin carnet: ${cat.sinCarnet}\n— Real Unión Lucense F.S.`;

  return (
    <section className="px-4 pt-6">
      <div className="club-tabs grid-cols-3">
        {([["mes", "Este mes"], ["90", "90 días"], ["temporada", "Temporada"]] as const).map(([id, l]) => (
          <Button variant="ghost" key={id} onClick={() => setRango(id)} className={`h-auto min-h-11 rounded-control text-body-sm font-bold ${rango === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</Button>
        ))}
      </div>

      <div className="month-hero mt-4">
        <p className="month-hero-label">El club te ha traído</p>
        <p className="month-hero-num">{cat.nuevas}</p>
        <p className="month-hero-unit">{cat.nuevas === 1 ? "persona nueva con carnet" : "personas nuevas con carnet"}</p>
        <div className="month-progress">
          <div className="flex justify-between text-body-sm"><span>Objetivo · últimos 90 días</span><span className="font-black">{prog.nuevas} de {prog.objetivo}</span></div>
          <div className="month-bar"><div style={{ width: `${prog.pct}%` }} /></div>
        </div>
      </div>

      <div className="surface-card month-stats mt-3" aria-label={`${cat.total} visitas en total`}>
        {([["Nuevas", "con carnet", cat.nuevas], ["Ya clientes", "con carnet", cat.yaClientes], ["Sin carnet", "declaradas", cat.sinCarnet]] as const).map(([l, sub, n]) => (
          <div key={l}><p className="month-stat-num">{n}</p><p className="month-stat-label">{l}</p><p className="month-stat-sub">{sub}</p></div>
        ))}
      </div>
      <p className="month-total">{cat.total} {cat.total === 1 ? "visita" : "visitas"} en total</p>

      <div className="surface-card month-chart mt-3">
        <p className="club-section-title mb-0">{rango === "temporada" ? "Visitas por mes" : "Visitas por semana"}</p>
        <div className="month-bars">
          {sem.map((w) => (
            <div key={w.label} className="month-col">
              <div className="month-bar-v" style={{ height: `${(w.total / max) * 100}%`, minHeight: w.total ? 4 : 0 }}>
                <div style={{ height: `${w.total ? (w.nuevas / w.total) * 100 : 0}%` }} />
              </div>
              <b className="month-col-n">{w.total || ""}</b>
              <span>{w.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-label font-bold">
          <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-primary" /> Visitas</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-accent" /> Nuevas</span>
        </div>
      </div>

      <p className="mt-6 text-item font-bold">{frase}</p>
      <a href={waLink(share, "")} target="_blank" rel="noreferrer" className="mt-4 flex h-auto min-h-11 items-center justify-center gap-2 rounded-control bg-primary font-black text-primary-foreground">
        <MessageCircle size={20} strokeWidth={1.75} /> Compartir por WhatsApp
      </a>
      {dataService.negocioPrueba()&&<div className="surface-card mt-6 px-4"><label className="state-role-row">Incluir visitas de prueba<Switch checked={incluir} onCheckedChange={setIncluir} aria-label="Incluir visitas de prueba"/></label></div>}
    </section>
  );
}
