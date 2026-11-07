import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Smartphone } from "lucide-react";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";
import pina from "@/assets/pina-equipo-ru-lucense.jpg.asset.json";
import { RoleSwitcher, type Role } from "@/components/RoleSwitcher";
import { SociaApp } from "@/components/SociaApp";
import { AvisosPanel } from "@/components/Avisos";
import { SociasPanel } from "@/components/SociasPanel";
import { PatrocinadoresPanel } from "@/components/PatrocinadoresPanel";
import { NegocioApp } from "@/components/NegocioApp";
import { dataService } from "@/lib/dataService";
import { waLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "R.U. Lucense · Carné de la afición" },
      { name: "description", content: "Tu carné de socia/o del Real Unión Lucense F.S. y lo que te da ser de los nuestros en Guntín." },
      { property: "og:title", content: "R.U. Lucense · Carné de la afición" },
      { property: "og:description", content: "Más que un club, un grupo de amigos. Tu carné y tus ventajas en el móvil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ROLE_KEY = "rul-demo-role";
type Sesion = ReturnType<typeof dataService.sesion>;

function Index() {
  const [role, setRole] = useState<Role>("socia");
  const [sesion, setSesion] = useState<Sesion>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    dataService.get();
    const r = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (r) setRole(r);
    setSesion(dataService.sesion());
    setReady(true);
  }, []);

  const cambiar = (r: Role) => {
    window.localStorage.setItem(ROLE_KEY, r);
    setRole(r);
    setSesion(dataService.sesion());
  };

  return (
    <AppFrame>
      {ready && role === "socia" && (sesion?.estado === "ok" ? <SociaApp socio={sesion.socio} /> : sesion ? <CarneMovido estado={sesion.estado} /> : <Bienvenida />)}
      {ready && role === "directiva" && <Directiva />}
      {ready && role === "negocio" && <NegocioApp />}
      <RoleSwitcher role={role} onChange={cambiar} />
    </AppFrame>
  );
}

export function AppFrame({ children, crema = false }: { children: React.ReactNode; crema?: boolean }) {
  return (
    <div className="min-h-screen bg-primary sm:py-6">
      <main className={`relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-[2rem] ${crema ? "hero-crema" : "bg-background"}`}>
        {children}
      </main>
    </div>
  );
}

function Bienvenida() {
  const [ayuda, setAyuda] = useState(false);
  const navigate = useNavigate();
  const simular = () => {
    const inv = dataService.get().socios.find((x) => x.estado === "invitada") ?? dataService.crearSocio("Socia Demo", "600000000");
    navigate({ to: "/activar/$token", params: { token: inv.tokenInvitacion } });
  };
  return (
    <section className="hero-crema flex flex-1 flex-col items-center px-6 pb-24 pt-12 text-center">
      <img src={escudo.url} alt="Escudo del Real Unión Lucense F.S." width={450} height={676} className="crest crest-blend animate-rise w-44" />
      <h1 className="title-club animate-rise mt-8 text-[2.5rem]" style={{ animationDelay: "120ms" }}>
        Más que un club, un grupo de amigos.
      </h1>
      <span className="gold-rule mt-5" />
      <p className="mt-5 text-muted-foreground">Real Unión Lucense F.S. · Guntín (Lugo)</p>

      <img
        src={pina.url}
        alt="La piña del equipo en el pabellón de Guntín"
        width={1920}
        height={1280}
        className="animate-rise mt-8 aspect-[3/2] w-full rounded-2xl object-cover"
        style={{ animationDelay: "240ms" }}
      />

      <div className="mt-8 flex w-full flex-col gap-3">
        <a
          href={waLink("¡Hola! Quiero hacerme socia/o del R.U. Lucense.")}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 text-lg font-black uppercase tracking-wide text-primary-foreground transition-opacity duration-200 hover:opacity-90"
        >
          Únete a la familia
        </a>
        <button onClick={() => setAyuda((a) => !a)} className="min-h-12 rounded-2xl btn-suave px-6 font-bold transition-colors duration-200">
          Ya soy socia/o
        </button>
        {ayuda && (
          <div className="animate-rise rounded-2xl bg-suave p-4 text-left">
            <p>Busca en tu WhatsApp el enlace que te mandó el club. Si no lo encuentras, pídenos uno nuevo.</p>
            <div className="mt-3 flex gap-2">
              <a href={waLink("¡Hola! Necesito un enlace nuevo para activar mi carné del R.U. Lucense.")} target="_blank" rel="noreferrer" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-2 text-sm font-bold text-primary-foreground">
                <MessageCircle size={18} strokeWidth={1.75} /> Pedir enlace
              </a>
              <button onClick={simular} className="min-h-11 flex-1 rounded-xl border-2 border-dashed border-primary px-2 text-sm font-bold">
                Simular enlace
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CarneMovido({ estado }: { estado: "movido" | "desactivada" }) {
  return (
    <section className="flex flex-1 flex-col justify-center px-6 pb-24">
      <Smartphone size={32} strokeWidth={1.75} />
      <h1 className="title-club mt-4 text-3xl">{estado === "movido" ? "Tu carné está en otro móvil" : "Tu carné está desactivado"}</h1>
      <span className="gold-rule mt-4" />
      <p className="mt-4">
        {estado === "movido" ? "Tu carné se ha abierto en otro móvil. Si no has sido tú, habla con el club." : "Habla con el club para volver a activarlo."}
      </p>
      <a href={waLink("¡Hola! Tengo un problema con mi carné del R.U. Lucense.")} target="_blank" rel="noreferrer" className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground">
        <MessageCircle size={18} strokeWidth={1.75} /> Hablar con el club
      </a>
    </section>
  );
}

function Directiva() {
  const [t, setT] = useState<"socias" | "patro" | "avisos">("socias");
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-5 mt-5 grid grid-cols-3 rounded-2xl bg-suave p-1">
        {([["socias", "Socias/os"], ["patro", "Patrocinadores"], ["avisos", "Avisos"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => setT(id)} className={`min-h-11 rounded-xl text-sm font-bold ${t === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</button>
        ))}
      </div>
      {t === "socias" ? <SociasPanel /> : t === "patro" ? <PatrocinadoresPanel /> : <AvisosPanel />}
    </div>
  );
}
