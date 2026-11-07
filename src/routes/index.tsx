import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import escudo from "@/assets/escudo-ru-lucense.png.asset.json";
import { PhotoSlot } from "@/components/PhotoSlot";
import { RoleSwitcher, type Role } from "@/components/RoleSwitcher";
import { dataService } from "@/lib/dataService";

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

function Index() {
  const [role, setRole] = useState<Role>("socia");

  useEffect(() => {
    dataService.get(); // siembra los datos de demostración la primera vez
  }, []);

  return (
    <div className="min-h-screen bg-primary sm:py-6">
      <main className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-[2rem]">
        {role === "socia" && <Bienvenida />}
        {role !== "socia" && <Pendiente role={role} />}
      </main>
      <RoleSwitcher role={role} onChange={setRole} />
    </div>
  );
}

function Bienvenida() {
  return (
    <section className="flex flex-1 flex-col items-center pb-24 text-center">
      <div className="hero-crema flex w-full flex-col items-center rounded-b-[2.5rem] px-6 pb-10 pt-12">
      <img
        src={escudo.url}
        alt="Escudo del Real Unión Lucense F.S."
        width={450}
        height={676}
        className="crest crest-blend animate-rise w-44"
      />
      <h1 className="title-club animate-rise mt-8 text-[2.5rem]" style={{ animationDelay: "120ms" }}>
        Más que un club, un grupo de amigos.
      </h1>
      <span className="gold-rule mt-5" />
      <p className="mt-5 text-muted-foreground">Real Unión Lucense F.S. · Guntín (Lugo)</p>
      </div>
      <div className="flex w-full flex-col px-6">

      <PhotoSlot label="piña del equipo en el pabellón de Guntín" className="mt-8 aspect-[4/3] w-full" />

      <div className="mt-8 flex w-full flex-col gap-3">
        <button className="min-h-12 rounded-2xl bg-primary px-6 text-lg font-black uppercase tracking-wide text-primary-foreground transition-opacity duration-200 hover:opacity-90">
          Únete a la familia
        </button>
        <button className="min-h-12 rounded-2xl border-2 border-primary px-6 font-bold transition-colors duration-200 hover:bg-roto">
          Ya soy socia/o
        </button>
      </div>
      </div>
    </section>
  );
}

function Pendiente({ role }: { role: Role }) {
  return (
    <section className="flex flex-1 flex-col justify-center px-6 pb-24">
      <p className="label-club text-accent">Vista {role === "negocio" ? "Negocio" : "Directiva"}</p>
      <h1 className="title-club mt-2 text-4xl">Estamos montándola.</h1>
      <span className="gold-rule mt-4" />
      <p className="mt-4 text-muted-foreground">Esta parte llega en el siguiente paso.</p>
    </section>
  );
}
