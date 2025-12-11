-- Script para asignar presentación predeterminada CERA a todos los productos que contengan "Cera"
-- Ejecutar en Supabase SQL Editor

-- Primero verificamos qué productos se van a actualizar
SELECT id, nombre, presentacion_predeterminada_id
FROM productos
WHERE nombre ILIKE '%Cera%';

-- Luego actualizamos asignando la presentación CERA
UPDATE productos
SET presentacion_predeterminada_id = (
    SELECT id 
    FROM presentaciones 
    WHERE nombre ILIKE '%CERA%'
    LIMIT 1
)
WHERE nombre ILIKE '%Cera%'
AND activo = true;

-- Verificar que se actualizaron correctamente
SELECT p.id, p.nombre, pres.nombre as presentacion, pres.peso_kg
FROM productos p
LEFT JOIN presentaciones pres ON p.presentacion_predeterminada_id = pres.id
WHERE p.nombre ILIKE '%Cera%';
