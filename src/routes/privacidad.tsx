import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad · R.U. Lucense" },
      { name: "description", content: "Qué datos guarda el Real Unión Lucense F.S. en la app de la afición y para qué." },
      { property: "og:title", content: "Política de privacidad · R.U. Lucense" },
      { property: "og:description", content: "Qué datos guardamos y para qué, explicado claro." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidad,
});

function Privacidad() {
  return (
    <div className="club-full-height bg-primary sm:py-6">
      <main className="mx-auto club-full-height w-full max-w-[430px] bg-background px-4 py-8 sm:club-full-height sm:rounded-[2rem]">
        <Button variant="ghost" onClick={() => history.back()} className="label-club h-auto min-h-11">← Volver</Button>
        <h1 className="title-club mt-4 text-heading">Política de privacidad</h1>
                <div className="mt-6 space-y-6">
          <p><b>Qué guardamos:</b> tu nombre, tu teléfono y tu número de socia/o.</p>
          <p><b>Para qué:</b> para darte el carnet y contar cuántas veces usas tus ventajas en los negocios que nos apoyan.</p>
          <p><b>Quién lo ve:</b> el club. Los negocios solo ven tu nombre al validar tu carnet.</p>
          <p><b>Lo que no hacemos:</b> no vendemos tus datos a nadie.</p>
          <p><b>Tus derechos:</b> puedes pedirnos ver, corregir o borrar tus datos cuando quieras. Escríbenos al [contacto del club pendiente].</p>
          <p className="text-body-sm text-muted-foreground">Responsable: Real Unión Lucense F.S. · [datos legales pendientes]</p>
        </div>
      </main>
    </div>
  );
}
