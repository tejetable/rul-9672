import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),getUser:vi.fn().mockResolvedValue({data:{user:null}})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{getUser:mocks.getUser},rpc:mocks.rpc,from:mocks.from}}));
vi.mock('./drive.functions',()=>({getDriveGallery:vi.fn().mockResolvedValue({albumes:[]})}));
import {dataService} from './dataService';
beforeEach(()=>{vi.clearAllMocks();mocks.from.mockImplementation(()=>({select:()=>({maybeSingle:async()=>({data:null,error:null})})}));});
describe('Cloud data boundary',()=>{
 it('regenerates only through the guarded test RPC and preserves authorization errors',async()=>{
   mocks.rpc.mockResolvedValue({data:null,error:{message:'Solo Super admin'}});
   await expect(dataService.regenerarVisitasPrueba('test-business')).rejects.toThrow('Solo Super admin');
   expect(mocks.rpc).toHaveBeenCalledWith('regenerar_visitas_prueba',{p_negocio:'test-business'});
   expect(mocks.from).not.toHaveBeenCalled();
 });
 it.each(['ligaEquipos','ligaPartidos','ligaSanciones'] as const)('reads %s from Cloud for season 2026-27 without changing old standings',async(method)=>{
   const rows=[{id:'fixture'}];const chain={select:vi.fn(),eq:vi.fn(),order:vi.fn(),range:vi.fn().mockResolvedValue({data:rows,error:null})};
   chain.select.mockReturnValue(chain);chain.eq.mockReturnValue(chain);chain.order.mockReturnValue(chain);mocks.from.mockReturnValue(chain);
   expect(await dataService[method]()).toEqual(rows);
   const tables={ligaEquipos:'liga_equipos',ligaPartidos:'liga_partidos',ligaSanciones:'liga_sanciones'};
   expect(mocks.from).toHaveBeenCalledWith(tables[method]);expect(chain.eq).toHaveBeenCalledWith('temporada','2026-27');expect(chain.range).toHaveBeenCalledWith(0,499);
   expect(mocks.rpc).not.toHaveBeenCalled();expect(mocks.from).not.toHaveBeenCalledWith('clasificacion_equipos');
 });
 it('saves an entire jornada through the protected RPC, preserving zero scores and postponement',async()=>{
   const partidos=[{local:'ru-lucense',visitante:'cubelas',goles_local:0,goles_visitante:0,aplazado:false},{local:'a',visitante:'b',goles_local:null,goles_visitante:null,aplazado:true}];
   mocks.rpc.mockResolvedValue({data:null,error:null});await dataService.guardarJornada(8,partidos);
   expect(mocks.rpc).toHaveBeenCalledWith('guardar_jornada',{p_temporada:'2026-27',p_jornada:8,p_partidos:partidos});expect(mocks.from).not.toHaveBeenCalled();
 });
 it('propagates a missing-match error without individual writes or changing old standings',async()=>{
   mocks.rpc.mockResolvedValue({data:null,error:{message:'El partido a - b no existe en la jornada 8'}});
   await expect(dataService.guardarJornada(8,[{local:'a',visitante:'b',goles_local:2,goles_visitante:1,aplazado:false}])).rejects.toThrow('no existe');
   expect(mocks.rpc).toHaveBeenCalledTimes(1);expect(mocks.from).not.toHaveBeenCalled();
 });
 it('Google clears transient password input and uses the verified access state',async()=>{dataService.recordarPasswordEntrada('12345678');mocks.rpc.mockResolvedValue({data:{tiene_password:true,debe_cambiar_password:false,ha_accedido:true,google:true},error:null});await dataService.cargarAcceso();expect(dataService.passwordEntrada()).toBe('');expect(dataService.acceso().debe_cambiar_password).toBe(false);});
 it('password access preserves the mandatory change returned by Cloud',async()=>{mocks.rpc.mockResolvedValue({data:{tiene_password:true,debe_cambiar_password:true,ha_accedido:true,google:false},error:null});await dataService.cargarAcceso();expect(dataService.acceso().debe_cambiar_password).toBe(true);});
 it('test access requires a successful protected RPC and cannot grant a role',async()=>{await dataService.init();mocks.rpc.mockResolvedValue({data:null,error:{message:'Solo Super admin'}});await expect(dataService.accederComoNegocio('p1')).rejects.toThrow('Solo Super admin');expect(dataService.negocioPrueba()).toBeNull();expect(dataService.rol()).toBeNull();expect(mocks.rpc).toHaveBeenCalledWith('acceder_como_negocio',{p_id:'p1'});});
 it('real statistics are the default; test totals use the separate guarded RPC',async()=>{mocks.rpc.mockResolvedValue({data:{visitas:2},error:null});await dataService.statsPatrocinador('p1','mes');expect(mocks.rpc).toHaveBeenLastCalledWith('stats_patrocinador',{p_patrocinador_id:'p1',p_periodo:'mes'});await dataService.statsPatrocinador('p1','mes',true);expect(mocks.rpc).toHaveBeenLastCalledWith('stats_negocio_prueba',{p_patrocinador_id:'p1',p_periodo:'mes'});});
 it('test writes use only the forced-test RPC',async()=>{await dataService.init();mocks.rpc.mockResolvedValue({data:null,error:null});await dataService.accederComoNegocio('p1');mocks.rpc.mockResolvedValue({data:null,error:{message:'blocked'}});mocks.from.mockClear();await expect(dataService.registrarVisita({patrocinadorId:'p1',socio:null,origen:'sin_carne',tipoCliente:'nueva',gasto:'20_50'})).rejects.toThrow('blocked');expect(mocks.from).not.toHaveBeenCalled();expect(mocks.rpc).toHaveBeenLastCalledWith('guardar_visita_prueba',{p_negocio:'p1',p_origen:'sin_carnet',p_tipo:'nueva',p_gasto:'20_50'});await dataService.init();});
 it('rejects an unpaid manual creation before calling Cloud',async()=>{await expect(dataService.crearSocio('Persona','600000001','demo@example.test',{metodo:'efectivo',importe:0,fecha:'2026-11-14'})).rejects.toThrow();expect(mocks.rpc).not.toHaveBeenCalled();});
 it('signed-out settings read only the public projection and clear the private email',async()=>{
   dataService.ajustes().email_club='private@example.test';
   mocks.from.mockImplementation(()=>({select:()=>({maybeSingle:async()=>({data:{whatsapp_club:'34600000000',nombre_club:'Club',temporada_actual:'2026/27'},error:null})})}));
   await dataService.init();
   expect(mocks.from).toHaveBeenCalledWith('ajustes_club_publicos');
   expect(mocks.from).not.toHaveBeenCalledWith('ajustes_club');
   expect(dataService.ajustes().email_club).toBe('');
   expect(dataService.whatsapp('Hola')).toContain('https://wa.me/34600000000');
 });
 it('the Directiva demo selector cannot grant Directiva permissions',async()=>{window.localStorage.setItem('rul-demo-role','directiva');await dataService.init();expect(dataService.rol()).toBeNull();});
 it('does not load club data from localStorage',async()=>{window.localStorage.setItem('rul-demo-db-v6',JSON.stringify({socios:[{nombre:'Private old row'}]}));await dataService.init();expect(dataService.get().socios).toEqual([]);});
 it('asks SQL for the 90-day statistics, not browser calculations',async()=>{mocks.rpc.mockResolvedValue({data:{visitas:7},error:null});expect(await dataService.statsPatrocinador('p1','90')).toEqual({visitas:7});expect(mocks.rpc).toHaveBeenCalledWith('stats_patrocinador',{p_patrocinador_id:'p1',p_periodo:'90d'});});
 it('business identification exposes no phone',async()=>{mocks.rpc.mockResolvedValue({data:{id:'s1',nombre:'Socia',numeroSocio:23,repite:false,yaHoy:false},error:null});const socio=await dataService.socioPorNumero(23);expect(socio?.telefono).toBe('');expect(mocks.rpc).toHaveBeenCalledWith('identificar_socio',{p_numero:23});});
 it('saves the score and optional table position together through the protected operation',async()=>{mocks.rpc.mockResolvedValue({data:null,error:null});await dataService.init();await dataService.guardarResultado('j7',2,1,4);expect(mocks.rpc).toHaveBeenCalledWith('guardar_resultado_partido',{p_id:'j7',p_favor:2,p_contra:1,p_posicion:4});});
 it('clears mandatory password change only through the guarded completion RPC',async()=>{mocks.rpc.mockImplementation(async(name:string)=>({data:name==='estado_acceso_personal'?{tiene_password:true,debe_cambiar_password:false,ha_accedido:true}:null,error:null}));await dataService.completarPassword();expect(mocks.rpc).toHaveBeenCalledWith('completar_cambio_password');expect(dataService.acceso().debe_cambiar_password).toBe(false);});
 it('edits number and normalized email atomically using the unchanged internal id',async()=>{mocks.rpc.mockResolvedValue({data:null,error:null});await dataService.init();await dataService.editarSocio('s1',{nombre:'Manuel',email:' Socio_19@Hotmail.example ',telefono:'',numeroSocio:11});expect(mocks.rpc).toHaveBeenCalledWith('editar_socio_ficha',{p_id:'s1',p_nombre:'Manuel',p_email:'socio_19@hotmail.example',p_telefono:'',p_numero:11});expect(mocks.from).not.toHaveBeenCalledWith('visitas');expect(mocks.from).not.toHaveBeenCalledWith('pagos');});
});
