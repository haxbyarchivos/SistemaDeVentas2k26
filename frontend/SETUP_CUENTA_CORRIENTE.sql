-- ====================================================
-- SCRIPT DE CREACIÓN DE MÓDULO CUENTAS CORRIENTES
-- Sistema de Ventas 2K26
-- ====================================================
-- INSTRUCCIONES: Ejecutar este script en el editor SQL de Supabase
-- ====================================================

-- 1. Crear tabla de movimientos de cuenta corriente
-- Esta tabla actúa como un historial financiero de cada cliente
CREATE TABLE IF NOT EXISTS cuenta_corriente_movimientos (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL,
  monto DECIMAL(10, 2) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('debito', 'credito', 'ajuste')),
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  
  -- Índices para mejorar el rendimiento
  CONSTRAINT movimiento_monto_check CHECK (monto != 0)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_cuenta_corriente_cliente ON cuenta_corriente_movimientos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cuenta_corriente_venta ON cuenta_corriente_movimientos(venta_id);
CREATE INDEX IF NOT EXISTS idx_cuenta_corriente_fecha ON cuenta_corriente_movimientos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cuenta_corriente_tipo ON cuenta_corriente_movimientos(tipo);

-- ====================================================
-- 2. FUNCIÓN PARA CREAR MOVIMIENTO AL REALIZAR UNA VENTA
-- ====================================================
-- Esta función se dispara cuando el estado de una venta cambia a 'vendido'
CREATE OR REPLACE FUNCTION registrar_movimiento_venta()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la venta cambia a estado 'vendido', crear un movimiento de débito
  IF NEW.estado = 'vendido' AND (OLD.estado IS NULL OR OLD.estado != 'vendido') THEN
    INSERT INTO cuenta_corriente_movimientos (
      cliente_id, 
      venta_id, 
      monto, 
      tipo, 
      descripcion,
      created_at
    )
    VALUES (
      NEW.cliente_id,
      NEW.id,
      NEW.total_ars,
      'debito',
      'Venta #' || COALESCE(NEW.numero_cotizacion, NEW.id::text) || ' - ' || COALESCE(NEW.cliente_nombre, 'Cliente'),
      NEW.created_at
    );
  END IF;

  -- Si la venta cambia de 'vendido' a 'cancelado' o 'cancelada', revertir el movimiento
  IF (NEW.estado = 'cancelado' OR NEW.estado = 'cancelada') AND OLD.estado = 'vendido' THEN
    INSERT INTO cuenta_corriente_movimientos (
      cliente_id, 
      venta_id, 
      monto, 
      tipo, 
      descripcion,
      created_at
    )
    VALUES (
      NEW.cliente_id,
      NEW.id,
      NEW.total_ars,
      'credito',
      'Cancelación de venta #' || COALESCE(NEW.numero_cotizacion, NEW.id::text),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================
-- 3. CREAR TRIGGER PARA VENTAS
-- ====================================================
DROP TRIGGER IF EXISTS trigger_venta_cuenta_corriente ON ventas;
CREATE TRIGGER trigger_venta_cuenta_corriente
  AFTER INSERT OR UPDATE OF estado ON ventas
  FOR EACH ROW
  EXECUTE FUNCTION registrar_movimiento_venta();

-- ====================================================
-- 4. VISTA PARA CONSULTAR SALDOS CONSOLIDADOS
-- ====================================================
-- Esta vista facilita la consulta de saldos por cliente
CREATE OR REPLACE VIEW vista_saldos_clientes AS
SELECT 
  c.id AS cliente_id,
  c.nombre AS cliente_nombre,
  c.telefono AS cuit,
  c.direccion AS email,
  COALESCE(SUM(
    CASE 
      WHEN m.tipo = 'debito' THEN m.monto
      WHEN m.tipo = 'credito' THEN -m.monto
      WHEN m.tipo = 'ajuste' THEN m.monto
      ELSE 0
    END
  ), 0) AS saldo_total,
  COUNT(m.id) AS cantidad_movimientos,
  MAX(m.created_at) AS ultimo_movimiento
FROM clientes c
LEFT JOIN cuenta_corriente_movimientos m ON c.id = m.cliente_id
GROUP BY c.id, c.nombre, c.telefono, c.direccion
ORDER BY c.nombre;

-- ====================================================
-- 5. FUNCIÓN PARA OBTENER SALDO DE UN CLIENTE
-- ====================================================
CREATE OR REPLACE FUNCTION obtener_saldo_cliente(cliente_uuid BIGINT)
RETURNS DECIMAL AS $$
DECLARE
  saldo DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN tipo = 'debito' THEN monto
      WHEN tipo = 'credito' THEN -monto
      WHEN tipo = 'ajuste' THEN monto
      ELSE 0
    END
  ), 0) INTO saldo
  FROM cuenta_corriente_movimientos
  WHERE cliente_id = cliente_uuid;
  
  RETURN saldo;
END;
$$ LANGUAGE plpgsql;

-- ====================================================
-- 6. DATOS INICIALES (OPCIONAL)
-- ====================================================
-- Si ya tienes ventas en estado 'vendido', ejecuta esto para crear
-- los movimientos históricos en la cuenta corriente:

-- DESCOMENTA ESTAS LÍNEAS SI DESEAS MIGRAR VENTAS EXISTENTES:
/*
INSERT INTO cuenta_corriente_movimientos (cliente_id, venta_id, monto, tipo, descripcion, created_at)
SELECT 
  cliente_id,
  id,
  total,
  'debito',
  'Venta #' || COALESCE(numero_cotizacion, id::text) || ' - ' || COALESCE(cliente_nombre, 'Cliente') || ' (Migración histórica)',
  created_at
FROM ventas
WHERE estado = 'vendido'
  AND NOT EXISTS (
    SELECT 1 FROM cuenta_corriente_movimientos 
    WHERE venta_id = ventas.id
  );
*/

-- ====================================================
-- 7. POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ====================================================
-- Habilitar RLS si lo necesitas
-- ALTER TABLE cuenta_corriente_movimientos ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura a usuarios autenticados
-- CREATE POLICY "Permitir lectura de movimientos" ON cuenta_corriente_movimientos
--   FOR SELECT
--   USING (true);

-- Crear política para permitir inserción a usuarios autenticados
-- CREATE POLICY "Permitir inserción de movimientos" ON cuenta_corriente_movimientos
--   FOR INSERT
--   WITH CHECK (true);

-- ====================================================
-- FIN DEL SCRIPT
-- ====================================================
-- Para verificar que todo funciona correctamente:
-- SELECT * FROM vista_saldos_clientes;
-- SELECT * FROM cuenta_corriente_movimientos ORDER BY created_at DESC LIMIT 10;
-- ====================================================
