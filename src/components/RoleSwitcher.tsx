import { useState } from "react";
import { FlaskConical } from "lucide-react";

export type Role = "socia" | "negocio" | "directiva";

const ROLES: { id: Role; label: string }[] = [
  { id: "socia", label: "Socia" },
  { id: "negocio", label: "Negocio" },
  { id: "directiva", label: "Directiva" },
];

export function RoleSwitcher({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="rounded-2xl border-2 border-dashed border-gold bg-background p-2 shadow-sm">
          <p className="label-club px-2 pb-1 text-muted-foreground">Demo · Ver como</p>
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onChange(r.id);
                setOpen(false);
              }}
              className={`block min-h-11 w-full rounded-xl px-4 text-left font-bold transition-colors duration-200 ${
                role === r.id ? "bg-primary text-primary-foreground" : "hover:bg-roto"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="label-club flex min-h-11 items-center gap-2 rounded-full border-2 border-dashed border-gold bg-background px-4 shadow-sm"
        aria-label="Selector de rol de la demo"
      >
        <FlaskConical size={16} strokeWidth={1.75} />
        Demo: {ROLES.find((r) => r.id === role)?.label}
      </button>
    </div>
  );
}
