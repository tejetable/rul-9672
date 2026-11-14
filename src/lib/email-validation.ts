import { z } from 'zod';
export const emailSchema = z.string().trim().toLowerCase().email('Dirección de email no válida.').max(254);
export const normalizarEmail = (value: string) => emailSchema.parse(value);
export const formatoImporte = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);