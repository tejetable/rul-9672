CREATE TABLE public.liga_equipos (
 id text PRIMARY KEY,
 club_id uuid NOT NULL DEFAULT public.club_principal() REFERENCES public.clubes(id),
 temporada text NOT NULL DEFAULT '2026-27',
 nombre text NOT NULL,
 corto text NOT NULL,
 es_nuestro boolean NOT NULL DEFAULT false,
 UNIQUE (id, club_id, temporada)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.liga_equipos TO authenticated;
GRANT ALL ON public.liga_equipos TO service_role;
ALTER TABLE public.liga_equipos ENABLE ROW LEVEL SECURITY;
CREATE POLICY liga_equipos_read ON public.liga_equipos FOR SELECT TO authenticated USING (true);
CREATE POLICY liga_equipos_write ON public.liga_equipos FOR ALL TO authenticated USING (public.has_club_role('directiva')) WITH CHECK (public.has_club_role('directiva'));

CREATE TABLE public.liga_partidos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 club_id uuid NOT NULL DEFAULT public.club_principal() REFERENCES public.clubes(id),
 temporada text NOT NULL DEFAULT '2026-27',
 jornada integer NOT NULL CHECK (jornada BETWEEN 1 AND 30),
 fecha date,
 hora time,
 local text NOT NULL REFERENCES public.liga_equipos(id),
 visitante text NOT NULL REFERENCES public.liga_equipos(id),
 goles_local integer CHECK (goles_local >= 0),
 goles_visitante integer CHECK (goles_visitante >= 0),
 aplazado boolean NOT NULL DEFAULT false,
 partido_id uuid REFERENCES public.partidos(id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (temporada, jornada, local, visitante),
 CHECK (local <> visitante),
 CHECK ((goles_local IS NULL) = (goles_visitante IS NULL)),
 FOREIGN KEY (local, club_id, temporada) REFERENCES public.liga_equipos(id, club_id, temporada),
 FOREIGN KEY (visitante, club_id, temporada) REFERENCES public.liga_equipos(id, club_id, temporada)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.liga_partidos TO authenticated;
GRANT ALL ON public.liga_partidos TO service_role;
ALTER TABLE public.liga_partidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY liga_partidos_read ON public.liga_partidos FOR SELECT TO authenticated USING (true);
CREATE POLICY liga_partidos_write ON public.liga_partidos FOR ALL TO authenticated USING (public.has_club_role('directiva')) WITH CHECK (public.has_club_role('directiva'));

CREATE TABLE public.liga_sanciones (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 club_id uuid NOT NULL DEFAULT public.club_principal() REFERENCES public.clubes(id),
 temporada text NOT NULL DEFAULT '2026-27',
 equipo text NOT NULL REFERENCES public.liga_equipos(id),
 puntos integer NOT NULL CHECK (puntos < 0),
 motivo text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (equipo, club_id, temporada) REFERENCES public.liga_equipos(id, club_id, temporada)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.liga_sanciones TO authenticated;
GRANT ALL ON public.liga_sanciones TO service_role;
ALTER TABLE public.liga_sanciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY liga_sanciones_read ON public.liga_sanciones FOR SELECT TO authenticated USING (true);
CREATE POLICY liga_sanciones_write ON public.liga_sanciones FOR ALL TO authenticated USING (public.has_club_role('directiva')) WITH CHECK (public.has_club_role('directiva'));

CREATE FUNCTION public.guardar_jornada(p_temporada text, p_jornada integer, p_partidos jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE f jsonb; club uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_club_role('directiva') THEN
  RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
 END IF;
 IF p_temporada IS NULL OR length(trim(p_temporada)) = 0 OR p_jornada IS NULL OR p_jornada NOT BETWEEN 1 AND 30 THEN
  RAISE EXCEPTION 'Temporada o jornada no válida' USING ERRCODE = '22023';
 END IF;
 IF p_partidos IS NULL OR jsonb_typeof(p_partidos) <> 'array' THEN
  RAISE EXCEPTION 'Indica un array de partidos' USING ERRCODE = '22023';
 END IF;
 IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_partidos) e GROUP BY e->>'local', e->>'visitante' HAVING count(*) > 1) THEN
  RAISE EXCEPTION 'Un partido está repetido' USING ERRCODE = '22023';
 END IF;
 club := public.club_principal();
 PERFORM pg_advisory_xact_lock(hashtextextended(club::text || ':' || p_temporada || ':' || p_jornada::text, 0));
 FOR f IN SELECT value FROM jsonb_array_elements(p_partidos) LOOP
  IF jsonb_typeof(f) <> 'object'
   OR jsonb_typeof(f->'local') IS DISTINCT FROM 'string'
   OR jsonb_typeof(f->'visitante') IS DISTINCT FROM 'string'
   OR NOT (f ? 'goles_local' AND f ? 'goles_visitante')
   OR (f->'goles_local' <> 'null'::jsonb AND (jsonb_typeof(f->'goles_local') <> 'number' OR (f->>'goles_local') !~ '^[0-9]+$'))
   OR (f->'goles_visitante' <> 'null'::jsonb AND (jsonb_typeof(f->'goles_visitante') <> 'number' OR (f->>'goles_visitante') !~ '^[0-9]+$'))
   OR (f->'goles_local' = 'null'::jsonb) IS DISTINCT FROM (f->'goles_visitante' = 'null'::jsonb)
   OR (f ? 'aplazado' AND jsonb_typeof(f->'aplazado') IS DISTINCT FROM 'boolean') THEN
   RAISE EXCEPTION 'Datos de partido no válidos' USING ERRCODE = '22023';
  END IF;
  UPDATE public.liga_partidos SET
   goles_local = (f->>'goles_local')::integer,
   goles_visitante = (f->>'goles_visitante')::integer,
   aplazado = coalesce((f->>'aplazado')::boolean, false),
   updated_at = now()
  WHERE club_id = club AND temporada = p_temporada AND jornada = p_jornada
   AND local = f->>'local' AND visitante = f->>'visitante';
  IF NOT FOUND THEN
   RAISE EXCEPTION 'El partido % - % no existe en la jornada %', f->>'local', f->>'visitante', p_jornada USING ERRCODE = '22023';
  END IF;
 END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.guardar_jornada(text, integer, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardar_jornada(text, integer, jsonb) TO authenticated;