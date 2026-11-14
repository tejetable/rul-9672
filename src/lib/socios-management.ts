import {z} from 'zod';
import type {Socio} from './dataService';
export const UNETE_DESTINO='whatsapp';
export const UNETE_MENSAJE='¡Hola! Quiero hacerme soci@ del R.U. Lucense.';
export const PAGE_SIZE=20;
export const SEARCH_DELAY=250;
export const pagoSchema=z.object({metodo:z.enum(['efectivo','transferencia','bizum']),importe:z.number().finite().positive('Indica un importe mayor que cero.'),fecha:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),referencia:z.string().trim().optional()});
export type PagoInput=z.infer<typeof pagoSchema>;
export interface Pago {id:string;socio_id:string;temporada:string;metodo:string;importe:number;fecha_pago:string;referencia:string|null}
export interface PersonaRol {id:string;email:string;nombre:string;rol:string;socio_id:string|null;patrocinador_id:string|null;activo:boolean}
export interface Persona {nombre:string;email:string;roles:PersonaRol[];activo:boolean}
export type Filtro='todas'|'activas'|'sin_acceder'|'desactivadas'|'sin_pago';
export type Orden='numero'|'nombre'|'fecha';
export type Direccion='asc'|'desc';
export function alCorriente(pagos:Pago[],id:string,temporada:string){return pagos.some(p=>p.socio_id===id&&p.temporada===temporada);}
export function listaSocios(socios:Socio[],q:string,filtro:Filtro,orden:Orden,status:Record<string,boolean>,pagos:Pago[],temporada:string,direccion:Direccion=orden==='fecha'?'desc':'asc'){
 const text=q.trim().toLocaleLowerCase('es');
 return socios.filter(s=>[s.nombre,s.email??'',s.telefono,String(s.numeroSocio)].some(v=>v.toLocaleLowerCase('es').includes(text)))
 .filter(s=>filtro==='todas'||(filtro==='activas'&&s.estado!=='desactivada'&&status[s.email?.toLowerCase()??'']===true)||(filtro==='desactivadas'&&s.estado==='desactivada')||(filtro==='sin_acceder'&&s.estado!=='desactivada'&&status[s.email?.toLowerCase()??'']===false)||(filtro==='sin_pago'&&!alCorriente(pagos,s.id,temporada)))
 .sort((a,b)=>(direccion==='asc'?1:-1)*(orden==='nombre'?a.nombre.localeCompare(b.nombre,'es'):orden==='fecha'?a.fechaAlta.localeCompare(b.fechaAlta):a.numeroSocio-b.numeroSocio));
}
export function paginaSocios<T>(rows:T[],page:number){const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));const current=Math.min(Math.max(page,1),pages);return {rows:rows.slice((current-1)*PAGE_SIZE,current*PAGE_SIZE),pages,current};}
export function hoyMadrid(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function primerNumeroLibre(socios:Pick<Socio, "numeroSocio">[]) { const ocupados=new Set(socios.map(s=>s.numeroSocio)); let numero=1; while(ocupados.has(numero))numero++; return numero; }
export function conflictoNumero(socios:Pick<Socio,"numeroSocio"|"nombre"|"email">[],numero:number,email:string) { const socio=socios.find(s=>s.numeroSocio===numero&&s.email?.toLowerCase()!==email.trim().toLowerCase()); return socio ? `El nº ${numero} ya es de ${socio.nombre}` : null; }
export const numeroSocioSchema=z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export function conflictoNumeroEdicion(socios:Pick<Socio,'id'|'numeroSocio'|'nombre'>[],numero:number,id:string){const owner=socios.find(s=>s.numeroSocio===numero&&s.id!==id);return owner?`El nº ${numero} ya es de ${owner.nombre}`:null;}

export function rolPrincipal(roles:Pick<PersonaRol,'rol'|'activo'>[]){return ['super_admin','directiva','negocio'].find(rol=>roles.some(r=>r.activo&&r.rol===rol))??null;}
