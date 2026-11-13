import {describe,it,expect} from 'vitest';
import {albumDate,buildAlbum,dailyHighlights,folderIdFromUrl,linkMatch,type DriveFile} from './drive-gallery';
const folder:DriveFile={id:'folder1234567890',name:'vs. Friol B',createdTime:'2026-11-10T10:00:00Z'};
const files:DriveFile[]=[{id:'one',name:'photo',mimeType:'image/jpeg',createdTime:'2026-11-10T11:00:00Z',imageMediaMetadata:{time:'2026:11:07 19:00:00'}},{id:'two',name:'photo',mimeType:'image/jpeg',createdTime:'2026-11-09T11:00:00Z'}];
describe('Reglas de álbumes Drive',()=>{
  it('prioriza la captura EXIF más antigua',()=>expect(albumDate(folder,files).slice(0,10)).toBe('2026-11-07'));
  it('usa creación de fotos sin EXIF y de carpeta vacía',()=>{expect(albumDate(folder,[files[1] as DriveFile])).toBe('2026-11-09T11:00:00Z');expect(albumDate(folder,[])).toBe(folder.createdTime);});
  it('enlaza Friol B con P.M. Friol en la misma fecha',()=>{const p={id:'match',rival:'P.M. Friol',fechaHora:'2026-11-07T19:00:00Z',lugar:'Guntín',esLocal:true,jugado:true,golesLocal:18,golesVisitante:0};expect(buildAlbum(folder,files,[p]).resultado).toBe('18-0');expect(linkMatch('explicit','Other','2020-01-01',[{...p,driveFolderId:'explicit'}])?.id).toBe('match');});
  it('selecciona 5 fotos diarias estables de los 3 álbumes más recientes',()=>{const albums=Array.from({length:4},(_,i)=>buildAlbum({...folder,id:`a${i}`},Array.from({length:5},(_,j)=>({...files[0] as DriveFile,id:`${i}-${j}`})),[]));const a=dailyHighlights(albums,'2026-11-13');expect(a).toHaveLength(5);expect(a).toEqual(dailyHighlights(albums,'2026-11-13'));expect(a.some(x=>x.albumId==='a3')).toBe(false);});
  it('extrae el ID de enlaces Drive y rechaza otro dominio',()=>{expect(folderIdFromUrl('https://drive.google.com/drive/folders/abc1234567890123?usp=sharing')).toBe('abc1234567890123');expect(folderIdFromUrl('https://example.com/folder')).toBeNull();});
});