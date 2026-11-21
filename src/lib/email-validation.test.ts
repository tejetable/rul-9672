import { describe, expect, it } from 'vitest';
import {emailSchema,normalizarEmail,formatoImporte} from './email-validation';
describe('Club email and payment formatting',()=>{
 it('accepts the Hotmail address with underscore',()=>expect(emailSchema.parse('socio_19@hotmail.example')).toBe('socio_19@hotmail.example'));
 it('accepts dots, digits, hyphens and plus',()=>expect(emailSchema.safeParse('nombre.apellido-19+club@gmail.com').success).toBe(true));
 it('normalizes casing and surrounding spaces',()=>expect(normalizarEmail('  Socio_19@Hotmail.example  ')).toBe('socio_19@hotmail.example'));
 it('rejects invalid email before saving',()=>expect(emailSchema.safeParse('socio_19@').success).toBe(false));
 it('formats 15 euros with Spanish decimals',()=>expect(formatoImporte(15).replace(/\u00a0/g,' ')).toBe('15,00 €'));
});