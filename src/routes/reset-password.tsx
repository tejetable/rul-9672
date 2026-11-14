import {createFileRoute} from '@tanstack/react-router';
import {SetPassword} from '@/components/SetPassword';
export const Route=createFileRoute('/reset-password')({head:()=>({meta:[{title:'Nueva contraseña · R.U. Lucense'},{name:'description',content:'Recupera de forma segura tu acceso al club.'},{property:'og:title',content:'Nueva contraseña · R.U. Lucense'},{property:'og:description',content:'Vuelve a entrar en la familia del R.U. Lucense.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <SetPassword/>});
