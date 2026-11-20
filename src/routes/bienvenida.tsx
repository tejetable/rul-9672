import {createFileRoute} from '@tanstack/react-router';
import {z} from 'zod';
import {PaidWelcome} from '@/components/MembershipPayment';
import {checkoutIdSchema} from '@/lib/membership-payment';
export const Route=createFileRoute('/bienvenida')({validateSearch:(value:Record<string,unknown>)=>z.object({session_id:checkoutIdSchema.optional().catch(undefined)}).parse(value),head:()=>({meta:[{title:'Tu alta en el club · R.U. Lucense'},{name:'description',content:'Consulta tu alta pagada, tu carnet y crea el acceso al Real Unión Lucense F.S.'},{property:'og:title',content:'Tu alta en el club · R.U. Lucense'},{property:'og:description',content:'Ya eres de los nuestros: carnet y acceso al club.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex,nofollow'},{name:'referrer',content:'no-referrer'}]}),component:Welcome});
function Welcome(){const {session_id}=Route.useSearch();return <PaidWelcome sessionId={session_id}/>;}
