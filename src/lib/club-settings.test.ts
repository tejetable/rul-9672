import {describe,it,expect} from 'vitest';
import {clubWhatsapp,settingsSchema,defaultSettings,canManageTeam} from './club-settings';
describe('Club settings and permissions',()=>{
 it('the club Twitch defaults to the supplied channel',()=>expect(defaultSettings.url_twitch).toBe('https://www.twitch.tv/adrifdez_10'));
 it('empty Twitch is permitted so its button can be hidden',()=>expect(settingsSchema.parse({...defaultSettings,url_twitch:''}).url_twitch).toBe(''));
 it('Twitch rejects unsafe non-https links',()=>expect(settingsSchema.safeParse({...defaultSettings,url_twitch:'javascript:alert(1)'}).success).toBe(false));
 it('only Super admin manages Directiva',()=>{expect(canManageTeam('super_admin')).toBe(true);expect(canManageTeam('directiva')).toBe(false);expect(canManageTeam('socia')).toBe(false);});
 it('empty WhatsApp hides contact',()=>expect(clubWhatsapp('Hola','')).toBeNull());
 it('country prefix is not duplicated',()=>expect(clubWhatsapp('Hola','34612345678')).toBe('https://wa.me/34612345678?text=Hola'));
 it('WhatsApp accepts digits and rejects symbols',()=>{expect(settingsSchema.safeParse({...defaultSettings,whatsapp_club:'34612345678'}).success).toBe(true);expect(settingsSchema.safeParse({...defaultSettings,whatsapp_club:'+34 612345678'}).success).toBe(false);});
});
