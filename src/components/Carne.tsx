import escudo from "@/assets/escudo-ru-lucense.png.asset.json";

export function Carne({ nombre, numero, temporada = "2026/27" }: { nombre: string; numero: number; temporada?: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl bg-primary p-6 text-center text-primary-foreground">
      <div className="mx-auto w-24 rounded-2xl bg-crema p-2">
        <img src={escudo.url} alt="Escudo del Real Unión Lucense F.S." width={450} height={676} className="crest crest-blend w-full" />
      </div>
      <p className="label-club mt-5 opacity-80">Socia/o de la temporada {temporada}</p>
      <p className="title-club mt-3 text-3xl">{nombre}</p>
      <p className="mt-4 text-5xl font-black text-gold">Nº {String(numero).padStart(3, "0")}</p>
      <p className="label-club mt-4 opacity-80">Real Unión Lucense F.S.</p>
    </div>
  );
}
