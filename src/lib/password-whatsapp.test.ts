import {describe,it,expect} from 'vitest';
import {accesoWhatsApp} from './password-whatsapp';
describe('Optional club password sharing',()=>{
 it('only offers sharing with a recipient phone',()=>expect(accesoWhatsApp('','manual@example.test','abcdefgh','https://rul-9672.lovable.app')).toBeNull());
 it('uses the Spanish recipient and encodes the entered access information',()=>{const value=accesoWhatsApp('600 000 001','Manual@Example.test','abcdefgh','https://rul-9672.lovable.app');expect(value?.startsWith('https://wa.me/34600000001?')).toBe(true);expect(decodeURIComponent(value??'')).toContain('Email: manual@example.test · Contraseña: abcdefgh. Al entrar te pedirá cambiarla.');});
});