CREATE TABLE public.clasificacion_equipos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), jornada int NOT NULL CHECK (jornada>0), posicion int NOT NULL CHECK (posicion>0), equipo text NOT NULL CHECK (length(trim(equipo)) BETWEEN 1 AND 200), puntos int NOT NULL DEFAULT 0, pj int NOT NULL DEFAULT 0 CHECK (pj>=0), g int NOT NULL DEFAULT 0 CHECK (g>=0), e int NOT NULL DEFAULT 0 CHECK (e>=0), p int NOT NULL DEFAULT 0 CHECK (p>=0), gf int NOT NULL DEFAULT 0 CHECK (gf>=0), gc int NOT NULL DEFAULT 0 CHECK (gc>=0), es_nuestro boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (jornada, equipo));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clasificacion_equipos TO authenticated;
GRANT ALL ON public.clasificacion_equipos TO service_role;
ALTER TABLE public.clasificacion_equipos ENABLE ROW LEVEL SECURITY;
CREATE POLICY clasif_eq_leer ON public.clasificacion_equipos FOR SELECT TO authenticated USING (true);
CREATE POLICY clasif_eq_escribir ON public.clasificacion_equipos FOR ALL TO authenticated USING (public.has_club_role('directiva')) WITH CHECK (public.has_club_role('directiva'));

CREATE OR REPLACE FUNCTION public.guardar_clasificacion(p_jornada int, p_filas jsonb) RETURNS void LANGUAGE plpgsql SET search_path=public AS $$
DECLARE nuestra int;
BEGIN
  IF NOT public.has_club_role('directiva') THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF jsonb_array_length(p_filas)=0 THEN RAISE EXCEPTION 'La clasificación está vacía'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(p_filas) f WHERE (f->>'esNuestro')::boolean) <> 1 THEN RAISE EXCEPTION 'Marca exactamente un equipo como nuestro'; END IF;
  DELETE FROM public.clasificacion_equipos WHERE jornada=p_jornada;
  INSERT INTO public.clasificacion_equipos(jornada,posicion,equipo,puntos,pj,g,e,p,gf,gc,es_nuestro)
  SELECT p_jornada,(f->>'posicion')::int,trim(f->>'equipo'),(f->>'puntos')::int,(f->>'pj')::int,(f->>'g')::int,(f->>'e')::int,(f->>'p')::int,(f->>'gf')::int,(f->>'gc')::int,(f->>'esNuestro')::boolean
  FROM jsonb_array_elements(p_filas) f;
  SELECT posicion INTO nuestra FROM public.clasificacion_equipos WHERE jornada=p_jornada AND es_nuestro;
  INSERT INTO public.clasificacion_club(jornada,posicion,actualizado_at,actualizado_por) VALUES (p_jornada,nuestra,now(),auth.uid());
END $$;
GRANT EXECUTE ON FUNCTION public.guardar_clasificacion(int,jsonb) TO authenticated;