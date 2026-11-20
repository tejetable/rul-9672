REVOKE EXECUTE ON FUNCTION public.identificar_socio(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.identificar_socio(bigint) TO authenticated;