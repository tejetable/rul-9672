import { useState } from 'react';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { dataService, runAction } from '@/lib/dataService';
import { ClubCabecera } from '@/components/ClubCabecera';

export function DirectivaAcceso() {
  const [busy,setBusy]=useState(false);
  return <div><ClubCabecera etiqueta="Directiva"/><section className="px-5 py-8">
    <h1 className="club-title">Cuenta del club</h1>
    <p className="mt-3 text-body-sm">Solo las cuentas autorizadas por el club pueden gestionar socias, negocios y avisos.</p>
    {dataService.rol() ? <Button className="mt-5" onClick={()=>runAction(async()=>{await dataService.cerrarSesion();window.location.reload();})}>Cerrar la sesión actual</Button> : <>
    <Button disabled={busy} className="mt-5 w-full" onClick={()=>runAction(async()=>{setBusy(true);try{const r=await lovable.auth.signInWithOAuth('google',{redirect_uri:window.location.origin});if(r.error)throw r.error;await dataService.init();}finally{setBusy(false);}})}>Continuar con Google</Button>
    <Button disabled={busy} variant="outline" className="mt-3 w-full" onClick={()=>runAction(async()=>{const r=await lovable.auth.signInWithOAuth('lovable',{redirect_uri:window.location.origin});if(r.error)throw r.error;await dataService.init();})}>Continuar con Lovable</Button>
    </>}
    <p className="mt-4 text-body-sm text-muted-foreground">Si ya has entrado y no tienes acceso, tu cuenta aún no está autorizada.</p>
  </section></div>;
}