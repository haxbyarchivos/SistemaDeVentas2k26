-- Script para asignar presentación predeterminada GELCO (24) a todos los productos que contengan "Gelcoat"
-- Ejecutar en Supabase SQL Editor

-- Primero verificamos qué productos se van a actualizar
SELECT id, nombre, presentacion_predeterminada_id
FROM productos
WHERE nombre ILIKE '%Gelcoat%';

-- Luego actualizamos asignando la presentación GELCO (24)
-- Primero necesitamos obtener el ID de la presentación GELCO (24)
UPDATE productos
SET presentacion_predeterminada_id = (
    SELECT id 
    FROM presentaciones 
    WHERE nombre ILIKE '%GELCO%' 
    AND peso_kg = 24
    LIMIT 1
)
WHERE nombre ILIKE '%Gelcoat%'
AND activo = true;

-- Verificar que se actualizaron correctamente
SELECT p.id, p.nombre, pres.nombre as presentacion, pres.peso_kg
FROM productos p
LEFT JOIN presentaciones pres ON p.presentacion_predeterminada_id = pres.id
WHERE p.nombre ILIKE '%Gelcoat%';
