import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {PartidosPanel} from './PartidosPanel';
import {AvisosPanel} from './Avisos';
export function ClubPanel() {
  const [segmento,setSegmento]=useState<'partidos'|'avisos'>('partidos');
  return <div><div className="club-tabs mx-5 mt-4 grid-cols-2" aria-label="Gestión del club">{(['partidos','avisos'] as const).map(s=><Button key={s} variant="ghost" aria-pressed={segmento===s} onClick={()=>setSegmento(s)}>{s==='partidos'?'Partidos':'Avisos'}</Button>)}</div>{segmento==='partidos'?<PartidosPanel/>:<AvisosPanel/>}</div>;
}
