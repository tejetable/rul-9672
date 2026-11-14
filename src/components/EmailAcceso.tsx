import {emailSchema} from '@/lib/email-validation';
import {useState} from 'react';
import {LoaderCircle} from 'lucide-react';
import {supabase} from '@/integrations/supabase/client';
import {Button} from './ui/button';
import {AccesoVisual} from './AccesoVisual';
import {PasswordField} from './PasswordField';
import {dataService} from '@/lib/dataService';
export function EmailAcceso({onBack,onDone}:{onBack:()=>void;onDone:()=>void}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[forgot,setForgot]=useState(false),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(){const parsed=emailSchema.safeParse(email);if(!parsed.success){setError('Dirección de email no válida.');return;}setBusy(true);setError('');try{if(forgot){await supabase.auth.resetPasswordForEmail(parsed.data,{redirectTo:window.location.origin+'/reset-password'});setSent(true);}else{const r=await supabase.auth.signInWithPassword({email:parsed.data,password});if(r.error)throw r.error;dataService.recordarPasswordEntrada(password);await dataService.init();onDone();}}catch{setError(forgot?'No hemos podido enviar el enlace. Inténtalo en un momento.':'Email o contraseña incorrectos.');}finally{setBusy(false);}}
 return <AccesoVisual compact><form className="access-form" noValidate onSubmit={e=>{e.preventDefault();void submit();}}><h2 className="access-title">{forgot?'Recupera tu contraseña':'Entra con tu email'}</h2>{sent?<p role="status" className="text-body-sm">Si ese email está en el club, te llegará un enlace en unos minutos. Mira también en spam.</p>:<><label htmlFor="login-email" className="text-body-sm font-bold">Email</label><input id="login-email" required type="email" autoComplete="email" placeholder="Tu email" value={email} onChange={e=>setEmail(e.target.value)} className="access-input"/>{!forgot&&<PasswordField id="login-password" value={password} onChange={setPassword} autoComplete="current-password"/>}{error&&<p role="alert" className="access-error">{error}</p>}<Button type="submit" disabled={busy} className="access-button">{busy?<LoaderCircle className="animate-spin" aria-label="Un momento"/>:forgot?'ENVIAR ENLACE':'ENTRAR'}</Button>{!forgot&&<Button type="button" variant="link" className="access-back" onClick={()=>{setForgot(true);setError('');}}>¿Olvidaste tu contraseña?</Button>}</>}<Button type="button" variant="link" className="access-back" onClick={()=>{if(forgot){setForgot(false);setSent(false);setError('');}else onBack();}}>‹ Volver</Button></form></AccesoVisual>;
}
