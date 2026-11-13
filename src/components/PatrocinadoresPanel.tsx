import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { dataService } from "@/lib/dataService";
import { desdeRango, estadisticas, progresoObjetivo, type Rango } from "@/lib/visitas";

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
  const db = dataService.get();
  const desde = desdeRango(rango);
  const semana = Date.now() - 7 * 86400000;
  const mes = estadisticas(db.visitas, null, desdeRango("mes"));
  const club = [
    ["Socias/os activos", db.socios.filter((x) => x.estado === "activa").length],
    ["Activos esta semana", db.socios.filter((x) => x.ultimaApertura && new Date(x.ultimaApertura).getTime() >= semana).length],
    ["Visitas del mes", mes.visitas],
  ] as const;
  return (
    <section className="px-5 pb-28 pt-8">
      <p className="label-club text-accent">Directiva</p>
      <h1 className="title-club mt-2 text-4xl">El club</h1>
      <span className="gold-rule mt-4" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {club.map(([l, n]) => (
          <div key={l} className="rounded-2xl bg-suave p-4">
            <p className="text-4xl font-black leading-none">{n}</p>
            <p className="label-club mt-2 text-[11px] text-muted-foreground">{l}</p>
          </div>
        ))}
        <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
          <p className="text-4xl font-black leading-none text-gold">{mes.nuevasVerificadas}</p>
          <p className="label-club mt-2 text-[11px] opacity-80">Clientas nuevas del mes (verificadas)</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-suave p-1">
        {([["mes", "Este mes"], ["90", "90 días"], ["temporada", "Temporada"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => setRango(id)} className={`min-h-11 rounded-xl text-sm font-bold ${rango === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</button>
        ))}
      </div>
      <h2 className="title-club mt-8 text-3xl">Patrocinadores</h2>
      <span className="label-club mt-3 inline-block rounded-full border border-dashed border-primary px-3 py-1 text-muted-foreground">Datos de demostración</span>
      {form ? <NuevoPatrocinador onDone={() => { setForm(false); setV((x) => x + 1); }} /> : (
        <button onClick={() => setForm(true)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl btn-suave font-black uppercase"><Plus size={18} strokeWidth={1.75} /> Nuevo patrocinador</button>
      )}
      <ul className="mt-5 space-y-3">
        {db.patrocinadores.map((p) => {
          const s = estadisticas(db.visitas, p.id, desde);
          const prog = progresoObjetivo(db.visitas, p.id);
          return (
            <li key={p.id} className="rounded-2xl bg-suave p-4">
              <p className="font-black">{p.nombre} <span className="text-xs font-bold text-muted-foreground">· PIN {p.pin}</span></p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[["Visitas", s.visitas], ["Nuevas verif.", s.nuevasVerificadas], ["Nuevas decl.", s.nuevasDeclaradas], ["Repiten", s.repiten], ["% nuevas", `${s.pctNuevas}%`], ["90 días", `${prog.nuevas}/5`]].map(([l, n]) => (
                  <div key={l} className="rounded-xl bg-background p-2">
                    <p className="text-xl font-black">{n}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-accent" style={{ width: `${prog.pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <button onClick={exportarCSV} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-black uppercase text-primary-foreground">
        <Download size={18} strokeWidth={1.75} /> Exportar CSV
      </button>
    </section>
  );
}


function NuevoPatrocinador({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ nombre: "", categoria: "", direccion: "", pin: dataService.pinLibre(), logoUrl: "", titulo: "", descripcion: "", condiciones: "Enseña tu carnet en el mostrador." });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const logo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setF((x) => ({ ...x, logoUrl: String(r.result) }));
    r.readAsDataURL(file);
  };
  const guardar = () => {
    if (!f.nombre.trim() || !f.titulo.trim()) return setErr("Pon al menos el nombre y la ventaja.");
    if (!/^\d{4}$/.test(f.pin)) return setErr("El PIN tiene que ser de 4 números.");
    const r = dataService.crearPatrocinador(
      { nombre: f.nombre.trim(), categoria: f.categoria.trim(), direccion: f.direccion.trim() || "[Dirección pendiente]", pin: f.pin, logoUrl: f.logoUrl },
      { titulo: f.titulo.trim(), descripcion: f.descripcion.trim(), condiciones: f.condiciones.trim() },
    );
    if (r === "pin_usado") return setErr("Ese PIN ya lo tiene otro negocio.");
    onDone();
  };
  const inp = "mt-1 min-h-12 w-full rounded-xl border-2 border-input bg-background px-3";
  const campo = (k: keyof typeof f, l: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <label className="mt-3 block"><span className="label-club">{l}</span><input value={f[k]} onChange={set(k)} className={inp} {...extra} /></label>
  );
  return (
    <div className="mt-4 rounded-2xl bg-suave p-4">
      <p className="font-black">Nuevo patrocinador</p>
      {campo("nombre", "Nombre")}
      {campo("categoria", "Categoría")}
      <label className="mt-3 block"><span className="label-club">Logo</span><input type="file" accept="image/*" onChange={logo} className="mt-1 block w-full text-sm" /></label>
      {f.logoUrl && <img src={f.logoUrl} alt="Logo del patrocinador" className="mt-2 h-14 w-auto object-contain" />}
      {campo("direccion", "Dirección")}
      {campo("pin", "PIN (4 dígitos)", { inputMode: "numeric", maxLength: 4 })}
      <p className="label-club mt-5 text-accent">Ventaja</p>
      {campo("titulo", "Título")}
      {campo("descripcion", "Descripción")}
      {campo("condiciones", "Condiciones")}
      {err && <p className="mt-3 text-sm font-bold">{err}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={guardar} className="min-h-12 rounded-2xl bg-primary font-black uppercase text-primary-foreground">Guardar</button>
        <button onClick={onDone} className="min-h-12 rounded-2xl btn-suave font-black uppercase">Cancelar</button>
      </div>
    </div>
  );
}
