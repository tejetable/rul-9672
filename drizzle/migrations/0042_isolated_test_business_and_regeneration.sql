ALTER TABLE public.patrocinadores ADD COLUMN es_prueba boolean NOT NULL DEFAULT false;
GRANT SELECT (es_prueba) ON public.patrocinadores TO authenticated;
CREATE POLICY patrocinadores_aislar_pruebas ON public.patrocinadores AS RESTRICTIVE FOR ALL TO authenticated USING (NOT es_prueba OR public.has_club_role('directiva')) WITH CHECK (NOT es_prueba OR public.is_super_admin());
CREATE POLICY ventajas_aislar_pruebas ON public.ventajas AS RESTRICTIVE FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.patrocinadores p WHERE p.id=patrocinador_id AND (NOT p.es_prueba OR public.is_super_admin()))) WITH CHECK (EXISTS(SELECT 1 FROM public.patrocinadores p WHERE p.id=patrocinador_id AND (NOT p.es_prueba OR public.is_super_admin())));
CREATE POLICY socios_aislar_pruebas ON public.socios AS RESTRICTIVE FOR ALL TO authenticated USING (NOT es_prueba OR (public.is_super_admin() AND EXISTS(SELECT 1 FROM public.patrocinadores p WHERE p.id=public.negocio_prueba_actual() AND p.es_prueba))) WITH CHECK (NOT es_prueba);
CREATE POLICY pagos_aislar_pruebas ON public.pagos AS RESTRICTIVE FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.socios s WHERE s.id=socio_id AND NOT s.es_prueba)) WITH CHECK (EXISTS(SELECT 1 FROM public.socios s WHERE s.id=socio_id AND NOT s.es_prueba));
CREATE POLICY visitas_aislar_pruebas ON public.visitas AS RESTRICTIVE FOR ALL TO authenticated USING (NOT es_prueba OR public.is_super_admin()) WITH CHECK (NOT es_prueba OR public.is_super_admin());

CREATE OR REPLACE FUNCTION public.proteger_entidades_prueba() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF TG_OP='UPDATE' AND NEW.es_prueba IS DISTINCT FROM OLD.es_prueba AND auth.role()='authenticated' THEN RAISE EXCEPTION 'No se puede cambiar el tipo de registro'; END IF;
IF TG_TABLE_NAME='visitas' THEN
 IF (EXISTS(SELECT 1 FROM public.patrocinadores WHERE id=NEW.patrocinador_id AND es_prueba) OR EXISTS(SELECT 1 FROM public.socios WHERE id=NEW.socio_id AND es_prueba)) AND NOT NEW.es_prueba THEN RAISE EXCEPTION 'Los datos de prueba solo admiten visitas de prueba'; END IF;
ELSIF TG_TABLE_NAME='pagos' AND EXISTS(SELECT 1 FROM public.socios WHERE id=NEW.socio_id AND es_prueba) THEN RAISE EXCEPTION 'No se registran cobros de prueba';
END IF;
RETURN NEW;
END $$;
CREATE TRIGGER patrocinadores_tipo_prueba BEFORE UPDATE ON public.patrocinadores FOR EACH ROW EXECUTE FUNCTION public.proteger_entidades_prueba();
CREATE TRIGGER socios_tipo_prueba BEFORE UPDATE ON public.socios FOR EACH ROW EXECUTE FUNCTION public.proteger_entidades_prueba();
CREATE TRIGGER visitas_entidades_prueba BEFORE INSERT OR UPDATE ON public.visitas FOR EACH ROW EXECUTE FUNCTION public.proteger_entidades_prueba();
CREATE TRIGGER pagos_entidades_prueba BEFORE INSERT OR UPDATE ON public.pagos FOR EACH ROW EXECUTE FUNCTION public.proteger_entidades_prueba();

CREATE OR REPLACE FUNCTION public.validar_alta_pagada() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NEW.es_prueba AND auth.role() IS DISTINCT FROM 'authenticated' THEN RETURN NEW; END IF;
IF NOT EXISTS(SELECT 1 FROM public.pagos WHERE socio_id=NEW.id AND temporada=NEW.temporada) THEN RAISE EXCEPTION 'El alta requiere un pago registrado'; END IF; RETURN NEW; END $$;

DO $$ DECLARE f text; changed text; BEGIN
f:=pg_get_functiondef('public.validate_club_fields()'::regprocedure);
changed:=replace(f,'IF TG_OP=''INSERT'' AND (NEW.email IS NULL','IF TG_OP=''INSERT'' AND NOT NEW.es_prueba AND (NEW.email IS NULL');
IF changed=f THEN RAISE EXCEPTION 'Validation definition changed'; END IF; EXECUTE changed;
f:=pg_get_functiondef('public.mi_patrocinador()'::regprocedure); EXECUTE replace(f,'AND p.activo ORDER BY','AND p.activo AND NOT p.es_prueba ORDER BY');
f:=pg_get_functiondef('public.entrar_negocio(text)'::regprocedure); EXECUTE replace(f,'WHERE activo AND pin_hash','WHERE activo AND NOT es_prueba AND pin_hash');
f:=pg_get_functiondef('public.enlazar_roles_email()'::regprocedure); EXECUTE replace(replace(f,'OR s.estado=''activa''','OR (s.estado=''activa'' AND NOT s.es_prueba)'), 'OR p.activo','OR (p.activo AND NOT p.es_prueba)');
f:=pg_get_functiondef('public.identificar_socio(bigint)'::regprocedure); EXECUTE replace(f,'AND estado=''activa''','AND estado=''activa'' AND (NOT es_prueba OR (public.is_super_admin() AND EXISTS(SELECT 1 FROM public.patrocinadores WHERE id=n AND es_prueba)))');
f:=pg_get_functiondef('public.gestion_socios()'::regprocedure);
EXECUTE replace(replace(replace(f,'FROM public.pagos p)','FROM public.pagos p JOIN public.socios s ON s.id=p.socio_id WHERE NOT s.es_prueba)'), 'FROM public.usuario_roles r WHERE activo','FROM public.usuario_roles r WHERE activo AND NOT EXISTS(SELECT 1 FROM public.socios s WHERE s.id=r.socio_id AND s.es_prueba)'), 'FROM public.socios WHERE email IS NOT NULL','FROM public.socios WHERE email IS NOT NULL AND NOT es_prueba');
f:=pg_get_functiondef('public.personas_club()'::regprocedure); EXECUTE replace(f,'FROM public.socios WHERE email IS NOT NULL','FROM public.socios WHERE email IS NOT NULL AND NOT es_prueba');
f:=pg_get_functiondef('public.stats_club(text)'::regprocedure);
EXECUTE replace(replace(replace(f,'INTO pats FROM public.patrocinadores;','INTO pats FROM public.patrocinadores WHERE NOT es_prueba;'),'FROM public.socios WHERE estado=''activa''','FROM public.socios WHERE NOT es_prueba AND estado=''activa'''),'WHERE NOT activo AND motivo_baja','WHERE NOT es_prueba AND NOT activo AND motivo_baja');
f:=pg_get_functiondef('public.stats_negocio_datos(uuid,text,boolean)'::regprocedure);
EXECUTE replace(f,'BEGIN IF p_incluir_prueba','BEGIN IF EXISTS(SELECT 1 FROM public.patrocinadores WHERE id=p_patrocinador_id AND es_prueba) AND NOT public.is_super_admin() THEN RAISE EXCEPTION ''Solo Super admin''; END IF; IF p_incluir_prueba');
END $$;

CREATE OR REPLACE FUNCTION public.regenerar_visitas_prueba(p_negocio uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE fila record; ids uuid[]; previous_setting text:=current_setting('club.test_write',true);
BEGIN
IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Solo Super admin'; END IF;
PERFORM 1 FROM public.patrocinadores WHERE id=p_negocio AND es_prueba AND activo FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Solo se pueden regenerar visitas de un negocio de prueba activo'; END IF;
SELECT array_agg(id ORDER BY numero_socio) INTO ids FROM public.socios WHERE es_prueba AND estado='activa' AND numero_socio BETWEEN 9001 AND 9006;
IF coalesce(array_length(ids,1),0)<>6 THEN RAISE EXCEPTION 'Faltan los seis soci@s de prueba'; END IF;
PERFORM set_config('club.test_write','yes',true);
DELETE FROM public.visitas WHERE patrocinador_id=p_negocio AND es_prueba;
FOR fila IN
 WITH candidatos AS (
 SELECT (now() AT TIME ZONE 'Europe/Madrid')::date-d AS dia,slot,
 CASE WHEN slot<=6 THEN ids[slot] ELSE NULL::uuid END AS socio,
 -ln(greatest(random(),0.000001))/(CASE WHEN extract(isodow FROM (now() AT TIME ZONE 'Europe/Madrid')::date-d)>=6 THEN 3 ELSE 1 END + CASE WHEN EXISTS(SELECT 1 FROM public.partidos WHERE (fecha_hora AT TIME ZONE 'Europe/Madrid')::date=(now() AT TIME ZONE 'Europe/Madrid')::date-d AND fecha_confirmada) THEN 3 ELSE 0 END) AS peso
 FROM generate_series(1,89) d CROSS JOIN generate_series(1,8) slot
 ), elegidos AS (SELECT * FROM candidatos ORDER BY peso LIMIT 150)
 SELECT *,row_number() OVER(ORDER BY dia,slot) AS n FROM elegidos ORDER BY dia,slot
LOOP
 INSERT INTO public.visitas(patrocinador_id,socio_id,fecha_hora,origen,tipo_cliente,tramo_gasto,anulada,es_prueba)
 VALUES(p_negocio,fila.socio,(fila.dia+time '12:00'+(fila.slot*interval '45 minutes')) AT TIME ZONE 'Europe/Madrid',CASE WHEN fila.socio IS NULL THEN 'sin_carnet' WHEN fila.n%2=0 THEN 'qr' ELSE 'numero' END,CASE WHEN fila.n%3=0 THEN 'nueva' ELSE 'ya_era_clienta' END,(ARRAY['lt20','20_50','50_100','gt100',NULL::text])[1+(fila.n%5)::integer],fila.n%30=0,true);
END LOOP;
PERFORM set_config('club.test_write',coalesce(previous_setting,''),true);
RETURN 150;
END $$;
REVOKE ALL ON FUNCTION public.regenerar_visitas_prueba(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.regenerar_visitas_prueba(uuid) TO authenticated;
