import {z} from 'zod';
export const PASSWORD_MIN_LENGTH=8;
export const passwordSchema=z.string().min(PASSWORD_MIN_LENGTH,'Usa al menos 8 caracteres.').max(128,'Usa como máximo 128 caracteres.');
export const passwordPairSchema=z.object({password:passwordSchema,repeat:z.string()}).refine(x=>x.password===x.repeat,{message:'Las contraseñas no coinciden.',path:['repeat']});
export function passwordStrength(value:string){return value.length<8?0:value.length<12?1:value.length<16?2:3;}
export function passwordLinkType(hash:string){const type=new URLSearchParams(hash.replace(/^#/, '')).get('type');return type==='recovery'||type==='invite'?type:null;}
