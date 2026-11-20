ALTER TABLE public.partidos ADD COLUMN IF NOT EXISTS fecha_confirmada boolean NOT NULL DEFAULT true;
INSERT INTO public.partidos (jornada,rival,es_local,fecha_hora,hora_confirmada,fecha_confirmada,pabellon,jugado)
SELECT j, r, l, (d::date + time '12:00') AT TIME ZONE 'Europe/Madrid', false, false, CASE WHEN l THEN 'Pavillón Municipal de Guntín' ELSE '' END, false
FROM (VALUES
(9,'Luisitalia',true,'2026-11-29'),(10,'Outeiro de Rei S.D. "B"',false,'2026-12-13'),(11,'ADC Fonte do Rei',false,'2026-12-20'),
(12,'Trabada Futsal',true,'2027-01-10'),(13,'Abella F.S.',false,'2027-01-17'),(14,'C.D. Cospeito',true,'2027-01-24'),(15,'Castroverde FS',false,'2027-01-31'),
(16,'Concello de Begonte F.S. "B"',false,'2027-02-07'),(17,'A.D.C. A Piringalla',false,'2027-02-14'),(18,'Pasarela Ribeira F.S. "B"',false,'2027-02-21'),
(19,'Samos Fútbol Sala',true,'2027-02-28'),(20,'U.D. Pastoricense',false,'2027-03-07'),(21,'P.M. Friol FS "B"',true,'2027-03-14'),
(22,'Val do Sil Futsal Quiroga',false,'2027-03-21'),(23,'CD Cubelas FS',true,'2027-04-04'),(24,'Luisitalia',false,'2027-04-11'),
(25,'Outeiro de Rei S.D. "B"',true,'2027-04-18'),(26,'ADC Fonte do Rei',true,'2027-04-25'),(27,'Trabada Futsal',false,'2027-05-02'),
(28,'Abella F.S.',true,'2027-05-09'),(29,'C.D. Cospeito',false,'2027-05-16'),(30,'Castroverde FS',true,'2027-05-23')
) v(j,r,l,d)
WHERE NOT EXISTS (SELECT 1 FROM public.partidos p WHERE p.jornada=v.j);