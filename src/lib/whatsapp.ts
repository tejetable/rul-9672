// [pendiente] Teléfono de WhatsApp de la directiva (sin prefijo). Vacío = WhatsApp deja elegir el chat.
export const TELEFONO_DIRECTIVA = "";

export function waLink(texto: string, telefono = TELEFONO_DIRECTIVA) {
  const num = telefono.replace(/\D/g, "");
  return `https://wa.me/${num ? "34" + num : ""}?text=${encodeURIComponent(texto)}`;
}

export function textoInvitacion(nombre: string, enlace: string) {
  return `¡Ya eres de los nuestros, ${nombre}! Activa tu carnet de socia del R.U. Lucense aquí: ${enlace}. Te esperamos en Guntín.`;
}
