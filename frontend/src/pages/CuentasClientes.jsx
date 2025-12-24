// /src/pages/CuentasClientes.jsx
import React, { useState, useEffect } from "react";
import PageContainer from "../components/PageContainer";
import Toast from "../components/Toast";
import { obtenerSaldosClientes, registrarPago, registrarAjuste, obtenerHistorialCliente } from "../utils/cuentaCorrienteService";
import "../styles/global.css";

export default function CuentasClientes() {
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [modalPago, setModalPago] = useState(null);
  const [modalHistorial, setModalHistorial] = useState(null);
  const [historialCliente, setHistorialCliente] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarSaldos();
  }, []);

  async function cargarSaldos() {
    setLoading(true);
    const { data, error } = await obtenerSaldosClientes();
    if (!error && data) {
      console.log('Saldos cargados:', data);
      setSaldos(data);
    } else {
      console.error('Error cargando saldos:', error);
      alert('Error cargando saldos: ' + (error?.message || 'Error desconocido'));
    }
    setLoading(false);
  }

  async function abrirHistorial(clienteId, clienteNombre) {
    console.log('Abriendo historial para cliente:', clienteId, clienteNombre);
    setModalHistorial({ clienteId, clienteNombre });
    setLoadingHistorial(true);
    const { data, error } = await obtenerHistorialCliente(clienteId, 100);
    if (!error && data) {
      console.log('Historial cargado:', data);
      setHistorialCliente(data);
    } else {
      console.error('Error cargando historial:', error);
      alert('Error cargando historial: ' + (error?.message || 'Error desconocido'));
      setHistorialCliente([]);
    }
    setLoadingHistorial(false);
  }

  function abrirModalPago(cliente) {
    console.log('Abriendo modal de pago para:', cliente);
    setModalPago({
      clienteId: cliente.cliente_id,
      clienteNombre: cliente.cliente_nombre,
      saldoActual: parseFloat(cliente.saldo_total || 0),
      monto: '',
      descripcion: '',
      tipoOperacion: 'ingreso' // 'ingreso' (pago del cliente) o 'egreso' (débito adicional)
    });
  }

  async function procesarMovimiento() {
    console.log('Procesando movimiento:', modalPago);
    
    if (!modalPago || !modalPago.monto || modalPago.monto <= 0) {
      setToast({ message: 'Ingrese un monto válido', type: 'warning' });
      return;
    }

    const monto = parseFloat(modalPago.monto);
    let error;

    try {
      if (modalPago.tipoOperacion === 'ingreso') {
        // Ingreso = Pago del cliente (reduce deuda)
        console.log('Registrando ingreso (pago)...');
        const resultado = await registrarPago(modalPago.clienteId, monto, modalPago.descripcion);
        error = resultado.error;
        if (!error) console.log('Ingreso registrado:', resultado.data);
      } else {
        // Egreso = Débito adicional (aumenta deuda)
        console.log('Registrando egreso (débito)...');
        const resultado = await registrarAjuste(modalPago.clienteId, monto, modalPago.descripcion, true);
        error = resultado.error;
        if (!error) console.log('Egreso registrado:', resultado.data);
      }

      if (error) {
        console.error('Error al registrar:', error);
        setToast({ message: 'Error: ' + error.message, type: 'error' });
        return;
      }

      // Cerrar modal y mostrar toast de éxito
      setModalPago(null);
      setToast({
        message: modalPago.tipoOperacion === 'ingreso' 
          ? '✓ Ingreso registrado correctamente' 
          : '✓ Egreso registrado correctamente',
        type: 'success'
      });
      
      // Recargar saldos
      cargarSaldos();
    } catch (err) {
      console.error('Excepción al procesar movimiento:', err);
      setToast({ message: 'Error inesperado: ' + err.message, type: 'error' });
    }
  }

  const saldosFiltrados = saldos.filter(cliente =>
    cliente.cliente_nombre?.toLowerCase().includes(filtro.toLowerCase())
  );

  const totalDeuda = saldosFiltrados.reduce((acc, c) => {
    const saldo = parseFloat(c.saldo_total || 0);
    return saldo > 0 ? acc + saldo : acc;
  }, 0);

  const totalFavor = saldosFiltrados.reduce((acc, c) => {
    const saldo = parseFloat(c.saldo_total || 0);
    return saldo < 0 ? acc + Math.abs(saldo) : acc;
  }, 0);

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">💰 Cuentas Corrientes - Clientes</h1>
        <p style={{ color: '#999', marginTop: '10px' }}>
          Gestión de saldos por cliente
        </p>
      </div>

      {/* ESTADÍSTICAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #333'
        }}>
          <p style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>TOTAL A COBRAR</p>
          <p style={{ color: '#ff4d4d', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            {formatearMoneda(totalDeuda)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #333'
        }}>
          <p style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>TOTAL A FAVOR</p>
          <p style={{ color: '#4dff4d', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            {formatearMoneda(totalFavor)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #333'
        }}>
          <p style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>CLIENTES</p>
          <p style={{ color: '#4da6ff', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            {saldosFiltrados.length}
          </p>
        </div>
      </div>

      {/* FILTRO */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 15px',
            backgroundColor: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px'
          }}
        />
      </div>

      {/* LISTA DE CLIENTES - DISEÑO DE TARJETAS */}
      {loading ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>Cargando saldos...</p>
      ) : saldosFiltrados.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#2d2d2d',
          borderRadius: '10px',
          border: '1px solid #444'
        }}>
          <p style={{ color: '#999', fontSize: '18px', margin: 0 }}>No hay clientes registrados</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {saldosFiltrados.map((cliente) => {
            const saldo = parseFloat(cliente.saldo_total || 0);
            const esDeuda = saldo > 0;
            const esFavor = saldo < 0;
            const saldoFormateado = new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(Math.abs(saldo));

            return (
              <div
                key={cliente.cliente_id}
                style={{
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #444',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: '20px',
                  transition: 'all 0.2s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#333';
                  e.currentTarget.style.borderColor = '#555';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d2d2d';
                  e.currentTarget.style.borderColor = '#444';
                }}
              >
                {/* INFORMACIÓN DEL CLIENTE */}
                <div>
                  <h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                    {cliente.cliente_nombre}
                  </h3>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#999', fontSize: '13px' }}>Saldo: </span>
                      <span style={{
                        color: esDeuda ? '#ff4d4d' : esFavor ? '#4dff4d' : '#999',
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}>
                        {saldoFormateado}
                      </span>
                      {esDeuda && <span style={{ color: '#ff4d4d', fontSize: '12px', marginLeft: '5px' }}>(Debe)</span>}
                      {esFavor && <span style={{ color: '#4dff4d', fontSize: '12px', marginLeft: '5px' }}>(A favor)</span>}
                    </div>
                    <div style={{ color: '#666', fontSize: '13px' }}>
                      {cliente.cantidad_movimientos || 0} movimiento(s)
                    </div>
                    <div style={{ color: '#666', fontSize: '13px' }}>
                      Último: {cliente.ultimo_movimiento
                        ? new Date(cliente.ultimo_movimiento).toLocaleDateString('es-AR')
                        : 'Sin movimientos'}
                    </div>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => abrirModalPago(cliente)}
                    style={{
                      backgroundColor: '#4da6ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#3d8fdd'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#4da6ff'}
                  >
                    💰 Ingreso / Egreso
                  </button>
                  <button
                    onClick={() => abrirHistorial(cliente.cliente_id, cliente.cliente_nombre)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                  >
                    📋 Historial
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE INGRESO / EGRESO */}
      {modalPago && (
        <div className="modal-overlay" onClick={() => setModalPago(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            {/* BOTÓN CERRAR (X) */}
            <button
              onClick={() => setModalPago(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                color: '#999',
                fontSize: '24px',
                cursor: 'pointer',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#333';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#999';
              }}
              title="Cerrar"
            >
              ✕
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '10px' }}>💰 Registrar Movimiento</h2>
            <p style={{ color: '#999', marginBottom: '25px' }}>
              Cliente: <strong style={{ color: 'white' }}>{modalPago.clienteNombre}</strong>
            </p>
            
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '25px',
              border: '1px solid #444'
            }}>
              <p style={{ color: '#999', fontSize: '13px', margin: '0 0 5px 0' }}>Saldo actual:</p>
              <p style={{
                color: modalPago.saldoActual > 0 ? '#ff4d4d' : modalPago.saldoActual < 0 ? '#4dff4d' : '#999',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0
              }}>
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(Math.abs(modalPago.saldoActual))}
                {modalPago.saldoActual > 0 && <span style={{ fontSize: '14px', marginLeft: '8px' }}>(Debe)</span>}
                {modalPago.saldoActual < 0 && <span style={{ fontSize: '14px', marginLeft: '8px' }}>(A favor)</span>}
              </p>
            </div>

            {/* SELECTOR DE TIPO DE OPERACIÓN */}
            <label style={{ display: 'block', marginBottom: '20px' }}>
              <span style={{ color: '#999', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Tipo de operación:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => setModalPago({ ...modalPago, tipoOperacion: 'ingreso' })}
                  style={{
                    padding: '15px',
                    backgroundColor: modalPago.tipoOperacion === 'ingreso' ? '#4dff4d' : '#2d2d2d',
                    color: modalPago.tipoOperacion === 'ingreso' ? '#1a1a1a' : '#999',
                    border: modalPago.tipoOperacion === 'ingreso' ? '2px solid #4dff4d' : '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  💵 Ingreso
                  <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.8 }}>
                    (Pago del cliente)
                  </div>
                </button>
                <button
                  onClick={() => setModalPago({ ...modalPago, tipoOperacion: 'egreso' })}
                  style={{
                    padding: '15px',
                    backgroundColor: modalPago.tipoOperacion === 'egreso' ? '#ff4d4d' : '#2d2d2d',
                    color: modalPago.tipoOperacion === 'egreso' ? 'white' : '#999',
                    border: modalPago.tipoOperacion === 'egreso' ? '2px solid #ff4d4d' : '1px solid #444',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📤 Egreso
                  <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.8 }}>
                    (Cargo adicional)
                  </div>
                </button>
              </div>
            </label>

            <label style={{ display: 'block', marginBottom: '20px' }}>
              <span style={{ color: '#999', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Monto:
              </span>
              <input
                type="number"
                step="0.01"
                value={modalPago.monto}
                onChange={(e) => setModalPago({ ...modalPago, monto: e.target.value })}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '25px' }}>
              <span style={{ color: '#999', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Descripción / Concepto:
              </span>
              <textarea
                value={modalPago.descripcion}
                onChange={(e) => setModalPago({ ...modalPago, descripcion: e.target.value })}
                placeholder="Ej: Pago en efectivo, Transferencia bancaria, Cargo por..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </label>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalPago(null)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                Cancelar
              </button>
              <button
                onClick={procesarMovimiento}
                style={{
                  padding: '12px 24px',
                  backgroundColor: modalPago.tipoOperacion === 'ingreso' ? '#4dff4d' : '#ff4d4d',
                  color: modalPago.tipoOperacion === 'ingreso' ? '#1a1a1a' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                ✓ Confirmar {modalPago.tipoOperacion === 'ingreso' ? 'Ingreso' : 'Egreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTORIAL */}
      {modalHistorial && (
        <div className="modal-overlay" onClick={() => setModalHistorial(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
            {/* BOTÓN CERRAR (X) */}
            <button
              onClick={() => setModalHistorial(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                color: '#999',
                fontSize: '24px',
                cursor: 'pointer',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#333';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#999';
              }}
              title="Cerrar"
            >
              ✕
            </button>

            <h2 style={{ marginTop: 0 }}>📋 Historial de Movimientos</h2>
            <p style={{ color: '#999', marginBottom: '20px' }}>
              Cliente: <strong style={{ color: 'white' }}>{modalHistorial.clienteNombre}</strong>
            </p>

            {loadingHistorial ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Cargando...</p>
            ) : historialCliente.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Sin movimientos registrados</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                      <th>Venta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialCliente.map((mov) => {
                      const monto = parseFloat(mov.monto || 0);
                      const esDebito = mov.tipo === 'debito' || (mov.tipo === 'ajuste' && monto > 0);

                      return (
                        <tr key={mov.id}>
                          <td>{new Date(mov.created_at).toLocaleString('es-AR')}</td>
                          <td>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              backgroundColor: esDebito ? '#ff4d4d22' : '#4dff4d22',
                              color: esDebito ? '#ff4d4d' : '#4dff4d'
                            }}>
                              {mov.tipo.toUpperCase()}
                            </span>
                          </td>
                          <td>{mov.descripcion || '-'}</td>
                          <td style={{
                            textAlign: 'right',
                            fontWeight: 'bold',
                            color: esDebito ? '#ff4d4d' : '#4dff4d'
                          }}>
                            {esDebito ? '+' : '-'}${Math.abs(monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td>{mov.ventas?.numero_cotizacion || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setModalHistorial(null)} className="btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST DE NOTIFICACIONES */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </PageContainer>
  );
}
