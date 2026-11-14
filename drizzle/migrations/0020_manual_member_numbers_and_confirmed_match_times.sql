CREATE OR REPLACE FUNCTION public.crear_socio_desde_pago(datos jsonb, pago jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n uuid; e text:=lower(trim(datos->>'email')); t text; m text:=pago->>'metodo'; amount numeric; d date; ref text:=nullif(trim(pago->>'referencia'),''); u uuid; num bigint; owner_name text;
BEGIN
IF auth.uid() IS NOT NULL THEN IF NOT public.has_club_role('directiva') OR m='stripe' THEN RAISE EXCEPTION 'No autorizado'; END IF; ELSIF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Pago no verificado'; END IF;
IF coalesce(length(trim(datos->>'nombre')),0) NOT BETWEEN 1 AND 200 OR e IS NULL OR length(e)>254 OR e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR coalesce(datos->>'telefono','') !~ '^$|^[0-9]{9,15}$' THEN RAISE EXCEPTION 'Comprueba los datos'; END IF;
IF m IS NULL OR m NOT IN ('efectivo','transferencia','bizum','stripe') THEN RAISE EXCEPTION 'Método no válido'; END IF;
amount:=(pago->>'importe')::numeric; d:=(pago->>'fecha')::date; IF amount IS NULL OR amount<=0 OR amount='NaN'::numeric OR d IS NULL OR d>(now() AT TIME ZONE 'Europe/Madrid')::date THEN RAISE EXCEPTION 'Indica importe y fecha válidos'; END IF;
IF m='stripe' THEN IF ref IS NULL THEN RAISE EXCEPTION 'Referencia obligatoria'; END IF; SELECT socio_id INTO n FROM public.pagos WHERE metodo='stripe' AND referencia=ref; IF n IS NOT NULL THEN RETURN n; END IF; END IF;
SELECT temporada_actual INTO t FROM public.ajustes_club WHERE id=true; PERFORM pg_advisory_xact_lock(hashtextextended(e,0)); PERFORM pg_advisory_xact_lock(72112611);
SELECT id INTO n FROM public.socios WHERE lower(email)=e ORDER BY fecha_alta LIMIT 1;
IF datos->>'numero_socio' IS NOT NULL THEN num:=(datos->>'numero_socio')::bigint; IF num<1 THEN RAISE EXCEPTION 'Indica un nº de socio válido'; END IF; SELECT nombre INTO owner_name FROM public.socios WHERE numero_socio=num AND id IS DISTINCT FROM n; IF owner_name IS NOT NULL THEN RAISE EXCEPTION 'El nº % ya es de %',num,owner_name; END IF; END IF;
SELECT id INTO u FROM auth.users WHERE lower(email)=e AND email_confirmed_at IS NOT NULL LIMIT 1;
IF n IS NULL THEN
IF num IS NULL THEN SELECT min(candidate) INTO num FROM (SELECT 1::bigint candidate UNION SELECT numero_socio+1 FROM public.socios) candidates WHERE NOT EXISTS(SELECT 1 FROM public.socios WHERE numero_socio=candidate); END IF;
INSERT INTO public.socios(nombre,email,telefono,numero_socio,estado,temporada,fecha_activacion) VALUES(trim(datos->>'nombre'),e,coalesce(datos->>'telefono',''),num,'activa',t,now()) RETURNING id INTO n;
ELSE UPDATE public.socios SET estado='activa',fecha_baja=NULL,motivo_baja=NULL WHERE id=n; END IF;
INSERT INTO public.usuario_roles(email,rol,socio_id,creado_por,user_id,nombre) VALUES(e,'socia',n,auth.uid(),u,trim(datos->>'nombre')) ON CONFLICT(email,rol,socio_id,patrocinador_id) DO UPDATE SET activo=true;
INSERT INTO public.pagos(socio_id,temporada,metodo,importe,fecha_pago,referencia,registrado_por) VALUES(n,t,m,amount,d,ref,auth.uid()); RETURN n; END $$;
ALTER TABLE public.partidos ADD COLUMN hora_confirmada boolean NOT NULL DEFAULT true;
CREATE OR REPLACE FUNCTION public.partido_estado_resultado() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$ BEGIN NEW.jugado := NEW.goles_favor IS NOT NULL AND NEW.goles_contra IS NOT NULL; RETURN NEW; END $$;
CREATE TRIGGER partido_estado_resultado BEFORE INSERT OR UPDATE ON public.partidos FOR EACH ROW EXECUTE FUNCTION public.partido_estado_resultado();
UPDATE public.partidos SET jugado=(goles_favor IS NOT NULL AND goles_contra IS NOT NULL);
GRANT SELECT ON public.estadisticas_liga TO authenticated;
GRANT SELECT ON public.partidos TO authenticated;