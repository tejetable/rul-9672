import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {emailSchema} from './email-validation';
import {passwordSchema} from './password-access';
const input=z.object({email:emailSchema,password:passwordSchema.max(128),mode:z.enum(['initial','reset'])});
export const setClubUserPassword=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>input.parse(v)).handler(async({data,context})=>{
 const permission=await context.supabase.rpc('is_super_admin');
 if(permission.error||permission.data!==true)throw new Error('Solo Super admin puede gestionar contraseñas.');
 const target=await context.supabase.rpc('preparar_password_usuario',{p_email:data.email});
 if(target.error)throw new Error('La persona debe tener acceso al club antes de poner una contraseña.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const result=target.data?await supabaseAdmin.auth.admin.updateUserById(target.data,{password:data.password,email_confirm:true}):await supabaseAdmin.auth.admin.createUser({email:data.email,password:data.password,email_confirm:true});
 if(result.error||!result.data.user)throw new Error('No se pudo guardar la contraseña. Los datos del club se mantienen; inténtalo otra vez.');
 const audit=await supabaseAdmin.rpc('registrar_password_usuario',{p_actor:context.userId,p_usuario:result.data.user.id,p_email:data.email,p_accion:data.mode==='initial'?'password_inicial':'password_cambiada_admin'});
 if(audit.error)throw new Error('La contraseña se guardó, pero no se pudo completar su registro. Inténtalo otra vez.');
 return {saved:true};
});
