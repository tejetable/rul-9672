import {createFileRoute} from '@tanstack/react-router';
import {SetPassword} from '@/components/SetPassword';
export const Route=createFileRoute('/create-password')({head:()=>({meta:[{title:'Crea tu contraseña · R.U. Lucense'},{name:'description',content:'Completa tu acceso al Real Unión Lucense con una contraseña.'},{property:'og:title',content:'Crea tu contraseña · R.U. Lucense'},{property:'og:description',content:'Ya eres parte del club. Prepara tu acceso personal.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <SetPassword creation/>});
