import {describe,it,expect} from 'vitest';
import {PASSWORD_MIN_LENGTH,passwordSchema,passwordPairSchema,passwordLinkType} from './password-access';
describe('Password rules',()=>{
 it('requires exactly a minimum of 8 characters',()=>{expect(PASSWORD_MIN_LENGTH).toBe(8);expect(passwordSchema.safeParse('1234567').success).toBe(false);expect(passwordSchema.safeParse('12345678').success).toBe(true);});
 it('does not require uppercase or symbols',()=>expect(passwordSchema.safeParse('abcdefgh').success).toBe(true));
 it('rejects different repeated passwords',()=>{expect(passwordPairSchema.safeParse({password:'abcdefgh',repeat:'abcdefgi'}).success).toBe(false);expect(passwordPairSchema.safeParse({password:'abcdefgh',repeat:'abcdefgh'}).success).toBe(true);});
 it('only recognizes recovery and invitation links',()=>{expect(passwordLinkType('#type=recovery')).toBe('recovery');expect(passwordLinkType('#type=invite')).toBe('invite');expect(passwordLinkType('#type=signup')).toBeNull();});
});
