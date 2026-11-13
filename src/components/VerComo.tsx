import {ChevronDown} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {dataService,runAction,useClubData} from '@/lib/dataService';
import {roleLabel} from '@/lib/email-access';
export function VerComo(){useClubData();const roles=dataService.roles();if(roles.length<2)return null;return <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" className="shrink-0 px-2 text-body-sm" aria-label="Ver como">Ver como<ChevronDown size={14}/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" collisionPadding={12} className="max-w-[calc(100vw-24px)] bg-background">{roles.map(r=><DropdownMenuItem key={r.id} onSelect={()=>runAction(()=>dataService.elegirRol(r.id))}>{roleLabel(r)}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;}