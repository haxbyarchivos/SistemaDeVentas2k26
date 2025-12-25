// /src/pages/CuentasMovimientos.jsx
import React, { useState, useEffect } from "react";
import PageContainer from "../components/PageContainer";
import { obtenerMovimientos, obtenerEstadisticas, eliminarMovimiento } from "../utils/cuentaCorrienteService";
import supabase from "../utils/supabaseClient";
import "../styles/global.css";

export default function CuentasMovimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  // Filtros
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    await Promise.all([
      cargarMovimientos(),
      cargarClientes(),
      cargarEstadisticas()
    ]);
    setLoading(false);
  }

  async function cargarMovimientos(aplicarFiltrosActivos = false) {
    const filtros = {};
    
    // Solo aplicar filtros si se pide explícitamente
    if (aplicarFiltrosActivos) {
      if (filtroCliente) filtros.cliente_id = filtroCliente;
      if (filtroTipo) filtros.tipo = filtroTipo;
      if (filtroFechaDesde) filtros.fecha_desde = filtroFechaDesde;
      if (filtroFechaHasta) filtros.fecha_hasta = filtroFechaHasta;
    }

    console.log('🔍 Cargando movimientos con filtros:', filtros);
    
    const { data, error } = await obtenerMovimientos(filtros);
    if (!error && data) {
      console.log('✅ Movimientos cargados:', data.length);
      setMovimientos(data);
    } else {
      console.error('❌ Error cargando movimientos:', error);
      setMovimientos([]);
    }
  }

  async function cargarClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombre')
      .order('nombre');

    if (!error && data) {
      setClientes(data);
    }
  }

  async function cargarEstadisticas() {
    const { data, error } = await obtenerEstadisticas();
    if (!error && data) {
      setEstadisticas(data);
    }
  }

  async function handleEliminarMovimiento(movimientoId, tieneVenta) {
    if (tieneVenta) {
      alert('❌ No se puede eliminar un movimiento asociado a una venta. Debe gestionarse desde el módulo de Ventas.');
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar este movimiento?')) return;

    const { error } = await eliminarMovimiento(movimientoId, tieneVenta);
    if (error) {
      alert('Error al eliminar: ' + error.message);
      return;
    }

    alert('✓ Movimiento eliminado correctamente');
    cargarDatos();
  }

  function aplicarFiltros() {
    console.log('🔍 Aplicando filtros...');
    cargarMovimientos(true);
  }

  function limpiarFiltros() {
    console.log('🗑️ Limpiando filtros...');
    setFiltroCliente('');
    setFiltroTipo('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    // Cargar todos los movimientos sin filtros
    setTimeout(() => cargarMovimientos(false), 100);
  }

  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">📊 Movimientos de Cuenta Corriente</h1>
        <p style={{ color: '#999', marginTop: '10px' }}>
          Historial detallado de todas las transacciones financieras
        </p>
      </div>

      {/* ESTADÍSTICAS */}
      {estadisticas && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #333'
          }}>
            <p style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>TOTAL A COBRAR</p>
            <p style={{ color: '#ff4d4d', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              ${estadisticas.totalDeuda.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #333'
          }}>
            <p style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>TOTAL A FAVOR</p>
            <p style={{ color: '#4dff4d', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              ${estadisticas.totalFavor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #333'
          }}>
            <p style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>CLIENTES CON DEUDA</p>
            <p style={{ color: '#ffaa4d', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              {estadisticas.clientesConDeuda}
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #333'
          }}>
            <p style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>TOTAL MOVIMIENTOS</p>
            <p style={{ color: '#4da6ff', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              {estadisticas.totalMovimientos}
            </p>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div style={{
        backgroundColor: '#2d2d2d',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid #444',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'white' }}>🔍 Filtros</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <div>
            <label style={{ color: '#999', fontSize: '13px', display: 'block', marginBottom: '5px' }}>
              Cliente:
            </label>
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '5px',
                color: 'white',
                fontSize: '14px'
              }}
            >
              <option value="">Todos los clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: '#999', fontSize: '13px', display: 'block', marginBottom: '5px' }}>
              Tipo:
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '5px',
                color: 'white',
                fontSize: '14px'
              }}
            >
              <option value="">Todos los tipos</option>
              <option value="debito">Débito (Deuda)</option>
              <option value="credito">Crédito (Pago)</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>

          <div>
            <label style={{ color: '#999', fontSize: '13px', display: 'block', marginBottom: '5px' }}>
              Desde:
            </label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '5px',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ color: '#999', fontSize: '13px', display: 'block', marginBottom: '5px' }}>
              Hasta:
            </label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '5px',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={aplicarFiltros} className="btn-primary">
            🔍 Aplicar Filtros
          </button>
          <button onClick={limpiarFiltros} className="btn-secondary">
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#2d2d2d',
          borderRadius: '10px',
          border: '1px solid #444'
        }}>
          <p style={{ color: '#999', fontSize: '16px', marginBottom: '10px' }}>⏳ Cargando movimientos...</p>
          <p style={{ color: '#666', fontSize: '13px' }}>Consultando base de datos...</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr style={{ backgroundColor: 'transparent' }}>
                <th style={{ paddingBottom: '15px', borderBottom: '2px solid #444' }}>Fecha</th>
                <th style={{ paddingBottom: '15px', borderBottom: '2px solid #444' }}>Cliente</th>
                <th style={{ paddingBottom: '15px', borderBottom: '2px solid #444' }}>Tipo</th>
                <th style={{ paddingBottom: '15px', borderBottom: '2px solid #444' }}>Descripción</th>
                <th style={{ textAlign: 'right', paddingBottom: '15px', borderBottom: '2px solid #444' }}>Monto</th>
                <th style={{ paddingBottom: '15px', borderBottom: '2px solid #444' }}>Venta</th>
                <th style={{ paddingBottom: '15px', borderBottom: '2px solid #444' }}>Usuario</th>
                <th style={{ paddingBottom: '15px', borderBottom: '2px solid #444' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div>
                      <p style={{ color: '#999', fontSize: '16px', marginBottom: '10px' }}>📭 No hay movimientos registrados</p>
                      <p style={{ color: '#666', fontSize: '13px' }}>
                        {(filtroCliente || filtroTipo || filtroFechaDesde || filtroFechaHasta) 
                          ? 'Intenta modificar los filtros para ver más resultados'
                          : 'Aún no se han registrado movimientos en el sistema'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                movimientos.map((mov) => {
                  const monto = parseFloat(mov.monto || 0);
                  const esDebito = mov.tipo === 'debito' || (mov.tipo === 'ajuste' && monto > 0);
                  const tieneVenta = mov.venta_id !== null;

                  return (
                    <tr 
                      key={mov.id} 
                      onMouseEnter={() => setHoveredRow(mov.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        backgroundColor: hoveredRow === mov.id ? '#353535' : '#2d2d2d',
                        border: '1px solid #3a3a3a',
                        transition: 'all 0.2s ease',
                        cursor: 'default'
                      }}
                    >
                      <td style={{ 
                        fontSize: '13px',
                        padding: '16px 12px',
                        borderLeft: `3px solid ${esDebito ? '#ff4d4d' : '#4dff4d'}`,
                        borderTop: '1px solid #3a3a3a',
                        borderBottom: '1px solid #3a3a3a'
                      }}>
                        {new Date(mov.created_at).toLocaleString('es-AR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ 
                        fontWeight: '500',
                        padding: '16px 12px',
                        borderTop: '1px solid #3a3a3a',
                        borderBottom: '1px solid #3a3a3a'
                      }}>
                        {mov.clientes?.nombre || '-'}
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        borderTop: '1px solid #3a3a3a',
                        borderBottom: '1px solid #3a3a3a'
                      }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: esDebito ? '#ff4d4d22' : '#4dff4d22',
                          color: esDebito ? '#ff4d4d' : '#4dff4d',
                          textTransform: 'uppercase'
                        }}>
                          {mov.tipo}
                        </span>
                      </td>
                      <td style={{ 
                        fontSize: '14px', 
                        maxWidth: '300px',
                        padding: '16px 12px',
                        borderTop: '1px solid #3a3a3a',
                        borderBottom: '1px solid #3a3a3a'
                      }}>
                        {mov.descripcion || '-'}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        color: esDebito ? '#ff4d4d' : '#4dff4d',
                        padding: '16px 12px',
                        borderTop: '1px solid #3a3a3a',
                        borderBottom: '1px solid #3a3a3a'
                      }}>
                        {esDebito ? '+' : '-'}${Math.abs(monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        borderTop: '1px solid #3a3a3a',
                        borderBottom: '1px solid #3a3a3a'
                      }}>
                        {tieneVenta ? (
                          <span style={{
                            padding: '3px 8px',
                            backgroundColor: '#4da6ff22',
                            color: '#4da6ff',
                            borderRadius: '3px',
                            fontSize: '12px'
                          }}>
                            #{mov.ventas?.numero_cotizacion || mov.venta_id}
                          </span>
                        ) : (
                          <span style={{ color: '#666', fontSize: '13px' }}>Manual</span>
                        )}
                      </td>
                      <td style={{ 
                        fontSize: '13px',
                        padding: '16px 12px',
                        borderTop: '1px solid #3a3a3a',
                        borderBottom: '1px solid #3a3a3a'
                      }}>
                        {mov.created_by || '-'}
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        borderTop: '1px solid #3a3a3a',
                        borderBottom: '1px solid #3a3a3a',
                        borderRight: '1px solid #3a3a3a'
                      }}>
                        {!tieneVenta && (
                          <button
                            onClick={() => handleEliminarMovimiento(mov.id, tieneVenta)}
                            className="btn-danger"
                            style={{ fontSize: '12px', padding: '5px 10px' }}
                          >
                            🗑️ Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {movimientos.length > 0 && (
            <p style={{ color: '#666', fontSize: '13px', marginTop: '15px', textAlign: 'center' }}>
              Mostrando {movimientos.length} movimiento(s)
            </p>
          )}
        </div>
      )}
    </PageContainer>
  );
}
