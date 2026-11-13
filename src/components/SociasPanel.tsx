import {InviteForm} from "./ClubAdmin";
import {DEMO_MODE} from "@/lib/club-settings";
import { BajaForm } from "@/components/BajaForm";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Plus, Search, Smartphone } from "lucide-react";
import { dataService, type Socio, useClubData, runAction } from "@/lib/dataService";
import { textoInvitacion, waLink } from "@/lib/whatsapp";

function enlace(s: Socio) {
  return `${window.location.origin}/activar/${s.tokenInvitacion}`;
}
function enviar(s: Socio) {
  window.open(waLink(textoInvitacion(s.nombre, enlace(s)), s.telefono), "_blank");
}

const ESTADO: Record<Socio["estado"], { label: string; cls: string }> = {
  invitada: { label: "Invitada", cls: "bg-suave text-muted-foreground border border-border" },
  activa: { label: "Activa", cls: "bg-accent text-accent-foreground" },
  desactivada: { label: "Desactivada", cls: "border border-primary text-primary" },
};

export function SociasPanel() {
  const db = useClubData();
  const [promote,setPromote]=useState<string|null>(null);
  const [baja, setBaja] = useState<string | null>(null);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");
  const [creada, setCreada] = useState<Socio | null>(null);

  const refresh = () => setSocios([...dataService.get().socios].sort((a, b) => b.numeroSocio - a.numeroSocio));
  useEffect(refresh, [db]);

  const lista = useMemo(
    () => socios.filter((s) => s.nombre.toLowerCase().includes(q.toLowerCase()) || String(s.numeroSocio).includes(q)),
    [socios, q],
  );
  const activas = socios.filter((s) => s.estado === "activa").length;

  const guardar = async () => {
    if (!nombre.trim() || tel.replace(/\D/g, "").length < 9) return;
    const s = await dataService.crearSocio(nombre, tel);
    setCreada(s);
    setNombre("");
    setTel("");
    setForm(false);
    refresh();
  };

  return (
    <section className="flex flex-1 flex-col px-5 pb-28 pt-6">
      <p className="club-chip">Directiva</p>
      <h1 className="title-club mt-2 text-heading">Socias/os</h1>
            <p className="mt-4 font-bold">
        {activas} activas de {socios.length} invitadas
      </p>

      {creada && (
        <div className="animate-rise mt-5 rounded-panel border-2 border-accent bg-suave p-4">
          <p className="label-club text-accent">Nueva socia/o</p>
          <p className="mt-1 text-item font-black">
            {creada.nombre} · nº {creada.numeroSocio}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="ghost" onClick={() => enviar(creada)} className="flex h-auto min-h-11 items-center justify-center gap-2 rounded-control bg-primary font-bold text-primary-foreground">
              <MessageCircle size={18} strokeWidth={1.75} /> Enviar invitación
            </Button>
            {DEMO_MODE&&<Link to="/activar/$token" params={{ token: creada.tokenInvitacion }} className="flex h-auto min-h-11 items-center justify-center rounded-control border-2 border-dashed border-primary font-bold">
              Abrir invitación (demo)
            </Link>}
          </div>
        </div>
      )}

      {form ? (
        <div className="mt-5 border-y border-border py-4">
          <label className="label-club">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 h-auto min-h-11 w-full rounded-control club-input border-input px-3" />
          <label className="label-club mt-3 block">Teléfono</label>
          <input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" placeholder="600 000 000" className="mt-1 h-auto min-h-11 w-full rounded-control club-input border-input px-3" />
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => runAction(guardar)} className="h-auto min-h-11 flex-1 rounded-control bg-primary font-bold text-primary-foreground">Guardar</Button>
            <Button variant="ghost" onClick={() => setForm(false)} className="h-auto min-h-11 rounded-control px-4 font-bold">Cancelar</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setForm(true)} className="mt-5 flex h-auto min-h-12 items-center justify-center gap-2 rounded-panel bg-primary font-black uppercase text-primary-foreground">
          <Plus size={20} strokeWidth={1.75} /> Nueva socia/o
        </Button>
      )}

      <div className="mt-5 flex items-center gap-2 rounded-control border border-input px-3">
        <Search size={18} strokeWidth={1.75} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o número" className="h-auto min-h-11 min-w-0 flex-1 bg-transparent outline-none" />
      </div>

      {baja && <BajaForm onCancel={() => setBaja(null)} onSave={async (fecha, motivo) => { await dataService.desactivar(baja, fecha, motivo); setBaja(null); }} />}
      <ul className="mt-4 flex flex-col gap-3">
        {lista.map((s) => (
          <li key={s.id} className="rounded-panel bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-bold">{s.nombre}</p>
                <p className="text-body-sm text-muted-foreground">Nº {s.numeroSocio}</p>
              </div>
              <span className={`label-club rounded-full px-3 py-1 ${ESTADO[s.estado].cls}`}>{ESTADO[s.estado].label}</span>
            </div>
            {s.cambioDispositivo && (
              <p className="mt-2 flex items-center gap-2 text-body-sm font-bold">
                <Smartphone size={16} strokeWidth={1.75} /> Cambio de dispositivo
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button variant="ghost"
                onClick={() => runAction(async () => {
                  const n = await dataService.regenerarToken(s.id);
                  refresh();
                  if (n) {
                    setCreada(n);
                    enviar(n);
                  }
                })}
                className="h-auto min-h-11 flex-1 rounded-control border border-primary text-body-sm font-bold"
              >
                Reenviar invitación
              </Button>
              {s.estado !== "desactivada" && (
                <Button variant="ghost"
                  onClick={() => {
                    setBaja(s.id);
                  }}
                  className="h-auto min-h-11 rounded-control px-3 text-body-sm font-bold text-muted-foreground"
                >
                  Desactivar
                </Button>
              )}
            </div>
            {dataService.esSuper()&&<Button variant="ghost" onClick={()=>setPromote(s.id)}>Hacer directiva</Button>}
            {promote===s.id&&<InviteForm nombreInicial={s.nombre} socioId={s.id} onDone={()=>setPromote(null)}/>}
          </li>
        ))}
      </ul>
    </section>
  );
}
