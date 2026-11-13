DROP POLICY ajustes_lectura ON public.ajustes_club;
CREATE POLICY ajustes_lectura ON public.ajustes_club FOR SELECT TO authenticated USING (public.is_super_admin());
REVOKE SELECT ON public.ajustes_club FROM anon;
CREATE VIEW public.ajustes_club_publicos AS SELECT id, whatsapp_club, nombre_club, temporada_actual FROM public.ajustes_club WHERE id = true;
REVOKE ALL ON public.ajustes_club_publicos FROM PUBLIC;
GRANT SELECT ON public.ajustes_club_publicos TO anon, authenticated;
GRANT ALL ON public.ajustes_club_publicos TO service_role;
COMMENT ON VIEW public.ajustes_club_publicos IS 'Public club contact and display settings only. Intentionally uses owner privileges; never include private email or other administrative fields.';