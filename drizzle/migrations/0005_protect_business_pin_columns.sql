REVOKE SELECT ON public.patrocinadores FROM authenticated;
GRANT SELECT(id,nombre,categoria,logo_url,direccion,importe_patrocinio,fecha_alta,fecha_baja,motivo_baja,detalle_baja,activo) ON public.patrocinadores TO authenticated;
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;