-- Script para sincronizar precios de la lista GENERAL a todas las demás listas
-- Ejecutar este script UNA SOLA VEZ en el SQL Editor de Supabase

DO $$
DECLARE
    lista_record RECORD;
    precio_record RECORD;
    total_listas INTEGER := 0;
    total_precios INTEGER := 0;
BEGIN
    -- Obtener todas las listas excepto GENERAL
    FOR lista_record IN 
        SELECT id, nombre 
        FROM listas_precios 
        WHERE id != '12989162-fdb2-4532-a893-5107b4c1cffb'
    LOOP
        total_listas := total_listas + 1;
        RAISE NOTICE 'Sincronizando lista: %', lista_record.nombre;
        
        -- Copiar todos los precios de GENERAL a esta lista
        FOR precio_record IN
            SELECT producto_id, precio_usd_kg
            FROM precios_producto
            WHERE lista_precio_id = '12989162-fdb2-4532-a893-5107b4c1cffb'
        LOOP
            -- Insertar o actualizar el precio
            INSERT INTO precios_producto (producto_id, lista_precio_id, precio_usd_kg, activo)
            VALUES (precio_record.producto_id, lista_record.id, precio_record.precio_usd_kg, true)
            ON CONFLICT (producto_id, lista_precio_id) 
            DO UPDATE SET precio_usd_kg = EXCLUDED.precio_usd_kg, activo = true;
            
            total_precios := total_precios + 1;
        END LOOP;
        
        RAISE NOTICE '✓ Lista sincronizada';
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✓ Sincronización completada exitosamente';
    RAISE NOTICE 'Total de listas sincronizadas: %', total_listas;
    RAISE NOTICE 'Total de precios copiados/actualizados: %', total_precios;
END $$;
