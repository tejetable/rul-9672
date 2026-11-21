CREATE TABLE IF NOT EXISTS public.clubes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, nombre text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubes TO authenticated;
GRANT ALL ON public.clubes TO service_role;
ALTER TABLE public.clubes ENABLE ROW LEVEL SECURITY;
CREATE POLICY clubes_leer ON public.clubes FOR SELECT TO authenticated USING (true);
CREATE POLICY clubes_escribir ON public.clubes FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
INSERT INTO public.clubes(slug,nombre) VALUES ('rulucense','Real Unión Lucense F.S.') ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.club_principal() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT id FROM public.clubes WHERE slug='rulucense' $$;

CREATE TABLE public.jugadores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), club_id uuid NOT NULL DEFAULT public.club_principal() REFERENCES public.clubes(id), nombre text NOT NULL, apodo text NOT NULL, dorsal int CHECK (dorsal IS NULL OR dorsal >= 0), activo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jugadores TO authenticated;
GRANT ALL ON public.jugadores TO service_role;
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY jugadores_leer ON public.jugadores FOR SELECT TO authenticated USING (true);
CREATE POLICY jugadores_escribir ON public.jugadores FOR ALL TO authenticated USING (public.has_club_role('directiva')) WITH CHECK (public.has_club_role('directiva'));

CREATE TABLE public.estadisticas_partido (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), club_id uuid NOT NULL DEFAULT public.club_principal() REFERENCES public.clubes(id), partido_id uuid NOT NULL REFERENCES public.partidos(id) ON DELETE CASCADE, jugador_id uuid NOT NULL REFERENCES public.jugadores(id), goles int NOT NULL DEFAULT 0 CHECK (goles>=0), asistencias int NOT NULL DEFAULT 0 CHECK (asistencias>=0), amarillas int NOT NULL DEFAULT 0 CHECK (amarillas>=0), rojas int NOT NULL DEFAULT 0 CHECK (rojas>=0), UNIQUE (partido_id, jugador_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estadisticas_partido TO authenticated;
GRANT ALL ON public.estadisticas_partido TO service_role;
ALTER TABLE public.estadisticas_partido ENABLE ROW LEVEL SECURITY;
CREATE POLICY estadisticas_leer ON public.estadisticas_partido FOR SELECT TO authenticated USING (true);
CREATE POLICY estadisticas_escribir ON public.estadisticas_partido FOR ALL TO authenticated USING (public.has_club_role('directiva')) WITH CHECK (public.has_club_role('directiva'));

CREATE OR REPLACE FUNCTION public.validar_estadistica_club() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.club_id IS DISTINCT FROM (SELECT club_id FROM public.jugadores WHERE id=NEW.jugador_id) THEN RAISE EXCEPTION 'El jugador no pertenece a este club'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER estadistica_club BEFORE INSERT OR UPDATE ON public.estadisticas_partido FOR EACH ROW EXECUTE FUNCTION public.validar_estadistica_club();

CREATE OR REPLACE FUNCTION public.validar_goles_partido() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE total int; favor int;
BEGIN
  SELECT coalesce(sum(goles),0) INTO total FROM public.estadisticas_partido WHERE partido_id=NEW.partido_id;
  SELECT coalesce(goles_favor,0) INTO favor FROM public.partidos WHERE id=NEW.partido_id;
  IF total>favor THEN RAISE EXCEPTION 'Hay % goles asignados y el R.U. Lucense marcó %', total, favor; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER goles_partido AFTER INSERT OR UPDATE ON public.estadisticas_partido DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.validar_goles_partido();

CREATE OR REPLACE FUNCTION public.guardar_estadisticas(p_partido uuid, p_filas jsonb) RETURNS void LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NOT public.has_club_role('directiva') THEN RAISE EXCEPTION 'No autorizado'; END IF;
  DELETE FROM public.estadisticas_partido WHERE partido_id=p_partido;
  INSERT INTO public.estadisticas_partido(partido_id,jugador_id,goles,asistencias,amarillas,rojas)
  SELECT p_partido,(f->>'jugadorId')::uuid,coalesce((f->>'goles')::int,0),coalesce((f->>'asistencias')::int,0),coalesce((f->>'amarillas')::int,0),coalesce((f->>'rojas')::int,0)
  FROM jsonb_array_elements(p_filas) f
  WHERE coalesce((f->>'goles')::int,0)+coalesce((f->>'asistencias')::int,0)+coalesce((f->>'amarillas')::int,0)+coalesce((f->>'rojas')::int,0)>0;
END $$;
GRANT EXECUTE ON FUNCTION public.guardar_estadisticas(uuid,jsonb) TO authenticated;

CREATE VIEW public.maximos_goleadores WITH (security_invoker=true) AS
SELECT j.id jugador_id, j.apodo, j.dorsal, coalesce(sum(e.goles),0)::int goles, coalesce(sum(e.asistencias),0)::int asistencias
FROM public.jugadores j LEFT JOIN public.estadisticas_partido e ON e.jugador_id=j.id
GROUP BY j.id ORDER BY 4 DESC, 5 DESC, j.apodo;
GRANT SELECT ON public.maximos_goleadores TO authenticated;

INSERT INTO public.jugadores(nombre,apodo,dorsal) VALUES ('Ángel','Ángel',4),('Manu','Manu',6),('Buján','Buján',8),('Vidal','Vidal',10),('Tejeda','Tejeda',11),('Óscar','Óscar',13),('Guille','Guille',16),('Goás','Goás',21),('Rubén','Rubi',23);

INSERT INTO public.estadisticas_partido(partido_id,jugador_id,goles,asistencias,amarillas)
SELECT p.id, j.id, v.g, v.a, v.ta FROM (VALUES
(1,'Buján',2,0,0),(1,'Vidal',1,0,0),(1,'Guille',1,0,0),(1,'Manu',1,2,0),(1,'Tejeda',0,1,0),
(2,'Manu',5,3,0),(2,'Buján',3,0,0),(2,'Guille',2,1,0),(2,'Tejeda',1,1,0),(2,'Goás',1,0,0),(2,'Óscar',0,1,0),
(3,'Rubi',2,2,0),(3,'Tejeda',2,0,0),(3,'Manu',2,1,0),(3,'Goás',1,0,0),(3,'Buján',0,1,0),
(4,'Guille',2,0,0),(4,'Manu',1,1,0),(4,'Ángel',0,1,0),
(5,'Manu',4,2,0),(5,'Goás',2,2,0),(5,'Buján',2,0,0),(5,'Guille',1,2,0),(5,'Ángel',0,1,0),
(6,'Goás',4,3,0),(6,'Rubi',2,3,0),(6,'Manu',2,3,1),(6,'Guille',2,0,0),(6,'Tejeda',0,1,0),
(7,'Rubi',3,0,0),(7,'Manu',1,1,0),(7,'Tejeda',1,1,0),(7,'Vidal',1,0,0),(7,'Goás',1,2,0),(7,'Buján',1,1,0),(7,'Ángel',0,1,0)
) v(jor,apodo,g,a,ta) JOIN public.partidos p ON p.jornada=v.jor JOIN public.jugadores j ON j.apodo=v.apodo;