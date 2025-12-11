-- Script para agregar columna presentacion_predeterminada_id a la tabla productos
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar la columna (puede ser NULL porque no todos los productos tendrán presentación predeterminada)
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS presentacion_predeterminada_id BIGINT;

-- 2. Agregar foreign key a la tabla presentaciones
ALTER TABLE productos
ADD CONSTRAINT fk_productos_presentacion_predeterminada
FOREIGN KEY (presentacion_predeterminada_id) 
REFERENCES presentaciones(id)
ON DELETE SET NULL;

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'productos' 
AND column_name = 'presentacion_predeterminada_id';
