import {ForcedPassword} from '@/components/PasswordManagement';
import {GoogleAcceso} from '@/components/GoogleAcceso';
import {ClubAdmin,ClubAdminMenu} from "@/components/ClubAdmin";
import {DEMO_MODE} from "@/lib/club-settings";
import {EmailAcceso} from "@/components/EmailAcceso";
import {UNETE_DESTINO,UNETE_MENSAJE} from '@/lib/socios-management';
import {VerComo} from "@/components/VerComo";
import {AccesoVisual} from "@/components/AccesoVisual";
import {EleccionRol} from "@/components/EleccionRol";
import { ClubCabecera } from "@/components/ClubCabecera";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Smartphone } from "lucide-react";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";

import { RoleSwitcher, type Role } from "@/components/RoleSwitcher";
import { SociaApp } from "@/components/SociaApp";
import { ClubPanel } from "@/components/ClubPanel";
import { SociasPanel } from "@/components/SociasPanel";
import { PatrocinadoresPanel } from "@/components/PatrocinadoresPanel";
import { NegocioApp } from "@/components/NegocioApp";
import { dataService, useClubData, runAction } from "@/lib/dataService";


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
function Index() {
 useClubData();const [ready,setReady]=useState(false),[wait,setWait]=useState(true),[page,setPage]=useState<'welcome'|'login'>('welcome');
 const [demoRole,setDemoRole]=useState<Role>('socia');
 useEffect(()=>{void dataService.init().catch(e=>runAction(async()=>{throw e;})).finally(()=>setReady(true));const saved=window.localStorage.getItem(ROLE_KEY) as Role|null;if(saved)setDemoRole(saved);const t=setTimeout(()=>setWait(false),1500);return()=>clearTimeout(t);},[]);
 const role=dataService.rol(),sesion=dataService.sesion(),roles=dataService.roles();
 const unknown=dataService.autenticado()&&roles.length===0;
 const content=!ready||wait?<Cargando/>:dataService.autenticado()?dataService.acceso().debe_cambiar_password?<ForcedPassword/>:unknown?<section className="space-y-5 px-4 py-10"><ClubCabecera etiqueta="Acceso"/><h1 className="club-title">Este email no está en el club todavía.</h1><UneteFamilia/><Button variant="ghost" onClick={()=>runAction(()=>dataService.cerrarSesion())}>Salir</Button></section>:!role?<EleccionRol/>:role==='directiva'||role==='super_admin'?<Directiva/>:role==='negocio'?<NegocioApp/>:sesion?.estado==='ok'?<SociaApp socio={sesion.socio}/>:<CarneMovido estado="desactivada"/>:<Bienvenida onEnter={()=>setPage('login')}/>;
 return <AppFrame>{page==='login'&&!dataService.autenticado()?<EmailAcceso onBack={()=>setPage('welcome')} onDone={()=>setPage('welcome')}/>:content}{ready&&!wait&&DEMO_MODE&&<RoleSwitcher role={demoRole} onChange={r=>{window.localStorage.setItem(ROLE_KEY,r);setDemoRole(r);}}/>}</AppFrame>;
}

function Cargando() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <img src={escudo.url} alt="Escudo del Real Unión Lucense F.S." width={450} height={676} className="crest crest-blend animate-rise w-36" />
      <p className="label-club animate-rise mt-6" style={{ animationDelay: "200ms" }}>R.U. Lucense</p>
    </section>
  );
}

export function AppFrame({ children, crema = false }: { children: React.ReactNode; crema?: boolean }) {
  return (
    <div className="min-h-screen bg-primary sm:py-6">
      <main className={`relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col sm:min-h-[calc(100vh-3rem)] sm:overflow-clip sm:rounded-[2rem] ${crema ? "hero-crema" : "bg-background"}`}>
        {children}
      </main>
    </div>
  );
}

function UneteFamilia(){const href=UNETE_DESTINO==='whatsapp'?dataService.whatsapp(UNETE_MENSAJE):null;return <div className="text-center text-body-sm">¿Aún no eres socio/a? <Button asChild variant="link" className="h-auto p-0 text-body-sm underline"><a href={href??undefined} aria-disabled={!href} onClick={e=>{if(!href){e.preventDefault();runAction(async()=>{throw new Error('El WhatsApp del club está pendiente de configurar.');});}}} target="_blank" rel="noreferrer">¡Únete a la familia!</a></Button></div>;}
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

function Directiva() {
  const [page,setPage]=useState<"equipo"|"ajustes"|null>(null);
  const [t, setT] = useState<"socias" | "patro" | "club">("socias");
  if(page&&dataService.esSuper())return <ClubAdmin page={page} onClose={()=>setPage(null)}/>;
  return (
    <div className="flex flex-1 flex-col">
      <ClubCabecera><VerComo/><ClubAdminMenu onOpen={setPage}/></ClubCabecera>
      {!dataService.ajustes().whatsapp_club&&<p className="mx-4 mt-3 text-body-sm">Falta el WhatsApp del club en Ajustes</p>}

      <div className="club-tabs mx-4 mt-4 grid-cols-3">
        {([["socias", "Socias/os"], ["patro", "Patrocinadores"], ["club", "Club"]] as const).map(([id, l]) => (
          <Button variant="ghost" key={id} onClick={() => setT(id)} className={`h-auto min-h-11 rounded-control text-label font-bold ${t === id ? "bg-primary text-primary-foreground" : ""}`}>{l}</Button>
        ))}
      </div>
      {t === "socias" ? <SociasPanel /> : t === "patro" ? <PatrocinadoresPanel /> : <ClubPanel />}

    </div>
  );
}
