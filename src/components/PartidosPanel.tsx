import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {dataService,useClubData,runAction} from '@/lib/dataService';
export function PartidosPanel(){
  const db=useClubData();const [edit,setEdit]=useState<string|null>(null);const [url,setUrl]=useState('');
  return <section className="mt-8 border-t border-border pt-5"><h2 className="club-section-title">Partidos · Fotos</h2>{db.partidos.map(p=><div key={p.id} className="mt-3 rounded-panel bg-surface p-4"><p className="font-bold">vs. {p.rival}</p>{edit===p.id ? <><label className="mt-3 block text-body-sm">Enlace de la carpeta de fotos (Drive)<input value={url} onChange={e=>setUrl(e.target.value)} className="club-input mt-1 w-full" placeholder="https://drive.google.com/drive/folders/…"/></label><Button className="mt-3" onClick={()=>runAction(async()=>{await dataService.guardarCarpetaPartido(p.id,url);setEdit(null);})}>Guardar</Button><Button variant="ghost" onClick={()=>setEdit(null)}>Cancelar</Button></> : <Button variant="ghost" onClick={()=>{setEdit(p.id);setUrl(p.driveFolderId?`https://drive.google.com/drive/folders/${p.driveFolderId}`:'');}}>Editar partido</Button>}</div>)}</section>;
}