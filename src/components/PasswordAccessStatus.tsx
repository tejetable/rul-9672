import {useEffect,useState} from 'react';
import {dataService} from '@/lib/dataService';
export function PasswordAccessStatus({email}:{email:string}){const [active,setActive]=useState<boolean|null>(null);useEffect(()=>{let live=true;void dataService.gestionSocios().then(v=>{if(live)setActive(!!v.accesos[email.trim().toLowerCase()]);}).catch(()=>{});return()=>{live=false;};},[email]);if(!email)return null;return <p className="mt-3 text-body-sm">{active===null?'Comprobando acceso…':active?'En activo':'Sin acceder'}</p>;}
