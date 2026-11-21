import {ListCard,ListRow} from './ListRow';
import { useState } from 'react';
import { Pencil, CircleDot } from 'lucide-react';
import {DirectivaFab} from './DirectivaFab';
import {GestionSheet} from './GestionPersonas';
import { Button } from '@/components/ui/button';
import { dataService, useClubData, runAction, type Partido } from '@/lib/dataService';
import { fechaMadridCampos, fechaMadridISO, inicioPartido, proximoPartido, resultadoPartido } from '@/lib/partidos';
import { fechaHumana } from '@/lib/fechas';
import { EstadisticasForm } from './EstadisticasForm';
import { ConvocatoriaForm } from './ConvocatoriaForm';
import { ClasificacionForm } from './ClasificacionForm';

const PABELLON = 'Pavillón Municipal de Guntín';
export function PartidosPanel() {
  const db=useClubData();const [edit,setEdit]=useState<Partido|'nuevo'|null>(null),[resultado,setResultado]=useState<string|null>(null),[selected,setSelected]=useState<Partido|null>(null);
  const [clasif,setClasif]=useState<number|null>(null);const ultimaJornada=Math.max(0,...db.partidos.filter(p=>p.jugado).map(p=>p.jornada??0));
  const ahora=new Date(),proximo=proximoPartido(db.partidos,ahora);
  const t=(p:Partido)=>inicioPartido(p)?.getTime()??Infinity;
  const proximos=db.partidos.filter(p=>!p.jugado).sort((a,b)=>t(a)-t(b));
  const jugados=db.partidos.filter(p=>p.jugado).sort((a,b)=>t(b)-t(a));
  const fila=(p:Partido)=>{const favor=p.esLocal?p.golesLocal:p.golesVisitante,contra=p.esLocal?p.golesVisitante:p.golesLocal;const r=resultadoPartido(p);const d=inicioPartido(p);const pasado=t(p)<=ahora.getTime();
    return <ListRow key={p.id} leading={p.jornada??<CircleDot/>} name={p.jugado?`${favor} – ${contra} · ${p.rival}`:`vs. ${p.rival}`} chip={r?(r==='V'?'VICTORIA':r==='E'?'EMPATE':'DERROTA'):(p.esLocal?'CASA':'FUERA')} subtitle={p.fechaConfirmada===false?'Fecha por confirmar':p.horaConfirmada===false?`Hora por confirmar · ${p.lugar}`:`${fechaMadridCampos(p).hora} · ${p.lugar}`} date={d?fechaHumana(d):''} dateTime={p.fechaHora} status={p.jugado?'off':pasado?'pending':'active'} statusLabel={p.jugado?'Jugado':pasado?'Falta el resultado':'Pendiente'} onClick={()=>setSelected(p)}/>;};
  return <section className="px-4 pt-4 pb-32">
    <article className="rounded-panel bg-surface p-4"><p className="label-club">Próximo partido</p><p className="mt-2 font-black">{proximo?`vs. ${proximo.rival}`:'Por confirmar'}</p>{proximo&&<><p className="text-body-sm">Jornada {proximo.jornada} · {inicioPartido(proximo)?fechaHumana(inicioPartido(proximo)!, proximo.horaConfirmada!==false):''}</p></>}</article>
    <div className="mt-3"><Button variant="outline" onClick={()=>setClasif(ultimaJornada||1)}>Actualizar clasificación</Button></div>
    <GestionSheet title="Actualizar clasificación" open={clasif!==null} onClose={()=>setClasif(null)}>{clasif!==null&&<ClasificacionForm jornada={clasif} onClose={()=>setClasif(null)}/>}</GestionSheet>
    <DirectivaFab label="Editar próximo partido" onClick={()=>setEdit(proximo??'nuevo')}/>
    <GestionSheet title={edit==='nuevo'?'Añadir partido':edit&&edit.id===proximo?.id?'Editar próximo partido':'Editar partido'} open={!!edit} onClose={()=>setEdit(null)}>{edit&&<PartidoForm key={edit==='nuevo'?'nuevo':edit.id} partido={edit==='nuevo'?undefined:edit} onClose={()=>setEdit(null)}/>}</GestionSheet>
    {proximos.length>0&&<><h2 className="club-section-title mt-6">Próximos</h2><ListCard label="Próximos partidos">{proximos.map(fila)}</ListCard></>}
    {jugados.length>0&&<><h2 className="club-section-title mt-6">Jugados</h2><ListCard label="Partidos jugados">{jugados.map(fila)}</ListCard></>}
    <GestionSheet title={selected?`vs. ${selected.rival}`:'Partido'} open={!!selected} onClose={()=>{setSelected(null);setResultado(null);}}>{selected&&<><p>Jornada {selected.jornada} · {selected.esLocal?'En casa':'Fuera'}</p><p>{inicioPartido(selected)?fechaHumana(inicioPartido(selected)!, selected.horaConfirmada!==false):'Fecha por confirmar'}{selected.horaConfirmada===false?' · Hora por confirmar':''}</p>{selected.jugado&&<p className="font-black">{selected.esLocal?selected.golesLocal:selected.golesVisitante} – {selected.esLocal?selected.golesVisitante:selected.golesLocal} · {resultadoPartido(selected)==='V'?'Victoria':resultadoPartido(selected)==='E'?'Empate':'Derrota'}</p>}<p>{selected.lugar}</p>{!selected.jugado&&(inicioPartido(selected)?.getTime()??Infinity)<=ahora.getTime()&&<p className="font-bold">Falta el resultado</p>}<div className="sheet-actions"><Button variant="outline" onClick={()=>{setEdit(selected);setSelected(null);}}><Pencil/>Editar partido</Button>{(selected.jugado||(inicioPartido(selected)?.getTime()??Infinity)<=ahora.getTime())&&<Button onClick={()=>setResultado(selected.id)}>{selected.jugado?'Corregir resultado':'METER RESULTADO'}</Button>}</div>{!selected.jugado&&<ConvocatoriaForm key={`c-${selected.id}`} partido={selected}/>}{selected.jugado&&<EstadisticasForm key={selected.id} partido={db.partidos.find(p=>p.id===selected.id)??selected}/>}{resultado===selected.id&&<ResultadoForm partido={selected} onClose={()=>{setResultado(null);if(selected.jornada){setClasif(selected.jornada);setSelected(null);}}}/>}</>}</GestionSheet>
  </section>;
}
function PartidoForm({partido,onClose}:{partido?:Partido|undefined;onClose:()=>void}) {
  const campos=partido?fechaMadridCampos(partido):{fecha:'',hora:''};
  const [form,setForm]=useState({jornada:partido?.jornada??7,rival:partido?.rival??'',rivalCorto:partido?.rivalCorto??'',fecha:campos.fecha,hora:campos.hora,horaConfirmada:partido?.horaConfirmada??true,esLocal:partido?.esLocal??true,lugar:partido?.lugar??PABELLON,competicion:partido?.competicion??'Primera Futgal · Grupo 2',driveUrl:partido?.driveFolderId?`https://drive.google.com/drive/folders/${partido.driveFolderId}`:''});
  const [busy,setBusy]=useState(false);
  return <form className="mt-6 space-y-3 border-y border-border py-4" onSubmit={e=>{e.preventDefault();runAction(async()=>{setBusy(true);try{await dataService.guardarPartido({...form,...(partido?{id:partido.id}:{}),fechaHora:fechaMadridISO(form.fecha,form.horaConfirmada?form.hora:'12:00')});onClose();}finally{setBusy(false);}});}}>
    <h2 className="club-section-title">{partido?'Editar partido':'Añadir partido'}</h2>
    <label className="block text-body-sm">Jornada<input required type="number" min="1" step="1" value={form.jornada} onChange={e=>setForm({...form,jornada:Number(e.target.value)})} className="club-input mt-2 w-full p-3"/></label>
    <label className="block text-body-sm">Rival<input required maxLength={200} value={form.rival} onChange={e=>setForm({...form,rival:e.target.value})} className="club-input mt-2 w-full p-3"/></label>
    <label className="block text-body-sm">Nombre corto (opcional)<input maxLength={60} value={form.rivalCorto} onChange={e=>setForm({...form,rivalCorto:e.target.value})} className="club-input mt-2 w-full p-3" placeholder="Val do Sil"/></label>
    <div className="grid grid-cols-2 gap-3"><label className="min-w-0 text-body-sm">Fecha<input required type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} className="club-input mt-2 w-full min-w-0 p-2"/></label><label className="min-w-0 text-body-sm">Hora<input required={form.horaConfirmada} disabled={!form.horaConfirmada} type="time" value={form.hora} onChange={e=>setForm({...form,hora:e.target.value})} className="club-input mt-2 w-full min-w-0 p-2"/></label></div>
    <label className="flex items-center gap-2 text-body-sm"><input type="checkbox" checked={form.horaConfirmada} onChange={e=>setForm({...form,horaConfirmada:e.target.checked})}/>Hora confirmada</label>
    <div className="club-tabs grid-cols-2">{[true,false].map(local=><Button key={String(local)} type="button" variant="ghost" aria-pressed={form.esLocal===local} onClick={()=>setForm({...form,esLocal:local,lugar:local?PABELLON:form.lugar===PABELLON?'':form.lugar})}>{local?'Local':'Visitante'}</Button>)}</div>
    <label className="block text-body-sm">Pabellón<input required value={form.lugar} onChange={e=>setForm({...form,lugar:e.target.value})} className="club-input mt-2 w-full p-3"/></label>
    <label className="block text-body-sm">Competición<input required value={form.competicion} onChange={e=>setForm({...form,competicion:e.target.value})} className="club-input mt-2 w-full p-3"/></label>
    <label className="block text-body-sm">Enlace de Drive (opcional)<input value={form.driveUrl} onChange={e=>setForm({...form,driveUrl:e.target.value})} className="club-input mt-2 w-full p-3" placeholder="https://drive.google.com/drive/folders/…"/></label>
    <Button disabled={busy} type="submit">{busy?'Guardando…':'Guardar partido'}</Button><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
  </form>;
}
function ResultadoForm({partido,onClose}:{partido:Partido;onClose:()=>void}) {
  const [favor,setFavor]=useState(String((partido.esLocal?partido.golesLocal:partido.golesVisitante)??'')),[contra,setContra]=useState(String((partido.esLocal?partido.golesVisitante:partido.golesLocal)??'')),[posicion,setPosicion]=useState(String(dataService.clasificacion()?.posicion??'')),[busy,setBusy]=useState(false);
  return <form className="mt-4 space-y-3 border-t border-border pt-4" onSubmit={e=>{e.preventDefault();runAction(async()=>{setBusy(true);try{await dataService.guardarResultado(partido.id,Number(favor),Number(contra),posicion?Number(posicion):null);onClose();}finally{setBusy(false);}});}}><div className="grid grid-cols-2 gap-3"><label className="text-body-sm">Goles a favor<input required type="number" min="0" step="1" value={favor} onChange={e=>setFavor(e.target.value)} className="club-input mt-2 w-full p-3"/></label><label className="text-body-sm">Goles en contra<input required type="number" min="0" step="1" value={contra} onChange={e=>setContra(e.target.value)} className="club-input mt-2 w-full p-3"/></label></div><label className="block text-body-sm">Posición en la tabla tras esta jornada (opcional)<input type="number" min="1" step="1" value={posicion} onChange={e=>setPosicion(e.target.value)} className="club-input mt-2 w-full p-3"/></label><Button asChild variant="link" className="p-0 text-body-sm"><a href={dataService.ajustes().url_clasificacion_futgal} target="_blank" rel="noopener noreferrer">Ver en Futgal ↗</a></Button><div><Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar resultado'}</Button><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button></div></form>;
}
