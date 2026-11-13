import {createServerFn} from '@tanstack/react-start';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {z} from 'zod';
export const invitarDirectiva=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input)=>z.object({nombre:z.string().trim().min(1).max(200),email:z.string().email(),socioId:z.string().uuid().nullable(),origin:z.string().url()}).parse(input)).handler(async({data,context})=>{
 const permission=await context.supabase.rpc('is_super_admin');if(permission.error||!permission.data)throw new Error('Solo Super admin puede invitar.');
 const origin=new URL(data.origin);const requestOrigin=new URL((await import('@tanstack/react-start/server')).getRequest().url).origin;if(origin.origin!==requestOrigin)throw new Error('Destino no válido.');
 const reserved=await context.supabase.rpc('reservar_directiva',{p_nombre:data.nombre,p_email:data.email,...(data.socioId?{p_socio:data.socioId}:{})});if(reserved.error||!reserved.data)throw new Error(reserved.error?.message??'No se pudo reservar la invitación.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const invite=await supabaseAdmin.auth.admin.inviteUserByEmail(data.email,{redirectTo:origin.origin});if(invite.error)throw new Error(invite.error.message);if(!invite.data.user)throw new Error('No se pudo enviar la invitación.');
 const linked=await context.supabase.rpc('vincular_directiva',{p_invitacion:reserved.data,p_user:invite.data.user.id});if(linked.error)throw new Error(linked.error.message);return {ok:true};
});
