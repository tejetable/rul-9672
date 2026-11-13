import {describe,it,expect} from 'vitest';
import {CODE_RESEND_SECONDS,initialRole,membershipSchema,type EmailRole} from './email-access';
const member:EmailRole={id:'member',rol:'socia',socio_id:'s',patrocinador_id:null,numero_socio:20,nombre:'Socia'};
const admin:EmailRole={id:'admin',rol:'super_admin',socio_id:null,patrocinador_id:null,numero_socio:null,nombre:'Admin'};
const input={nombre:'Socia',email:'SOCIA@example.test',telefono:'',mayor:true,consentimiento:true};
describe('Email access rules',()=>{
 it('waits 30 seconds before offering another code',()=>expect(CODE_RESEND_SECONDS).toBe(30));
 it('zero roles cannot enter a role view',()=>expect(initialRole([],'admin')).toBeNull());
 it('one role enters directly',()=>expect(initialRole([member],null)?.id).toBe('member'));
 it('multiple roles require a choice on first access',()=>expect(initialRole([admin,member],null)).toBeNull());
 it('remembers only an actually assigned role',()=>{expect(initialRole([admin,member],'member')?.id).toBe('member');expect(initialRole([member,admin],'forged')).toBeNull();});
 it('requires email for new memberships',()=>expect(membershipSchema.safeParse({...input,email:''}).success).toBe(false));
 it('phone is optional',()=>expect(membershipSchema.parse(input).telefono).toBe(''));
 it('normalizes email to lower case',()=>expect(membershipSchema.parse(input).email).toBe('socia@example.test'));
 it('requires age confirmation',()=>expect(membershipSchema.safeParse({...input,mayor:false}).success).toBe(false));
 it('requires privacy consent',()=>expect(membershipSchema.safeParse({...input,consentimiento:false}).success).toBe(false));
});