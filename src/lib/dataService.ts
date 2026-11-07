import { repiteViaClub, yaRegistradaHoy, type Visita } from "./visitas";
export type { Visita } from "./visitas";
// Capa de datos aislada. Hoy: localStorage. Mañana: se cambia por Lovable Cloud sin tocar pantallas.

export interface Socio {
  id: string;
  nombre: string;
  telefono: string;
  numeroSocio: number;
  temporada: string;
  fechaAlta: string;
  consentimientoRGPD: { aceptado: boolean; fecha: string | null };
  mayorDeEdad: boolean;
  estado: "invitada" | "activa" | "desactivada";
  tokenInvitacion: string;
  fechaActivacion: string | null;
  dispositivoId: string | null;
  cambioDispositivo: boolean;
}
export interface Patrocinador {
  id: string;
  nombre: string;
  categoria: string;
  logoUrl: string;
  direccion: string;
  pin: string;
  activo: boolean;
}
export interface Ventaja {
  id: string;
  patrocinadorId: string;
  titulo: string;
  descripcion: string;
  condiciones: string;
  activa: boolean;
  fechaInicio: string;
  fechaFin: string;
  destacado?: string;
  tarifas?: { servicio: string; normal: string; socio: string }[];
}
export interface Canje {
  id: string;
  socioId: string;
  patrocinadorId: string;
  ventajaId: string;
  fechaHora: string;
  primeraVezDeclarada: boolean;
  primerCanjeSistema: boolean;
}
export interface Partido {
  id: string;
  rival: string;
  fechaHora: string;
  lugar: string;
  esLocal: boolean;
  golesLocal: number | null;
  golesVisitante: number | null;
  jugado: boolean;
}
export interface Aviso {
  id: string;
  titulo: string;
  texto: string;
  fecha: string;
  tipo: "partido" | "ventaja" | "club";
  /** A quién va dirigido; sin valor = todos */
  para?: "todos" | "socias" | "negocios";
}
export interface DB {
  socios: Socio[];
  patrocinadores: Patrocinador[];
  ventajas: Ventaja[];
  canjes: Canje[];
  partidos: Partido[];
  avisos: Aviso[];
  visitas: Visita[];
  socioActualId: string | null;
}

const KEY = "rul-demo-db-v5";
const DEVICE_KEY = "rul-device-id";
const SESSION_KEY = "rul-session-socio";
const NEGOCIO_KEY = "rul-session-negocio";

export function nuevoToken() {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
}
const TEMPORADA = "2026/27";

function seed(): DB {
  const now = new Date();
  const socios: Socio[] = Array.from({ length: 18 }, (_, i) => ({
    id: `s${i + 1}`,
    nombre: `Socia Demo ${i + 1}`,
    telefono: "600000000",
    numeroSocio: i + 1,
    temporada: TEMPORADA,
    fechaAlta: new Date(now.getTime() - (60 - i) * 86400000).toISOString(),
    consentimientoRGPD: { aceptado: true, fecha: now.toISOString() },
    mayorDeEdad: true,
    estado: "activa",
    tokenInvitacion: `seed-token-demo-${i + 1}-xxxxxxxxxxxx`,
    fechaActivacion: now.toISOString(),
    dispositivoId: "demo-seed",
    cambioDispositivo: false,
  }));
  const pend = "[Dirección pendiente]";
  const patrocinadores: Patrocinador[] = [
    { id: "p1", nombre: "EFG Parquets", categoria: "Parquets y suelos", logoUrl: "", direccion: pend, pin: "1111", activo: true },
    { id: "p2", nombre: "Noel López Pinín · Nutrición", categoria: "Nutrición", logoUrl: "", direccion: pend, pin: "2222", activo: true },
    { id: "p3", nombre: "BajoCero · Mauro Busi", categoria: "Fisio, entreno y estética", logoUrl: "", direccion: pend, pin: "3333", activo: true },
    { id: "p4", nombre: "Psicotécnico San Roque", categoria: "Psicotécnicos", logoUrl: "", direccion: pend, pin: "4444", activo: true },
    { id: "p5", nombre: "Clínica Dinam", categoria: "Salud", logoUrl: "", direccion: pend, pin: "5555", activo: true },
  ];
  const T = { activa: true, fechaInicio: "2026-09-01", fechaFin: "2027-06-30" };
  const ventajas: Ventaja[] = [
    { id: "v1", patrocinadorId: "p1", destacado: "10 %", titulo: "En trabajos de EFG Parquets", descripcion: "Para que tu casa también juegue en casa.", condiciones: "Enseña tu carné al pedir presupuesto.", ...T },
    { id: "v2", patrocinadorId: "p2", destacado: "15 %", titulo: "En asesoría mensual", descripcion: "De 90 € a 76,50 € al mes.", condiciones: "Enseña tu carné al empezar la asesoría.", ...T },
    { id: "v3", patrocinadorId: "p3", destacado: "10 %", titulo: "Primera sesión de fisioterapia", descripcion: "En tu primera visita.", condiciones: "Solo en la primera sesión.", ...T },
    { id: "v4", patrocinadorId: "p3", destacado: "10 %", titulo: "Primera mensualidad de entrenamiento", descripcion: "Incluye una sesión de prueba gratis.", condiciones: "Solo en la primera mensualidad.", ...T },
    { id: "v5", patrocinadorId: "p3", destacado: "10 %", titulo: "Bonos de estética", descripcion: "Incluye diagnóstico gratis.", condiciones: "Enseña tu carné al comprar el bono.", ...T },
    { id: "v6", patrocinadorId: "p4", destacado: "5 €", titulo: "Menos en tu psicotécnico", descripcion: "Con tu carné de socia/o.", condiciones: "Enseña tu carné al pedir cita.", ...T },
    {
      id: "v7", patrocinadorId: "p5", destacado: "Tarifas", titulo: "Tarifas de socia/o en consultas y pruebas", descripcion: "Y 5 € menos en psicotécnicos con tu carné.", condiciones: "Di que eres socia/o al pedir cita. Analítica básica con cita previa martes y jueves.", ...T,
      tarifas: [
        { servicio: "Consulta medicina general", normal: "50 €", socio: "40 €" },
        { servicio: "Revisión medicina general", normal: "30 €", socio: "25 €" },
        { servicio: "Electrocardiograma (ECG)", normal: "20 €", socio: "15 €" },
        { servicio: "Audiometría", normal: "15 €", socio: "12 €" },
        { servicio: "Espirometría", normal: "15 €", socio: "12 €" },
        { servicio: "Radiografía · 1 proyección", normal: "20 €", socio: "18 €" },
        { servicio: "Radiografía · 2 proyecciones", normal: "32 €", socio: "30 €" },
        { servicio: "Reconocimiento deportivo", normal: "35 €", socio: "25 €" },
        { servicio: "Analítica básica", normal: "65 €", socio: "40 €" },
      ],
    },
  ];
  // 26 canjes repartidos en 8 semanas
  const canjes: Canje[] = [];
  const visto = new Set<string>();
  for (let i = 0; i < 26; i++) {
    const socio = socios[(i * 7) % socios.length]!;
    const pat = `p${(i % 5) + 1}`;
    const k = socio.id + pat;
    const primero = !visto.has(k);
    visto.add(k);
    canjes.push({
      id: `c${i + 1}`,
      socioId: socio.id,
      patrocinadorId: pat,
      ventajaId: ventajas.find((v) => v.patrocinadorId === pat)!.id,
      fechaHora: new Date(now.getTime() - Math.floor((i / 26) * 56 + 1) * 86400000).toISOString(),
      primeraVezDeclarada: primero && i % 4 !== 0,
      primerCanjeSistema: primero,
    });
  }
  const partidos: Partido[] = [
    { id: "m1", rival: "[Rival]", fechaHora: "", lugar: "Pabellón de Guntín", esLocal: true, golesLocal: null, golesVisitante: null, jugado: true },
    { id: "m2", rival: "Abella F.C.", fechaHora: "", lugar: "[Pabellón pendiente]", esLocal: true, golesLocal: null, golesVisitante: null, jugado: false },
  ];
  const avisos: Aviso[] = [
    { id: "a1", titulo: "Arrancamos temporada", texto: "Primera temporada en Primera Futgal. Te esperamos en Guntín.", fecha: now.toISOString(), tipo: "club" },
    { id: "a2", titulo: "Próximo partido: vs Abella F.C.", texto: "Concello de Guntín - R.U. Lucense contra Abella F.C. Fecha y hora por confirmar. Te esperamos.", fecha: new Date(now.getTime() + 1000).toISOString(), tipo: "partido" },
  ];
  // 26 visitas de demo en 8 semanas para el patrocinador piloto (p1)
  const visitas: Visita[] = [];
  for (let i = 0; i < 26; i++) {
    const dias = 55 - Math.floor(i * 2.1);
    const fecha = new Date(now.getTime() - dias * 86400000 - (i % 5) * 3600000);
    const conCarne = i % 4 !== 3;
    const socio = conCarne ? socios[(i * 5) % 11]! : undefined;
    visitas.push({
      id: `vi${i + 1}`,
      patrocinadorId: "p1",
      fechaHora: fecha.toISOString(),
      numeroSocio: socio?.numeroSocio,
      socioId: socio?.id,
      origen: conCarne ? (i % 2 ? "qr" : "numero") : "sin_carne",
      tipoCliente: i % 9 === 0 ? "nueva" : "ya_era_clienta",
      repiteViaClub: socio ? repiteViaClub(visitas, "p1", socio.id, fecha) : false,
      verificada: conCarne,
      anulada: false,
    });
  }
  return { socios, patrocinadores, ventajas, canjes, partidos, avisos, visitas, socioActualId: null };
}

function load(): DB {
  if (typeof window === "undefined") return seed();
  const raw = window.localStorage.getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as DB;
    } catch {
      /* datos corruptos: se vuelve a sembrar */
    }
  }
  const db = seed();
  window.localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}

function save(db: DB) {
  window.localStorage.setItem(KEY, JSON.stringify(db));
}

export const dataService = {
  get: load,
  reset() {
    const db = seed();
    save(db);
    return db;
  },
  /** Directiva da de alta: queda invitada con token */
  crearSocio(nombre: string, telefono: string): Socio {
    const db = load();
    const socio: Socio = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      telefono: telefono.replace(/\D/g, ""),
      numeroSocio: Math.max(0, ...db.socios.map((s) => s.numeroSocio)) + 1,
      temporada: TEMPORADA,
      fechaAlta: new Date().toISOString(),
      consentimientoRGPD: { aceptado: false, fecha: null },
      mayorDeEdad: false,
      estado: "invitada",
      tokenInvitacion: nuevoToken(),
      fechaActivacion: null,
      dispositivoId: null,
      cambioDispositivo: false,
    };
    db.socios.push(socio);
    save(db);
    return socio;
  },
  update(id: string, patch: Partial<Socio>): Socio | null {
    const db = load();
    const s = db.socios.find((x) => x.id === id);
    if (!s) return null;
    Object.assign(s, patch);
    save(db);
    return s;
  },
  /** Reenviar: token nuevo, el anterior deja de valer */
  regenerarToken(id: string) {
    return this.update(id, { tokenInvitacion: nuevoToken() });
  },
  desactivar(id: string) {
    return this.update(id, { estado: "desactivada" });
  },
  porToken(token: string): Socio | null {
    const s = load().socios.find((x) => x.tokenInvitacion === token);
    return s && s.estado !== "desactivada" ? s : null;
  },
  dispositivoId(): string {
    let d = window.localStorage.getItem(DEVICE_KEY);
    if (!d) {
      d = crypto.randomUUID();
      window.localStorage.setItem(DEVICE_KEY, d);
    }
    return d;
  },
  /** Un carné, un móvil: activar en otro dispositivo mueve el carné aquí */
  activar(token: string): Socio | null {
    const s = this.porToken(token);
    if (!s) return null;
    const dev = this.dispositivoId();
    const otro = s.dispositivoId !== null && s.dispositivoId !== dev;
    const now = new Date().toISOString();
    const r = this.update(s.id, {
      estado: "activa",
      mayorDeEdad: true,
      consentimientoRGPD: { aceptado: true, fecha: now },
      fechaActivacion: now,
      dispositivoId: dev,
      cambioDispositivo: s.cambioDispositivo || otro,
    });
    window.localStorage.setItem(SESSION_KEY, s.id);
    return r;
  },
  /** Sesión de este móvil: carné propio, movido a otro móvil, o ninguno */
  sesion(): { socio: Socio; estado: "ok" | "movido" | "desactivada" } | null {
    const id = window.localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    const s = load().socios.find((x) => x.id === id);
    if (!s) return null;
    if (s.estado === "desactivada") return { socio: s, estado: "desactivada" };
    if (s.dispositivoId !== this.dispositivoId()) return { socio: s, estado: "movido" };
    return { socio: s, estado: "ok" };
  },
  // ---- Negocio ----
  negocioPorPin(pin: string) {
    return load().patrocinadores.find((p) => p.pin === pin && p.activo) ?? null;
  },
  negocioSesion() {
    const id = window.localStorage.getItem(NEGOCIO_KEY);
    return id ? (load().patrocinadores.find((p) => p.id === id) ?? null) : null;
  },
  abrirNegocio(id: string) {
    window.localStorage.setItem(NEGOCIO_KEY, id);
  },
  cerrarNegocio() {
    window.localStorage.removeItem(NEGOCIO_KEY);
  },
  socioPorNumero(n: number) {
    return load().socios.find((s) => s.numeroSocio === n && s.estado !== "desactivada") ?? null;
  },
  yaHoy(patId: string, socioId: string) {
    return yaRegistradaHoy(load().visitas, patId, socioId);
  },
  repite(patId: string, socioId: string) {
    return repiteViaClub(load().visitas, patId, socioId);
  },
  registrarVisita(input: { patrocinadorId: string; socio: Socio | null; origen: Visita["origen"]; tipoCliente: Visita["tipoCliente"] }): Visita | "duplicada" {
    const db = load();
    const { socio, patrocinadorId } = input;
    if (socio && yaRegistradaHoy(db.visitas, patrocinadorId, socio.id)) return "duplicada";
    const v: Visita = {
      id: crypto.randomUUID(),
      patrocinadorId,
      fechaHora: new Date().toISOString(),
      numeroSocio: socio?.numeroSocio,
      socioId: socio?.id,
      origen: socio ? input.origen : "sin_carne",
      tipoCliente: input.tipoCliente,
      repiteViaClub: socio ? repiteViaClub(db.visitas, patrocinadorId, socio.id) : false,
      verificada: !!socio,
      ventajaId: db.ventajas.find((x) => x.patrocinadorId === patrocinadorId)?.id,
      anulada: false,
    };
    db.visitas.push(v);
    save(db);
    return v;
  },
  anularVisita(id: string) {
    const db = load();
    const v = db.visitas.find((x) => x.id === id);
    if (v) v.anulada = true;
    save(db);
  },
  crearAviso(a: { titulo: string; texto: string; tipo: Aviso["tipo"]; para: NonNullable<Aviso["para"]> }) {
    const db = load();
    db.avisos.push({ ...a, id: "a" + Date.now(), fecha: new Date().toISOString() });
    save(db);
  },
  borrarAviso(id: string) {
    const db = load();
    db.avisos = db.avisos.filter((x) => x.id !== id);
    save(db);
  },
  avisosPara(quien: "socias" | "negocios") {
    return [...load().avisos].filter((a) => !a.para || a.para === "todos" || a.para === quien).sort((a, b) => b.fecha.localeCompare(a.fecha));
  },
  /** Clienta nueva = declarada primera vez Y sin canjes previos en ese negocio */
  esClientaNueva(c: Canje) {
    return c.primeraVezDeclarada && c.primerCanjeSistema;
  },
};
