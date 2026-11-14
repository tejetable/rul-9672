// Member invitations keep their Spanish prefix; club contact uses Cloud settings.
export function waLink(texto: string, telefono = "") {
  const num = telefono.replace(/\D/g, "");
  return `https://wa.me/${num ? "34" + num : ""}?text=${encodeURIComponent(texto)}`;
}

export function textoInvitacion(nombre: string, enlace: string) {
  return `¡Ya eres de los nuestros, ${nombre}! Activa tu carnet de soci@ del R.U. Lucense aquí: ${enlace}. Te esperamos en Guntín.`;
}
