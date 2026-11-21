import {getMembershipConfig} from './membership-payment.functions';
import {textoMiembros} from './member-language';
import {normalizarEmail} from './email-validation';
import { useSyncExternalStore } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {defaultSettings,settingsSchema,canManageTeam,clubWhatsapp} from "./club-settings";
import {initialRole,type EmailRole} from "./email-access";
import {pagoSchema,type PagoInput,type Pago,type Persona,type PersonaRol} from './socios-management';
import { getDriveGallery } from './drive.functions';
import { folderIdFromUrl } from './drive-gallery';
import type { Rango, Visita } from "./visitas";
import type { ClubStats, ClubSummary } from "./club-stats";
export type { Visita } from "./visitas";
export interface Socio {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
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
  carnetFisico?: "pendiente" | "entregado";
  fechaEntrega?: string | null;
  esPrueba?: boolean;
}
export interface Patrocinador {
  id: string;
  nombre: string;
  categoria: string;
  logoUrl: string;
  direccion: string;
  emailAcceso?: string;
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
  jornada?: number | null;
  rival: string;
  fechaHora: string;
  lugar: string;
  competicion?: string | undefined;
  esLocal: boolean;
  golesLocal: number | null;
  golesVisitante: number | null;
  jugado: boolean;
  horaConfirmada?: boolean;
  fechaConfirmada?: boolean;
  driveFolderId?: string | null;
}
export interface Aviso {
  id: string;
  titulo: string;
  texto: string;
  fecha: string;
  tipo: "otro" | "ventaja" | "club";
  /** A quién va dirigido; sin valor = todos */
  para?: "todos" | "socias" | "negocios";
}
export interface Jugador {id:string;nombre:string;apodo:string;dorsal:number|null;activo:boolean}
export interface EstadisticaJugador {jugadorId:string;goles:number;asistencias:number;amarillas:number;rojas:number}
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
export interface LigaStats { pj:number; g:number; e:number; p:number; puntos:number; goles_favor:number; goles_contra:number; racha:string[] }
let liga:LigaStats={pj:0,g:0,e:0,p:0,puntos:0,goles_favor:0,goles_contra:0,racha:[]};
let clasificacion:{jornada:number;posicion:number}|null=null;
let settings=defaultSettings;
let db = emptyDB();
let role: 'socia' | 'negocio' | 'directiva' | 'super_admin' | null = null;
let roles:EmailRole[]=[];
let selectedRole:string|null=null;
let reads: string[] = [];
let version = 0;
let userId: string | null = null;
let linkedSocio: string | null = null;
let sessionState: 'ok'|'movido'|'desactivada'|null=null;
let visitNames:Record<string,{nombre:string;numero:number}>={};
let negocioPrueba:string|null=null;
let acceso={tiene_password:false,debe_cambiar_password:false,ha_accedido:false};
let loginPassword='';
const listeners = new Set<() => void>();
let channel: ReturnType<typeof supabase.channel> | null = null;
const notify = () => { version++; listeners.forEach((fn) => fn()); };
const check = (error: { message: string } | null) => { if (error) throw new Error(textoMiembros(error.message)); };
const socioFrom = (s: Record<string, unknown>): Socio => ({
  carnetFisico:s['carnet_fisico']==='entregado'?'entregado':'pendiente',fechaEntrega:s['fecha_entrega']?String(s['fecha_entrega']):null,esPrueba:s['es_prueba']===true,
  email:String(s['email']??''),id: String(s['id']), nombre: String(s['nombre']), telefono: String(s['telefono'] ?? ''), numeroSocio: Number(s['numero_socio']),
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
  configPago:()=>getMembershipConfig(),
  async entregarCarnet(id:string,entregado:boolean){const r=await supabase.rpc('entregar_carnet_fisico',{p_socio:id,p_entregado:entregado});check(r.error);await this.refresh();},
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  snapshot: () => version,
  get: () => db,
  estadoSocia:()=>sessionState,
  nombreVisita:(id:string)=>visitNames[id]?.nombre ?? 'Sin carnet',
  rol: () => role,
  negocioPrueba:()=>negocioPrueba,
  async accederComoNegocio(id:string){const r=await supabase.rpc('acceder_como_negocio',{p_id:id});check(r.error);negocioPrueba=id;notify();},
  async salirNegocioPrueba(){const r=await supabase.rpc('salir_negocio_prueba');check(r.error);negocioPrueba=null;await this.refresh();},
  async borrarVisitasPrueba(id:string){const r=await supabase.rpc('borrar_visitas_prueba',{p_negocio:id});check(r.error);await this.refresh();},
  roles:()=>roles,
  rolSeleccionado:()=>selectedRole,
  autenticado:()=>!!userId,
  esSuper:()=>roles.some(r=>r.rol==='super_admin')||canManageTeam(role),
  esDirectiva:()=>role==='directiva'||role==='super_admin',
  ajustes:()=>settings,
  liga:()=>liga,
  clasificacion:()=>clasificacion,
  whatsapp:(texto:string)=>clubWhatsapp(texto,settings.whatsapp_club),
  async cargarAjustes(){
    const r=await supabase.from("ajustes_club_publicos").select("id,whatsapp_club,nombre_club,temporada_actual,url_clasificacion_futgal,cuota_socio,url_twitch").maybeSingle();
    check(r.error);settings={
      whatsapp_club:r.data?.whatsapp_club??defaultSettings.whatsapp_club,
      nombre_club:r.data?.nombre_club??defaultSettings.nombre_club,
      temporada_actual:r.data?.temporada_actual??defaultSettings.temporada_actual,
      email_club:'',email_avisos:'',
      url_twitch:r.data?.url_twitch??defaultSettings.url_twitch,
      cuota_socio:r.data?.cuota_socio==null?null:Number(r.data.cuota_socio),
      url_clasificacion_futgal:r.data?.url_clasificacion_futgal??defaultSettings.url_clasificacion_futgal,
    };
    if(this.esSuper()){
      const privateSettings=await supabase.from("ajustes_club").select("email_club,email_avisos").maybeSingle();
      check(privateSettings.error);settings.email_club=privateSettings.data?.email_club??'';settings.email_avisos=privateSettings.data?.email_avisos??'';
    }
    notify();
  },
  async guardarAjustes(input:typeof defaultSettings){const r=await supabase.from("ajustes_club").update(settingsSchema.parse(input)).eq("id",true).select();check(r.error);if(!r.data?.length)throw new Error("Solo Super admin puede editar ajustes.");await this.cargarAjustes();},
  async estadoPassword(email:string){const r=await supabase.rpc('acceso_password_club',{p_email:normalizarEmail(email)});check(r.error);return !!(r.data as {activo?:boolean}|null)?.activo;},
  acceso:()=>acceso,
  async pagoTemporada(socioId:string,temporada:string){const r=await supabase.from('pagos').select('id').eq('socio_id',socioId).eq('temporada',temporada).limit(1);check(r.error);return (r.data?.length??0)>0;},
  passwordEntrada:()=>loginPassword,
  recordarPasswordEntrada:(value:string)=>{loginPassword=value;},
  async cargarAcceso(){const r=await supabase.rpc('estado_acceso_personal');check(r.error);acceso=r.data as unknown as typeof acceso;if((r.data as {google?:boolean}|null)?.google)loginPassword='';notify();},
  async completarPassword(){const r=await supabase.rpc('completar_cambio_password');check(r.error);loginPassword='';await this.cargarAcceso();},
  async equipo(){const [r,h]=await Promise.all([supabase.from('usuario_roles').select('*').in('rol',['directiva','super_admin']).eq('activo',true),supabase.from('registro_permisos').select('*').order('fecha',{ascending:false})]);check(r.error);check(h.error);return {personas:(r.data??[]).map(x=>({id:x.id,email:x.email,nombre:x.nombre,role:x.rol,estado:x.user_id?'Activo':'Disponible',fecha_alta:x.creado_at})),invitaciones:[],historial:h.data??[]};},
  async invitarDirectiva(nombre:string,email:string,_socioId:string|null=null){const r=await supabase.rpc('asignar_directiva_email',{p_nombre:nombre,p_email:normalizarEmail(email)});check(r.error);await this.refresh();},
  async quitarDirectiva(id:string,motivo:string){const r=await supabase.rpc('retirar_directiva_email',{p_id:id,p_motivo:motivo});check(r.error);},
  async gestionSocios(){const r=await supabase.rpc('gestion_socios');check(r.error);return r.data as unknown as {pagos:Pago[];roles:PersonaRol[];passwords:Record<string,boolean>;accesos:Record<string,boolean>};},
  async personasClub(){const r=await supabase.rpc('personas_club');check(r.error);return (r.data??[]) as unknown as Persona[];},
  async gestionarRol(email:string,rol:'directiva'|'negocio',activo:boolean,patrocinador:string|null=null,motivo=''){const r=await supabase.rpc('gestionar_rol_persona',{p_email:normalizarEmail(email),p_rol:rol,p_activo:activo,...(patrocinador?{p_patrocinador:patrocinador}:{}),p_motivo:motivo});check(r.error);await this.refresh();},
  async registrarPago(id:string,pago:PagoInput){const r=await supabase.rpc('registrar_pago_socio',{p_socio:id,p_pago:pagoSchema.parse(pago)});check(r.error);await this.refresh();},
  async editarSocio(id:string,input:{nombre:string;email:string;telefono:string;numeroSocio:number}){const r=await supabase.rpc('editar_socio_ficha',{p_id:id,p_nombre:input.nombre,p_email:normalizarEmail(input.email),p_telefono:input.telefono.replace(/\D/g,''),p_numero:input.numeroSocio});check(r.error);await this.refresh();},
  async reactivar(id:string){const r=await supabase.from('socios').update({estado:'activa',fecha_baja:null,motivo_baja:null}).eq('id',id).select('id');check(r.error);if(!r.data?.length)throw new Error('No autorizado');await this.refresh();},
  async emailNegocio(id:string,email:string){const r=await supabase.rpc('asignar_negocio_email',{p_id:id,p_email:normalizarEmail(email)});check(r.error);await this.refresh();},
  async elegirRol(id:string){const chosen=roles.find(r=>r.id===id);if(!chosen)throw new Error('Rol no autorizado');const r=await supabase.rpc('elegir_vista',{p_role:id});check(r.error);selectedRole=id;role=chosen.rol;linkedSocio=chosen.socio_id;sessionState=role==='socia'?'ok':null;window.localStorage.setItem('rul-last-email-role',id);await this.refresh();},
  async albumes(){return (await getDriveGallery()).albumes;},
  async guardarPartido(input:{id?:string;jornada:number;rival:string;fechaHora:string;esLocal:boolean;lugar:string;competicion:string;driveUrl:string;horaConfirmada?:boolean}){
    const folder=folderIdFromUrl(input.driveUrl);if(input.driveUrl.trim()&&!folder)throw new Error('Pega un enlace válido de carpeta de Google Drive.');
    const row={fecha_confirmada:true,hora_confirmada:input.horaConfirmada??true,jornada:input.jornada,rival:input.rival.trim(),fecha_hora:input.fechaHora,es_local:input.esLocal,pabellon:input.lugar.trim(),competicion:input.competicion,drive_folder_id:folder};
    const r=input.id?await supabase.from('partidos').update(row).eq('id',input.id).select('id').single():await supabase.from('partidos').insert(row).select('id').single();check(r.error);await this.refresh();
  },
  async guardarResultado(id:string,favor:number,contra:number,posicion:number|null){const r=await supabase.rpc('guardar_resultado_partido',{p_id:id,p_favor:favor,p_contra:contra,...(posicion===null?{}:{p_posicion:posicion})});check(r.error);await this.refresh();},
  async jugadores(){const r=await supabase.from('jugadores').select('id,nombre,apodo,dorsal,activo').order('dorsal');check(r.error);return (r.data??[]).map(j=>({id:j.id,nombre:j.nombre,apodo:j.apodo,dorsal:j.dorsal,activo:j.activo})) as Jugador[];},
  async crearJugador(input:{nombre:string;apodo:string;dorsal:number|null}){const r=await supabase.from('jugadores').insert({nombre:input.nombre.trim(),apodo:input.apodo.trim(),dorsal:input.dorsal});check(r.error);},
  async subirPiezaResultado(partidoId:string,file:File){if(!['image/jpeg','image/png'].includes(file.type))throw new Error('Sube una imagen JPG o PNG.');const path=`${partidoId}/${Date.now()}.${file.type==='image/png'?'png':'jpg'}`;const up=await supabase.storage.from('piezas-resultado').upload(path,file,{contentType:file.type});check(up.error);const r=await supabase.from('partidos').update({imagen_resultado_url:path}).eq('id',partidoId);check(r.error);return path;},
  async convocatoria(partidoId:string){const r=await supabase.from('convocatorias').select('jugadores,imagen_url,publicada').eq('partido_id',partidoId).maybeSingle();check(r.error);if(!r.data?.publicada)return null;const js=await this.jugadores();const jugadores=r.data.jugadores.map(id=>js.find(j=>j.id===id)).filter((j):j is Jugador=>!!j).map(j=>({id:j.id,apodo:j.apodo,dorsal:j.dorsal}));let imagenUrl:string|null=null;if(r.data.imagen_url){const u=await supabase.storage.from('piezas-convocatoria').createSignedUrl(r.data.imagen_url,3600);imagenUrl=u.data?.signedUrl??null;}return {jugadores,imagenUrl};},
  async convocatoriaGestion(partidoId:string){const r=await supabase.from('convocatorias').select('jugadores,imagen_url,publicada').eq('partido_id',partidoId).maybeSingle();check(r.error);return r.data?{jugadores:r.data.jugadores,imagenPath:r.data.imagen_url,publicada:r.data.publicada}:{jugadores:[] as string[],imagenPath:null as string|null,publicada:false};},
  async subirPiezaConvocatoria(partidoId:string,file:File){if(!['image/jpeg','image/png'].includes(file.type))throw new Error('Sube una imagen JPG o PNG.');const path=`${partidoId}/${Date.now()}.${file.type==='image/png'?'png':'jpg'}`;const up=await supabase.storage.from('piezas-convocatoria').upload(path,file,{contentType:file.type});check(up.error);return path;},
  async guardarConvocatoria(partidoId:string,input:{jugadores:string[];imagenPath:string|null;publicada:boolean}){const r=await supabase.from('convocatorias').upsert({partido_id:partidoId,jugadores:input.jugadores,imagen_url:input.imagenPath,publicada:input.publicada});check(r.error);},
  async estadisticasPartido(partidoId:string){const r=await supabase.from('estadisticas_partido').select('jugador_id,goles,asistencias,amarillas,rojas').eq('partido_id',partidoId);check(r.error);return (r.data??[]).map(e=>({jugadorId:e.jugador_id,goles:e.goles,asistencias:e.asistencias,amarillas:e.amarillas,rojas:e.rojas})) as EstadisticaJugador[];},
  async guardarEstadisticas(partidoId:string,filas:EstadisticaJugador[]){const r=await supabase.rpc('guardar_estadisticas',{p_partido:partidoId,p_filas:filas as unknown as never});check(r.error);},
  async maximosGoleadores(){const r=await supabase.from('maximos_goleadores').select('*');check(r.error);return (r.data??[]).map(m=>({jugadorId:m.jugador_id!,apodo:m.apodo!,dorsal:m.dorsal,goles:m.goles??0,asistencias:m.asistencias??0}));},
  async guardarCarpetaPartido(id:string,enlace:string){const folder=folderIdFromUrl(enlace);if(enlace.trim()&&!folder)throw new Error('Pega un enlace válido de carpeta de Google Drive.');const r=await supabase.from('partidos').update({drive_folder_id:folder}).eq('id',id);check(r.error);await this.refresh();},
  async init() {
    acceso={tiene_password:false,debe_cambiar_password:false,ha_accedido:false};
    role=null;
    negocioPrueba=null;
    await this.cargarAjustes();
    const { data } = await supabase.auth.getUser(); userId = data.user?.id ?? null;
    if (!userId) { db = emptyDB(); role = null;roles=[];selectedRole=null; linkedSocio = null; reads = []; sessionState=null;visitNames={};notify(); return; }
    await this.cargarAcceso();
    const rr=await supabase.rpc('enlazar_roles_email');check(rr.error);roles=(rr.data??[]) as unknown as EmailRole[];
    const selected=initialRole(roles,selectedRole??window.localStorage.getItem('rul-last-email-role'));
    selectedRole=selected?.id??null;role=selected?.rol??null;linkedSocio=selected?.socio_id??null;
    if(selected){const r=await supabase.rpc('elegir_vista',{p_role:selected.id});check(r.error);}
    sessionState=role==='socia'?'ok':null;
    if(this.esSuper()){const exit=await supabase.rpc('salir_negocio_prueba');check(exit.error);await this.cargarAjustes();}
    await this.refresh();
    if (!channel) {
      channel = supabase.channel(`club-${crypto.randomUUID()}`).on('postgres_changes', { event: '*', schema: 'public' }, () => { void this.refresh().catch(() => toast.error('No se pudieron actualizar los datos.')); }).subscribe();
    }
  },
  async refresh() {
    if (!userId || !role) { db = emptyDB(); notify(); return; }
    const [socios, pats, ventajas, visitas, partidos, avisos, leidos, stats, tabla] = await Promise.all([
      allRows((a,b) => supabase.from('socios').select('*').order('numero_socio').range(a,b)),
      allRows((a,b) => supabase.from('patrocinadores').select('id,nombre,categoria,logo_url,direccion,activo,importe_patrocinio,fecha_baja,motivo_baja,email_acceso').order('fecha_alta').range(a,b)),
      allRows((a,b) => supabase.from('ventajas').select('*').order('id').range(a,b)),
      role === 'socia' ? Promise.resolve([]) : allRows((a,b) => {
        const q=supabase.from('visitas').select('*').order('fecha_hora');
        return (role==='negocio'?q.gte('fecha_hora',new Date(Date.now()-86400000).toISOString()):q).range(a,b);
      }),
      allRows((a,b) => supabase.from('partidos').select('*').order('fecha_hora',{ascending:false}).range(a,b)),
      allRows((a,b) => supabase.from('avisos').select('*').order('publicado_at',{ascending:false}).range(a,b)),
      allRows((a,b) => supabase.from('avisos_leidos').select('aviso_id').eq('user_id',userId ?? '').order('aviso_id').range(a,b)),
      supabase.from('estadisticas_liga').select('*').single(),
      supabase.from('clasificacion_club').select('jornada,posicion').order('actualizado_at',{ascending:false}).limit(1).maybeSingle(),
    ]);
    check(stats.error);check(tabla.error);
    liga={pj:stats.data?.pj??0,g:stats.data?.g??0,e:stats.data?.e??0,p:stats.data?.p??0,puntos:stats.data?.puntos??0,goles_favor:stats.data?.goles_favor??0,goles_contra:stats.data?.goles_contra??0,racha:stats.data?.racha??[]};clasificacion=tabla.data;
    db = { socios: socios.map(socioFrom), patrocinadores: pats.map(p => ({ id:p.id,nombre:p.nombre,categoria:p.categoria,logoUrl:p.logo_url,emailAcceso:p.email_acceso??'',direccion:p.direccion,activo:p.activo,importePatrocinio:Number(p.importe_patrocinio),fechaBaja:p.fecha_baja,motivoBaja:p.motivo_baja })),
      ventajas: ventajas.map(v => ({id:v.id,patrocinadorId:v.patrocinador_id,titulo:textoMiembros(v.titulo),descripcion:textoMiembros(v.descripcion),condiciones:textoMiembros(v.condiciones),activa:v.activa,fechaInicio:v.fecha_inicio,fechaFin:v.fecha_fin,...(v.destacado ? {destacado:v.destacado}:{}),...(v.tarifas ? {tarifas:v.tarifas as unknown as NonNullable<Ventaja['tarifas']>}: {})})),
      visitas: visitas.map(v => ({id:v.id,esPrueba:v.es_prueba,socioId:v.socio_id ?? undefined,patrocinadorId:v.patrocinador_id,ventajaId:v.ventaja_id ?? undefined,fechaHora:v.fecha_hora,origen:v.origen === 'sin_carnet' ? 'sin_carne' : v.origen as Visita['origen'],tipoCliente:v.tipo_cliente as Visita['tipoCliente'],repiteViaClub:v.repite_via_club,verificada:v.verificada,anulada:v.anulada,numeroSocio:socios.find(s=>s.id===v.socio_id)?.numero_socio})),
      partidos: partidos.map(p=>({id:p.id,horaConfirmada:p.hora_confirmada,fechaConfirmada:p.fecha_confirmada,jornada:p.jornada,rival:p.rival,fechaHora:p.fecha_hora ?? '',lugar:p.pabellon,esLocal:p.es_local,competicion:p.competicion ?? undefined,golesLocal:p.es_local ? p.goles_favor : p.goles_contra,golesVisitante:p.es_local ? p.goles_contra : p.goles_favor,jugado:p.jugado,driveFolderId:p.drive_folder_id})),
      avisos:avisos.map(a=>({id:a.id,titulo:textoMiembros(a.titulo),texto:textoMiembros(a.texto),fecha:a.publicado_at,tipo:a.tipo as Aviso['tipo'],para:a.destinatarios as NonNullable<Aviso['para']>})),canjes:[],socioActualId:linkedSocio };
    if(role==='socia'){const status=await supabase.rpc('estado_sesion_socia');sessionState=status.data as typeof sessionState;}
    if(role==='negocio'){const names=await supabase.rpc('visit_names_today');visitNames=(names.data??{}) as unknown as typeof visitNames;}
    roles=roles.map(r=>({...r,numero_socio:db.socios.find(s=>s.id===r.socio_id)?.numeroSocio??r.numero_socio}));
    reads = leidos.map(l=>l.aviso_id); notify();
  },
  async crearSocio(nombre:string,telefono:string,email:string,pago:PagoInput,numeroSocio?:number){const r=await supabase.rpc('alta_socio_con_pago',{p_datos:{nombre,email:normalizarEmail(email),...(numeroSocio===undefined?{}:{numero_socio:numeroSocio}),telefono:telefono.replace(/\D/g,'')},p_pago:pagoSchema.parse(pago)});check(r.error);await this.refresh();const s=db.socios.find(s=>s.id===r.data);if(!s)throw new Error('No se pudo leer la ficha');return s;},
  async desactivar(id: string, fecha: string, motivo: string) { const r=await supabase.from('socios').update({estado:'desactivada',fecha_baja:fecha,motivo_baja:motivo}).eq('id',id);check(r.error);await this.refresh(); },
  async bajaPatrocinador(id:string,fecha:string,motivo:string,detalle:string) { const r=await supabase.from('patrocinadores').update({activo:false,fecha_baja:fecha,motivo_baja:motivo,detalle_baja:detalle}).eq('id',id);check(r.error);await this.refresh(); },
  dispositivoId() { let d=window.localStorage.getItem('rul-device-id'); if(!d){d=crypto.randomUUID();window.localStorage.setItem('rul-device-id',d);} return d; },
  sesion(): {socio:Socio;estado:'ok'|'movido'|'desactivada'} | null {const s=db.socios.find(s=>s.id===linkedSocio);return s?{socio:s,estado:s.estado==='activa'?'ok':'desactivada'}:null;},
  async cerrarSesion(){ loginPassword='';acceso={tiene_password:false,debe_cambiar_password:false,ha_accedido:false};if(channel){await supabase.removeChannel(channel);channel=null;} db=emptyDB();reads=[];roles=[];selectedRole=null;settings={...defaultSettings,email_club:''};role=null;userId=null;linkedSocio=null;sessionState=null;visitNames={};notify();const r=await supabase.auth.signOut();check(r.error); },
  async marcarApertura(_id:string){const r=await supabase.rpc('marcar_apertura');check(r.error);},
  async crearPatrocinador(p:Omit<Patrocinador,'id'|'activo'>,v:{titulo:string;descripcion:string;condiciones:string}):Promise<Patrocinador|'pin_usado'> {const r=await supabase.rpc('crear_negocio_email',{p_nombre:p.nombre,p_categoria:p.categoria,p_direccion:p.direccion,p_logo:p.logoUrl,p_email:normalizarEmail(p.emailAcceso??''),p_titulo:v.titulo,p_descripcion:v.descripcion,p_condiciones:v.condiciones,p_importe:p.importePatrocinio??0});check(r.error);await this.refresh();const pat=db.patrocinadores.find(x=>x.id===r.data);if(!pat)throw new Error('No se pudo leer el patrocinador.');return pat;},
  negocioSesion(){const id=negocioPrueba??roles.find(r=>r.id===selectedRole)?.patrocinador_id;return role==='negocio'||negocioPrueba?db.patrocinadores.find(p=>p.id===id)??null:null;},
  abrirNegocio(_id:string){},
  cerrarNegocio(){return this.cerrarSesion();},
  async socioPorNumero(n:number){const r=await supabase.rpc('identificar_socio',{p_numero:n});check(r.error);if(!r.data)return null;const s=r.data as unknown as {id:string;nombre:string;numeroSocio:number;repite:boolean;yaHoy:boolean};return {...s,telefono:'',temporada:'2026/27',estado:'activa' as const,fechaAlta:'',consentimientoRGPD:{aceptado:false,fecha:null},mayorDeEdad:true,tokenInvitacion:'',fechaActivacion:null,dispositivoId:null,cambioDispositivo:false};},
  async registrarVisita(input:{patrocinadorId:string;socio:Socio|null;origen:Visita['origen'];tipoCliente:Visita['tipoCliente'];gasto?:string}):Promise<Visita|'duplicada'>{
    if(negocioPrueba){const r=await supabase.rpc('guardar_visita_prueba',{p_negocio:input.patrocinadorId,...(input.socio?{p_socio:input.socio.id}:{}),p_origen:input.origen==='sin_carne'?'sin_carnet':input.origen,p_tipo:input.tipoCliente,...(input.gasto?{p_gasto:input.gasto}:{})});if(r.error?.code==='23505')return 'duplicada';check(r.error);await this.refresh();const v=db.visitas.find(v=>v.id===r.data);if(!v)throw new Error('No se pudo leer la visita.');return v;}
    const r=await supabase.from('visitas').insert({patrocinador_id:input.patrocinadorId,socio_id:input.socio?.id ?? null,origen:input.origen==='sin_carne'?'sin_carnet':input.origen,tipo_cliente:input.tipoCliente,tramo_gasto:input.gasto||null}).select().single();if(r.error?.code==='23505')return 'duplicada';check(r.error);await this.refresh();const v=db.visitas.find(v=>v.id===r.data?.id);if(!v)throw new Error('No se pudo leer la visita.');return v;},
  async anularVisita(id:string){if(negocioPrueba){const r=await supabase.rpc('anular_visita_prueba',{p_id:id});check(r.error);await this.refresh();return;}const r=await supabase.from('visitas').update({anulada:true}).eq('id',id).select('id');check(r.error);if(!r.data?.length)throw new Error('Solo puedes anular visitas de los últimos 10 minutos.');await this.refresh();},
  async crearAviso(a:{titulo:string;texto:string;tipo:Aviso['tipo'];para:NonNullable<Aviso['para']>}){const r=await supabase.from('avisos').insert({titulo:a.titulo,texto:a.texto,tipo:a.tipo,destinatarios:a.para});check(r.error);await this.refresh();},
  async borrarAviso(id:string){const r=await supabase.from('avisos').delete().eq('id',id);check(r.error);await this.refresh();},
  avisosLeidos:()=>reads,
  avisosPara(quien:'socias'|'negocios'){return db.avisos.filter(a=>!a.para||a.para==='todos'||a.para===quien);},
  async marcarAvisosLeidos(quien:'socias'|'negocios'){if(!userId)return;const rows=this.avisosPara(quien).filter(a=>!reads.includes(a.id)).map(a=>({aviso_id:a.id,user_id:userId ?? '',socio_id:linkedSocio}));if(!rows.length)return;const r=await supabase.from('avisos_leidos').insert(rows);if(r.error?.code!=='23505')check(r.error);await this.refresh();},
  async statsPatrocinador(id:string,rango:Rango,incluirPrueba=false){const r=await supabase.rpc(incluirPrueba?'stats_negocio_prueba':'stats_patrocinador',{p_patrocinador_id:id,p_periodo:rango==='90'?'90d':rango});check(r.error);return r.data as unknown as ClubStats;},
  async statsClub(rango:Rango){const r=await supabase.rpc('stats_club',{p_periodo:rango==='90'?'90d':rango});check(r.error);return r.data as unknown as ClubSummary;},
};
export function useClubData(){useSyncExternalStore(dataService.subscribe,dataService.snapshot,()=>0);return db;}
export function runAction(fn:()=>Promise<unknown>){void fn().catch(e=>toast.error(e instanceof Error?e.message:'No se pudo completar la operación.'));}
