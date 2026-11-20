import {createFileRoute} from '@tanstack/react-router';
import {z} from 'zod';
export const Route=createFileRoute('/api/public/stripe-webhook')({server:{handlers:{POST:async({request})=>{
 const secret=process.env['STRIPE_WEBHOOK_SECRET'];if(!secret)return new Response('Webhook no configurado',{status:503});
 const signature=request.headers.get('stripe-signature');if(!signature)return new Response('Firma no válida',{status:400});
 const body=await request.text();if(body.length>1048576)return new Response('Payload demasiado grande',{status:413});
 const Stripe=(await import('stripe')).default;const key=process.env['STRIPE_SECRET_KEY'];if(!key)return new Response('Stripe no configurado',{status:503});const stripe=new Stripe(key,{httpClient:Stripe.createFetchHttpClient()});let event;
 try{event=await stripe.webhooks.constructEventAsync(body,signature,secret,300,Stripe.createSubtleCryptoProvider());z.object({id:z.string().min(1).max(255),type:z.string().max(100),created:z.number().int().nonnegative(),livemode:z.boolean(),data:z.object({object:z.object({id:z.string().min(1).max(255)}).passthrough()})}).parse(event);}catch{return new Response('Firma o evento no válido',{status:400});}
 try{const {processStripeEvent}=await import('@/lib/membership-payment.server');await processStripeEvent(event,new URL(request.url).origin);return Response.json({received:true});}catch{return new Response('Evento registrado; reintentar',{status:500});}
}}}});
