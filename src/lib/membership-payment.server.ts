import Stripe from 'stripe';
import {supabaseAdmin} from '@/integrations/supabase/client.server';
import {emailSchema,formatoImporte} from './email-validation';
import {feeCents,verifiedPaidSession,escapeEmailHtml,accessWithinWeek,canSetPaymentPassword} from './membership-payment';
import { escudo as crest } from '@/assets/recursos';
import type {Database} from '@/integrations/supabase/types';
type Checkout=Database['public']['Tables']['stripe_checkouts']['Row'];
const INITIAL_PRICE='price_1UdvH3HuiZ2SMGQDrUVobtWo';
export function stripeClient(){const key=process.env['STRIPE_SECRET_KEY'];if(!key)throw new Error('Stripe no está configurado.');return new Stripe(key,{httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:2});}
function check(error:{message:string}|null){if(error)throw new Error(error.message);}
export async function paymentSettings(){const r=await supabaseAdmin.from('ajustes_club').select('cuota_socio,temporada_actual,email_avisos').eq('id',true).single();check(r.error);if(!r.data)throw new Error('Faltan los ajustes del club.');return {...r.data,centimos:feeCents(r.data.cuota_socio)};}
export async function paymentConfig(){const [settings,balance]=await Promise.all([paymentSettings(),stripeClient().balance.retrieve()]);return {cuota:settings.centimos/100,temporada:settings.temporada_actual,prueba:!balance.livemode,ready:!!process.env['STRIPE_WEBHOOK_SECRET']};}
export async function membershipPrice(stripe:Stripe,cents:number,season:string,live:boolean){
 if(!live&&cents===1500&&season==='2026/27')return INITIAL_PRICE;
 const lookup=`rul_cuota_${season.replace(/\W/g,'_')}_${cents}`;
 const prices=await stripe.prices.list({lookup_keys:[lookup],active:true,limit:1});const price=prices.data[0];if(price)return price.id;
 const product=await stripe.products.create({name:`Cuota de soci@ · R.U. Lucense · ${season}`,metadata:{tipo:'cuota_socio',temporada:season}},{idempotencyKey:`product-${lookup}`});
 try{return (await stripe.prices.create({product:product.id,unit_amount:cents,currency:'eur',lookup_key:lookup},{idempotencyKey:`price-${lookup}`})).id;}catch(error){const existing=(await stripe.prices.list({lookup_keys:[lookup],limit:1})).data[0];if(existing)return existing.id;throw error;}
}
export async function readCheckout(id:string){const r=await supabaseAdmin.from('stripe_checkouts').select('*').eq('session_id',id).maybeSingle();check(r.error);if(!r.data)throw new Error('Este enlace no es válido.');return r.data;}
export async function paidCheckout(id:string){const c=await readCheckout(id);if(!c.pagado_at||!accessWithinWeek(c.pagado_at))throw new Error('Este enlace ha caducado. Entra con tu email o contacta con el club.');const session=await stripeClient().checkout.sessions.retrieve(id);if(!verifiedPaidSession(session,c))throw new Error('El pago no está confirmado.');return {checkout:c,session};}
async function lookupAuth(email:string){const r=await supabaseAdmin.rpc('stripe_auth_email',{p_email:email});check(r.error);return r.data as {id:string;confirmed:boolean}|null;}
export async function ensurePaymentAuth(c:Checkout){
 let user=await lookupAuth(c.email);let nuevo=false;
 if(!user){const created=await supabaseAdmin.auth.admin.createUser({email:c.email,email_confirm:true});if(created.error){user=await lookupAuth(c.email);if(!user)throw new Error('No se pudo crear el acceso después del pago.');}else if(created.data.user){user={id:created.data.user.id,confirmed:true};nuevo=true;}}
 if(!user?.confirmed)throw new Error('El email ya tiene un acceso sin verificar. El club debe revisar el alta.');
 const linked=await supabaseAdmin.rpc('vincular_auth_stripe',{p_session:c.session_id??'',p_user:user.id,p_nuevo:nuevo});check(linked.error);
}
export async function paymentStatus(id:string){
 const c=await readCheckout(id);const session=await stripeClient().checkout.sessions.retrieve(id);
 if(!verifiedPaidSession(session,c))return {estado:'no_pagado' as const,prueba:c.es_prueba};
 if(!c.pagado_at||!c.socio_id||!c.user_id)return {estado:'preparando' as const,prueba:c.es_prueba};
 if(!accessWithinWeek(c.pagado_at))return {estado:'caducado' as const,prueba:c.es_prueba};
 const [s,p,r]=await Promise.all([supabaseAdmin.from('socios').select('id,nombre,numero_socio,temporada').eq('id',c.socio_id).maybeSingle(),supabaseAdmin.from('profiles').select('tiene_password').eq('id',c.user_id).maybeSingle(),supabaseAdmin.from('usuario_roles').select('rol').eq('email',c.email).eq('activo',true).neq('rol','socia')]);check(s.error);check(p.error);check(r.error);
 if(!s.data)return {estado:'caducado' as const,prueba:c.es_prueba};
 return {estado:'listo' as const,prueba:c.es_prueba,socio:{id:s.data.id,nombre:s.data.nombre,numero:Number(s.data.numero_socio),temporada:s.data.temporada},email:c.email,puede_password:canSetPaymentPassword(c,!!p.data?.tiene_password,!!r.data?.length)};
}
async function sendClubEmail(clave:string,subject:string,html:string){
 const settings=await paymentSettings();const to=emailSchema.parse(settings.email_avisos);
 const existing=await supabaseAdmin.from('emails_log').select('estado').eq('clave',clave).maybeSingle();check(existing.error);if(existing.data?.estado==='enviado')return;
 const inserted=await supabaseAdmin.from('emails_log').upsert({clave,destinatario:to,asunto:subject},{onConflict:'clave',ignoreDuplicates:true});check(inserted.error);
 const key=process.env['RESEND_API_KEY'],lovable=process.env['LOVABLE_API_KEY'];
 try{
  if(!key||!lovable)throw new Error('Resend no está conectado.');
  const response=await fetch('https://connector-gateway.lovable.dev/resend/emails',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${lovable}`,'X-Connection-Api-Key':key,'Idempotency-Key':clave},body:JSON.stringify({from:'R.U. Lucense <onboarding@resend.dev>',to:[to],subject,html})});
  if(!response.ok){const errorBody=await response.text();await supabaseAdmin.from('emails_log').update({estado:'error',error:`Resend [${response.status}]: ${errorBody}`}).eq('clave',clave);throw new Error(`El aviso no se ha enviado (Resend ${response.status}). Revisa el destinatario o el dominio de envío.`);}
  const result=await response.json() as {id?:string};const saved=await supabaseAdmin.from('emails_log').update({estado:'enviado',provider_id:result.id??null,enviado_at:new Date().toISOString(),error:null}).eq('clave',clave);check(saved.error);
 }catch(error){const detail=error instanceof Error?error.message:'No se pudo enviar el aviso.';const saved=await supabaseAdmin.from('emails_log').select('error').eq('clave',clave).maybeSingle();if(!saved.data?.error)await supabaseAdmin.from('emails_log').update({estado:'error',error:detail}).eq('clave',clave);throw error;}
}
export async function sendMembershipEmail(c:Checkout,session:Stripe.Checkout.Session,method:string,origin:string){
 if(!c.socio_id)return;const s=await supabaseAdmin.from('socios').select('nombre,numero_socio').eq('id',c.socio_id).single();check(s.error);if(!s.data)throw new Error('Ficha no disponible.');
 const esc=escapeEmailHtml,number=s.data.numero_socio;
 const html=`<img src="${esc(new URL(crest.url,origin).href)}" width="80" alt="Real Unión Lucense F.S."><h1>Soci@ nº ${number}</h1><p>${esc(s.data.nombre)}</p><p>Email: ${esc(c.email)}<br>Teléfono: ${esc(c.telefono||'—')}</p><p>Temporada ${esc(c.temporada)} · ${esc(formatoImporte(c.importe_centimos/100))} · ${esc(method)}</p><p>${esc(new Date((session.created)*1000).toLocaleString('es-ES',{timeZone:'Europe/Madrid'}))}<br>Referencia: ${esc(typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id??'')}</p><p>Hay que preparar y entregar su carnet físico.</p><a style="background:#0D4631;color:white;padding:12px 18px;text-decoration:none" href="${esc(origin)}/?socio=${encodeURIComponent(c.socio_id)}">Ver ficha en la app</a>`;
 await sendClubEmail(`alta-${session.id}`,`Nuevo soci@ nº ${number} · ${s.data.nombre} · Carnet físico pendiente`,html);
}
function safeFailure(error:unknown){if(error instanceof Stripe.errors.StripeError)return `Stripe: ${error.type} (${error.code??'sin código'})`;return error instanceof Error?error.message:'Error al procesar el pago.';}
export async function processStripeEvent(event:Stripe.Event,origin:string){
 const prior=await supabaseAdmin.from('stripe_eventos').select('estado').eq('event_id',event.id).maybeSingle();check(prior.error);if(prior.data?.estado==='procesado')return;
 const receipt=await supabaseAdmin.from('stripe_eventos').upsert({event_id:event.id,tipo:event.type},{onConflict:'event_id',ignoreDuplicates:true});check(receipt.error);
 try{
  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
   const incoming=event.data.object;const session=await stripeClient().checkout.sessions.retrieve(incoming.id,{expand:['payment_intent.latest_charge']});
   if(session.payment_status==='paid'){
    const c=await readCheckout(session.id);if(!verifiedPaidSession(session,c)||session.metadata?.['alta_id']!==c.id||session.customer_email?.toLowerCase()!==c.email)throw new Error('Los datos del pago no coinciden con el alta.');
    if(c.pagado_at&&!c.socio_id){const retired=await supabaseAdmin.from('stripe_eventos').update({estado:'procesado',procesado_at:new Date().toISOString(),error:'Ficha eliminada por administración; el reintento no recrea el alta.'}).eq('event_id',event.id);check(retired.error);return;}
    const intent=session.payment_intent;const ref=typeof intent==='string'?intent:intent?.id;if(!ref)throw new Error('Falta la referencia del pago.');
    const charge=typeof intent==='object'&&intent?.latest_charge&&typeof intent.latest_charge==='object'?intent.latest_charge:null;
    const type=charge?.payment_method_details?.type??'card';const method=type==='card'?'Tarjeta':type==='bizum'?'Bizum':type;
    const registered=await supabaseAdmin.rpc('procesar_alta_stripe',{p_event:event.id,p_session:session.id,p_referencia:ref,p_importe:session.amount_total??0,p_prueba:!session.livemode,p_fecha:new Date(event.created*1000).toISOString(),p_metodo:method});check(registered.error);
    const stored=await readCheckout(session.id);await ensurePaymentAuth(stored);await sendMembershipEmail(stored,session,method,origin);
   }
  }else if(event.type==='charge.refunded'){
   const charge=event.data.object;const ref=typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent?.id;
   if(ref){const p=await supabaseAdmin.from('pagos').update({estado:'reembolsado',reembolsado_at:new Date(event.created*1000).toISOString()}).eq('referencia',ref).eq('metodo','stripe').select('socio_id').maybeSingle();check(p.error);if(p.data){const s=await supabaseAdmin.from('socios').select('nombre,numero_socio').eq('id',p.data.socio_id).single();check(s.error);if(s.data)await sendClubEmail(`refund-${event.id}`,`Pago devuelto · Soci@ nº ${s.data.numero_socio}`,`<p>Se ha devuelto el pago de ${escapeEmailHtml(s.data.nombre)}, soci@ nº ${s.data.numero_socio}.</p><p>Referencia: ${escapeEmailHtml(ref)}. La ficha sigue en activo.</p>`);}}
  }
  const done=await supabaseAdmin.from('stripe_eventos').update({estado:'procesado',procesado_at:new Date().toISOString(),error:null}).eq('event_id',event.id);check(done.error);
 }catch(error){const detail=safeFailure(error);await supabaseAdmin.from('stripe_eventos').update({estado:'error',error:detail}).eq('event_id',event.id);try{await sendClubEmail(`error-${event.id}`,'Revisar pago Stripe · Alta o aviso pendiente',`<p>El club debe revisar el evento ${escapeEmailHtml(event.id)}.</p><p>${escapeEmailHtml(detail)}</p><p>Stripe reintentará la entrega. No se ha dado de baja ninguna ficha.</p>`);}catch{/* Durable error and outbox remain visible to Super admin; Stripe retries. */}throw new Error('El evento está registrado y necesita reintento.');}
}
