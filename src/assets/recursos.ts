// Recursos del club servidos desde el propio build de la app.
// Antes eran .asset.json que apuntaban al hosting de Lovable (/__l5e/...)
// y fuera de Lovable (Cloudflare) daban 404.
import escudoUrl from './escudo-rul.png';
import carnetFrenteUrl from './carne-fisico-frente.jpg';
import carnetReversoUrl from './carne-fisico-reverso.jpg';
import ventajasPdfUrl from './ventajas-socios-2026-27.pdf';

export const escudo = { url: escudoUrl };
export const carnetFrente = { url: carnetFrenteUrl };
export const carnetReverso = { url: carnetReversoUrl };
export const ventajasPdf = { url: ventajasPdfUrl };
