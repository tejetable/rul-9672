import type { AlbumGaleria, FotoGaleria } from './galeria';
import type { Partido } from './dataService';
export interface DriveFile { id:string;name:string;createdTime:string;mimeType?:string;imageMediaMetadata?:{time?:string;width?:number;height?:number} }
export interface DriveAlbum extends AlbumGaleria { rival:string; partidoId?:string;resultado?:string }
export const captureDate=(f:DriveFile)=> {
  const raw=f.imageMediaMetadata?.time;
  const normalized=raw?.replace(/^(\d{4}):(\d{2}):(\d{2})/,'$1-$2-$3').replace(' ','T');
  const d=normalized ? new Date(normalized) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : f.createdTime;
};
export function albumDate(folder:DriveFile,files:DriveFile[]) {
  const images=files.filter(f=>f.mimeType?.startsWith('image/'));
  const exif=images.filter(f=>!!f.imageMediaMetadata?.time && captureDate(f)!==f.createdTime).map(captureDate);
  return (exif.length?exif:images.map(f=>f.createdTime)).sort()[0] ?? folder.createdTime;
}
const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.]/g,'').trim();
export function linkMatch(folderId:string,rival:string,fecha:string,partidos:Partido[]) {
  const explicit=partidos.find(p=>p.driveFolderId===folderId);
  if(explicit)return explicit;
  const words=(s:string)=>normal(s).split(/\s+/).filter(w=>w.length>2);
  return partidos.find(p=>p.jugado && Math.abs(new Date(p.fechaHora).getTime()-new Date(fecha).getTime())<=86400000 && (normal(p.rival).includes(normal(rival)) || normal(rival).includes(normal(p.rival)) || words(rival).some(w=>words(p.rival).includes(w))));
}
export function buildAlbum(folder:DriveFile,files:DriveFile[],partidos:Partido[]):DriveAlbum {
  const rival=folder.name.replace(/^vs\.?\s*/i,'').trim();
  const date=albumDate(folder,files); const partido=linkMatch(folder.id,rival,date,partidos);
  const resultado=partido?.jugado && partido.golesLocal!==null && partido.golesVisitante!==null ? `${partido.esLocal?partido.golesLocal:partido.golesVisitante}-${partido.esLocal?partido.golesVisitante:partido.golesLocal}` : undefined;
  const fecha=date.slice(0,10);const day=new Date(date).toLocaleDateString('es-ES',{timeZone:'Europe/Madrid',day:'2-digit',month:'short'}).replaceAll('.','').toUpperCase();
  return {id:folder.id,rival,titulo:`vs. ${rival}`,fecha,detalle:[resultado,day].filter(Boolean).join(' · '),...(partido?{partidoId:partido.id}:{}),...(resultado?{resultado}:{}),fotos:files.filter(f=>f.mimeType?.startsWith('image/')||f.mimeType?.startsWith('video/')).sort((a,b)=>captureDate(a).localeCompare(captureDate(b))).map(f=>({id:f.id,src:`https://drive.google.com/thumbnail?id=${encodeURIComponent(f.id)}&sz=w1600`,thumb:`https://drive.google.com/thumbnail?id=${encodeURIComponent(f.id)}&sz=w600`,pos:'50% 50%',...(f.mimeType?.startsWith('video/')?{video:true}: {})}))};
}
export function dailyHighlights(albumes:DriveAlbum[],day:string):{albumId:string;foto:FotoGaleria}[] {
  let seed=Array.from(day).reduce((s,c)=>(s*31+c.charCodeAt(0))>>>0,0);
  const all=albumes.slice(0,3).flatMap(a=>a.fotos.filter(f=>!f.video).map(foto=>({albumId:a.id,foto})));
  for(let i=all.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);const a=all[i],b=all[j];if(a&&b){all[i]=b;all[j]=a;}}
  return all.slice(0,5);
}
export function folderIdFromUrl(value:string):string|null {
  if(!value.trim())return null;
  const match=value.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([\w-]+)/);
  return match?.[1] ?? (/^[\w-]{15,100}$/.test(value.trim())?value.trim():null);
}