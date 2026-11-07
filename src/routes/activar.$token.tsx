import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";
import { Carne } from "@/components/Carne";
import { dataService, type Socio } from "@/lib/dataService";
import { waLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/activar/$token")({
  head: () => ({
    meta: [
      { title: "Activa tu carné · R.U. Lucense" },
      { name: "description", content: "Activa tu carné de socia/o del Real Unión Lucense F.S." },
      { property: "og:title", content: "Activa tu carné · R.U. Lucense" },
      { property: "og:description", content: "Tu carné de socia/o del R.U. Lucense, listo en tu móvil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Activar,
});

function Activar() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [socio, setSocio] = useState<Socio | null | undefined>(undefined);
  const [mayor, setMayor] = useState(false);
  const [rgpd, setRgpd] = useState(false);
  const [hecho, setHecho] = useState(false);

  useEffect(() => {
    dataService.get();
    setSocio(dataService.porToken(token));
  }, [token]);

  const activar = () => {
    if (!mayor || !rgpd) return;
    dataService.activar(token);
    window.localStorage.setItem("rul-demo-role", "socia");
    setHecho(true);
    setTimeout(() => navigate({ to: "/" }), 1800);
  };

  return (
    <div className="min-h-screen bg-primary sm:py-6">
      <main className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-[2rem]">
        <header className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground">
          <div className="w-9 rounded-lg bg-crema p-0.5">
            <img src={escudo.url} alt="Escudo del R.U. Lucense" width={450} height={676} className="crest crest-blend w-full" />
          </div>
          <span className="label-club">R.U. Lucense</span>
        </header>

        {socio === null && (
          <section className="flex flex-1 flex-col justify-center px-6 pb-16">
            <h1 className="title-club text-3xl">Este enlace ya no vale.</h1>
            <span className="gold-rule mt-4" />
            <p className="mt-4">Pídele uno nuevo al club.</p>
            <a href={waLink("¡Hola! Mi enlace para activar el carné del R.U. Lucense ya no vale. ¿Me mandáis uno nuevo?")} target="_blank" rel="noreferrer" className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground">
              <MessageCircle size={18} strokeWidth={1.75} /> Escribir al club
            </a>
          </section>
        )}

        {socio && hecho && (
          <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="animate-rise w-full">
              <Carne nombre={socio.nombre} numero={socio.numeroSocio} temporada={socio.temporada} />
            </div>
            <p className="title-club animate-rise mt-8 flex items-center gap-2 text-3xl" style={{ animationDelay: "300ms" }}>
              <Check size={28} strokeWidth={2.5} className="text-accent" /> Ya eres de los nuestros.
            </p>
          </section>
        )}

        {socio && !hecho && (
          <section className="flex flex-1 flex-col px-6 pb-10 pt-8">
            <h1 className="title-club text-3xl">Hola, {socio.nombre}. Este es tu carné.</h1>
            <div className="mt-6">
              <Carne nombre={socio.nombre} numero={socio.numeroSocio} temporada={socio.temporada} />
            </div>

            <label className="mt-8 flex min-h-11 cursor-pointer items-start gap-3">
              <input type="checkbox" checked={mayor} onChange={(e) => setMayor(e.target.checked)} className="mt-1 size-5 accent-primary" />
              <span className="font-bold">Tengo 18 años o más</span>
            </label>
            {!mayor && <p className="ml-8 text-sm text-muted-foreground">Si no, pídele a tu madre, padre o tutor que hable con el club.</p>}

            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={rgpd} onChange={(e) => setRgpd(e.target.checked)} className="mt-1 size-5 shrink-0 accent-primary" />
              <span>
                Guardamos tu nombre y tu teléfono para darte el carné y contar cuántas veces usas tus ventajas. No vendemos tus datos a nadie. Los negocios solo ven tu nombre al validar.{" "}
                <Link to="/privacidad" className="font-bold underline">Política de privacidad</Link>
              </span>
            </label>

            <button
              onClick={activar}
              disabled={!mayor || !rgpd}
              className="mt-8 min-h-12 rounded-2xl bg-primary text-lg font-black uppercase text-primary-foreground transition-opacity duration-200 disabled:opacity-40"
            >
              Activar mi carné
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
