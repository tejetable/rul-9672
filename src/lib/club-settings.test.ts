import {describe,it,expect} from 'vitest';
import {clubWhatsapp,settingsSchema,defaultSettings,canManageTeam} from './club-settings';
describe('Club settings and permissions',()=>{
 it('only Super admin manages Directiva',()=>{expect(canManageTeam('super_admin')).toBe(true);expect(canManageTeam('directiva')).toBe(false);expect(canManageTeam('socia')).toBe(false);});
 it('empty WhatsApp hides contact',()=>expect(clubWhatsapp('Hola','')).toBeNull());
 it('country prefix is not duplicated',()=>expect(clubWhatsapp('Hola','34612345678')).toBe('https://wa.me/34612345678?text=Hola'));
 it('WhatsApp accepts digits and rejects symbols',()=>{expect(settingsSchema.safeParse({...defaultSettings,whatsapp_club:'34612345678'}).success).toBe(true);expect(settingsSchema.safeParse({...defaultSettings,whatsapp_club:'+34 612345678'}).success).toBe(false);});
});
