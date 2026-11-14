ALTER TABLE public.ajustes_club ADD COLUMN url_twitch text NOT NULL DEFAULT 'https://www.twitch.tv/adrifdez_10';
CREATE OR REPLACE VIEW public.ajustes_club_publicos AS SELECT id,whatsapp_club,nombre_club,temporada_actual,url_clasificacion_futgal,cuota_socio,url_twitch FROM public.ajustes_club;
GRANT SELECT ON public.ajustes_club_publicos TO anon,authenticated;
GRANT ALL ON public.ajustes_club_publicos TO service_role;
