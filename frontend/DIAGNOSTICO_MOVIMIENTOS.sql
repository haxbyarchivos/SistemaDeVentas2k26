-- ============================================
-- DIAGNÓSTICO Y REPARACIÓN: MÓDULO MOVIMIENTOS
-- ============================================
-- Este script verifica y repara la estructura de datos
-- para sincronizar el módulo de Movimientos con el historial de clientes

-- ============================================
-- 1. VERIFICAR ESTRUCTURA DE TABLAS
-- ============================================

-- Verificar que existe la tabla de movimientos
SELECT 
    table_name, 
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('cuenta_corriente_movimientos', 'movimientos_caja');

-- Verificar estructura de cuenta_corriente_movimientos
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cuenta_corriente_movimientos'
ORDER BY ordinal_position;

-- ============================================
-- 2. VERIFICAR RELACIONES (FOREIGN KEYS)
-- ============================================

-- Verificar foreign keys existentes
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'cuenta_corriente_movimientos';

-- ============================================
-- 3. VERIFICAR DATOS EXISTENTES
-- ============================================

-- Contar movimientos totales
SELECT 
    COUNT(*) as total_movimientos,
    COUNT(DISTINCT cliente_id) as clientes_con_movimientos,
    COUNT(CASE WHEN venta_id IS NOT NULL THEN 1 END) as movimientos_con_venta,
    COUNT(CASE WHEN venta_id IS NULL THEN 1 END) as movimientos_manuales
FROM cuenta_corriente_movimientos;

-- Contar por tipo de movimiento
SELECT 
    tipo,
    COUNT(*) as cantidad,
    SUM(monto) as monto_total
FROM cuenta_corriente_movimientos
GROUP BY tipo
ORDER BY cantidad DESC;

-- Verificar movimientos sin nombre de cliente (problema de JOIN)
SELECT 
    m.id,
    m.cliente_id,
    c.nombre as cliente_nombre,
    m.tipo,
    m.monto,
    m.created_at
FROM cuenta_corriente_movimientos m
LEFT JOIN clientes c ON m.cliente_id = c.id
WHERE c.id IS NULL
LIMIT 10;

-- ============================================
-- 4. VERIFICAR VISTA DE SALDOS
-- ============================================

-- Verificar que existe la vista
SELECT 
    table_name, 
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'vista_saldos_clientes';

-- Si la vista existe, ver su contenido
SELECT 
    cliente_id,
    cliente_nombre,
    saldo_total,
    ultimo_movimiento
FROM vista_saldos_clientes
ORDER BY saldo_total DESC
LIMIT 10;

-- ============================================
-- 5. CREAR FOREIGN KEY SI NO EXISTE
-- ============================================

-- Esto asegura que la relación con clientes está correctamente definida
DO $$
BEGIN
    -- Verificar si ya existe la FK
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_cuenta_corriente_cliente'
          AND table_name = 'cuenta_corriente_movimientos'
    ) THEN
        -- Crear la foreign key
        ALTER TABLE cuenta_corriente_movimientos
        ADD CONSTRAINT fk_cuenta_corriente_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key fk_cuenta_corriente_cliente creada exitosamente';
    ELSE
        RAISE NOTICE 'Foreign key fk_cuenta_corriente_cliente ya existe';
    END IF;
    
    -- Verificar FK con ventas
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_cuenta_corriente_venta'
          AND table_name = 'cuenta_corriente_movimientos'
    ) THEN
        -- Crear la foreign key
        ALTER TABLE cuenta_corriente_movimientos
        ADD CONSTRAINT fk_cuenta_corriente_venta
        FOREIGN KEY (venta_id) REFERENCES ventas(id)
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key fk_cuenta_corriente_venta creada exitosamente';
    ELSE
        RAISE NOTICE 'Foreign key fk_cuenta_corriente_venta ya existe';
    END IF;
END $$;

-- ============================================
-- 6. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================

-- Índice para búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_cuenta_corriente_cliente_id 
ON cuenta_corriente_movimientos(cliente_id);

-- Índice para ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_cuenta_corriente_created_at 
ON cuenta_corriente_movimientos(created_at DESC);

-- Índice para filtrado por tipo
CREATE INDEX IF NOT EXISTS idx_cuenta_corriente_tipo 
ON cuenta_corriente_movimientos(tipo);

-- Índice para búsquedas por venta
CREATE INDEX IF NOT EXISTS idx_cuenta_corriente_venta_id 
ON cuenta_corriente_movimientos(venta_id);

-- ============================================
-- 7. CREAR VISTA MEJORADA (SI SE NECESITA)
-- ============================================

-- Vista que combina movimientos con información del cliente y venta
CREATE OR REPLACE VIEW vista_movimientos_completa AS
SELECT 
    m.id,
    m.cliente_id,
    c.nombre as cliente_nombre,
    c.email as cliente_email,
    c.telefono as cliente_telefono,
    m.tipo,
    m.monto,
    m.descripcion,
    m.venta_id,
    v.numero_cotizacion,
    v.estado as estado_venta,
    v.total_ars as total_venta,
    m.created_by,
    m.created_at,
    m.updated_at,
    -- Indicador de si es manual o automático
    CASE 
        WHEN m.venta_id IS NULL THEN 'Manual'
        ELSE 'Automático'
    END as origen,
    -- Calcular saldo acumulado (usando window function)
    SUM(
        CASE 
            WHEN m.tipo = 'debito' THEN m.monto
            WHEN m.tipo = 'credito' THEN -m.monto
            WHEN m.tipo = 'ajuste' THEN m.monto
            ELSE 0
        END
    ) OVER (
        PARTITION BY m.cliente_id 
        ORDER BY m.created_at, m.id
    ) as saldo_acumulado
FROM cuenta_corriente_movimientos m
LEFT JOIN clientes c ON m.cliente_id = c.id
LEFT JOIN ventas v ON m.venta_id = v.id
ORDER BY m.created_at DESC;

-- ============================================
-- 8. VERIFICACIÓN FINAL
-- ============================================

-- Test query completa como la que usa la aplicación
SELECT 
    m.*,
    json_build_object(
        'id', c.id,
        'nombre', c.nombre
    ) as clientes,
    json_build_object(
        'id', v.id,
        'numero_cotizacion', v.numero_cotizacion,
        'total_ars', v.total_ars,
        'estado', v.estado
    ) as ventas
FROM cuenta_corriente_movimientos m
LEFT JOIN clientes c ON m.cliente_id = c.id
LEFT JOIN ventas v ON m.venta_id = v.id
ORDER BY m.created_at DESC
LIMIT 20;

-- Resultado esperado de estadísticas
SELECT 
    COUNT(*) as total_movimientos,
    COUNT(DISTINCT cliente_id) as clientes_unicos,
    SUM(CASE WHEN tipo = 'debito' THEN monto ELSE 0 END) as total_debitos,
    SUM(CASE WHEN tipo = 'credito' THEN monto ELSE 0 END) as total_creditos,
    SUM(CASE WHEN tipo = 'ajuste' THEN monto ELSE 0 END) as total_ajustes
FROM cuenta_corriente_movimientos;

-- ============================================
-- 9. MENSAJES DE RESULTADO
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Diagnóstico completado';
    RAISE NOTICE 'Revisa los resultados anteriores para verificar:';
    RAISE NOTICE '1. Que la tabla cuenta_corriente_movimientos existe';
    RAISE NOTICE '2. Que las foreign keys están creadas';
    RAISE NOTICE '3. Que hay datos en la tabla';
    RAISE NOTICE '4. Que los índices están optimizados';
    RAISE NOTICE '5. Que la vista vista_movimientos_completa funciona';
END $$;
