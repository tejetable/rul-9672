import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GaleriaFoto } from "@/components/GaleriaFoto";
import { useDriveGallery } from '@/hooks/use-drive-gallery';
import {randomHighlights,type HighlightPhoto} from '@/lib/drive-gallery';
import { fechaHumana } from '@/lib/fechas';

async function preloadPhotos(photos:HighlightPhoto[]):Promise<HighlightPhoto[]> {
  const loaded=await Promise.all(photos.map(async item=>{
    const image=new Image();image.src=item.foto.thumb;
    try {await image.decode();return item;}catch{return null;}
  }));
  return loaded.filter((item):item is HighlightPhoto=>item!==null);
}

export function Galeria() {
  const {data,isPending}=useDriveGallery();
  const albumes=data?.albumes??[];
  const [photos,setPhotos]=useState<HighlightPhoto[]>([]);
  const [incoming,setIncoming]=useState<HighlightPhoto[]|null>(null);
  const [busy,setBusy]=useState(false);
  const [initialLoading,setInitialLoading]=useState(true);
  const alive=useRef(true);
  const lock=useRef(false);
  const generation=useRef(0);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;};},[]);
  useEffect(()=>{
    if(!data)return;
    const token=++generation.current;
    const reciente=[...data.albumes].sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
    const primeras=reciente?reciente.fotos.filter(f=>!f.video).slice(0,5).map(foto=>({foto,albumId:reciente.id})):[];
    void preloadPhotos(primeras.length>=5?primeras:randomHighlights(data.destacadas)).then(ready=>{
      if(alive.current&&generation.current===token){setPhotos(ready);setInitialLoading(false);}
    });
  },[data]);
  const refresh=async()=>{
    if(!data||lock.current)return;
    lock.current=true;setBusy(true);
    const token=++generation.current;
    try {
      const ready=await preloadPhotos(randomHighlights(data.destacadas,photos));
      if(!alive.current||token!==generation.current||ready.length!==Math.min(5,data.destacadas.length))return;
      setIncoming(ready);
      await new Promise(resolve=>setTimeout(resolve,250));
      if(alive.current&&token===generation.current){setPhotos(ready);setIncoming(null);}
    }finally{lock.current=false;if(alive.current)setBusy(false);}
  };
  const recienteAlbum=[...albumes].sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
  const ultimo=recienteAlbum?[recienteAlbum.titulo,recienteAlbum.resultado,recienteAlbum.fecha?fechaHumana(recienteAlbum.fecha):''].filter(Boolean).join(' · '):'';
  const mosaic=(selection:HighlightPhoto[],outgoing=false)=><div className={`gallery-mosaic gallery-highlight-layer ${outgoing?'is-outgoing':''}`}>{selection.map(({foto,albumId},index)=>{
    const album=albumes.find(a=>a.id===albumId);if(!album)return null;
    return <Button asChild key={foto.id} variant="ghost" className={`gallery-tile ${index===0?'gallery-hero':'gallery-square'}`}><Link to="/galeria/$folderId" params={{folderId:albumId}} search={{foto:foto.id}} aria-label={`Ver foto: ${album.titulo}`} tabIndex={outgoing?-1:undefined}><GaleriaFoto foto={foto} alt={album.titulo} preloaded/></Link></Button>;
  })}</div>;
  return <section className="mt-6" aria-label="Fotos del equipo">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="min-w-0"><h2 className="club-section-title mb-0">Último partido</h2>{ultimo&&<p className="truncate text-body-sm font-bold">{ultimo}</p>}</div>
      <div className="flex items-center gap-2">
        {(data?.destacadas.length??0)>5&&<Button variant="ghost" aria-label="Ver otras fotos" title="Ver otras fotos" disabled={busy} onClick={()=>void refresh()} className={`gallery-refresh ${busy?'is-refreshing':''}`}><RefreshCw aria-hidden="true"/></Button>}
        <Button asChild variant="link" className="h-11 px-0 text-accent font-bold"><Link to="/galeria" search={{ partido: "todos" }}>Ver todas <ArrowRight strokeWidth={1.75} /></Link></Button>
      </div>
    </div>
    {isPending|| (!!data?.destacadas.length&&initialLoading) ? <div className="gallery-image is-loading aspect-[16/10]"/> : !photos.length ? <p className="py-6 text-body-sm text-muted-foreground">Todavía no hay fotos disponibles.</p> : <div className={`gallery-highlight-stack ${incoming?'is-crossfading':''}`} aria-busy={busy}>
      {mosaic(photos,!!incoming)}
      {incoming&&mosaic(incoming)}
    </div>}
  </section>;
}
