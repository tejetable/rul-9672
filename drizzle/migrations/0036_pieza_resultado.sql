ALTER TABLE public.partidos ADD COLUMN IF NOT EXISTS imagen_resultado_url text;
CREATE POLICY piezas_leer ON storage.objects FOR SELECT TO authenticated USING (bucket_id='piezas-resultado' AND public.has_club_role('directiva'));
CREATE POLICY piezas_subir ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='piezas-resultado' AND public.has_club_role('directiva'));
CREATE POLICY piezas_cambiar ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='piezas-resultado' AND public.has_club_role('directiva'));
CREATE POLICY piezas_borrar ON storage.objects FOR DELETE TO authenticated USING (bucket_id='piezas-resultado' AND public.has_club_role('directiva'));