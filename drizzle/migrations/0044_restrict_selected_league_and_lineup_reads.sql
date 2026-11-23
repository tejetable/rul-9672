ALTER POLICY liga_sanciones_read ON public.liga_sanciones
USING (
 club_id = public.club_principal()
 AND (auth.jwt()->>'is_anonymous') IS DISTINCT FROM 'true'
 AND EXISTS (SELECT 1 FROM public.usuario_roles r WHERE r.user_id = (SELECT auth.uid()) AND r.activo)
);

ALTER POLICY jugadores_leer ON public.jugadores
USING (
 club_id = public.club_principal()
 AND (auth.jwt()->>'is_anonymous') IS DISTINCT FROM 'true'
 AND EXISTS (SELECT 1 FROM public.usuario_roles r WHERE r.user_id = (SELECT auth.uid()) AND r.activo)
);

ALTER POLICY convocatoria_img_leer ON storage.objects
USING (
 bucket_id = 'piezas-convocatoria'
 AND (auth.jwt()->>'is_anonymous') IS DISTINCT FROM 'true'
 AND EXISTS (
  SELECT 1 FROM public.usuario_roles r
  WHERE r.user_id = (SELECT auth.uid()) AND r.activo
  AND (
   r.rol IN ('directiva'::public.club_role, 'super_admin'::public.club_role)
   OR EXISTS (
    SELECT 1 FROM public.convocatorias c
    WHERE c.publicada AND c.imagen_url = storage.objects.name
   )
  )
 )
);