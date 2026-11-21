import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {PartidosPanel} from './PartidosPanel';
import {AvisosPanel} from './Avisos';
import {PlantillaPanel} from './PlantillaPanel';
export function ClubPanel() {
  const [segmento,setSegmento]=useState<'partidos'|'avisos'|'plantilla'>('partidos');
  return <div><div className="club-tabs mx-4 mt-4 grid-cols-3" aria-label="Gestión del club">{(['partidos','avisos','plantilla'] as const).map(s=><Button key={s} variant="ghost" aria-pressed={segmento===s} onClick={()=>setSegmento(s)}>{s==='partidos'?'Partidos':s==='avisos'?'Avisos':'Plantilla'}</Button>)}</div>{segmento==='partidos'?<PartidosPanel/>:segmento==='avisos'?<AvisosPanel/>:<PlantillaPanel/>}</div>;
}
