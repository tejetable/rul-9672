import {useState} from 'react';
import {useServerFn} from '@tanstack/react-start';
import {deleteClubMember} from '@/lib/password.functions';
import {dataService,type Socio} from '@/lib/dataService';
import {Button} from './ui/button';
export function DeleteMember({socio,onDone}:{socio:Socio;onDone:()=>Promise<void>}){
 const remove=useServerFn(deleteClubMember);const [open,setOpen]=useState(false),[name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!dataService.esSuper())return null;
 const self=dataService.roles().some(r=>r.socio_id===socio.id);
 return <section className="border-t border-border pt-6"><Button variant="ghost" className="text-account-danger" disabled={self} onClick={()=>setOpen(true)}>Eliminar socio</Button>{open&&<form className="space-y-3" onSubmit={e=>{e.preventDefault();setBusy(true);setError('');void remove({data:{id:socio.id,name}}).then(async()=>{await dataService.refresh();await onDone();}).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}><p className="text-body-sm">Se borrarán su nombre, email, teléfono y acceso. Sus visitas se conservan sin nombre para no alterar las estadísticas de los patrocinadores. No se puede deshacer.</p><label className="block text-body-sm">Nombre completo<input className="club-input mt-2 w-full" value={name} onChange={e=>setName(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<Button variant="destructive" type="submit" disabled={busy||name!==socio.nombre}>Eliminar definitivamente</Button><Button variant="outline" onClick={()=>{setOpen(false);setName('');}}>Cancelar</Button></form>}</section>;
}