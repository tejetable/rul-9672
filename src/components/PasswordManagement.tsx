import {useEffect,useState} from 'react';
import {googleEmail} from '@/lib/access-rules';
import {useServerFn} from '@tanstack/react-start';
import {KeyRound,MoreHorizontal} from 'lucide-react';
import {toast} from 'sonner';
import {supabase} from '@/integrations/supabase/client';
import {dataService,useClubData} from '@/lib/dataService';
import {setClubUserPassword,createPersonalPassword} from '@/lib/password.functions';
import {passwordPairSchema} from '@/lib/password-access';
import {PasswordField} from './PasswordField';
import {Button} from './ui/button';
import {GestionSheet} from './GestionPersonas';
import {AccesoVisual} from './AccesoVisual';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from './ui/dropdown-menu';

export function InitialPassword({email,value,onChange}:{email:string;value:string;onChange:(value:string)=>void}) {
 if(!dataService.esSuper())return null;
 return <div className="space-y-2"><PasswordField id="initial-password" label="Contraseña inicial" required={false} value={value} onChange={onChange}/><p className="text-body-sm text-muted-foreground">{googleEmail(email)?'Opcional: puede entrar con Google sin contraseña.':'Escribe una contraseña. La cambiará la primera vez que entre.'}</p></div>;
}

export function PersonPassword({email}:{email:string}) {
 const [open,setOpen]=useState(false),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const save=useServerFn(setClubUserPassword);
 const [status,setStatus]=useState<{tiene_password:boolean;puede_google:boolean;ultimo_acceso:string|null}|null>(null);
 const load=async()=>{const r=await supabase.rpc('acceso_usuario_admin',{p_email:email});if(r.error)throw new Error(r.error.message);setStatus(r.data as unknown as NonNullable<typeof status>);};
 useEffect(()=>{if(dataService.esSuper()&&email)void load().catch(e=>setError(e.message));},[email]);
 const remove=async()=>{if(!window.confirm('¿Eliminar su contraseña? Podrá seguir entrando con Google.'))return;setBusy(true);setError('');try{await save({data:{email,password:'',mode:'remove'}});await load();toast.success('Contraseña eliminada.');}catch(e){setError(e instanceof Error?e.message:'No se pudo eliminar.');}finally{setBusy(false);}};
 if(!dataService.esSuper())return null;
 return <section className="space-y-3 border-t border-border pt-4"><h2 className="club-section-title">Acceso</h2>{status&&<><p className="text-body-sm">Entra con: {[status.puede_google?'Google':null,status.tiene_password?'Contraseña':null].filter(Boolean).join(' · ')||'Sin contraseña'}</p><p className="text-body-sm">{status.ultimo_acceso?`Último acceso: ${new Date(status.ultimo_acceso).toLocaleString('es-ES',{timeZone:'Europe/Madrid'})}`:'Sin acceder'}</p></>}<Button variant="outline" className="h-auto whitespace-normal" onClick={()=>setOpen(v=>!v)}><KeyRound/>Cambiar contraseña de este usuario</Button>{open&&<form className="space-y-3" onSubmit={e=>{e.preventDefault();setBusy(true);setError('');void save({data:{email,password,mode:'reset'}}).then(async()=>{setOpen(false);setPassword('');await load();toast.success('Contraseña guardada. Elegirá una propia al entrar.');}).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}><PasswordField id="person-password" label="Nueva contraseña" value={password} onChange={setPassword}/><Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar contraseña'}</Button></form>}{status?.tiene_password&&<><Button variant="outline" disabled={busy||!status.puede_google} onClick={()=>{void remove();}}>Eliminar contraseña</Button>{!status.puede_google&&<p className="text-body-sm">No tiene otra forma de entrar. Cámbiasela en lugar de eliminarla.</p>}</>}{error&&<p role="alert">{error}</p>}</section>;
}

export function ChangePasswordForm({forced=false,onDone}:{forced?:boolean;onDone:()=>void}) {
 const createPassword=useServerFn(createPersonalPassword);
 const [current,setCurrent]=useState(forced?dataService.passwordEntrada():''),[password,setPassword]=useState(''),[repeat,setRepeat]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const has=dataService.acceso().tiene_password;
 return <form className="access-form" onSubmit={e=>{e.preventDefault();const parsed=passwordPairSchema.safeParse({password,repeat});if(!parsed.success){setError(parsed.error.issues[0]?.message??'Comprueba la contraseña.');return;}if(has&&current===password){setError('Elige una contraseña distinta de la que tienes ahora.');return;}setBusy(true);setError('');void (async()=>{if(has){const result=await supabase.auth.updateUser({password,current_password:current});if(result.error)throw new Error(result.error.message==='Current password required'?'Escribe tu contraseña actual.':'No se pudo cambiar. Comprueba la contraseña actual.');await dataService.completarPassword();}else{await createPassword({data:{password}});await dataService.cargarAcceso();}onDone();})().catch(e=>setError(e.message)).finally(()=>setBusy(false));}}>{forced&&<p className="text-body-sm">Esta contraseña te la dio el club. Ponle una tuya para seguir.</p>}{has&&<PasswordField id="current-password" label={forced?'Contraseña del club':'Contraseña actual'} value={current} onChange={setCurrent} autoComplete="current-password"/>}<PasswordField id="chosen-password" label="Nueva contraseña" value={password} onChange={setPassword}/><PasswordField id="chosen-repeat" label="Repetir contraseña" value={repeat} onChange={setRepeat}/>{error&&<p role="alert" className="access-error">{error}</p>}<Button type="submit" disabled={busy}>{busy?'Guardando…':forced?'Guardar y entrar':'Guardar contraseña'}</Button></form>;
}

export function ForcedPassword(){return <AccesoVisual compact><h1 className="access-title">Elige tu contraseña</h1><ChangePasswordForm forced onDone={()=>{void dataService.init();}}/><Button variant="link" onClick={()=>{void dataService.cerrarSesion();}}>Salir</Button></AccesoVisual>;}

export function PasswordMenuItem(){useClubData();const [open,setOpen]=useState(false);const acc=dataService.acceso() as {tiene_password:boolean;google?:boolean};if(!acc.tiene_password&&acc.google)return null;const title=dataService.acceso().tiene_password?'Cambiar contraseña':'Crear contraseña';return <><DropdownMenuItem onSelect={e=>{e.preventDefault();setOpen(true);}}><KeyRound/>{title}</DropdownMenuItem><GestionSheet title={title} open={open} onClose={()=>setOpen(false)}><ChangePasswordForm onDone={()=>{setOpen(false);toast.success('Contraseña guardada.');}}/></GestionSheet></>;}
export function BusinessAccountMenu(){return <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Más opciones de Negocio"><MoreHorizontal/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-background"><PasswordMenuItem/><DropdownMenuItem onSelect={()=>{void dataService.cerrarSesion();}}>Salir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;}