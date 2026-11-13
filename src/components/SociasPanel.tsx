import {accessMessage} from "@/lib/email-access";
import {InviteForm} from "./ClubAdmin";

import { BajaForm } from "@/components/BajaForm";
import { Button } from "@/components/ui/button";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Plus, Search, Smartphone } from "lucide-react";
import { dataService, type Socio, useClubData, runAction } from "@/lib/dataService";
import { waLink } from "@/lib/whatsapp";

function enviar(s:Socio){if(s.telefono)window.open(waLink(accessMessage(s.email??'',window.location.origin),s.telefono),'_blank');else void navigator.clipboard.writeText(accessMessage(s.email??'',window.location.origin));}

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
  const [email,setEmail]=useState("");
  const [pending,setPending]=useState<Awaited<ReturnType<typeof dataService.solicitudes>>>([]);
  useEffect(()=>{runAction(async()=>setPending(await dataService.solicitudes()));},[db]);
  const [creada, setCreada] = useState<Socio | null>(null);

  const refresh = () => setSocios([...dataService.get().socios].sort((a, b) => b.numeroSocio - a.numeroSocio));
  useEffect(refresh, [db]);

  const lista = useMemo(
    () => socios.filter((s) => s.nombre.toLowerCase().includes(q.toLowerCase()) || String(s.numeroSocio).includes(q)),
    [socios, q],
  );
  const activas = socios.filter((s) => s.estado === "activa").length;

  const guardar = async () => {
    if (!nombre.trim() || !email.includes("@")) return;
    const s = await dataService.crearSocio(nombre, tel,email);
    setCreada(s);
    setNombre("");
    setTel("");setEmail("");
    setForm(false);
    refresh();
  };

  return (
    <section className="flex flex-1 flex-col px-5 pb-28 pt-6">
      <p className="club-chip">Directiva</p>
      <h1 className="title-club mt-2 text-heading">Socias/os</h1>
            <p className="mt-4 font-bold">
        {activas} activas de {socios.length} socias/os
      </p>

      {pending.length>0&&<div className="mt-5 space-y-3"><h2 className="club-section-title">Solicitudes pendientes</h2>{pending.map(s=><article key={s.id} className="rounded-panel bg-surface p-4"><p className="font-bold">{s.nombre}</p><p className="break-all text-body-sm">{s.email}</p><p className="label-club mt-2">Pendiente de pago · {s.temporada}</p><Button className="mt-3 whitespace-normal" onClick={()=>runAction(()=>dataService.pagarSolicitud(s))}>Marcar como pagada (efectivo)</Button></article>)}</div>}
      {creada && (
        <div className="animate-rise mt-5 rounded-panel border-2 border-accent bg-suave p-4">
          <p className="label-club text-accent">Nueva socia/o</p>
          <p className="mt-1 text-item font-black">
            {creada.nombre} · nº {creada.numeroSocio}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="ghost" onClick={() => enviar(creada)} className="flex h-auto min-h-11 items-center justify-center gap-2 rounded-control bg-primary font-bold text-primary-foreground">
              <MessageCircle size={18} strokeWidth={1.75} /> Enviar / copiar acceso
            </Button>
          </div>
        </div>
      )}

      {form ? (
        <div className="mt-5 border-y border-border py-4">
          <label className="label-club">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 h-auto min-h-11 w-full rounded-control club-input border-input px-3" />
          <label className="label-club mt-3 block">Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="club-input mt-1 min-h-11 w-full px-3"/><label className="label-club mt-3 block">Teléfono (opcional)</label>
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
                onClick={()=>enviar(s)}
                className="h-auto min-h-11 flex-1 rounded-control border border-primary text-body-sm font-bold"
              >
                Enviar / copiar acceso
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
