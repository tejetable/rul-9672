import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),getUser:vi.fn().mockResolvedValue({data:{user:null}})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{getUser:mocks.getUser},rpc:mocks.rpc,from:()=>({select:()=>({maybeSingle:async()=>({data:null,error:null})})})}}));
vi.mock('./club.functions',()=>({previewInvitation:vi.fn()}));
vi.mock('./drive.functions',()=>({getDriveGallery:vi.fn().mockResolvedValue({albumes:[]})}));
import {dataService} from './dataService';
beforeEach(()=>vi.clearAllMocks());
describe('Cloud data boundary',()=>{
 it('the Directiva demo selector cannot grant Directiva permissions',async()=>{window.localStorage.setItem('rul-demo-role','directiva');await dataService.init();expect(dataService.rol()).toBeNull();});
 it('does not load club data from localStorage',async()=>{window.localStorage.setItem('rul-demo-db-v6',JSON.stringify({socios:[{nombre:'Private old row'}]}));await dataService.init();expect(dataService.get().socios).toEqual([]);});
 it('asks SQL for the 90-day statistics, not browser calculations',async()=>{mocks.rpc.mockResolvedValue({data:{visitas:7},error:null});expect(await dataService.statsPatrocinador('p1','90')).toEqual({visitas:7});expect(mocks.rpc).toHaveBeenCalledWith('stats_patrocinador',{p_patrocinador_id:'p1',p_periodo:'90d'});});
 it('business identification exposes no phone',async()=>{mocks.rpc.mockResolvedValue({data:{id:'s1',nombre:'Socia',numeroSocio:23,repite:false,yaHoy:false},error:null});const socio=await dataService.socioPorNumero(23);expect(socio?.telefono).toBe('');expect(mocks.rpc).toHaveBeenCalledWith('identificar_socio',{p_numero:23});});
});
