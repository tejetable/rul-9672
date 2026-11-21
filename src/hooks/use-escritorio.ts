import { useSyncExternalStore } from 'react';

// true a partir de 1024 px (portátil o monitor). En servidor y en móvil, false.
const CONSULTA = '(min-width: 1024px)';
function suscribir(aviso: () => void) {
  const m = window.matchMedia(CONSULTA);
  m.addEventListener('change', aviso);
  return () => m.removeEventListener('change', aviso);
}
export function useEscritorio() {
  return useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA).matches, () => false);
}
