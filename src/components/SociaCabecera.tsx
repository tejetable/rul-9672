import { Instagram, LogOut, MessageCircle, MoreHorizontal, Twitch } from "lucide-react";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";
import { AvisosCampana } from "@/components/AvisosCampana";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { dataService, runAction } from "@/lib/dataService";
import { waLink } from "@/lib/whatsapp";

export function SociaCabecera() {
  return <header className="fixed inset-x-0 top-0 z-30 mx-auto flex h-14 w-full max-w-[430px] items-center gap-2 border-b border-border bg-background px-4">
    <img src={escudo.url} alt="Escudo del R.U. Lucense" className="size-7 shrink-0 object-contain" />
    <span className="flex-1 text-sm font-black">R.U. LUCENSE</span>
    <AvisosCampana quien="socias" />
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Más opciones" title="Más opciones" className="size-11 shrink-0"><MoreHorizontal size={22} strokeWidth={1.75} /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background">
        <DropdownMenuItem asChild><a href={waLink("Hola, soy socia/o del R.U. Lucense y quería consultaros algo.")} target="_blank" rel="noopener noreferrer" className="min-h-11"><MessageCircle strokeWidth={1.75} />Contactar con el club</a></DropdownMenuItem>
        <DropdownMenuItem asChild><a href="https://www.instagram.com/realunionlucense/" target="_blank" rel="noopener noreferrer" className="min-h-11"><Instagram strokeWidth={1.75} />Instagram</a></DropdownMenuItem>
        <DropdownMenuItem asChild><a href="https://www.twitch.tv/adrifdez_10" target="_blank" rel="noopener noreferrer" className="min-h-11"><Twitch strokeWidth={1.75} />Twitch</a></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { runAction(async () => { await dataService.cerrarSesion(); window.location.reload(); }); }} className="min-h-11"><LogOut strokeWidth={1.75} />Salir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>;
}