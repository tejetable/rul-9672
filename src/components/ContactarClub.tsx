import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/whatsapp";

export function ContactarClub({ texto }: { texto: string }) {
  return (
    <a
      href={waLink(texto)}
      target="_blank"
      rel="noopener noreferrer"
      className="mx-5 mt-3 flex min-h-11 items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-background text-sm font-bold transition-transform duration-200 active:scale-[.98]"
    >
      <MessageCircle size={18} strokeWidth={1.75} /> Contactar con el club
    </a>
  );
}
