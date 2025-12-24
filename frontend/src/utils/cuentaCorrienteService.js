// /src/utils/cuentaCorrienteService.js
// Servicios para manejar la lógica de Cuentas Corrientes
import supabase from './supabaseClient';

// ====================================================
// OBTENER SALDOS CONSOLIDADOS POR CLIENTE
// ====================================================
export async function obtenerSaldosClientes() {
  try {
    const { data, error } = await supabase
      .from('vista_saldos_clientes')
      .select('*')
      .order('cliente_nombre');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error obteniendo saldos:', error);
    return { data: null, error };
  }
}

// ====================================================
// OBTENER MOVIMIENTOS DE CUENTA CORRIENTE
// ====================================================
export async function obtenerMovimientos(filtros = {}) {
  try {
    let query = supabase
      .from('cuenta_corriente_movimientos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nombre
        ),
        ventas:venta_id (
          id,
          numero_cotizacion,
          total,
          estado
        )
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filtros.cliente_id) {
      query = query.eq('cliente_id', filtros.cliente_id);
    }

    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo);
    }

    if (filtros.fecha_desde) {
      query = query.gte('created_at', filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query = query.lte('created_at', filtros.fecha_hasta);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    return { data: null, error };
  }
}

// ====================================================
// REGISTRAR PAGO MANUAL
// ====================================================
export async function registrarPago(clienteId, monto, descripcion = '') {
  try {
    if (!clienteId || !monto || monto <= 0) {
      throw new Error('Datos inválidos para registrar el pago');
    }

    const usuario = JSON.parse(localStorage.getItem('user') || '{}');
    
    const { data, error } = await supabase
      .from('cuenta_corriente_movimientos')
      .insert({
        cliente_id: clienteId,
        monto: Math.abs(monto), // Positivo para crédito
        tipo: 'credito',
        descripcion: descripcion || `Pago registrado por ${usuario.username || 'usuario'}`,
        created_by: usuario.username || 'sistema',
        venta_id: null // No está asociado a ninguna venta
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error registrando pago:', error);
    return { data: null, error };
  }
}

// ====================================================
// REGISTRAR AJUSTE MANUAL (DÉBITO O CRÉDITO)
// ====================================================
export async function registrarAjuste(clienteId, monto, descripcion = '', esDebito = true) {
  try {
    if (!clienteId || !monto || monto === 0) {
      throw new Error('Datos inválidos para registrar el ajuste');
    }

    const usuario = JSON.parse(localStorage.getItem('user') || '{}');
    
    const { data, error } = await supabase
      .from('cuenta_corriente_movimientos')
      .insert({
        cliente_id: clienteId,
        monto: Math.abs(monto),
        tipo: esDebito ? 'debito' : 'credito',
        descripcion: descripcion || `${esDebito ? 'Cargo' : 'Crédito'} por ${usuario.username || 'usuario'}`,
        created_by: usuario.username || 'sistema',
        venta_id: null
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error registrando ajuste:', error);
    return { data: null, error };
  }
}

// ====================================================
// OBTENER SALDO DE UN CLIENTE ESPECÍFICO
// ====================================================
export async function obtenerSaldoCliente(clienteId) {
  try {
    if (!clienteId) {
      throw new Error('ID de cliente no proporcionado');
    }

    const { data, error } = await supabase
      .from('cuenta_corriente_movimientos')
      .select('monto, tipo')
      .eq('cliente_id', clienteId);

    if (error) throw error;

    // Calcular el saldo manualmente
    const saldo = data.reduce((acc, mov) => {
      if (mov.tipo === 'debito') {
        return acc + parseFloat(mov.monto);
      } else if (mov.tipo === 'credito') {
        return acc - Math.abs(parseFloat(mov.monto));
      } else if (mov.tipo === 'ajuste') {
        return acc + parseFloat(mov.monto);
      }
      return acc;
    }, 0);

    return { data: saldo, error: null };
  } catch (error) {
    console.error('Error obteniendo saldo del cliente:', error);
    return { data: 0, error };
  }
}

// ====================================================
// OBTENER HISTORIAL DE UN CLIENTE
// ====================================================
export async function obtenerHistorialCliente(clienteId, limite = 50) {
  try {
    if (!clienteId) {
      throw new Error('ID de cliente no proporcionado');
    }

    const { data, error } = await supabase
      .from('cuenta_corriente_movimientos')
      .select(`
        *,
        ventas:venta_id (
          numero_cotizacion,
          estado
        )
      `)
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return { data: null, error };
  }
}

// ====================================================
// ELIMINAR MOVIMIENTO (Solo ajustes o pagos manuales)
// ====================================================
export async function eliminarMovimiento(movimientoId, esVentaAsociada = false) {
  try {
    if (esVentaAsociada) {
      throw new Error('No se puede eliminar un movimiento asociado a una venta. Debe gestionarse desde el módulo de Ventas.');
    }

    const { error } = await supabase
      .from('cuenta_corriente_movimientos')
      .delete()
      .eq('id', movimientoId)
      .is('venta_id', null); // Solo permite eliminar movimientos sin venta asociada

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error eliminando movimiento:', error);
    return { error };
  }
}

// ====================================================
// OBTENER ESTADÍSTICAS GENERALES
// ====================================================
export async function obtenerEstadisticas() {
  try {
    // Total de deudas pendientes
    const { data: saldos, error: errorSaldos } = await supabase
      .from('vista_saldos_clientes')
      .select('saldo_total');

    if (errorSaldos) throw errorSaldos;

    const totalDeuda = saldos.reduce((acc, cliente) => {
      const saldo = parseFloat(cliente.saldo_total || 0);
      return saldo > 0 ? acc + saldo : acc;
    }, 0);

    const totalFavor = saldos.reduce((acc, cliente) => {
      const saldo = parseFloat(cliente.saldo_total || 0);
      return saldo < 0 ? acc + Math.abs(saldo) : acc;
    }, 0);

    const clientesConDeuda = saldos.filter(c => parseFloat(c.saldo_total || 0) > 0).length;

    // Total de movimientos
    const { count: totalMovimientos, error: errorMovimientos } = await supabase
      .from('cuenta_corriente_movimientos')
      .select('*', { count: 'exact', head: true });

    if (errorMovimientos) throw errorMovimientos;

    return {
      data: {
        totalDeuda,
        totalFavor,
        clientesConDeuda,
        totalMovimientos: totalMovimientos || 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { data: null, error };
  }
}
