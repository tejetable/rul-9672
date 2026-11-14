import {describe,it,expect} from 'vitest';
import {primerNumeroLibre,conflictoNumero,alCorriente,listaSocios,paginaSocios,pagoSchema,PAGE_SIZE,SEARCH_DELAY,UNETE_MENSAJE} from './socios-management';
import type {Socio} from './dataService';
const socios=Array.from({length:60},(_,i)=>({id:String(i+1),nombre:`Persona demo ${i+1}`,numeroSocio:i+1,email:`demo${i+1}@example.test`,telefono:`600000${String(i+1).padStart(3,'0')}`,estado:i===59?'desactivada':'activa',fechaAlta:'2026-11-14'} as Socio));
describe('Gestión de socios',()=>{
 it('60 socios have three pages of 20',()=>{expect(PAGE_SIZE).toBe(20);const p=paginaSocios(socios,3);expect(p.pages).toBe(3);expect(p.rows).toHaveLength(20);expect(p.rows[0]?.numeroSocio).toBe(41);});
 it('search 12 finds member number 12',()=>{const r=listaSocios(socios,'12','todas','numero',{},[],'2026/27');expect(r.map(s=>s.numeroSocio)).toContain(12);expect(r).not.toHaveLength(60);});
 it('search also matches email and phone',()=>{expect(listaSocios(socios,'demo3@','todas','numero',{},[],'2026/27').map(s=>s.numeroSocio)).toEqual([3]);expect(listaSocios(socios,'600000008','todas','numero',{},[],'2026/27').map(s=>s.numeroSocio)).toEqual([8]);});
 it('Desactivadas excludes active members',()=>expect(listaSocios(socios,'','desactivadas','numero',{},[],'2026/27').map(s=>s.numeroSocio)).toEqual([60]));
 it('pending password excludes deactivated people',()=>expect(listaSocios(socios,'','password','numero',{'demo1@example.test':false,'demo60@example.test':false},[],'2026/27').map(s=>s.numeroSocio)).toEqual([1]));
 it('only payments in the current season count as paid',()=>{const p={id:'p',socio_id:'1',temporada:'2025/26',metodo:'efectivo',importe:20,fecha_pago:'2025-11-14',referencia:null};expect(alCorriente([p],'1','2026/27')).toBe(false);expect(alCorriente([{...p,temporada:'2026/27'}],'1','2026/27')).toBe(true);});
 it('manual creation requires method, positive amount and date, and cannot claim Stripe',()=>{expect(pagoSchema.safeParse({}).success).toBe(false);expect(pagoSchema.safeParse({metodo:'efectivo',importe:0,fecha:'2026-11-14'}).success).toBe(false);expect(pagoSchema.safeParse({metodo:'stripe',importe:20,fecha:'2026-11-14'}).success).toBe(false);expect(pagoSchema.safeParse({metodo:'bizum',importe:20,fecha:'2026-11-14'}).success).toBe(true);});
 it('search debounce is 250 milliseconds',()=>expect(SEARCH_DELAY).toBe(250));
 it('membership contact uses the requested message',()=>expect(UNETE_MENSAJE).toBe('¡Hola! Quiero hacerme socio/a del R.U. Lucense.'));
});
describe("Numeración manual",()=>{it("con solo Diego nº 11 propone el 1",()=>expect(primerNumeroLibre([{numeroSocio:11}])).toBe(1));it("rellena el hueco mínimo sin reiniciar secuencia",()=>expect(primerNumeroLibre([{numeroSocio:1},{numeroSocio:3},{numeroSocio:11}])).toBe(2));it("impide usar el 11 de otra persona",()=>expect(conflictoNumero([{numeroSocio:11,nombre:"Tejetable",email:"diegoteje11@gmail.com"}],11,"otro@example.test")).toBe("El nº 11 ya es de Tejetable"));});
