-- Script para agregar 'consolidacion' como tipo válido en movimientos_stock
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar la restricción CHECK actual
ALTER TABLE movimientos_stock 
DROP CONSTRAINT IF EXISTS movimientos_stock_tipo_check;

-- 2. Crear nueva restricción CHECK incluyendo 'consolidacion'
ALTER TABLE movimientos_stock
ADD CONSTRAINT movimientos_stock_tipo_check 
CHECK (tipo IN ('ingreso', 'egreso', 'venta', 'devolucion_pendiente', 'devolucion_cancelacion', 'consolidacion'));

-- Verificar que se aplicó correctamente
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'movimientos_stock_tipo_check';
