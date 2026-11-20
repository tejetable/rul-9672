import { fechaHumana } from "@/lib/fechas";
import {ListCard,ListRow} from './ListRow';
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dataService, type Aviso, useClubData, runAction } from "@/lib/dataService";

export function AvisosCampana({ quien }: { quien: "socias" | "negocios" }) {
  const db = useClubData();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [leidos, setLeidos] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [selected,setSelected]=useState<Aviso|null>(null);
  useEffect(() => {
    setAvisos(dataService.avisosPara(quien));
    setLeidos(dataService.avisosLeidos());
  }, [quien, db]);
  const cambiar = (value: boolean) => {
    setOpen(value);
    setSelected(null);
    if (!value) return;
    const actuales = dataService.avisosPara(quien);
    setAvisos(actuales);
    runAction(async () => { await dataService.marcarAvisosLeidos(quien); setLeidos(dataService.avisosLeidos()); });
    setLeidos(dataService.avisosLeidos());
  };
  return (
    <Dialog.Root open={open} onOpenChange={cambiar}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir avisos" title="Avisos" className="relative size-11 shrink-0">
          <Bell size={20} strokeWidth={1.75} />
          {avisos.some((a) => !leidos.includes(a.id)) && <span aria-label="Avisos sin leer" className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-primary/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content aria-describedby={undefined} className="club-bottom-sheet fixed inset-x-0 z-50 mx-auto w-full max-w-[430px] rounded-t-panel border-t border-border bg-background animate-sheet">
          <div className="club-sheet-scroll">
          <div className="club-sheet-header grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <Dialog.Title className="club-section-title">Avisos</Dialog.Title>
            <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Cerrar avisos"><X size={20} strokeWidth={1.75} /></Button></Dialog.Close>
          </div>
          <div className="px-4 pb-4">
          {avisos.length === 0 && <p className="mt-6 text-muted-foreground">Todavía no hay avisos.</p>}
          {selected?<div className="mt-4 space-y-3"><Button variant="link" onClick={()=>setSelected(null)}>Volver a avisos</Button><h2 className="font-bold">{selected.titulo}</h2><p className="whitespace-pre-line">{selected.texto}</p></div>:<ListCard label="Avisos" className="mt-4">{avisos.map(a=><ListRow key={a.id} leading={<Bell/>} name={a.titulo} subtitle={a.texto} date={fechaHumana(a.fecha)} dateTime={a.fecha} onClick={()=>setSelected(a)}/>)}</ListCard>}
          </div></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}