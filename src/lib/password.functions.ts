import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {emailSchema} from './email-validation';
import {passwordSchema} from './password-access';
const input=z.object({email:emailSchema,password:z.union([passwordSchema,z.literal('')]),mode:z.enum(['initial','reset','remove'])}).refine(v=>v.mode!=='reset'||v.password.length>=8);
export const setClubUserPassword=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>input.parse(v)).handler(async({data,context})=>{
 const permission=await context.supabase.rpc('is_super_admin');
 if(permission.error||permission.data!==true)throw new Error('Solo Super admin puede gestionar contraseñas.');
 const target=await context.supabase.rpc('preparar_password_usuario',{p_email:data.email});
 if(target.error)throw new Error('La persona debe tener acceso al club antes de poner una contraseña.');
 const status=await context.supabase.rpc('acceso_usuario_admin',{p_email:data.email});
 if(status.error)throw new Error(status.error.message);
 if(data.mode==='remove'&&!(status.data as {puede_google?:boolean})?.puede_google)throw new Error('No tiene otra forma de entrar. Cámbiasela en lugar de eliminarla.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 if(target.data&&data.mode==='initial'&&!data.password)return {saved:true};
 const password=data.mode==='remove'?`${crypto.randomUUID()}${crypto.randomUUID()}`:data.password;
 const result=target.data?await supabaseAdmin.auth.admin.updateUserById(target.data,{...(password?{password}:{}),email_confirm:true}):await supabaseAdmin.auth.admin.createUser({email:data.email,...(password?{password}:{}),email_confirm:true});
 if(result.error||!result.data.user)throw new Error('No se pudo guardar la contraseña. Los datos del club se mantienen; inténtalo otra vez.');
 const audit=await supabaseAdmin.rpc('registrar_password_usuario',{p_actor:context.userId,p_usuario:result.data.user.id,p_email:data.email,p_accion:data.mode==='remove'?'password_eliminada':data.mode==='reset'?'password_cambiada_admin':password?'password_inicial':'usuario_sin_password'});
 if(audit.error)throw new Error('La contraseña se guardó, pero no se pudo completar su registro. Inténtalo otra vez.');
 return {saved:true};
});
export const deleteClubMember=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().uuid(),name:z.string().min(1)}).parse(v)).handler(async({data,context})=>{
 const permission=await context.supabase.rpc('preparar_eliminar_socio',{p_socio:data.id,p_nombre:data.name});
 if(permission.error)throw new Error(permission.error.message);
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const result=await supabaseAdmin.rpc('eliminar_socio_admin',{p_actor:context.userId,p_socio:data.id,p_nombre:data.name});
 if(result.error)throw new Error(result.error.message);
 const target=result.data as {usuario:string|null;borrar_auth:boolean};
 if(target.borrar_auth&&target.usuario){const removed=await supabaseAdmin.auth.admin.deleteUser(target.usuario);if(removed.error)throw new Error('El socio se eliminó, pero su acceso no pudo retirarse. Contacta con el club para completar la retirada.');}
 return {deleted:true};
});
export const createPersonalPassword=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({password:passwordSchema}).parse(v)).handler(async({data,context})=>{
 const status=await context.supabase.rpc('estado_acceso_personal');
 if(status.error||(status.data as {tiene_password?:boolean})?.tiene_password!==false)throw new Error('Para cambiarla, escribe tu contraseña actual.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const result=await supabaseAdmin.auth.admin.updateUserById(context.userId,{password:data.password});
 if(result.error)throw new Error('No se pudo crear tu contraseña.');
 const done=await context.supabase.rpc('completar_cambio_password');
 if(done.error)throw new Error(done.error.message);
 return {saved:true};
});
