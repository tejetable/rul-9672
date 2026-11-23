import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';

// Opt-in integration suite: uses an authorized local session, never stores credentials.
const sessionPath=process.env['LIGA_TEST_SESSION'];
describe.skipIf(!sessionPath)('Cloud league constraints and transactional save',()=>{
 let token='';
 const prefix=`league-check-${crypto.randomUUID()}`;
 const local=`${prefix}-home`;const visitante=`${prefix}-away`;
 const temporada='2026-27';
 const url=import.meta.env['VITE_SUPABASE_URL'];
 const key=import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
 async function request(path:string,method='GET',body?:unknown,authenticated=true){
  const response=await fetch(`${url}/rest/v1/${path}`,{method,headers:{apikey:key,...(authenticated?{Authorization:`Bearer ${token}`} : {}),'Content-Type':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const text=await response.text();return {ok:response.ok,status:response.status,data:text?JSON.parse(text):null};
 }
 const fixture=(goles_local:number|null=2,goles_visitante:number|null=1)=>({local,visitante,goles_local,goles_visitante,aplazado:false});
 async function save(partidos:unknown[],jornada=1){return request('rpc/guardar_jornada','POST',{p_temporada:temporada,p_jornada:jornada,p_partidos:partidos});}
 async function readFixture(){const r=await request(`liga_partidos?local=eq.${local}&select=goles_local,goles_visitante,aplazado`);expect(r.ok).toBe(true);return r.data;}
 beforeAll(async()=>{
  if(!sessionPath)throw new Error('Missing integration session');
  const session=JSON.parse(readFileSync(sessionPath,'utf8'));token=session.session.access_token;
  const role=await request('rpc/has_club_role','POST',{r:'directiva'});expect(role.data).toBe(true);
  const teams=await request('liga_equipos','POST',[{id:local,temporada,nombre:'Integration home',corto:'Home'},{id:visitante,temporada,nombre:'Integration away',corto:'Away'}]);expect(teams.ok).toBe(true);
  const match=await request('liga_partidos','POST',{temporada,jornada:1,local,visitante});expect(match.ok).toBe(true);
 });
 afterAll(async()=>{
  if(!token)return;
  expect((await request(`liga_sanciones?equipo=eq.${local}`,'DELETE')).ok).toBe(true);
  expect((await request(`liga_partidos?local=eq.${local}`,'DELETE')).ok).toBe(true);
  expect((await request(`liga_equipos?id=in.(${local},${visitante})`,'DELETE')).ok).toBe(true);
 });
 it('allows Directiva / Super admin to save and read back a 2-1 result',async()=>{
  expect((await save([fixture()])).ok).toBe(true);expect(await readFixture()).toEqual([{goles_local:2,goles_visitante:1,aplazado:false}]);
 });
 it('rolls back every update if any match does not exist in the jornada',async()=>{
  expect((await save([fixture()])).ok).toBe(true);
  expect((await save([fixture(9,0),{...fixture(),local:'nonexistent-team'}])).ok).toBe(false);
  expect(await readFixture()).toEqual([{goles_local:2,goles_visitante:1,aplazado:false}]);
 });
 it('does not save a match from a different jornada',async()=>{expect((await save([fixture()],2)).ok).toBe(false);});
 it('only accepts jornadas 1–30',async()=>{for(const jornada of [0,31])expect((await save([fixture()],jornada)).ok).toBe(false);});
 it('rejects negative goals',async()=>{expect((await save([fixture(-1,0)])).ok).toBe(false);});
 it('requires both scores to be null or both present',async()=>{expect((await save([fixture(null,1)])).ok).toBe(false);});
 it('allows unplayed and postponed matches with two null scores',async()=>{
  expect((await save([{...fixture(null,null),aplazado:true}])).ok).toBe(true);expect(await readFixture()).toEqual([{goles_local:null,goles_visitante:null,aplazado:true}]);
 });
 it('rejects duplicate fixtures within the transaction',async()=>{expect((await save([fixture(),fixture()])).ok).toBe(false);});
 it('enforces fixture uniqueness in the table',async()=>{expect((await request('liga_partidos','POST',{temporada,jornada:1,local,visitante})).ok).toBe(false);});
 it('only accepts negative sanction points',async()=>{
  expect((await request('liga_sanciones','POST',{temporada,equipo:local,puntos:0,motivo:'Integration test'})).ok).toBe(false);
  expect((await request('liga_sanciones','POST',{temporada,equipo:local,puntos:-3,motivo:'Integration test'})).ok).toBe(true);
 });
 it('anonymous callers cannot read league data or execute the writer',async()=>{
  for(const table of ['liga_equipos','liga_partidos','liga_sanciones']){
   const result=await request(`${table}?limit=1`,'GET',undefined,false);
   if(result.ok)expect(result.data).toEqual([]);else expect([401,403]).toContain(result.status);
  }
  expect((await request('rpc/guardar_jornada','POST',{p_temporada:temporada,p_jornada:1,p_partidos:[fixture()]},false)).ok).toBe(false);
 });
});