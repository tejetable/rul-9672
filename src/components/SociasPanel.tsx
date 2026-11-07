import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Plus, Search, Smartphone } from "lucide-react";
import { dataService, type Socio } from "@/lib/dataService";
import { textoInvitacion, waLink } from "@/lib/whatsapp";

function enlace(s: Socio) {
  return `${window.location.origin}/activar/${s.tokenInvitacion}`;
}
function enviar(s: Socio) {
  window.open(waLink(textoInvitacion(s.nombre, enlace(s)), s.telefono), "_blank");
}

const ESTADO: Record<Socio["estado"], { label: string; cls: string }> = {
  invitada: { label: "Invitada", cls: "bg-roto text-muted-foreground border border-border" },
  activa: { label: "Activa", cls: "bg-accent text-accent-foreground" },
  desactivada: { label: "Desactivada", cls: "border border-primary text-primary" },
};

export function SociasPanel() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");
  const [creada, setCreada] = useState<Socio | null>(null);

  const refresh = () => setSocios([...dataService.get().socios].sort((a, b) => b.numeroSocio - a.numeroSocio));
  useEffect(refresh, []);

  const lista = useMemo(
    () => socios.filter((s) => s.nombre.toLowerCase().includes(q.toLowerCase()) || String(s.numeroSocio).includes(q)),
    [socios, q],
  );
  const activas = socios.filter((s) => s.estado === "activa").length;

  const guardar = () => {
    if (!nombre.trim() || tel.replace(/\D/g, "").length < 9) return;
    const s = dataService.crearSocio(nombre, tel);
    setCreada(s);
    setNombre("");
    setTel("");
    setForm(false);
    refresh();
  };

  return (
    <section className="flex flex-1 flex-col px-5 pb-28 pt-8">
      <p className="label-club text-accent">Directiva</p>
      <h1 className="title-club mt-2 text-4xl">Socias/os</h1>
      <span className="gold-rule mt-4" />
      <p className="mt-4 font-bold">
        {activas} activas de {socios.length} invitadas
      </p>

      {creada && (
        <div className="animate-rise mt-5 rounded-2xl border-2 border-accent bg-roto p-4">
          <p className="label-club text-accent">Nueva socia/o</p>
          <p className="mt-1 text-lg font-black">
            {creada.nombre} · nº {creada.numeroSocio}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <button onClick={() => enviar(creada)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground">
              <MessageCircle size={18} strokeWidth={1.75} /> Enviar invitación
            </button>
            <Link to="/activar/$token" params={{ token: creada.tokenInvitacion }} className="flex min-h-11 items-center justify-center rounded-xl border-2 border-dashed border-primary font-bold">
              Abrir invitación (demo)
            </Link>
          </div>
        </div>
      )}

      {form ? (
        <div className="mt-5 rounded-2xl bg-roto p-4">
          <label className="label-club">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3" />
          <label className="label-club mt-3 block">Teléfono</label>
          <input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" placeholder="600 000 000" className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3" />
          <div className="mt-4 flex gap-2">
            <button onClick={guardar} className="min-h-11 flex-1 rounded-xl bg-primary font-bold text-primary-foreground">Guardar</button>
            <button onClick={() => setForm(false)} className="min-h-11 rounded-xl px-4 font-bold">Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setForm(true)} className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-black uppercase text-primary-foreground">
          <Plus size={20} strokeWidth={1.75} /> Nueva socia/o
        </button>
      )}

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-input px-3">
        <Search size={18} strokeWidth={1.75} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o número" className="min-h-11 flex-1 bg-transparent outline-none" />
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {lista.map((s) => (
          <li key={s.id} className="rounded-2xl bg-roto p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-bold">{s.nombre}</p>
                <p className="text-sm text-muted-foreground">Nº {s.numeroSocio}</p>
              </div>
              <span className={`label-club rounded-full px-3 py-1 ${ESTADO[s.estado].cls}`}>{ESTADO[s.estado].label}</span>
            </div>
            {s.cambioDispositivo && (
              <p className="mt-2 flex items-center gap-2 text-sm font-bold">
                <Smartphone size={16} strokeWidth={1.75} /> Cambio de dispositivo
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  const n = dataService.regenerarToken(s.id);
                  refresh();
                  if (n) {
                    setCreada(n);
                    enviar(n);
                  }
                }}
                className="min-h-11 flex-1 rounded-xl border border-primary text-sm font-bold"
              >
                Reenviar invitación
              </button>
              {s.estado !== "desactivada" && (
                <button
                  onClick={() => {
                    dataService.desactivar(s.id);
                    refresh();
                  }}
                  className="min-h-11 rounded-xl px-3 text-sm font-bold text-muted-foreground"
                >
                  Desactivar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
