import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';

// Opt-in checks with authorized sessions; no credentials or PIN are kept in source.
const dir=process.env['TEST_BUSINESS_SESSION_DIR'];
describe.skipIf(!dir)('isolated test business in Cloud',()=>{
 const tokens:Record<string,string>={};let business='';let realBusiness='';
 const url=import.meta.env['VITE_SUPABASE_URL'];const key=import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
 async function request(account:string,path:string,body?:unknown,method=body===undefined?'GET':'POST'){
  const response=await fetch(`${url}/rest/v1/${path}`,{method,headers:{apikey:key,...(tokens[account]?{Authorization:`Bearer ${tokens[account]}`} : {}),'Content-Type':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const text=await response.text();return {ok:response.ok,data:text?JSON.parse(text):null};
 }
 const rpc=(account:string,name:string,body:unknown={})=>request(account,`rpc/${name}`,body);
 beforeAll(async()=>{
  if(!dir)throw new Error('Missing authorized sessions');
  for(const account of ['admin','member','directiva','business'])tokens[account]=JSON.parse(readFileSync(`${dir}/${account}-session.json`,'utf8')).session.access_token;
  expect((await rpc('admin','is_super_admin')).data).toBe(true);
  const roles=await rpc('admin','enlazar_roles_email');
  const role=roles.data.find((r:{rol:string})=>r.rol==='super_admin');expect(role).toBeDefined();
  expect((await rpc('admin','elegir_vista',{p_role:role.id})).ok).toBe(true);
  const pats=await request('admin','patrocinadores?select=id,nombre,es_prueba');expect(pats.ok).toBe(true);
  const test=pats.data.find((p:{nombre:string;es_prueba:boolean})=>p.nombre==='Negocio de prueba'&&p.es_prueba);
  const real=pats.data.find((p:{es_prueba:boolean})=>!p.es_prueba);expect(test).toBeDefined();expect(real).toBeDefined();business=test.id;realBusiness=real.id;
  expect((await rpc('admin','acceder_como_negocio',{p_id:business})).ok).toBe(true);
 });
 afterAll(async()=>{if(tokens['admin'])expect((await rpc('admin','salir_negocio_prueba')).ok).toBe(true);});
 it.each(['member','business'])('hides test businesses and benefits from %s at the database boundary',async(account)=>{
  expect((await request(account,`patrocinadores?id=eq.${business}&select=id`)).data).toEqual([]);
  expect((await request(account,`ventajas?patrocinador_id=eq.${business}&select=id`)).data).toEqual([]);
  expect((await request(account,`visitas?patrocinador_id=eq.${business}&select=id`)).data).toEqual([]);
  expect((await rpc(account,'stats_negocio_prueba',{p_patrocinador_id:business,p_periodo:'90d'})).ok).toBe(false);
 });
 it('Directiva sees the marked business but cannot regenerate its visits',async()=>{
  expect((await request('directiva',`patrocinadores?id=eq.${business}&select=es_prueba`)).data).toEqual([{es_prueba:true}]);
  expect((await rpc('directiva','regenerar_visitas_prueba',{p_negocio:business})).ok).toBe(false);
  expect((await request('directiva','socios?numero_socio=gte.9001&numero_socio=lte.9006&select=id')).data).toEqual([]);
 });
 it('creates six active fictitious members numbered 9001–9006 without contacts or payments',async()=>{
  const members=await request('admin','socios?numero_socio=gte.9001&numero_socio=lte.9006&select=id,numero_socio,es_prueba,estado,email,telefono&order=numero_socio');
  expect(members.ok).toBe(true);expect(members.data.map((s:{numero_socio:number})=>s.numero_socio)).toEqual([9001,9002,9003,9004,9005,9006]);
  for(const s of members.data){expect(s.es_prueba).toBe(true);expect(s.estado).toBe('activa');expect(s.email).toBeNull();expect(s.telefono).toBe('');expect((await request('admin',`pagos?socio_id=eq.${s.id}&select=id`)).data).toEqual([]);}
 });
 it('keeps 150 test visits in the past 90 days, including exactly five annulled visits',async()=>{
  const visits=await request('admin',`visitas?patrocinador_id=eq.${business}&select=es_prueba,anulada,fecha_hora,origen,tipo_cliente,tramo_gasto`);expect(visits.ok).toBe(true);
  expect(visits.data).toHaveLength(150);expect(visits.data.filter((v:{anulada:boolean})=>v.anulada)).toHaveLength(5);
  for(const v of visits.data){expect(v.es_prueba).toBe(true);expect(Date.parse(v.fecha_hora)).toBeGreaterThan(Date.now()-90*86400000);expect(Date.parse(v.fecha_hora)).toBeLessThan(Date.now());}
  expect(new Set(visits.data.map((v:{origen:string})=>v.origen))).toEqual(new Set(['qr','numero','sin_carnet']));
  expect(new Set(visits.data.map((v:{tipo_cliente:string})=>v.tipo_cliente))).toEqual(new Set(['nueva','ya_era_clienta']));
  expect(new Set(visits.data.map((v:{tramo_gasto:string|null})=>v.tramo_gasto))).toEqual(new Set(['lt20','20_50','50_100','gt100',null]));
 });
 it('never creates two visits for the same member and Madrid day',async()=>{
  const visits=await request('admin',`visitas?patrocinador_id=eq.${business}&socio_id=not.is.null&select=socio_id,fecha`);
  const keys=visits.data.map((v:{socio_id:string;fecha:string})=>`${v.socio_id}:${v.fecha}`);expect(new Set(keys).size).toBe(keys.length);
 });
 it('shows 145 valid visits through the protected 90-day preview statistics',async()=>{
  const stats=await rpc('admin','stats_negocio_prueba',{p_patrocinador_id:business,p_periodo:'90d'});expect(stats.ok).toBe(true);expect(stats.data.visitas).toBe(145);
 });
 it('preserves the real club statistics captured before creating the business',async()=>{
  if(!dir)throw new Error('Missing baseline');
  const stats=await rpc('admin','stats_club',{p_periodo:'90d'});expect(stats.ok).toBe(true);expect(stats.data).toEqual(JSON.parse(readFileSync(`${dir}/baseline.json`,'utf8')));
 });
 it('rejects regeneration for real businesses and unauthenticated callers',async()=>{
  expect((await rpc('admin','regenerar_visitas_prueba',{p_negocio:realBusiness})).ok).toBe(false);
  expect((await rpc('anon','regenerar_visitas_prueba',{p_negocio:business})).ok).toBe(false);
 });
 it('rejects recording a real visit against the fictitious business',async()=>{
  expect((await request('admin','visitas',{patrocinador_id:business,origen:'sin_carnet',tipo_cliente:'nueva',es_prueba:false})).ok).toBe(false);
 });
});