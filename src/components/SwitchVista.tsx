import type { ReactNode } from "react";
import { CalendarDays, House, IdCard, QrCode } from "lucide-react";
import type { Vista } from "@/lib/vista";

const Sol = () => <svg className="vs-icon vs-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
const Luna = () => <svg className="vs-icon vs-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;

/** Interruptor de dos opciones del club. Apagado: pista clara con filete de oro y bola verde.
 *  Encendido: pista verde noche y bola de oro metálico. La bola cruza con rebote, el icono gira y cambia
 *  y un brillo recorre la bola al encenderse. Cada opción enseña su nombre dentro de la pista. */
export function SwitchDos({ on, offLabel, onLabel, offIcon, onIcon, stars = false }: { on: boolean; offLabel: string; onLabel: string; offIcon: ReactNode; onIcon: ReactNode; stars?: boolean }) {
  return (
    <span className="vista-switch" data-state={on ? "strong" : "light"} aria-hidden="true">
      {stars && <span className="vs-stars"><i /><i /><i /></span>}
      <span className="vs-label vs-label-strong">{onLabel}</span>
      <span className="vs-label vs-label-light">{offLabel}</span>
      <span className="vs-knob">{offIcon}{onIcon}</span>
    </span>
  );
}

/** El mismo interruptor como control: un botón con role="switch". */
export function BotonDos({ on, onChange, label, ...rest }: { on: boolean; onChange: (v: boolean) => void; label: string; offLabel: string; onLabel: string; offIcon: ReactNode; onIcon: ReactNode; stars?: boolean }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="duo-btn" onClick={() => onChange(!on)}><SwitchDos on={on} {...rest} /></button>;
}

export const SwitchVista = ({ vista }: { vista: Vista }) => <SwitchDos on={vista === "noche"} offLabel="Light" onLabel="Strong" offIcon={<Sol />} onIcon={<Luna />} stars />;
export const iconosVista = { off: <Sol />, on: <Luna /> };

export const iconosCarnet = { off: <IdCard className="vs-icon vs-off" strokeWidth={2} />, on: <QrCode className="vs-icon vs-on" strokeWidth={2} /> };
export const iconosCasa = { off: <CalendarDays className="vs-icon vs-off" strokeWidth={2} />, on: <House className="vs-icon vs-on" strokeWidth={2} /> };
