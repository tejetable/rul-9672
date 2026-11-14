import {ChevronDown} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {dataService,runAction,useClubData} from '@/lib/dataService';
import {roleLabel} from '@/lib/email-access';
export function VerComo(){useClubData();const roles=dataService.roles();if(roles.length<2)return null;return <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" className="shrink-0 px-2 text-body-sm max-[430px]:size-8 max-[430px]:p-0" aria-label="Ver como"><span className="max-[430px]:hidden">Ver como</span><ChevronDown size={14}/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" collisionPadding={12} className="max-w-[calc(100vw-24px)] bg-background">{roles.map(r=><DropdownMenuItem key={r.id} onSelect={()=>runAction(()=>dataService.elegirRol(r.id))}>{roleLabel(r)}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;}