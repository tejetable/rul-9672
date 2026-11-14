import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { runAction } from '@/lib/dataService';

export function BajaForm({ negocio=false, onSave, onCancel }: {negocio?:boolean;onSave:(fecha:string,motivo:string,detalle:string)=>Promise<void>;onCancel:()=>void}) {
  const [fecha,setFecha]=useState(new Date().toLocaleDateString('en-CA'));
  const [motivo,setMotivo]=useState('');
  const [detalle,setDetalle]=useState('');
  const [busy,setBusy]=useState(false);
  return <div className="mt-4 border-y border-border py-4">
    <h2 className="club-section-title">Fecha y motivo de baja</h2>
    <label className="mt-3 block">Fecha<input aria-label="Fecha de baja" type="date" value={fecha} onChange={e=>setFecha(e.target.value)} className="club-input mt-2 w-full" /></label>
    <label className="mt-3 block">Motivo<select aria-label="Motivo de baja" value={motivo} onChange={e=>setMotivo(e.target.value)} className="club-input mt-2 w-full"><option value="">Selecciona</option>{(negocio?['no ve retorno','precio','cierre del negocio','otro']:['petición de la persona','no renovación','otro']).map(m=><option key={m}>{m}</option>)}</select></label>
    <textarea aria-label="Detalle de la baja" placeholder="Detalle del motivo" value={detalle} onChange={e=>setDetalle(e.target.value)} className="club-input mt-3 w-full" />
    <div className="mt-3 flex gap-2"><Button disabled={!fecha||!motivo||busy} onClick={()=>runAction(async()=>{setBusy(true);try{await onSave(fecha,negocio?motivo:[motivo,detalle].filter(Boolean).join(': '),detalle);}finally{setBusy(false);}})}>Confirmar baja</Button><Button variant="ghost" onClick={onCancel}>Cancelar</Button></div>
  </div>;
}