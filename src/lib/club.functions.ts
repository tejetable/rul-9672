import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

// Possession of an invitation is the capability. Never return phone or device data.
export const previewInvitation = createServerFn({ method: 'POST' })
  .inputValidator((data) => z.object({ token: z.string().min(24).max(100) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: socio, error } = await supabaseAdmin.from('socios')
      .select('id,nombre,numero_socio,temporada,estado')
      .eq('token_invitacion', data.token).neq('estado', 'desactivada').maybeSingle();
    if (error) throw new Error('No se pudo consultar la invitación.');
    return socio;
  });