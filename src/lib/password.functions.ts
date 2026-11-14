import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
const input=z.object({email:z.string().trim().toLowerCase().email(),origin:z.string().url()});
function redirectUrl(origin:string){const url=new URL(origin);if(url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('Dirección no válida');const valid=url.hostname==='rul-9672.lovable.app'||url.hostname==='id-preview--6a75f78a-56db-4f8a-b65b-1ee613502b56.lovable.app'||(url.hostname==='localhost'&&url.port==='8080');if(!valid||(url.protocol!=='https:'&&url.hostname!=='localhost'))throw new Error('Dirección no válida');return `${url.origin}/create-password`;}
export const sendPasswordInvitation=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>input.parse(v)).handler(async({data,context})=>{
 const status=await context.supabase.rpc('acceso_password_club',{p_email:data.email});if(status.error||!status.data)throw new Error('No autorizado');
 const value=status.data as {user_id:string|null;activo:boolean};const redirectTo=redirectUrl(data.origin);
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 // Existing Auth accounts cannot be invited again; recovery is the supported secure resend.
 const result=value.user_id?await supabaseAdmin.auth.resetPasswordForEmail(data.email,{redirectTo}):await supabaseAdmin.auth.admin.inviteUserByEmail(data.email,{redirectTo});
 if(result.error)throw new Error('El acceso está guardado, pero no se pudo enviar el email. Reenvíalo desde la ficha.');return {sent:true};
});
