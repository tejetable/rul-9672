import {createServerFn} from '@tanstack/react-start';
import {getRequest,setResponseHeader} from '@tanstack/react-start/server';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {membershipSchema,sessionInput} from './membership-payment';
import {passwordPairSchema} from './password-access';
export const getMembershipConfig=createServerFn({method:'GET'}).handler(async()=>{const {paymentConfig}=await import('./membership-payment.server');return paymentConfig();});
export const createMembershipCheckout=createServerFn({method:'POST'}).inputValidator((v:unknown)=>membershipSchema.parse(v)).handler(async({data})=>{
 const {stripeClient,paymentSettings,membershipPrice}=await import('./membership-payment.server');const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 if(!process.env['STRIPE_WEBHOOK_SECRET'])throw new Error('Los pagos están en preparación. Vuelve a intentarlo cuando el club los active.');
 const settings=await paymentSettings();const existing=await supabaseAdmin.from('socios').select('id').eq('email',data.email).eq('estado','activa').eq('temporada',settings.temporada_actual).limit(1);if(existing.error)throw new Error('No se pudo comprobar tu alta.');if(existing.data?.length)throw new Error('Ya eres soci@ esta temporada. Entra con tu email.');
 const stripe=stripeClient();const balance=await stripe.balance.retrieve();const price=await membershipPrice(stripe,settings.centimos,settings.temporada_actual,balance.livemode);
 const origin=new URL(getRequest().url).origin;
 const created=await supabaseAdmin.from('stripe_checkouts').insert({nombre:data.nombre,email:data.email,telefono:data.telefono,temporada:settings.temporada_actual,importe_centimos:settings.centimos,es_prueba:!balance.livemode}).select('*').single();if(created.error||!created.data)throw new Error('No se pudo preparar el pago.');
 const c=created.data;
 try{const session=await stripe.checkout.sessions.create({mode:'payment',adaptive_pricing:{enabled:false},line_items:[{price,quantity:1}],customer_email:data.email,metadata:{alta_id:c.id,nombre:data.nombre,email:data.email,telefono:data.telefono,temporada:c.temporada,consentimiento_at:c.consentimiento_at},success_url:`${origin}/bienvenida?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/unete`},{idempotencyKey:`checkout-${c.id}`});if(!session.url)throw new Error('Pago no disponible.');const saved=await supabaseAdmin.from('stripe_checkouts').update({session_id:session.id}).eq('id',c.id);if(saved.error){await stripe.checkout.sessions.expire(session.id);throw new Error('No se pudo registrar el pago.');}return {url:session.url};}catch{throw new Error('No se pudo abrir Stripe. No se ha creado ningún soci@.');}
});
export const getMembershipStatus=createServerFn({method:'POST'}).inputValidator((v:unknown)=>sessionInput.parse(v)).handler(async({data})=>{setResponseHeader('Cache-Control','no-store');const {paymentStatus}=await import('./membership-payment.server');return paymentStatus(data.session_id);});
export const createPaidMemberPassword=createServerFn({method:'POST'}).inputValidator((v:unknown)=>sessionInput.and(passwordPairSchema).parse(v)).handler(async({data})=>{
 const {paidCheckout}=await import('./membership-payment.server');const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {checkout}=await paidCheckout(data.session_id);
 const claim=await supabaseAdmin.rpc('password_alta_stripe',{p_session:data.session_id,p_accion:'claim'});if(claim.error||!claim.data)throw new Error('Entra con tu acceso habitual o pide al club una contraseña.');
 const saved=await supabaseAdmin.auth.admin.updateUserById(claim.data,{password:data.password});if(saved.error){await supabaseAdmin.rpc('password_alta_stripe',{p_session:data.session_id,p_accion:'release'});throw new Error('No se pudo guardar la contraseña. Prueba con otra de al menos 8 caracteres.');}
 const done=await supabaseAdmin.rpc('password_alta_stripe',{p_session:data.session_id,p_accion:'done'});if(done.error)throw new Error('La contraseña se guardó. Entra con tu email; el club revisará el registro.');return {email:checkout.email};
});
export const deleteTestMembers=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({confirm:z.literal(true)}).parse(v)).handler(async({context})=>{
 const permission=await context.supabase.rpc('is_super_admin');if(permission.error||permission.data!==true)throw new Error('Solo Super admin puede borrar pruebas.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const list=await supabaseAdmin.from('socios').select('id,nombre').eq('es_prueba',true);if(list.error)throw new Error('No se pudieron consultar las pruebas.');let count=0;
 for(const s of list.data??[]){const removed=await supabaseAdmin.rpc('eliminar_socio_admin',{p_actor:context.userId,p_socio:s.id,p_nombre:s.nombre});if(removed.error)throw new Error(removed.error.message);const result=removed.data as {usuario:string|null;borrar_auth:boolean};if(result.borrar_auth&&result.usuario){const auth=await supabaseAdmin.auth.admin.deleteUser(result.usuario);if(auth.error)throw new Error('La ficha se borró; falta retirar su acceso.');}count++;}return {count};
});
