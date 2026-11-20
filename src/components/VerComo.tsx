import {ChevronDown} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {dataService,runAction,useClubData} from '@/lib/dataService';
import {roleLabel} from '@/lib/email-access';
import {textoAccesible} from '@/lib/member-language';
export function VerComo(){useClubData();const roles=dataService.roles();if(roles.length<2)return null;const activo=roles.find(r=>r.id===dataService.rolSeleccionado());return <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" className="h-11 shrink-0 gap-1 px-2 text-body-sm font-bold" aria-label={`Ver como: ${activo?textoAccesible(roleLabel(activo)):''}`}>{activo?roleLabel(activo).split(' nº')[0]:'Ver como'}<ChevronDown size={14}/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" collisionPadding={12} className="max-w-[calc(100vw-24px)] bg-background">{roles.map(r=><DropdownMenuItem aria-label={textoAccesible(roleLabel(r))} key={r.id} onSelect={()=>runAction(()=>dataService.elegirRol(r.id))}>{roleLabel(r)}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;}