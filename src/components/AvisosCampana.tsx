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
  useEffect(() => {
    setAvisos(dataService.avisosPara(quien));
    setLeidos(dataService.avisosLeidos());
  }, [quien, db]);
  const cambiar = (value: boolean) => {
    setOpen(value);
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
        <Dialog.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[80dvh] w-full max-w-[430px] overflow-y-auto rounded-t-lg border-t border-border bg-background px-4 pb-8 pt-6 animate-sheet">
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="club-section-title">Avisos</Dialog.Title>
            <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Cerrar avisos"><X size={20} strokeWidth={1.75} /></Button></Dialog.Close>
          </div>
          {avisos.length === 0 && <p className="mt-6 text-muted-foreground">Todavía no hay avisos.</p>}
          <ul className="mt-4 space-y-3">
            {avisos.map((a) => <li key={a.id} className="rounded-lg bg-suave p-4">
              <p className="text-xs text-muted-foreground">{new Date(a.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</p>
              <p className="mt-1 font-black">{a.titulo}</p>
              <p className="mt-1 whitespace-pre-line">{a.texto}</p>
            </li>)}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}