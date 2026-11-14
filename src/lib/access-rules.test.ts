import {describe,it,expect} from 'vitest';
import {googleEmail,canRemovePassword} from './access-rules';
import {passwordSchema} from './password-access';
describe('Definitive account access rules',()=>{
 it('Gmail can use Google without an initial password',()=>expect(googleEmail('User@gmail.com')).toBe(true));
 it('Googlemail can use Google without an initial password',()=>expect(googleEmail(' user@googlemail.com ')).toBe(true));
 it('Hotmail cannot remove its only password',()=>expect(canRemovePassword('manuel_ma19@hotmail.com')).toBe(false));
 it('a linked Google identity permits password removal on another email domain',()=>expect(canRemovePassword('person@club.es',true)).toBe(true));
 it('does not mistake lookalike domains for Google',()=>expect(canRemovePassword('person@gmail.com.evil.test')).toBe(false));
 it('requires at least eight password characters',()=>{expect(passwordSchema.safeParse('1234567').success).toBe(false);expect(passwordSchema.safeParse('12345678').success).toBe(true);});
});