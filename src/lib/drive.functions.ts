import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { buildAlbum, highlightPool, type DriveFile, type DriveAlbum } from './drive-gallery';
import type { Partido } from './dataService';
type Galeria = {albumes:DriveAlbum[];destacadas:ReturnType<typeof highlightPool>;error:boolean};
const CACHE_ID='drive-gallery-pool-v2', CACHE_MS=600000;
// Caché en memoria del Worker: sirve aunque no haya SUPABASE_SERVICE_ROLE_KEY (fuera de Lovable).
let memoria:{at:number;data:Galeria}|null=null;
async function leerCache():Promise<Galeria|null>{
  if(memoria&&Date.now()-memoria.at<CACHE_MS)return memoria.data;
  try{const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const c=await supabaseAdmin.from('gallery_cache').select('payload,updated_at').eq('id',CACHE_ID).maybeSingle();
    if(c.data&&Date.now()-new Date(c.data.updated_at).getTime()<CACHE_MS){const data=c.data.payload as unknown as Galeria;memoria={at:new Date(c.data.updated_at).getTime(),data};return data;}}catch{/* sin clave de servicio: solo memoria */}
  return null;
}
async function guardarCache(data:Galeria){
  memoria={at:Date.now(),data};
  try{const {supabaseAdmin}=await import('@/integrations/supabase/client.server');await supabaseAdmin.from('gallery_cache').upsert({id:CACHE_ID,payload:JSON.parse(JSON.stringify(data)),updated_at:new Date().toISOString()});}catch{/* sin clave de servicio: solo memoria */}
}

export const getDriveGallery = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
  const empty={albumes:[],destacadas:[],error:true};
  const key=process.env['GOOGLE_API_KEY'];if(!key)return empty;
  const allowed=await context.supabase.rpc('has_club_role',{r:'directiva'});
  const member=await context.supabase.rpc('mi_socio');
  if(!allowed.data && !member.data)return empty;
  const cached=await leerCache();if(cached)return cached;
  try {
    const list=async(q:string):Promise<DriveFile[]>=>{
      const rows:DriveFile[]=[];let token='';
      do {
        const params=new URLSearchParams({q,fields:'nextPageToken,files(id,name,mimeType,createdTime,imageMediaMetadata(time,width,height))',pageSize:'1000',key});
        if(token)params.set('pageToken',token);
        const response=await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
        if(!response.ok){console.error('Drive gallery request failed',response.status);throw new Error('Drive unavailable');}
        const body=await response.json() as {files?:DriveFile[];nextPageToken?:string};rows.push(...(body.files??[]));token=body.nextPageToken??'';
      } while(token);
      return rows;
    };
    const folders=await list("'1w3jhKPkxaOnj1kN6jZFQVV2RPHD9k4kI' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false");
    const matches=await context.supabase.from('partidos').select('*');
    const partidos:Partido[]=(matches.data??[]).map(p=>({id:p.id,rival:p.rival,fechaHora:p.fecha_hora??'',lugar:p.lugar,esLocal:p.es_local,jugado:p.jugado,golesLocal:p.es_local?p.goles_favor:p.goles_contra,golesVisitante:p.es_local?p.goles_contra:p.goles_favor,driveFolderId:p.drive_folder_id}));
    const albumes=[];
    for(const folder of folders){if(!/^[\w-]+$/.test(folder.id))continue;albumes.push(buildAlbum(folder,await list(`'${folder.id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed=false`),partidos));}
    albumes.sort((a,b)=>b.fecha.localeCompare(a.fecha));
    const result:Galeria={albumes,destacadas:highlightPool(albumes),error:false};
    await guardarCache(result);
    return result;
  } catch {return empty;}
});