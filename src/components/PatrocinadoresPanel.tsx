import { Download } from "lucide-react";
import { dataService } from "@/lib/dataService";
import { desdeRango, estadisticas, progresoObjetivo } from "@/lib/visitas";

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
  const db = dataService.get();
  const desde = desdeRango("temporada");
  return (
    <section className="px-5 pb-28 pt-8">
      <p className="label-club text-accent">Directiva</p>
      <h1 className="title-club mt-2 text-4xl">Patrocinadores</h1>
      <span className="gold-rule mt-4" />
      <span className="label-club mt-4 inline-block rounded-full border border-dashed border-primary px-3 py-1 text-muted-foreground">Datos de demostración</span>
      <ul className="mt-5 space-y-3">
        {db.patrocinadores.map((p) => {
          const s = estadisticas(db.visitas, p.id, desde);
          const prog = progresoObjetivo(db.visitas, p.id);
          return (
            <li key={p.id} className="rounded-2xl bg-roto p-4">
              <p className="font-black">{p.nombre}</p>
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
