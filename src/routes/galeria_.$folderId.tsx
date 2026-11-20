import {createFileRoute,Link,useNavigate} from '@tanstack/react-router';
import {useEffect,useState} from 'react';
import {ArrowLeft,ChevronLeft,ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import { claseVista, useVista } from "@/lib/vista";
import {GaleriaFoto} from '@/components/GaleriaFoto';
import {GaleriaVisor} from '@/components/GaleriaVisor';
import {useDriveGallery} from '@/hooks/use-drive-gallery';
export const Route=createFileRoute('/galeria_/$folderId')({
  validateSearch:(s:Record<string,unknown>)=>({foto:typeof s['foto']==='string'?s['foto']:''}),
  head:()=>({meta:[{title:'Álbum del partido · R.U. Lucense'},{name:'description',content:'Fotos y vídeos de nuestros partidos, desde el álbum del club.'},{property:'og:title',content:'Álbum del partido · R.U. Lucense'},{property:'og:description',content:'Las fotos y vídeos de la familia del Real Unión Lucense.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component:AlbumPage,
});
function AlbumPage(){
  const vista = useVista();
  const {folderId}=Route.useParams();const {foto}=Route.useSearch();const navigate=useNavigate();const {data,isPending}=useDriveGallery();
  const albums=data?.albumes??[];const current=albums.findIndex(a=>a.id===folderId);const album=albums[current];
  const [visor,setVisor]=useState<number|null>(null);const [start,setStart]=useState<number|null>(null);
  useEffect(()=>{if(foto&&album){const i=album.fotos.findIndex(f=>f.id===foto);if(i>=0)setVisor(i);}else setVisor(null);},[folderId,foto,album]);
  const prev=albums[current-1],next=albums[current+1];
  const go=(id:string)=>navigate({to:'/galeria/$folderId',params:{folderId:id},search:{foto:''}});
  return <div className="min-h-dvh bg-primary"><main className={`${claseVista(vista)} mx-auto min-h-dvh max-w-[430px] bg-background pb-8`}>
    <header className="sticky top-0 z-20 bg-background px-4 py-2" onTouchStart={e=>setStart(e.touches[0]?.clientX??null)} onTouchEnd={e=>{const end=e.changedTouches[0]?.clientX;if(start!==null&&end!==undefined){if(end-start>70&&prev)void go(prev.id);if(start-end>70&&next)void go(next.id);}setStart(null);}}>
      <div className="flex min-h-14 items-center gap-2"><Button asChild variant="ghost" size="icon"><Link to="/galeria" search={{partido:'todos'}} aria-label="Volver a álbumes"><ArrowLeft/></Link></Button><div><h1 className="club-section-title">{album?.titulo??'Fotos'}</h1>{album&&<p className="text-body-sm">{album.detalle} · {album.fotos.length} fotos/vídeos</p>}</div></div>
      <div className="grid grid-cols-2 gap-2"><Button disabled={!prev} variant="ghost" onClick={()=>prev&&go(prev.id)} className="h-auto whitespace-normal text-body-sm"><ChevronLeft/>Anterior {prev?.rival}</Button><Button disabled={!next} variant="ghost" onClick={()=>next&&go(next.id)} className="h-auto whitespace-normal text-body-sm">Siguiente {next?.rival}<ChevronRight/></Button></div>
      <div className="gallery-filters">{albums.map(a=><Button key={a.id} variant="ghost" className={`gallery-filter ${a.id===folderId?'gallery-filter-active':''}`} onClick={()=>go(a.id)}>{a.titulo} · {new Date(`${a.fecha}T12:00:00`).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}</Button>)}</div>
    </header>
    {isPending&&<div className="gallery-image is-loading aspect-square"/>}
    {!isPending&&!album&&<p className="px-4 py-8 text-muted-foreground">No hay fotos disponibles en este álbum.</p>}
    <div className="gallery-complete-grid">{album?.fotos.map((f,i)=><Button key={f.id} variant="ghost" className="gallery-tile gallery-square" aria-label={`Ver foto ${i+1}`} onClick={()=>setVisor(i)}><GaleriaFoto foto={f} alt={album.titulo}/></Button>)}</div>
    {album&&visor!==null&&<GaleriaVisor album={album} inicial={visor} siguiente={next} onClose={()=>{setVisor(null);void navigate({to:'/galeria/$folderId',params:{folderId},search:{foto:''},replace:true});}}/>}
  </main></div>;
}