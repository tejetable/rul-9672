import {useState} from 'react';
import {Eye,EyeOff} from 'lucide-react';
import {Button} from './ui/button';
import {passwordStrength} from '@/lib/password-access';
export function PasswordField({id,label='Contraseña',value,onChange,meter=false,autoComplete='new-password'}:{id:string;label?:string;value:string;onChange:(v:string)=>void;meter?:boolean;autoComplete?:string}){
 const [show,setShow]=useState(false);const strength=passwordStrength(value);
 return <div className="space-y-2"><label htmlFor={id} className="text-body-sm font-bold">{label}</label><div className="relative"><input id={id} required minLength={8} type={show?'text':'password'} autoComplete={autoComplete} value={value} onChange={e=>onChange(e.target.value)} className="access-input pr-14"/><Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2 h-10 w-10" aria-label={`${show?'Ocultar':'Mostrar'} ${label.toLowerCase()}`} title={`${show?'Ocultar':'Mostrar'} contraseña`} onClick={()=>setShow(v=>!v)}>{show?<EyeOff/>:<Eye/>}</Button></div>{meter&&value&&<div className="space-y-1"><div className="grid grid-cols-3 gap-1" role="meter" aria-label="Seguridad de la contraseña" aria-valuemin={0} aria-valuemax={3} aria-valuenow={strength}>{[1,2,3].map(n=><span key={n} className={`h-1 rounded-full ${n<=strength?'bg-accent':'bg-border'}`}/>)}</div><p className="text-body-sm text-muted-foreground">{['Usa al menos 8 caracteres.','Seguridad básica','Seguridad buena','Seguridad alta'][strength]}</p></div>}</div>;
}
