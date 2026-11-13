import {useQuery} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {getDriveGallery} from '@/lib/drive.functions';
export function useDriveGallery(){
  const fetchGallery=useServerFn(getDriveGallery);
  return useQuery({queryKey:['drive-gallery'],queryFn:()=>fetchGallery(),staleTime:600000,retry:false});
}