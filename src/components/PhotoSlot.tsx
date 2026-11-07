import { Camera } from "lucide-react";

export function PhotoSlot({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`photo-slot flex flex-col items-center justify-center gap-2 p-6 text-center ${className}`}>
      <Camera size={24} strokeWidth={1.75} />
      <span className="label-club">FOTO: {label}</span>
    </div>
  );
}
