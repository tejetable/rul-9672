import {PasswordMenuItem} from './PasswordManagement';
import {VerComoItems} from "@/components/VerComo";
import { Instagram, LogOut, MessageCircle, MoreHorizontal, Twitch } from "lucide-react";
import { BotonDos, iconosVista } from "@/components/SwitchVista";
import { guardarVista, useVista } from "@/lib/vista";
import { escudo } from "@/assets/recursos";
import { AvisosCampana } from "@/components/AvisosCampana";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { dataService, runAction } from "@/lib/dataService";


export function SociaCabecera() {
  const vista=useVista();
  const member=dataService.sesion()?.socio;
  const contact=dataService.whatsapp(`¡Hola! Soy ${member?.nombre??""}, soci@ nº ${member?.numeroSocio??""}.`);
  return <header className="socia-header sticky top-0 z-30 grid h-14 w-full shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border bg-background px-4">
    <span className="flex items-center"><img src={escudo.url} alt="Escudo del R.U. Lucense" className="socia-crest" /></span>
    <BotonDos on={vista==="noche"} onChange={(v)=>guardarVista(v?"noche":"dia")} label="Vista Strong (noche de partido)" offLabel="Light" onLabel="Strong" offIcon={iconosVista.off} onIcon={iconosVista.on} stars />
    <span className="flex items-center justify-end"><AvisosCampana quien="socias" />
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Más opciones" title="Más opciones" className="size-11 shrink-0"><MoreHorizontal size={22} strokeWidth={1.75} /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={12} className="w-56 max-w-[calc(100vw-24px)] rounded-tile bg-background">
        <VerComoItems/>
        {contact&&<DropdownMenuItem asChild><a href={contact} target="_blank" rel="noopener noreferrer" className="min-h-11"><MessageCircle strokeWidth={1.75} />Contactar con el club</a></DropdownMenuItem>}
        <DropdownMenuItem asChild><a href="https://www.instagram.com/realunionlucense/" target="_blank" rel="noopener noreferrer" className="min-h-11"><Instagram strokeWidth={1.75} />Instagram</a></DropdownMenuItem>
        <DropdownMenuItem asChild><a href="https://www.twitch.tv/adrifdez_10" target="_blank" rel="noopener noreferrer" className="min-h-11"><Twitch strokeWidth={1.75} />Twitch</a></DropdownMenuItem>
        <DropdownMenuSeparator /><PasswordMenuItem/>
        <DropdownMenuItem onSelect={() => { runAction(async () => { await dataService.cerrarSesion(); window.location.reload(); }); }} className="min-h-11"><LogOut strokeWidth={1.75} />Salir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu></span>
  </header>;
}