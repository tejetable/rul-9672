import { z } from 'zod';
import {emailSchema} from './email-validation';
export const membershipSchema=z.object({nombre:z.string().trim().min(1).max(200),email:emailSchema,telefono:z.string().regex(/^$|^[0-9]{9,15}$/),mayor:z.literal(true),consentimiento:z.literal(true)});
export interface EmailRole {id:string;rol:'socia'|'negocio'|'directiva'|'super_admin';socio_id:string|null;patrocinador_id:string|null;numero_socio:number|null;nombre:string;}
export function roleLabel(r:EmailRole){return r.rol==='socia'?`Socia/o nº ${r.numero_socio??'[pendiente]'}`:r.rol==='negocio'?`Negocio: ${r.nombre}`:r.rol==='super_admin'?'Super admin':'Directiva';}
export function initialRole(roles:EmailRole[],last:string|null){return roles.length===1?roles[0]??null:roles.find(r=>r.id===last)??null;}
export function accessMessage(email:string,origin:string){return `Ya tienes acceso. Entra en ${origin} con este email: ${email.trim().toLowerCase()}`;}