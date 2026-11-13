import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/whatsapp";

export function ContactarClub({ texto }: { texto: string }) {
  return (
    <a
      href={waLink(texto)}
      target="_blank"
      rel="noopener noreferrer"
      className="club-button mx-5 mt-3 flex items-center justify-center gap-2 bg-surface text-primary transition-transform active:scale-[.98]"
    >
      <MessageCircle size={18} strokeWidth={1.75} /> Contactar con el club
    </a>
  );
}
