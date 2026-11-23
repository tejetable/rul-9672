CREATE OR REPLACE FUNCTION public.proteger_entidades_prueba() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF TG_TABLE_NAME IN ('socios','patrocinadores') THEN
 IF TG_OP='UPDATE' AND NEW.es_prueba IS DISTINCT FROM OLD.es_prueba AND auth.role()='authenticated' THEN RAISE EXCEPTION 'No se puede cambiar el tipo de registro'; END IF;
END IF;
IF TG_TABLE_NAME='visitas' THEN
 IF (EXISTS(SELECT 1 FROM public.patrocinadores WHERE id=NEW.patrocinador_id AND es_prueba) OR EXISTS(SELECT 1 FROM public.socios WHERE id=NEW.socio_id AND es_prueba)) AND NOT NEW.es_prueba THEN RAISE EXCEPTION 'Los datos de prueba solo admiten visitas de prueba'; END IF;
ELSIF TG_TABLE_NAME='pagos' THEN
 IF EXISTS(SELECT 1 FROM public.socios WHERE id=NEW.socio_id AND es_prueba) THEN RAISE EXCEPTION 'No se registran cobros de prueba'; END IF;
END IF;
RETURN NEW;
END $$;