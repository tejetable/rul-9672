import {createFileRoute} from '@tanstack/react-router';
import {queryOptions,useSuspenseQuery} from '@tanstack/react-query';
import {JoinMembership} from '@/components/MembershipPayment';
import {dataService} from '@/lib/dataService';
const configQuery=queryOptions({queryKey:['membership-payment-config'],queryFn:()=>dataService.configPago(),staleTime:0});
export const Route=createFileRoute('/unete')({head:()=>({meta:[{title:'Únete a la familia · R.U. Lucense'},{name:'description',content:'Hazte soci@ del Real Unión Lucense F.S. y paga la cuota de temporada de forma segura.'},{property:'og:title',content:'Únete a la familia · R.U. Lucense'},{property:'og:description',content:'Tu alta y carnet de soci@ del Real Unión Lucense F.S.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),loader:({context})=>context.queryClient.ensureQueryData(configQuery),component:Join});
function Join(){const {data}=useSuspenseQuery(configQuery);return <JoinMembership config={data}/>;}
