ALTER TABLE public.partidos ADD COLUMN IF NOT EXISTS rival_corto text CHECK (rival_corto IS NULL OR length(rival_corto)<=60);
UPDATE public.partidos p SET rival_corto=v.c FROM (VALUES (1,'Begonte B'),(2,'A Piringalla'),(3,'Ribeira B'),(4,'Samos'),(5,'Pastoricense'),(6,'Friol B'),(7,'Val do Sil'),(8,'Cubelas'),(9,'Luisitalia'),(10,'Outeiro de Rei B')) v(j,c) WHERE p.jornada=v.j;

ALTER TABLE public.patrocinadores ADD COLUMN IF NOT EXISTS telefono text CHECK (telefono IS NULL OR length(telefono)<=30), ADD COLUMN IF NOT EXISTS horario text CHECK (horario IS NULL OR length(horario)<=300), ADD COLUMN IF NOT EXISTS web text CHECK (web IS NULL OR length(web)<=300);

ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS publico text NOT NULL DEFAULT 'socios' CHECK (publico IN ('socios','negocios','todos'));
UPDATE public.avisos SET publico=CASE destinatarios WHEN 'socias' THEN 'socios' WHEN 'negocios' THEN 'negocios' ELSE 'todos' END;
CREATE OR REPLACE FUNCTION public.sync_aviso_publico() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='UPDATE' AND NEW.destinatarios IS DISTINCT FROM OLD.destinatarios AND NEW.publico IS NOT DISTINCT FROM OLD.publico THEN
    NEW.publico := CASE NEW.destinatarios WHEN 'socias' THEN 'socios' WHEN 'negocios' THEN 'negocios' ELSE 'todos' END;
  ELSIF TG_OP='INSERT' AND NEW.destinatarios IS NOT NULL AND NEW.destinatarios<>'todos' AND NEW.publico='socios' THEN
    NEW.publico := CASE NEW.destinatarios WHEN 'negocios' THEN 'negocios' ELSE 'socios' END;
  END IF;
  NEW.destinatarios := CASE NEW.publico WHEN 'socios' THEN 'socias' ELSE NEW.publico END;
  RETURN NEW;
END $$;
CREATE TRIGGER aviso_publico BEFORE INSERT OR UPDATE ON public.avisos FOR EACH ROW EXECUTE FUNCTION public.sync_aviso_publico();
COMMENT ON COLUMN public.avisos.destinatarios IS 'DEPRECATED: replaced by publico (kept in sync by trigger)';
DROP POLICY IF EXISTS avisos_lectura ON public.avisos;
CREATE POLICY avisos_lectura ON public.avisos FOR SELECT TO authenticated USING (public.has_club_role('directiva') OR (public.mi_socio() IS NOT NULL AND publico IN ('todos','socios')) OR (public.mi_patrocinador() IS NOT NULL AND publico IN ('todos','negocios')));