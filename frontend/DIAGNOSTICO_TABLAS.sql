-- DIAGNÓSTICO: Ver estructura y contenido de tablas

-- 1. Ver columnas de la tabla productos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'productos'
ORDER BY ordinal_position;

-- 2. Ver columnas de la tabla presentaciones
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'presentaciones'
ORDER BY ordinal_position;

-- 3. Ver primeros 10 productos (para verificar datos)
SELECT * FROM public.productos LIMIT 10;

-- 4. Ver primeras 10 presentaciones (para verificar datos)
SELECT * FROM public.presentaciones LIMIT 10;

-- Notas:
-- - Si las consultas de arriba no devuelven columnas, es probable que RLS esté bloqueando
-- - Si las consultas devuelven datos, copia y pega el resultado acá para que lo analice
-- - Si ves columnas con nombres distintos (ej. 'peso' en vez de 'peso_kg'), avísame para ajustar el cliente React
