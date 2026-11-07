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
}
export interface DB {
  socios: Socio[];
  patrocinadores: Patrocinador[];
  ventajas: Ventaja[];
  canjes: Canje[];
  partidos: Partido[];
  avisos: Aviso[];
  socioActualId: string | null;
}

const KEY = "rul-demo-db-v2";
const DEVICE_KEY = "rul-device-id";
const SESSION_KEY = "rul-session-socio";

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
  const patrocinadores: Patrocinador[] = [
    { id: "p1", nombre: "[Tienda de uñas – nombre pendiente]", categoria: "Estética", logoUrl: "", direccion: "[Dirección pendiente], Guntín", pin: "1234", activo: true },
    { id: "p2", nombre: "[Patrocinador piloto 2 – pendiente]", categoria: "[Categoría pendiente]", logoUrl: "", direccion: "[Dirección pendiente], Lugo", pin: "5678", activo: true },
  ];
  const ventajas: Ventaja[] = [
    { id: "v1", patrocinadorId: "p1", titulo: "[Ventaja pendiente de acordar]", descripcion: "[Descripción pendiente]", condiciones: "Una vez al día por socia/o. Enseña tu carné en el mostrador.", activa: true, fechaInicio: "2026-09-01", fechaFin: "2027-06-30" },
    { id: "v2", patrocinadorId: "p2", titulo: "[Ventaja pendiente de acordar]", descripcion: "[Descripción pendiente]", condiciones: "Una vez al día por socia/o.", activa: true, fechaInicio: "2026-09-01", fechaFin: "2027-06-30" },
  ];
  // 26 canjes repartidos en 8 semanas
  const canjes: Canje[] = [];
  const visto = new Set<string>();
  for (let i = 0; i < 26; i++) {
    const socio = socios[(i * 7) % socios.length]!;
    const pat = i % 3 === 0 ? "p2" : "p1";
    const k = socio.id + pat;
    const primero = !visto.has(k);
    visto.add(k);
    canjes.push({
      id: `c${i + 1}`,
      socioId: socio.id,
      patrocinadorId: pat,
      ventajaId: pat === "p1" ? "v1" : "v2",
      fechaHora: new Date(now.getTime() - Math.floor((i / 26) * 56 + 1) * 86400000).toISOString(),
      primeraVezDeclarada: primero && i % 4 !== 0,
      primerCanjeSistema: primero,
    });
  }
  const partidos: Partido[] = [
    { id: "m1", rival: "[Rival]", fechaHora: "", lugar: "Pabellón de Guntín", esLocal: true, golesLocal: null, golesVisitante: null, jugado: true },
    { id: "m2", rival: "[Rival]", fechaHora: "", lugar: "Pabellón de Guntín", esLocal: true, golesLocal: null, golesVisitante: null, jugado: false },
  ];
  const avisos: Aviso[] = [
    { id: "a1", titulo: "Arrancamos temporada", texto: "Primera temporada en Primera Futgal. Te esperamos en Guntín.", fecha: now.toISOString(), tipo: "club" },
  ];
  return { socios, patrocinadores, ventajas, canjes, partidos, avisos, socioActualId: null };
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
  /** Clienta nueva = declarada primera vez Y sin canjes previos en ese negocio */
  esClientaNueva(c: Canje) {
    return c.primeraVezDeclarada && c.primerCanjeSistema;
  },
};
