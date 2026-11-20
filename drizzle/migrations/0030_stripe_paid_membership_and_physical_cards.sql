ALTER TABLE public.ajustes_club ADD COLUMN email_avisos text NOT NULL DEFAULT 'realunionlucensefs@gmail.com';
ALTER TABLE public.socios ADD COLUMN carnet_fisico text NOT NULL DEFAULT 'pendiente' CHECK(carnet_fisico IN ('pendiente','entregado'));
ALTER TABLE public.socios ADD COLUMN fecha_entrega timestamptz;
ALTER TABLE public.socios ADD COLUMN es_prueba boolean NOT NULL DEFAULT false;
ALTER TABLE public.pagos ADD COLUMN estado text NOT NULL DEFAULT 'pagado' CHECK(estado IN ('pagado','reembolsado'));
ALTER TABLE public.pagos ADD COLUMN detalle_metodo text;
ALTER TABLE public.pagos ADD COLUMN reembolsado_at timestamptz;
CREATE TABLE public.stripe_checkouts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),session_id text UNIQUE,nombre text NOT NULL,email text NOT NULL,telefono text NOT NULL DEFAULT '',temporada text NOT NULL,importe_centimos integer NOT NULL CHECK(importe_centimos>0),consentimiento_at timestamptz NOT NULL DEFAULT now(),es_prueba boolean NOT NULL,socio_id uuid REFERENCES public.socios(id) ON DELETE SET NULL,user_id uuid,auth_nuevo boolean NOT NULL DEFAULT false,password_claimed_at timestamptz,password_saved_at timestamptz,pagado_at timestamptz,creado_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.stripe_checkouts TO authenticated; GRANT ALL ON public.stripe_checkouts TO service_role;
ALTER TABLE public.stripe_checkouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY stripe_checkouts_super ON public.stripe_checkouts FOR SELECT TO authenticated USING(public.is_super_admin());
CREATE TABLE public.stripe_eventos(event_id text PRIMARY KEY,tipo text NOT NULL,estado text NOT NULL DEFAULT 'recibido' CHECK(estado IN ('recibido','procesado','error')),session_id text,socio_id uuid REFERENCES public.socios(id) ON DELETE SET NULL,error text,creado_at timestamptz NOT NULL DEFAULT now(),procesado_at timestamptz);
GRANT SELECT ON public.stripe_eventos TO authenticated; GRANT ALL ON public.stripe_eventos TO service_role;
ALTER TABLE public.stripe_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY stripe_eventos_super ON public.stripe_eventos FOR SELECT TO authenticated USING(public.is_super_admin());
CREATE TABLE public.emails_log(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),clave text UNIQUE NOT NULL,destinatario text NOT NULL,asunto text NOT NULL,estado text NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente','enviado','error')),error text,provider_id text,intentos integer NOT NULL DEFAULT 0,creado_at timestamptz NOT NULL DEFAULT now(),enviado_at timestamptz);
GRANT SELECT ON public.emails_log TO authenticated; GRANT ALL ON public.emails_log TO service_role;
ALTER TABLE public.emails_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY emails_log_super ON public.emails_log FOR SELECT TO authenticated USING(public.is_super_admin());
CREATE FUNCTION public.stripe_auth_email(p_email text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT CASE WHEN auth.role()='service_role' THEN (SELECT jsonb_build_object('id',u.id,'confirmed',u.email_confirmed_at IS NOT NULL) FROM auth.users u WHERE lower(u.email)=lower(trim(p_email)) LIMIT 1) ELSE NULL END $$;
REVOKE ALL ON FUNCTION public.stripe_auth_email(text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.stripe_auth_email(text) TO service_role;
CREATE FUNCTION public.procesar_alta_stripe(p_event text,p_session text,p_referencia text,p_importe integer,p_prueba boolean,p_fecha timestamptz,p_metodo text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.stripe_checkouts; n uuid; BEGIN
IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Pago no verificado'; END IF;
SELECT * INTO c FROM public.stripe_checkouts WHERE session_id=p_session FOR UPDATE;
IF NOT FOUND OR p_referencia IS NULL OR p_importe<>c.importe_centimos OR p_prueba IS DISTINCT FROM c.es_prueba THEN RAISE EXCEPTION 'Pago no coincide con el alta'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(p_referencia,0));
SELECT socio_id INTO n FROM public.pagos WHERE metodo='stripe' AND referencia=p_referencia;
IF n IS NULL THEN
n:=public.crear_socio_desde_pago(jsonb_build_object('nombre',c.nombre,'email',c.email,'telefono',c.telefono),jsonb_build_object('metodo','stripe','importe',p_importe/100.0,'fecha',(p_fecha AT TIME ZONE 'Europe/Madrid')::date,'referencia',p_referencia));
UPDATE public.socios SET temporada=c.temporada,mayor_de_edad=true,consentimiento_at=c.consentimiento_at,carnet_fisico='pendiente',fecha_entrega=NULL,es_prueba=CASE WHEN es_prueba THEN true ELSE c.es_prueba AND NOT EXISTS(SELECT 1 FROM public.pagos WHERE socio_id=n AND metodo<>'stripe') END WHERE id=n;
UPDATE public.pagos SET temporada=c.temporada,detalle_metodo=p_metodo WHERE metodo='stripe' AND referencia=p_referencia;
END IF;
UPDATE public.stripe_checkouts SET socio_id=n,pagado_at=coalesce(pagado_at,p_fecha) WHERE id=c.id;
UPDATE public.stripe_eventos SET socio_id=n,session_id=p_session WHERE event_id=p_event;
RETURN n; END $$;
REVOKE ALL ON FUNCTION public.procesar_alta_stripe(text,text,text,integer,boolean,timestamptz,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.procesar_alta_stripe(text,text,text,integer,boolean,timestamptz,text) TO service_role;
CREATE FUNCTION public.vincular_auth_stripe(p_session text,p_user uuid,p_nuevo boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE c public.stripe_checkouts; BEGIN
IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'No autorizado'; END IF;
SELECT * INTO c FROM public.stripe_checkouts WHERE session_id=p_session FOR UPDATE;
IF c.pagado_at IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user AND lower(email)=c.email AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'Acceso no verificado'; END IF;
UPDATE public.stripe_checkouts SET user_id=p_user,auth_nuevo=auth_nuevo OR p_nuevo WHERE id=c.id;
UPDATE public.usuario_roles SET user_id=p_user WHERE socio_id=c.socio_id AND rol='socia' AND (user_id IS NULL OR user_id=p_user);
INSERT INTO public.profiles(id,email,socio_id) VALUES(p_user,c.email,c.socio_id) ON CONFLICT(id) DO UPDATE SET socio_id=excluded.socio_id;
END $$;
REVOKE ALL ON FUNCTION public.vincular_auth_stripe(text,uuid,boolean) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.vincular_auth_stripe(text,uuid,boolean) TO service_role;
CREATE FUNCTION public.password_alta_stripe(p_session text,p_accion text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE c public.stripe_checkouts; BEGIN
IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'No autorizado'; END IF;
SELECT * INTO c FROM public.stripe_checkouts WHERE session_id=p_session FOR UPDATE;
IF NOT FOUND OR c.pagado_at IS NULL OR c.pagado_at<now()-interval '7 days' OR c.user_id IS NULL OR NOT c.auth_nuevo OR EXISTS(SELECT 1 FROM public.usuario_roles WHERE email=c.email AND activo AND rol<>'socia') THEN RAISE EXCEPTION 'Entra con tu acceso habitual o contacta con el club'; END IF;
IF p_accion='claim' THEN
IF c.password_saved_at IS NOT NULL OR c.password_claimed_at>now()-interval '2 minutes' OR EXISTS(SELECT 1 FROM public.profiles WHERE id=c.user_id AND tiene_password) OR EXISTS(SELECT 1 FROM auth.users WHERE id=c.user_id AND coalesce(encrypted_password,'')<>'') OR EXISTS(SELECT 1 FROM auth.identities WHERE user_id=c.user_id AND provider='google') THEN RAISE EXCEPTION 'La contraseña ya existe o el acceso está en curso'; END IF;
UPDATE public.stripe_checkouts SET password_claimed_at=now() WHERE id=c.id;
ELSIF p_accion='done' THEN
IF c.password_claimed_at IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=c.user_id AND coalesce(encrypted_password,'')<>'') THEN RAISE EXCEPTION 'Guarda primero la contraseña'; END IF;
UPDATE public.profiles SET tiene_password=true,debe_cambiar_password=false WHERE id=c.user_id;
UPDATE public.stripe_checkouts SET password_saved_at=now() WHERE id=c.id;
INSERT INTO public.registro_permisos(actor_id,afectado_id,accion,motivo) VALUES(c.user_id,c.user_id,'password_inicial_pago','Acceso inicial tras pago verificado');
ELSIF p_accion='release' THEN UPDATE public.stripe_checkouts SET password_claimed_at=NULL WHERE id=c.id AND password_saved_at IS NULL;
ELSE RAISE EXCEPTION 'Acción no válida'; END IF; RETURN c.user_id; END $$;
REVOKE ALL ON FUNCTION public.password_alta_stripe(text,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.password_alta_stripe(text,text) TO service_role;
CREATE FUNCTION public.entregar_carnet_fisico(p_socio uuid,p_entregado boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT public.has_club_role('directiva') THEN RAISE EXCEPTION 'No autorizado'; END IF;
UPDATE public.socios SET carnet_fisico=CASE WHEN p_entregado THEN 'entregado' ELSE 'pendiente' END,fecha_entrega=CASE WHEN p_entregado THEN coalesce(fecha_entrega,now()) ELSE NULL END WHERE id=p_socio;
END $$;
REVOKE ALL ON FUNCTION public.entregar_carnet_fisico(uuid,boolean) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.entregar_carnet_fisico(uuid,boolean) TO authenticated;
CREATE FUNCTION public.proteger_datos_pago_stripe() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF auth.role() IS DISTINCT FROM 'service_role' AND (NEW.es_prueba IS DISTINCT FROM OLD.es_prueba) THEN RAISE EXCEPTION 'No autorizado'; END IF; IF NEW.carnet_fisico IS DISTINCT FROM OLD.carnet_fisico THEN IF NOT public.has_club_role('directiva') AND auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'No autorizado'; END IF; NEW.fecha_entrega:=CASE WHEN NEW.carnet_fisico='entregado' THEN coalesce(NEW.fecha_entrega,now()) ELSE NULL END; END IF; RETURN NEW; END $$;
CREATE TRIGGER proteger_datos_pago_stripe BEFORE UPDATE ON public.socios FOR EACH ROW EXECUTE FUNCTION public.proteger_datos_pago_stripe();