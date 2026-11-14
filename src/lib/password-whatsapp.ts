import {emailSchema} from './email-validation';
import {passwordSchema} from './password-access';
export function accesoWhatsApp(phone:string,email:string,password:string,origin:string) {
 const digits=phone.replace(/\D/g,'');
 const recipient=digits.length===9?`34${digits}`:digits;
 if(!/^[1-9]\d{7,14}$/.test(recipient))return null;
 const address=emailSchema.parse(email);passwordSchema.parse(password);
 const url=new URL(origin);if(!['https:','http:'].includes(url.protocol))return null;
 const message=`Ya puedes entrar en la app del R.U. Lucense: ${url.origin}. Email: ${address} · Contraseña: ${password}. Al entrar te pedirá cambiarla.`;
 return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}