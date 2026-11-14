import {z} from 'zod';
import {emailSchema} from './email-validation';
export const settingsSchema=z.object({url_twitch:z.union([z.literal(''),z.string().trim().url().refine(url=>url.startsWith('https://'),'Usa un enlace https.')]),cuota_socio:z.number().positive().nullable(),whatsapp_club:z.string().regex(/^$|^[1-9][0-9]{7,14}$/, 'Incluye el prefijo de país y solo dígitos.'),nombre_club:z.string().trim().min(1),temporada_actual:z.string().trim().min(1),email_club:z.union([z.literal(''),emailSchema]),url_clasificacion_futgal:z.string().url().refine(url=>url.startsWith('https://'),'Usa un enlace https.')});
export type ClubSettings=z.infer<typeof settingsSchema>;
export const defaultSettings:ClubSettings={url_twitch:'https://www.twitch.tv/adrifdez_10',cuota_socio:null,whatsapp_club:'',nombre_club:'Real Unión Lucense F.S.',temporada_actual:'2026/27',email_club:'',url_clasificacion_futgal:'https://www.futgal.es/pnfg/NPcd/NFG_VisClasificacion?cod_primaria=1000120&codcompeticion=26991388&codgrupo=26991389&cod_agrupacion=1'};
export function clubWhatsapp(text:string,phone:string){return phone?`https://wa.me/${phone}?text=${encodeURIComponent(text)}`:null;}
export function canManageTeam(role:string|null){return role==='super_admin';}
export const DEMO_MODE=import.meta.env['VITE_DEMO_MODE']==='true';
