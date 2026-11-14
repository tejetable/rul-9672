import { MessageCircle } from "lucide-react";
import {dataService,useClubData} from "@/lib/dataService";

export function ContactarClub({ texto }: { texto: string }) {
  useClubData();const url=dataService.whatsapp(texto);if(!url)return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="club-button mx-4 mt-3 flex items-center justify-center gap-2 bg-surface text-primary transition-transform active:scale-[.98]"
    >
      <MessageCircle size={18} strokeWidth={1.75} /> Contactar con el club
    </a>
  );
}
