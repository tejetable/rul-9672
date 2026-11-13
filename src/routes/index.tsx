import { ClubCabecera } from "@/components/ClubCabecera";
import { Button } from "@/components/ui/button";
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
      { title: "R.U. Lucense · Carnet de la afición" },
      { name: "description", content: "Tu carnet de socia/o del Real Unión Lucense F.S. y lo que te da ser de los nuestros en Guntín." },
      { property: "og:title", content: "R.U. Lucense · Carnet de la afición" },
      { property: "og:description", content: "Más que un club, un grupo de amigos. Tu carnet y tus ventajas en el móvil." },
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
  const [espera, setEspera] = useState(true);

  useEffect(() => {
    dataService.get();
    const r = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (r) setRole(r);
    setSesion(dataService.sesion());
    setReady(true);
    const t = setTimeout(() => setEspera(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const cambiar = (r: Role) => {
    window.localStorage.setItem(ROLE_KEY, r);
    setRole(r);
    setSesion(dataService.sesion());
  };

  const cargando = !ready || espera;
  return (
    <AppFrame crema={cargando}>
      {cargando && <Cargando />}
      {!cargando && role === "socia" && (sesion?.estado === "ok" ? <SociaApp socio={sesion.socio} /> : sesion ? <CarneMovido estado={sesion.estado} /> : <Bienvenida />)}
      {!cargando && role === "directiva" && <Directiva />}
      {!cargando && role === "negocio" && <NegocioApp />}
      {!cargando && <RoleSwitcher role={role} onChange={cambiar} />}
    </AppFrame>
  );
}

function Cargando() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <img src={escudo.url} alt="Escudo del Real Unión Lucense F.S." width={450} height={676} className="crest crest-blend animate-rise w-36" />
      <p className="label-club animate-rise mt-6" style={{ animationDelay: "200ms" }}>R.U. Lucense</p>
    </section>
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
      <h1 className="title-club animate-rise mt-8 text-heading" style={{ animationDelay: "120ms" }}>
        Más que un club, un grupo de amigos.
      </h1>
            <p className="mt-5 text-muted-foreground">Real Unión Lucense F.S. · Guntín (Lugo)</p>

      <img
        src={pina.url}
        alt="La piña del equipo en el pabellón de Guntín"
        width={1920}
        height={1280}
        className="animate-rise mt-8 aspect-[3/2] w-full rounded-panel object-cover"
        style={{ animationDelay: "240ms" }}
      />

      <div className="mt-8 flex w-full flex-col gap-3">
        <a
          href={waLink("¡Hola! Quiero hacerme socia/o del R.U. Lucense.")}
          target="_blank"
          rel="noreferrer"
          className="flex h-auto min-h-12 items-center justify-center rounded-panel bg-primary px-6 text-item font-black uppercase tracking-wide text-primary-foreground transition-opacity duration-200 hover:opacity-90"
        >
          Únete a la familia
        </a>
        <Button variant="ghost" onClick={() => setAyuda((a) => !a)} className="h-auto min-h-12 rounded-panel btn-suave px-6 font-bold transition-colors duration-200">
          Ya soy socia/o
        </Button>
        {ayuda && (
          <div className="animate-rise rounded-panel bg-surface p-4 text-left">
            <p>Busca en tu WhatsApp el enlace que te mandó el club. Si no lo encuentras, pídenos uno nuevo.</p>
            <div className="mt-3 flex gap-2">
              <a href={waLink("¡Hola! Necesito un enlace nuevo para activar mi carnet del R.U. Lucense.")} target="_blank" rel="noreferrer" className="flex h-auto min-h-11 flex-1 items-center justify-center gap-2 rounded-control bg-primary px-2 text-body-sm font-bold text-primary-foreground">
                <MessageCircle size={18} strokeWidth={1.75} /> Pedir enlace
              </a>
              <Button variant="ghost" onClick={simular} className="h-auto min-h-11 flex-1 rounded-control border-2 border-dashed border-primary px-2 text-body-sm font-bold">
                Simular enlace
              </Button>
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
      <h1 className="title-club mt-4 text-heading">{estado === "movido" ? "Tu carnet está en otro móvil" : "Tu carnet está desactivado"}</h1>
            <p className="mt-4">
        {estado === "movido" ? "Tu carnet se ha abierto en otro móvil. Si no has sido tú, habla con el club." : "Habla con el club para volver a activarlo."}
      </p>
      <a href={waLink("¡Hola! Tengo un problema con mi carnet del R.U. Lucense.")} target="_blank" rel="noreferrer" className="mt-6 flex h-auto min-h-12 items-center justify-center gap-2 rounded-panel bg-primary font-bold text-primary-foreground">
        <MessageCircle size={18} strokeWidth={1.75} /> Hablar con el club
      </a>
    </section>
  );
}

function Directiva() {
  const [t, setT] = useState<"socias" | "patro" | "avisos">("socias");
  return (
    <div className="flex flex-1 flex-col">
      <ClubCabecera etiqueta="Directiva" />
      <div className="club-tabs mx-5 mt-4 grid-cols-3">
        {([["socias", "Socias/os"], ["patro", "Patrocinadores"], ["avisos", "Avisos"]] as const).map(([id, l]) => (
          <Button variant="ghost" key={id} onClick={() => setT(id)} className={`h-auto min-h-11 rounded-control text-label font-bold ${t === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</Button>
        ))}
      </div>
      {t === "socias" ? <SociasPanel /> : t === "patro" ? <PatrocinadoresPanel /> : <AvisosPanel />}
    </div>
  );
}
