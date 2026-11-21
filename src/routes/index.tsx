import {ForcedPassword} from '@/components/PasswordManagement';
import {GoogleAcceso} from '@/components/GoogleAcceso';
import {ClubAdmin,ClubAdminMenu} from "@/components/ClubAdmin";
import {DEMO_MODE} from "@/lib/club-settings";
import {EmailAcceso} from "@/components/EmailAcceso";
import {UNETE_DESTINO} from '@/lib/socios-management';
import {VerComo} from "@/components/VerComo";
import {AccesoVisual} from "@/components/AccesoVisual";
import {EleccionRol} from "@/components/EleccionRol";
import { ClubCabecera } from "@/components/ClubCabecera";
import { Button } from "@/components/ui/button";
import {z} from "zod";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Smartphone } from "lucide-react";
import { escudo } from "@/assets/recursos";
import { escudo as escudoTransparente } from "@/assets/recursos";

import { RoleSwitcher, type Role } from "@/components/RoleSwitcher";
import { SociaApp } from "@/components/SociaApp";
import { ClubPanel } from "@/components/ClubPanel";
import { PartidosPanel } from "@/components/PartidosPanel";
import { AvisosPanel } from "@/components/Avisos";
import { PlantillaPanel } from "@/components/PlantillaPanel";
import { useEscritorio } from "@/hooks/use-escritorio";
import { QRCodeSVG } from "qrcode.react";
import { Bell, CalendarDays, Shirt, Store, Users } from "lucide-react";
import { SociasPanel } from "@/components/SociasPanel";
import { PatrocinadoresPanel } from "@/components/PatrocinadoresPanel";
import { NegocioApp } from "@/components/NegocioApp";
import { dataService, useClubData, runAction } from "@/lib/dataService";


export const Route = createFileRoute("/")({
  validateSearch:(value:Record<string,unknown>)=>z.object({socio:z.string().uuid().optional().catch(undefined)}).parse(value),
  head: () => ({
    meta: [
      { title: "R.U. Lucense · Carnet de la afición" },
      { name: "description", content: "Tu carnet de soci@ del Real Unión Lucense F.S. y lo que te da ser de los nuestros en Guntín." },
      { property: "og:title", content: "R.U. Lucense · Carnet de la afición" },
      { property: "og:description", content: "Más que un club, un grupo de amigos. Tu carnet y tus ventajas en el móvil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ROLE_KEY = "rul-demo-role";
function Index() {
 useClubData();const [ready,setReady]=useState(false),[wait,setWait]=useState(true),[page,setPage]=useState<'welcome'|'login'>('welcome');
 const [demoRole,setDemoRole]=useState<Role>('socia');
 useEffect(()=>{void dataService.init().catch(e=>runAction(async()=>{throw e;})).finally(()=>setReady(true));const saved=window.localStorage.getItem(ROLE_KEY) as Role|null;if(saved)setDemoRole(saved);const t=setTimeout(()=>setWait(false),1500);return()=>clearTimeout(t);},[]);
 const role=dataService.rol(),sesion=dataService.sesion(),roles=dataService.roles();
 const unknown=dataService.autenticado()&&roles.length===0;
 const content=!ready||wait?<Cargando/>:dataService.autenticado()?dataService.acceso().debe_cambiar_password?<ForcedPassword/>:unknown?<section className="space-y-5 px-4 py-10"><ClubCabecera etiqueta="Acceso"/><h1 className="club-title">Este email no está en el club todavía.</h1><UneteFamilia/><Button variant="ghost" onClick={()=>runAction(()=>dataService.cerrarSesion())}>Salir</Button></section>:!role?<EleccionRol/>:role==='directiva'||role==='super_admin'?<Directiva/>:role==='negocio'?<NegocioApp/>:sesion?.estado==='ok'?<SociaApp socio={sesion.socio}/>:<CarneMovido estado="desactivada"/>:<Bienvenida onEnter={()=>setPage('login')}/>;
 const gestion=dataService.autenticado()&&(role==='directiva'||role==='super_admin');
 return <AppFrame ancho={gestion}>{page==='login'&&!dataService.autenticado()?<EmailAcceso onBack={()=>setPage('welcome')} onDone={()=>setPage('welcome')}/>:content}{ready&&!wait&&DEMO_MODE&&<RoleSwitcher role={demoRole} onChange={r=>{window.localStorage.setItem(ROLE_KEY,r);setDemoRole(r);}}/>}</AppFrame>;
}

function Cargando() {
  return (
    <section className="club-loading flex flex-1 flex-col items-center justify-center px-4 text-center">
      <img src={escudoTransparente.url} alt="Escudo del Real Unión Lucense F.S." width={340} height={456} className="crest animate-rise w-36" />
      <span className="club-loading-rule animate-rise" style={{ animationDelay: "120ms" }} aria-hidden="true" />
      <p className="label-club animate-rise mt-4" style={{ animationDelay: "200ms" }}>R.U. Lucense</p>
    </section>
  );
}

export function AppFrame({ children, crema = false, ancho = false }: { children: React.ReactNode; crema?: boolean; ancho?: boolean }) {
  // ancho: gestión del club, que en escritorio ocupa toda la pantalla. El resto (soci@, negocio, acceso) es una app de móvil:
  // en escritorio se queda en su columna, con la marca del club al lado.
  return (
    <div className={`club-full-height bg-primary sm:py-6 ${ancho ? "club-frame-ancho" : "club-frame-movil"}`}>
      {!ancho && <MarcaEscritorio />}
      <main className={`relative mx-auto flex club-full-height w-full max-w-[430px] flex-col sm:club-full-height sm:overflow-clip sm:rounded-[2rem] ${crema ? "hero-crema" : "bg-background"}`}>
        {children}
      </main>
    </div>
  );
}

function MarcaEscritorio() {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => setUrl(window.location.origin), []);
  return <aside className="club-marca-escritorio" aria-label="Real Unión Lucense F.S.">
    <img src={escudoTransparente.url} alt="Escudo del Real Unión Lucense F.S." className="club-marca-escudo" />
    <p className="club-marca-label">Real Unión Lucense F.S. · Guntín</p>
    <p className="club-marca-lema">Más que un club, un grupo de amigos.</p>
    <span className="club-marca-filete" aria-hidden="true" />
    <div className="club-marca-movil">
      {url && <QRCodeSVG value={url} size={112} marginSize={2} bgColor="#FFFFFF" fgColor="#0D4631" aria-label="Código QR para abrir la app en el móvil" />}
      <div><p className="font-black">Llévala en el móvil</p><p className="text-body-sm text-muted-foreground">Escanea el código y añádela a tu pantalla de inicio. Para enseñar el carnet en un negocio, usa el móvil.</p></div>
    </div>
  </aside>;
}

function UneteFamilia(){return <div className="text-center text-body-sm">¿Aún no eres soci@? <Button asChild variant="link" className="h-auto p-0 text-body-sm underline"><Link to={UNETE_DESTINO}>¡Únete a la familia!</Link></Button></div>;}
function Bienvenida({onEnter}:{onEnter:()=>void}) {
 return <AccesoVisual><GoogleAcceso/><Button variant="outline" onClick={onEnter} className="access-button access-button-secondary">ENTRAR CON EMAIL</Button><UneteFamilia/><p className="access-season">Temporada {dataService.ajustes().temporada_actual}</p></AccesoVisual>;
}

function CarneMovido({ estado }: { estado: "movido" | "desactivada" }) {
  return (
    <section className="flex flex-1 flex-col justify-center px-4 pb-24">
      <Smartphone size={32} strokeWidth={1.75} />
      <h1 className="title-club mt-4 text-heading">{estado === "movido" ? "Tu carnet está en otro móvil" : "Tu carnet está desactivado"}</h1>
            <p className="mt-4">
        {estado === "movido" ? "Tu carnet se ha abierto en otro móvil. Si no has sido tú, habla con el club." : "Habla con el club para volver a activarlo."}
      </p>
      {dataService.ajustes().whatsapp_club&&<a href={dataService.whatsapp("¡Hola! Tengo un problema con mi carnet del R.U. Lucense.")??undefined} target="_blank" rel="noreferrer" className="mt-6 flex h-auto min-h-12 items-center justify-center gap-2 rounded-panel bg-primary font-bold text-primary-foreground">
        <MessageCircle size={18} strokeWidth={1.75} /> Hablar con el club
      </a>}
    </section>
  );
}

type SeccionGestion = "socias" | "patro" | "partidos" | "avisos" | "plantilla";
const SECCIONES_ESCRITORIO = [["socias", "Soci@s", Users], ["patro", "Patrocinadores", Store], ["partidos", "Partidos", CalendarDays], ["avisos", "Avisos", Bell], ["plantilla", "Plantilla", Shirt]] as const;

function Directiva() {
  const escritorio = useEscritorio();
  const [page,setPage]=useState<"equipo"|"ajustes"|null>(null);
  const [t, setT] = useState<"socias" | "patro" | "club">("socias");
  if(page&&dataService.esSuper())return <ClubAdmin page={page} onClose={()=>setPage(null)}/>;
  if(escritorio)return <DirectivaEscritorio onOpen={setPage}/>;
  return (
    <div className="flex flex-1 flex-col">
      <ClubCabecera><VerComo/><ClubAdminMenu onOpen={setPage}/></ClubCabecera>
      {!dataService.ajustes().whatsapp_club&&<p className="mx-4 mt-3 text-body-sm">Falta el WhatsApp del club en Ajustes</p>}

      <div className="club-tabs mx-4 mt-4 grid-cols-3">
        {([["socias", "Soci@s"], ["patro", "Patrocinadores"], ["club", "Club"]] as const).map(([id, l]) => (
          <Button variant="ghost" aria-label={id === "socias" ? "Socios o socias" : l} key={id} onClick={() => setT(id)} className={`h-auto min-h-11 rounded-control text-label font-bold ${t === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</Button>
        ))}
      </div>
      {t === "socias" ? <SociasPanel /> : t === "patro" ? <PatrocinadoresPanel /> : <ClubPanel />}

    </div>
  );
}

function DirectivaEscritorio({ onOpen }: { onOpen: (p: "equipo" | "ajustes") => void }) {
  const [s, setS] = useState<SeccionGestion>("socias");
  return (
    <div className="dir-escritorio">
      <nav className="dir-nav" aria-label="Gestión del club">
        <div className="dir-nav-club"><img src={escudoTransparente.url} alt="Escudo del R.U. Lucense" className="size-10 object-contain" /><div><p className="text-body-sm font-black">R.U. Lucense</p><p className="text-label uppercase text-muted-foreground">Club</p></div></div>
        {SECCIONES_ESCRITORIO.map(([id, l, Icono]) => <button key={id} type="button" className="dir-nav-item" aria-current={s === id ? "page" : undefined} onClick={() => setS(id)}><Icono size={20} strokeWidth={1.75} aria-hidden="true" />{l}</button>)}
        <div className="flex-1" />
        <div className="dir-nav-extra"><VerComo /><ClubAdminMenu onOpen={onOpen} /></div>
      </nav>
      <section className="dir-main" aria-label={SECCIONES_ESCRITORIO.find(x => x[0] === s)?.[1]}>
        {!dataService.ajustes().whatsapp_club && <p className="mx-4 mb-3 text-body-sm">Falta el WhatsApp del club en Ajustes</p>}
        {s === "socias" ? <SociasPanel /> : s === "patro" ? <PatrocinadoresPanel /> : s === "partidos" ? <PartidosPanel /> : s === "avisos" ? <AvisosPanel /> : <PlantillaPanel />}
      </section>
    </div>
  );
}
