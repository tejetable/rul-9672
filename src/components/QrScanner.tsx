import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/** Lector de QR con la cámara (BarcodeDetector del navegador). Devuelve el número de socio. */
export function QrScanner({ onResult, onClose }: { onResult: (n: number) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stop = false;
    const BD = (window as unknown as { BarcodeDetector?: new (o: object) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!BD) {
      setError("Este móvil no puede escanear desde aquí. Escribe el número de socio.");
      return;
    }
    const det = new BD({ formats: ["qr_code"] });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (!video.current) return;
        video.current.srcObject = s;
        void video.current.play();
        const tick = async () => {
          if (stop || !video.current) return;
          try {
            const r = await det.detect(video.current);
            const m = r[0]?.rawValue.match(/^RUL:(\d+)$/);
            if (m) {
              onResult(Number(m[1]));
              return;
            }
          } catch {
            /* frame no listo */
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => setError("No podemos abrir la cámara. Escribe el número de socio."));
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-primary p-6 text-primary-foreground">
      <button onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex size-12 items-center justify-center">
        <X size={28} strokeWidth={1.75} />
      </button>
      {error ? (
        <p className="max-w-xs text-center text-lg font-bold">{error}</p>
      ) : (
        <>
          <video ref={video} playsInline muted className="aspect-square w-full max-w-sm rounded-3xl object-cover" />
          <p className="label-club mt-4">Apunta al QR del carné</p>
        </>
      )}
    </div>
  );
}
