import type { ReactNode } from "react";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";

export function ClubCabecera({ titulo = "R.U. LUCENSE", etiqueta, children }: { titulo?: string; etiqueta?: string; children?: ReactNode }) {
  return <header className="club-header">
    <img src={escudo.url} alt="Escudo del R.U. Lucense" className="size-7 shrink-0 object-contain" />
    <div className="min-w-0 flex-1">
      {etiqueta && <p className="text-label uppercase text-muted-foreground">{etiqueta}</p>}
      <p className="truncate text-body-sm font-black">{titulo}</p>
    </div>
    {children}
  </header>;
}