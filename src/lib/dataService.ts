import { useSyncExternalStore } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { previewInvitation } from "./club.functions";
import { getDriveGallery } from './drive.functions';
import { folderIdFromUrl } from './drive-gallery';
import type { Rango, Visita } from "./visitas";
import type { ClubStats, ClubSummary } from "./club-stats";
export type { Visita } from "./visitas";
export interface Socio {
  id: string;
  nombre: string;
  telefono: string;
  numeroSocio: number;
  temporada: string;
  fechaAlta: string;
  consentimientoRGPD: { aceptado: boolean; fecha: string | null };
  mayorDeEdad: boolean;
  estado: "invitada" | "activa" | "desactivada";
  tokenInvitacion: string;
  fechaActivacion: string | null;
  dispositivoId: string | null;
  cambioDispositivo: boolean;
  /** Última vez que abrió la app */
  ultimaApertura?: string | undefined;
  fechaBaja?: string | null;
  motivoBaja?: string | null;
}
export interface Patrocinador {
  id: string;
  nombre: string;
  categoria: string;
  logoUrl: string;
  direccion: string;
  pin?: string;
  importePatrocinio?: number;
  fechaBaja?: string | null;
  motivoBaja?: string | null;
  activo: boolean;
}
export interface Ventaja {
  id: string;
  patrocinadorId: string;
  titulo: string;
  descripcion: string;
  condiciones: string;
  activa: boolean;
  fechaInicio: string;
  fechaFin: string;
  destacado?: string;
  tarifas?: { servicio: string; normal: string; socio: string }[];
}
export interface Canje {
  id: string;
  socioId: string;
  patrocinadorId: string;
  ventajaId: string;
  fechaHora: string;
  primeraVezDeclarada: boolean;
  primerCanjeSistema: boolean;
}
export interface Partido {
  id: string;
  rival: string;
  fechaHora: string;
  lugar: string;
  competicion?: string | undefined;
  esLocal: boolean;
  golesLocal: number | null;
  golesVisitante: number | null;
  jugado: boolean;
  driveFolderId?: string | null;
}
export interface Aviso {
  id: string;
  titulo: string;
  texto: string;
  fecha: string;
  tipo: "partido" | "ventaja" | "club";
  /** A quién va dirigido; sin valor = todos */
  para?: "todos" | "socias" | "negocios";
}
export interface DB {
  socios: Socio[];
  patrocinadores: Patrocinador[];
  ventajas: Ventaja[];
  canjes: Canje[];
  partidos: Partido[];
  avisos: Aviso[];
  visitas: Visita[];
  socioActualId: string | null;
}

const emptyDB = (): DB => ({ socios: [], patrocinadores: [], ventajas: [], canjes: [], partidos: [], avisos: [], visitas: [], socioActualId: null });
let db = emptyDB();
let role: 'socia' | 'negocio' | 'directiva' | null = null;
let reads: string[] = [];
let version = 0;
let userId: string | null = null;
let linkedSocio: string | null = null;
let sessionState: 'ok'|'movido'|'desactivada'|null=null;
let visitNames:Record<string,{nombre:string;numero:number}>={};
const listeners = new Set<() => void>();
let channel: ReturnType<typeof supabase.channel> | null = null;
const notify = () => { version++; listeners.forEach((fn) => fn()); };
const check = (error: { message: string } | null) => { if (error) throw new Error(error.message); };
const socioFrom = (s: Record<string, unknown>): Socio => ({
  id: String(s['id']), nombre: String(s['nombre']), telefono: String(s['telefono'] ?? ''), numeroSocio: Number(s['numero_socio']),
  temporada: String(s['temporada'] ?? '2026/27'), fechaAlta: String(s['fecha_alta'] ?? ''),
  consentimientoRGPD: { aceptado: !!s['consentimiento_at'], fecha: s['consentimiento_at'] ? String(s['consentimiento_at']) : null },
  mayorDeEdad: !!s['mayor_de_edad'], estado: s['estado'] as Socio['estado'], tokenInvitacion: String(s['token_invitacion'] ?? ''),
  fechaActivacion: s['fecha_activacion'] ? String(s['fecha_activacion']) : null, dispositivoId: s['dispositivo_id'] ? String(s['dispositivo_id']) : null,
  cambioDispositivo: !!s['cambio_dispositivo'], ultimaApertura: s['ultima_apertura'] ? String(s['ultima_apertura']) : undefined,
  fechaBaja: s['fecha_baja'] ? String(s['fecha_baja']) : null, motivoBaja: s['motivo_baja'] ? String(s['motivo_baja']) : null,
});
async function allRows<T>(query: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let start = 0; ; start += 500) { const result = await query(start, start + 499); check(result.error); rows.push(...(result.data ?? [])); if ((result.data?.length ?? 0) < 500) return rows; }
}
export const dataService = {
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  snapshot: () => version,
  get: () => db,
  estadoSocia:()=>sessionState,
  nombreVisita:(id:string)=>visitNames[id]?.nombre ?? 'Sin carnet',
  rol: () => role,
  async albumes(){return (await getDriveGallery()).albumes;},
  async guardarCarpetaPartido(id:string,enlace:string){const folder=folderIdFromUrl(enlace);if(enlace.trim()&&!folder)throw new Error('Pega un enlace válido de carpeta de Google Drive.');const r=await supabase.from('partidos').update({drive_folder_id:folder}).eq('id',id);check(r.error);await this.refresh();},
  async init() {
    const { data } = await supabase.auth.getUser(); userId = data.user?.id ?? null;
    if (!userId) { db = emptyDB(); role = null; linkedSocio = null; reads = []; sessionState=null;visitNames={};notify(); return; }
    const rr = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(); check(rr.error); role = rr.data?.role ?? null;
    const pr = await supabase.from('profiles').select('socio_id').eq('id', userId).maybeSingle(); check(pr.error); linkedSocio = pr.data?.socio_id ?? null;
    const status=role==='socia'?await supabase.rpc('estado_sesion_socia'):null;
    sessionState=status?.data as typeof sessionState ?? null;
    await this.refresh();
    if (!channel) {
      channel = supabase.channel(`club-${crypto.randomUUID()}`).on('postgres_changes', { event: '*', schema: 'public' }, () => { void this.refresh().catch(() => toast.error('No se pudieron actualizar los datos.')); }).subscribe();
    }
  },
  async refresh() {
    if (!userId || !role) { db = emptyDB(); notify(); return; }
    const [socios, pats, ventajas, visitas, partidos, avisos, leidos] = await Promise.all([
      allRows((a,b) => supabase.from('socios').select('*').order('numero_socio').range(a,b)),
      allRows((a,b) => supabase.from('patrocinadores').select('id,nombre,categoria,logo_url,direccion,activo,importe_patrocinio,fecha_baja,motivo_baja').order('fecha_alta').range(a,b)),
      allRows((a,b) => supabase.from('ventajas').select('*').order('id').range(a,b)),
      role === 'socia' ? Promise.resolve([]) : allRows((a,b) => {
        const q=supabase.from('visitas').select('*').order('fecha_hora');
        return (role==='negocio'?q.gte('fecha_hora',new Date(Date.now()-86400000).toISOString()):q).range(a,b);
      }),
      allRows((a,b) => supabase.from('partidos').select('*').order('fecha_hora',{ascending:false}).range(a,b)),
      allRows((a,b) => supabase.from('avisos').select('*').order('publicado_at',{ascending:false}).range(a,b)),
      allRows((a,b) => supabase.from('avisos_leidos').select('aviso_id').eq('user_id',userId ?? '').order('aviso_id').range(a,b)),
    ]);
    db = { socios: socios.map(socioFrom), patrocinadores: pats.map(p => ({ id:p.id,nombre:p.nombre,categoria:p.categoria,logoUrl:p.logo_url,direccion:p.direccion,activo:p.activo,importePatrocinio:Number(p.importe_patrocinio),fechaBaja:p.fecha_baja,motivoBaja:p.motivo_baja })),
      ventajas: ventajas.map(v => ({id:v.id,patrocinadorId:v.patrocinador_id,titulo:v.titulo,descripcion:v.descripcion,condiciones:v.condiciones,activa:v.activa,fechaInicio:v.fecha_inicio,fechaFin:v.fecha_fin,...(v.destacado ? {destacado:v.destacado}:{}),...(v.tarifas ? {tarifas:v.tarifas as unknown as NonNullable<Ventaja['tarifas']>}: {})})),
      visitas: visitas.map(v => ({id:v.id,socioId:v.socio_id ?? undefined,patrocinadorId:v.patrocinador_id,ventajaId:v.ventaja_id ?? undefined,fechaHora:v.fecha_hora,origen:v.origen === 'sin_carnet' ? 'sin_carne' : v.origen as Visita['origen'],tipoCliente:v.tipo_cliente as Visita['tipoCliente'],repiteViaClub:v.repite_via_club,verificada:v.verificada,anulada:v.anulada,numeroSocio:socios.find(s=>s.id===v.socio_id)?.numero_socio})),
      partidos: partidos.map(p=>({id:p.id,rival:p.rival,fechaHora:p.fecha_hora ?? '',lugar:p.lugar,esLocal:p.es_local,competicion:p.competicion ?? undefined,golesLocal:p.es_local ? p.goles_favor : p.goles_contra,golesVisitante:p.es_local ? p.goles_contra : p.goles_favor,jugado:p.jugado,driveFolderId:p.drive_folder_id})),
      avisos:avisos.map(a=>({id:a.id,titulo:a.titulo,texto:a.texto,fecha:a.publicado_at,tipo:a.tipo as Aviso['tipo'],para:a.destinatarios as NonNullable<Aviso['para']>})),canjes:[],socioActualId:linkedSocio };
    if(role==='socia'){const status=await supabase.rpc('estado_sesion_socia');sessionState=status.data as typeof sessionState;}
    if(role==='negocio'){const names=await supabase.rpc('visit_names_today');visitNames=(names.data??{}) as unknown as typeof visitNames;}
    reads = leidos.map(l=>l.aviso_id); notify();
  },
  async crearSocio(nombre: string, telefono: string) {
    const input = z.object({ nombre:z.string().trim().min(1).max(200),telefono:z.string().regex(/^\d{9,15}$/) }).parse({nombre,telefono:telefono.replace(/\D/g,'')});
    const r = await supabase.from('socios').insert(input).select().single(); check(r.error); if (!r.data) throw new Error('No se pudo crear la socia.'); await this.refresh(); return socioFrom(r.data);
  },
  async regenerarToken(id: string) { const r = await supabase.from('socios').update({token_invitacion:nuevoToken()}).eq('id',id).select().single(); check(r.error); await this.refresh(); return r.data ? socioFrom(r.data) : null; },
  async desactivar(id: string, fecha: string, motivo: string) { const r=await supabase.from('socios').update({estado:'desactivada',fecha_baja:fecha,motivo_baja:motivo}).eq('id',id);check(r.error);await this.refresh(); },
  async bajaPatrocinador(id:string,fecha:string,motivo:string,detalle:string) { const r=await supabase.from('patrocinadores').update({activo:false,fecha_baja:fecha,motivo_baja:motivo,detalle_baja:detalle}).eq('id',id);check(r.error);await this.refresh(); },
  async porToken(token:string) { const s=await previewInvitation({data:{token}}); return s ? socioFrom(s) : null; },
  dispositivoId() { let d=window.localStorage.getItem('rul-device-id'); if(!d){d=crypto.randomUUID();window.localStorage.setItem('rul-device-id',d);} return d; },
  async anonymous() { const {data}=await supabase.auth.getUser(); if(!data.user){const r=await supabase.auth.signInAnonymously();check(r.error);} },
  async activar(token:string) { await this.anonymous(); const r=await supabase.rpc('enlazar_socio',{p_token:token,p_dispositivo:this.dispositivoId()});check(r.error);await this.init();return this.sesion()?.socio ?? null; },
  sesion(): {socio:Socio;estado:'ok'|'movido'|'desactivada'} | null { if(role!=='socia')return null; const s=db.socios.find(s=>s.id===linkedSocio); if(!s)return null;return {socio:s,estado:s.estado==='desactivada'?'desactivada':s.dispositivoId===this.dispositivoId()?'ok':'movido'}; },
  async cerrarSesion(){ if(channel){await supabase.removeChannel(channel);channel=null;} db=emptyDB();reads=[];role=null;userId=null;linkedSocio=null;sessionState=null;visitNames={};notify();const r=await supabase.auth.signOut();check(r.error); },
  async marcarApertura(_id:string){const r=await supabase.rpc('marcar_apertura');check(r.error);},
  pinLibre:()=>String(Math.floor(1000+Math.random()*9000)),
  async crearPatrocinador(p:Omit<Patrocinador,'id'|'activo'>,v:{titulo:string;descripcion:string;condiciones:string}):Promise<Patrocinador|'pin_usado'> {const r=await supabase.rpc('crear_patrocinador',{p_nombre:p.nombre,p_categoria:p.categoria,p_direccion:p.direccion,p_logo:p.logoUrl,p_pin:p.pin ?? '',p_titulo:v.titulo,p_descripcion:v.descripcion,p_condiciones:v.condiciones,p_importe:p.importePatrocinio ?? 0});check(r.error);if(!r.data)return 'pin_usado';await this.refresh();const pat=db.patrocinadores.find(x=>x.id===r.data);if(!pat)throw new Error('No se pudo leer el patrocinador.');return pat;},
  async negocioPorPin(pin:string){await this.anonymous();const r=await supabase.rpc('entrar_negocio',{p_pin:pin});check(r.error);if(!r.data)return null;await this.init();return this.negocioSesion();},
  negocioSesion(){return role==='negocio'? db.patrocinadores[0] ?? null : null;},
  abrirNegocio(_id:string){},
  cerrarNegocio(){return this.cerrarSesion();},
  async socioPorNumero(n:number){const r=await supabase.rpc('identificar_socio',{p_numero:n});check(r.error);if(!r.data)return null;const s=r.data as unknown as {id:string;nombre:string;numeroSocio:number;repite:boolean;yaHoy:boolean};return {...s,telefono:'',temporada:'2026/27',estado:'activa' as const,fechaAlta:'',consentimientoRGPD:{aceptado:false,fecha:null},mayorDeEdad:true,tokenInvitacion:'',fechaActivacion:null,dispositivoId:null,cambioDispositivo:false};},
  async registrarVisita(input:{patrocinadorId:string;socio:Socio|null;origen:Visita['origen'];tipoCliente:Visita['tipoCliente']}):Promise<Visita|'duplicada'>{const r=await supabase.from('visitas').insert({patrocinador_id:input.patrocinadorId,socio_id:input.socio?.id ?? null,origen:input.origen==='sin_carne'?'sin_carnet':input.origen,tipo_cliente:input.tipoCliente}).select().single();if(r.error?.code==='23505')return 'duplicada';check(r.error);await this.refresh();const v=db.visitas.find(v=>v.id===r.data?.id);if(!v)throw new Error('No se pudo leer la visita.');return v;},
  async anularVisita(id:string){const r=await supabase.from('visitas').update({anulada:true}).eq('id',id).select('id');check(r.error);if(!r.data?.length)throw new Error('Solo puedes anular visitas de los últimos 10 minutos.');await this.refresh();},
  async crearAviso(a:{titulo:string;texto:string;tipo:Aviso['tipo'];para:NonNullable<Aviso['para']>}){const r=await supabase.from('avisos').insert({titulo:a.titulo,texto:a.texto,tipo:a.tipo,destinatarios:a.para});check(r.error);await this.refresh();},
  async borrarAviso(id:string){const r=await supabase.from('avisos').delete().eq('id',id);check(r.error);await this.refresh();},
  avisosLeidos:()=>reads,
  avisosPara(quien:'socias'|'negocios'){return db.avisos.filter(a=>!a.para||a.para==='todos'||a.para===quien);},
  async marcarAvisosLeidos(quien:'socias'|'negocios'){if(!userId)return;const rows=this.avisosPara(quien).filter(a=>!reads.includes(a.id)).map(a=>({aviso_id:a.id,user_id:userId ?? '',socio_id:linkedSocio}));if(!rows.length)return;const r=await supabase.from('avisos_leidos').insert(rows);if(r.error?.code!=='23505')check(r.error);await this.refresh();},
  async statsPatrocinador(id:string,rango:Rango){const r=await supabase.rpc('stats_patrocinador',{p_patrocinador_id:id,p_periodo:rango==='90'?'90d':rango});check(r.error);return r.data as unknown as ClubStats;},
  async statsClub(rango:Rango){const r=await supabase.rpc('stats_club',{p_periodo:rango==='90'?'90d':rango});check(r.error);return r.data as unknown as ClubSummary;},
};
export function nuevoToken(){const a=new Uint8Array(24);crypto.getRandomValues(a);return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');}
export function useClubData(){useSyncExternalStore(dataService.subscribe,dataService.snapshot,()=>0);return db;}
export function runAction(fn:()=>Promise<unknown>){void fn().catch(e=>toast.error(e instanceof Error?e.message:'No se pudo completar la operación.'));}
