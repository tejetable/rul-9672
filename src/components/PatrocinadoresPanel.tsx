import { BajaForm } from "@/components/BajaForm";
import { adaptarStats, emptyStats, type ClubSummary } from "@/lib/club-stats";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { dataService, useClubData, runAction } from "@/lib/dataService";
import { type Rango } from "@/lib/visitas";

function exportarCSV() {
  const db = dataService.get();
  const head = ["fechaHora", "patrocinador", "numeroSocio", "nombre", "origen", "tipoCliente", "repiteViaClub", "verificada", "anulada"];
  const rows = db.visitas.map((v) => [
    v.fechaHora,
    db.patrocinadores.find((p) => p.id === v.patrocinadorId)?.nombre ?? "",
    v.numeroSocio ?? "",
    db.socios.find((s) => s.id === v.socioId)?.nombre ?? "",
    v.origen,
    v.tipoCliente,
    v.repiteViaClub,
    v.verificada,
    v.anulada,
  ]);
  const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "visitas-ru-lucense.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function PatrocinadoresPanel() {
  const [, setV] = useState(0);
  const [rango, setRango] = useState<Rango>("mes");
  const [form, setForm] = useState(false);
  const db = useClubData();
  const [baja, setBaja] = useState<string | null>(null);
  const [summary, setSummary] = useState<ClubSummary>({socios_activos:0,activos_semana:0,visitas:0,nuevas_verificadas:0,patrocinadores:{},bajas:{}});
  useEffect(() => { runAction(async () => setSummary(await dataService.statsClub(rango))); }, [db, rango]);
  const club = [
    ["Socias/os activos", summary.socios_activos],
    ["Activos esta semana", summary.activos_semana],
    ["Visitas del mes", summary.visitas],
  ] as const;
  return (
    <section className="px-5 pb-28 pt-6">
      <p className="club-chip">Directiva</p>
      <h1 className="title-club mt-2 text-heading">El club</h1>
            <div className="mt-5 grid grid-cols-2 gap-3">
        {club.map(([l, n]) => (
          <div key={l} className="rounded-panel bg-surface p-4">
            <p className="text-heading font-black leading-none">{n}</p>
            <p className="label-club mt-2 text-[11px] text-muted-foreground">{l}</p>
          </div>
        ))}
        <div className="rounded-panel bg-primary p-4 text-primary-foreground">
          <p className="text-heading font-black leading-none text-gold">{summary.nuevas_verificadas}</p>
          <p className="label-club mt-2 text-[11px] opacity-80">Clientas nuevas del mes (verificadas)</p>
        </div>
      </div>
      <div className="mt-5 club-tabs grid-cols-3">
        {([["mes", "Este mes"], ["90", "90 días"], ["temporada", "Temporada"]] as const).map(([id, l]) => (
          <Button variant="ghost" key={id} onClick={() => setRango(id)} className={`h-auto min-h-11 rounded-control text-body-sm font-bold ${rango === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</Button>
        ))}
      </div>
      <h2 className="club-section-title mt-8">Patrocinadores</h2>
      <span className="label-club mt-3 inline-block rounded-full border border-dashed border-primary px-3 py-1 text-muted-foreground">Datos de demostración</span>
      {form ? <NuevoPatrocinador onDone={() => { setForm(false); setV((x) => x + 1); }} /> : (
        <Button variant="ghost" onClick={() => setForm(true)} className="mt-4 flex h-auto min-h-12 w-full items-center justify-center gap-2 rounded-panel btn-suave font-black uppercase"><Plus size={18} strokeWidth={1.75} /> Nuevo patrocinador</Button>
      )}
      {baja && <BajaForm negocio onCancel={() => setBaja(null)} onSave={async (fecha,motivo,detalle) => {await dataService.bajaPatrocinador(baja,fecha,motivo,detalle);setBaja(null);}} />}
      <h2 className="club-section-title mt-5">Bajas</h2><div className="mt-2 grid grid-cols-2 gap-2">{["no ve retorno","precio","cierre del negocio","otro"].map(m => <div key={m} className="rounded-panel bg-surface p-3"><p className="font-black">{summary.bajas[m] ?? 0}</p><p className="text-body-sm">{m}</p></div>)}</div>
      <ul className="mt-5 space-y-3">
        {db.patrocinadores.map((p) => {
          const raw = summary.patrocinadores[p.id] ?? emptyStats;
          const s = adaptarStats(raw);
          const prog = { nuevas:raw.objetivo_nuevas_90d,pct:Math.min(100,raw.objetivo_nuevas_90d*20) };
          return (
            <li key={p.id} className="rounded-panel bg-surface p-4">
              <p className="font-black">{p.nombre}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[["Visitas", s.visitas], ["Nuevas verif.", s.nuevasVerificadas], ["Nuevas decl.", s.nuevasDeclaradas], ["Repiten", s.repiten], ["% nuevas", `${s.pctNuevas}%`], ["90 días", `${prog.nuevas}/5`]].map(([l, n]) => (
                  <div key={l} className="py-2">
                    <p className="text-section font-black">{n}</p>
                    <p className="text-label font-bold uppercase text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-accent" style={{ width: `${prog.pct}%` }} />
              </div>
              <EmailNegocio id={p.id} email={p.emailAcceso??""}/>{p.activo && <Button variant="ghost" onClick={() => setBaja(p.id)}>Desactivar</Button>}
            </li>
          );
        })}
      </ul>
      <Button variant="ghost" onClick={exportarCSV} className="mt-6 flex h-auto min-h-12 w-full items-center justify-center gap-2 rounded-panel bg-primary font-black uppercase text-primary-foreground">
        <Download size={18} strokeWidth={1.75} /> Exportar CSV
      </Button>
    </section>
  );
}


function NuevoPatrocinador({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ importe: "", nombre: "", categoria: "", direccion: "", emailAcceso: "", logoUrl: "", titulo: "", descripcion: "", condiciones: "Enseña tu carnet en el mostrador." });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const logo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setF((x) => ({ ...x, logoUrl: String(r.result) }));
    r.readAsDataURL(file);
  };
  const guardar = async () => {
    if (!f.nombre.trim() || !f.titulo.trim()) return setErr("Pon al menos el nombre y la ventaja.");
    if (!f.emailAcceso.includes("@")) return setErr("Indica el email de acceso.");
    const r = await dataService.crearPatrocinador(
      { nombre: f.nombre.trim(), categoria: f.categoria.trim(), direccion: f.direccion.trim() || "[Dirección pendiente]", emailAcceso: f.emailAcceso, logoUrl: f.logoUrl, importePatrocinio:Number(f.importe)||0 },
      { titulo: f.titulo.trim(), descripcion: f.descripcion.trim(), condiciones: f.condiciones.trim() },
    );
    if (r === "pin_usado") return setErr("No se pudo guardar.");
    onDone();
  };
  const inp = "mt-1 h-auto min-h-12 w-full rounded-control club-input border-input px-3";
  const campo = (k: keyof typeof f, l: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <label className="mt-3 block"><span className="label-club">{l}</span><input value={f[k]} onChange={set(k)} className={inp} {...extra} /></label>
  );
  return (
    <div className="mt-4 border-y border-border py-4">
      <p className="font-black">Nuevo patrocinador</p>
      {campo("nombre", "Nombre")}
      {campo("categoria", "Categoría")}
      <label className="mt-3 block"><span className="label-club">Logo</span><input type="file" accept="image/*" onChange={logo} className="mt-1 block w-full text-body-sm" /></label>
      {f.logoUrl && <img src={f.logoUrl} alt="Logo del patrocinador" className="mt-2 h-14 w-auto object-contain" />}
      {campo("direccion", "Dirección")}
      {campo("emailAcceso", "Email de acceso del negocio", {type:"email",required:true})}
      {campo("importe", "Importe patrocinio (€)", {type:"number",min:0,step:"0.01"})}
      <p className="label-club mt-5 text-accent">Ventaja</p>
      {campo("titulo", "Título")}
      {campo("descripcion", "Descripción")}
      {campo("condiciones", "Condiciones")}
      {err && <p className="mt-3 text-body-sm font-bold">{err}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="ghost" onClick={() => runAction(guardar)} className="h-auto min-h-12 rounded-panel bg-primary font-black uppercase text-primary-foreground">Guardar</Button>
        <Button variant="ghost" onClick={onDone} className="h-auto min-h-12 rounded-panel btn-suave font-black uppercase">Cancelar</Button>
      </div>
    </div>
  );
}

function EmailNegocio({id,email}:{id:string;email:string}){const [value,setValue]=useState(email);return <form className="mt-3 space-y-2" onSubmit={e=>{e.preventDefault();runAction(()=>dataService.emailNegocio(id,value));}}><label className="block label-club">Email de acceso del negocio<input required type="email" value={value} onChange={e=>setValue(e.target.value)} className="club-input mt-1 w-full p-3"/></label><Button type="submit" variant="outline">Guardar acceso</Button></form>;}
