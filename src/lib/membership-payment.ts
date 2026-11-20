import {z} from 'zod';
import {emailSchema} from './email-validation';
export const PAYMENT_POLL_MS=2000;
export const PAYMENT_POLL_LIMIT_MS=20000;
export const PAYMENT_ACCESS_DAYS=7;
export const membershipSchema=z.object({nombre:z.string().trim().min(2,'Indica tu nombre y apellidos.').max(200),email:emailSchema,telefono:z.string().trim().max(25).transform(v=>v.replace(/[\s+()-]/g,'')).refine(v=>/^$|^[0-9]{9,15}$/.test(v),'Indica un teléfono válido.'),mayor:z.literal(true,{errorMap:()=>({message:'Debes tener 18 años o más.'})}),consentimiento:z.literal(true,{errorMap:()=>({message:'Acepta la política de privacidad.'})})});
export const checkoutIdSchema=z.string().regex(/^cs_(test_|live_)?[A-Za-z0-9]+$/).max(255);
export const sessionInput=z.object({session_id:checkoutIdSchema});
export function feeCents(fee:unknown){const amount=z.number().finite().positive().max(999999).parse(Number(fee));const cents=Math.round(amount*100);if(cents<1||Math.abs(amount*100-cents)>0.000001)throw new Error('Cuota no válida.');return cents;}
export function accessWithinWeek(paidAt:string,now=Date.now()){const date=Date.parse(paidAt);return Number.isFinite(date)&&date<=now&&now-date<PAYMENT_ACCESS_DAYS*86400000;}
export function verifiedPaidSession(session:{mode:string|null;payment_status:string;currency:string|null;amount_total:number|null;livemode:boolean},checkout:{importe_centimos:number;es_prueba:boolean}){return session.mode==='payment'&&session.payment_status==='paid'&&session.currency==='eur'&&session.amount_total===checkout.importe_centimos&&session.livemode===!checkout.es_prueba;}
export function canSetPaymentPassword(c:{auth_nuevo:boolean;password_saved_at:string|null;pagado_at:string|null},hasPassword:boolean,otherRoles:boolean,now=Date.now()){return c.auth_nuevo&&!c.password_saved_at&&!!c.pagado_at&&accessWithinWeek(c.pagado_at,now)&&!hasPassword&&!otherRoles;}
export function escapeEmailHtml(text:string){return text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));}
