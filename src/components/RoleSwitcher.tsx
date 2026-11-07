import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Role = "socia" | "negocio" | "directiva";

const ROLES: { id: Role; label: string }[] = [
  { id: "socia", label: "Socia" },
  { id: "negocio", label: "Negocio" },
  { id: "directiva", label: "Directiva" },
];

export function RoleSwitcher({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative z-30 mx-5 my-3 flex flex-col items-end gap-2">
      {open && (
        <div className="absolute bottom-12 right-0 rounded-lg border border-primary/20 bg-background p-2 shadow-sm">
          <p className="label-club px-2 pb-1 text-muted-foreground">Demo · Ver como</p>
          {ROLES.map((r) => (
            <Button variant="ghost"
              key={r.id}
              onClick={() => {
                onChange(r.id);
                setOpen(false);
              }}
              className={`block min-h-11 w-full rounded-xl px-4 text-left font-bold transition-colors duration-200 ${
                role === r.id ? "bg-primary text-primary-foreground" : "hover:bg-suave"
              }`}
            >
              {r.label}
            </Button>
          ))}
        </div>
      )}
      <Button variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-9 items-center gap-2 text-xs text-muted-foreground hover:bg-primary/10"
        aria-label="Selector de rol de la demo"
      >
        <FlaskConical size={16} strokeWidth={1.75} />
        Demo: {ROLES.find((r) => r.id === role)?.label}
      </Button>
    </div>
  );
}
