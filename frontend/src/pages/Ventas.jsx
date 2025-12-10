import React, { useState, useEffect } from "react";
import PageContainer from "../components/PageContainer";
import { Link } from "react-router-dom";
import supabase from "../utils/supabaseClient";
import "../styles/global.css";

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [ventaExpandida, setVentaExpandida] = useState(null)
  const [modalEditar, setModalEditar] = useState(null)
  const [clientes, setClientes] = useState([])

  useEffect(() => {
    cargarVentas()
    cargarClientes()
  }, [filtroEstado])

  async function cargarClientes() {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')
      
      if (!error) {
        setClientes(data || [])
      }
    } catch (err) {
      console.error('Error cargando clientes:', err)
    }
  }

  async function cargarVentas() {
    try {
      setLoading(true)
      let query = supabase
        .from('ventas')
        .select('*')
        .order('created_at', { ascending: false })

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error cargando ventas:', error)
        return
      }

      setVentas(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function cambiarEstado(ventaId, nuevoEstado) {
    try {
      // Obtener la venta con su estado actual
      const { data: venta, error: errorVenta } = await supabase
        .from('ventas')
        .select('*')
        .eq('id', ventaId)
        .single()

      if (errorVenta) {
        alert('Error al obtener datos de la venta: ' + errorVenta.message)
        return
      }

      const estadoAnterior = venta.estado

      console.log('Cambio de estado:', { estadoAnterior, nuevoEstado, ventaId })

      // Verificar que la venta tenga items válidos
      if (!venta.items || venta.items.length === 0) {
        alert('Esta venta no tiene items registrados. No se puede procesar.')
        return
      }

      // Verificar que todos los items tengan producto_id
      const itemsSinProductoId = venta.items.filter(item => !item.producto_id)
      if (itemsSinProductoId.length > 0) {
        alert('Algunos items no tienen producto_id. Esta venta fue creada con una versión anterior y no se puede procesar automáticamente.')
        return
      }

      // CASO 1: De VENDIDO a PENDIENTE/CANCELADO → Devolver stock
      if (estadoAnterior === 'vendido' && (nuevoEstado === 'pendiente' || nuevoEstado === 'cancelada' || nuevoEstado === 'cancelado')) {
        console.log('Devolviendo stock...')
        for (const item of venta.items) {
          const kilosADevolver = item.kilos || 0
          
          // Obtener stock actual
          const { data: prodActual } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', item.producto_id)
            .single()

          if (prodActual) {
            // Incrementar stock del producto
            const { error: errorStock } = await supabase
              .from('productos')
              .update({
                stock: prodActual.stock + kilosADevolver
              })
              .eq('id', item.producto_id)

            if (errorStock) {
              console.error('Error devolviendo stock:', errorStock)
            } else {
              console.log(`Stock devuelto: ${item.producto} +${kilosADevolver}kg`)
            }
          }

          // Registrar movimiento de devolución
          await supabase
            .from('movimientos_stock')
            .insert({
              producto_id: item.producto_id,
              tipo: (nuevoEstado === 'cancelada' || nuevoEstado === 'cancelado') ? 'devolucion_cancelacion' : 'devolucion_pendiente',
              cantidad: kilosADevolver,
              venta_id: ventaId,
              created_at: new Date().toISOString(),
              observaciones: `Cambio de estado ${estadoAnterior} → ${nuevoEstado}. Venta ${venta.numero_cotizacion || ventaId} - ${item.producto}`
            })
        }
      }

      // CASO 2: De PENDIENTE/CANCELADO a VENDIDO → Descontar stock
      if ((estadoAnterior === 'pendiente' || estadoAnterior === 'cancelada' || estadoAnterior === 'cancelado') && nuevoEstado === 'vendido') {
        // Obtener todos los productos involucrados para verificar stock
        const productosIds = [...new Set(venta.items.map(item => item.producto_id))]
        const { data: productos, error: errorProductos } = await supabase
          .from('productos')
          .select('id, nombre, stock')
          .in('id', productosIds)

        if (errorProductos) {
          alert('Error al verificar stock: ' + errorProductos.message)
          return
        }

        // Verificar stock suficiente para cada item
        const stockInsuficiente = []
        for (const item of venta.items) {
          const producto = productos.find(p => p.id === item.producto_id)
          if (!producto) {
            stockInsuficiente.push(`${item.producto}: Producto no encontrado`)
            continue
          }

          const kilosADescontar = item.kilos || 0
          if (producto.stock < kilosADescontar) {
            stockInsuficiente.push(`${producto.nombre}: Stock actual ${producto.stock}kg, necesario ${kilosADescontar}kg`)
          }
        }

        if (stockInsuficiente.length > 0) {
          alert('⚠️ Stock insuficiente:\n\n' + stockInsuficiente.join('\n') + '\n\n¿Deseas continuar de todos modos?')
          if (!window.confirm('Confirmar venta con stock insuficiente')) {
            return
          }
        }

        // Descontar stock y registrar movimientos
        for (const item of venta.items) {
          const kilosADescontar = item.kilos || 0
          
          // Obtener stock actual
          const { data: prodActual } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', item.producto_id)
            .single()

          if (prodActual) {
            // Actualizar stock del producto
            const { error: errorStock } = await supabase
              .from('productos')
              .update({
                stock: prodActual.stock - kilosADescontar
              })
              .eq('id', item.producto_id)

            if (errorStock) {
              console.error('Error actualizando stock:', errorStock)
            }
          }

          // Registrar movimiento de stock
          await supabase
            .from('movimientos_stock')
            .insert({
              producto_id: item.producto_id,
              tipo: 'venta',
              cantidad: -kilosADescontar,
              venta_id: ventaId,
              created_at: new Date().toISOString(),
              observaciones: `Venta ${venta.numero_cotizacion || ventaId} - ${item.producto}`
            })
        }
      }

      // Actualizar estado de la venta
      const { error } = await supabase
        .from('ventas')
        .update({ 
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('id', ventaId)

      if (error) {
        alert('Error al cambiar estado: ' + error.message)
        return
      }

      // Mensajes según el cambio
      if (estadoAnterior === 'vendido' && (nuevoEstado === 'pendiente' || nuevoEstado === 'cancelada' || nuevoEstado === 'cancelado')) {
        alert(`✓ Estado cambiado a ${nuevoEstado.toUpperCase()} y stock devuelto`)
      } else if ((estadoAnterior === 'pendiente' || estadoAnterior === 'cancelada' || estadoAnterior === 'cancelado') && nuevoEstado === 'vendido') {
        alert('✓ Venta confirmada y stock descontado')
      } else {
        alert(`Estado actualizado a: ${nuevoEstado.toUpperCase()}`)
      }
      
      cargarVentas()
    } catch (err) {
      console.error('Error:', err)
      alert('Error al cambiar estado: ' + err.message)
    }
  }

  async function eliminarVenta(ventaId) {
    if (!window.confirm('¿Estás seguro de eliminar esta venta?')) return

    try {
      const { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', ventaId)

      if (error) {
        alert('Error al eliminar: ' + error.message)
        return
      }

      alert('Venta eliminada correctamente')
      cargarVentas()
    } catch (err) {
      console.error('Error:', err)
      alert('Error al eliminar')
    }
  }

  async function guardarEdicion() {
    if (!modalEditar) return

    try {
      const { error } = await supabase
        .from('ventas')
        .update({
          cliente_id: modalEditar.cliente_id,
          cliente_nombre: modalEditar.cliente_nombre,
          created_at: modalEditar.created_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', modalEditar.id)

      if (error) {
        alert('Error al guardar: ' + error.message)
        return
      }

      alert('Venta actualizada correctamente')
      setModalEditar(null)
      cargarVentas()
    } catch (err) {
      console.error('Error:', err)
      alert('Error al guardar cambios')
    }
  }

  function abrirModalEditar(venta) {
    setModalEditar({
      id: venta.id,
      cliente_id: venta.cliente_id,
      cliente_nombre: venta.cliente_nombre,
      created_at: venta.created_at
    })
  }

  function toggleExpandir(ventaId) {
    setVentaExpandida(ventaExpandida === ventaId ? null : ventaId)
  }

  function formatARS(value) {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value) || 0)
  }

  function getEstadoColor(estado) {
    switch(estado) {
      case 'vendido': return '#10b981'
      case 'pendiente': return '#f59e0b'
      case 'cancelado': return '#ef4444'
      default: return '#6b7280'
    }
  }

  function getEstadoTexto(estado) {
    switch(estado) {
      case 'vendido': return 'VENDIDO'
      case 'pendiente': return 'PENDIENTE'
      case 'cancelado': return 'CANCELADO'
      default: return estado
    }
  }

  return (
    <PageContainer
      title="Ventas"
      subtitle="Gestión de cotizaciones y ventas"
      footer={<Link to="/dashboard" className="back-link">Volver</Link>}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className={filtroEstado === 'todos' ? 'btn' : 'btn btn-ghost'} 
            onClick={() => setFiltroEstado('todos')}
          >
            Todas
          </button>
          <button 
            className={filtroEstado === 'pendiente' ? 'btn' : 'btn btn-ghost'} 
            onClick={() => setFiltroEstado('pendiente')}
            style={filtroEstado === 'pendiente' ? { backgroundColor: '#f59e0b' } : {}}
          >
            Pendientes
          </button>
          <button 
            className={filtroEstado === 'vendido' ? 'btn' : 'btn btn-ghost'} 
            onClick={() => setFiltroEstado('vendido')}
            style={filtroEstado === 'vendido' ? { backgroundColor: '#10b981' } : {}}
          >
            Vendidas
          </button>
          <button 
            className={filtroEstado === 'cancelado' ? 'btn' : 'btn btn-ghost'} 
            onClick={() => setFiltroEstado('cancelado')}
            style={filtroEstado === 'cancelado' ? { backgroundColor: '#ef4444' } : {}}
          >
            Canceladas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="small">Cargando ventas...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total ARS</th>
                <th>Kilos</th>
                <th>Items</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="small" style={{ textAlign: 'center', padding: '20px' }}>
                    No hay ventas {filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : ''}
                  </td>
                </tr>
              ) : (
                ventas.map(venta => (
                  <React.Fragment key={venta.id}>
                    <tr style={{ cursor: 'pointer' }}>
                      <td onClick={() => toggleExpandir(venta.id)}>
                        <span style={{ marginRight: '8px' }}>
                          {ventaExpandida === venta.id ? '▼' : '▶'}
                        </span>
                        {venta.numero_cotizacion}
                      </td>
                      <td>{new Date(venta.created_at).toLocaleDateString('es-AR')}</td>
                      <td>{venta.cliente_nombre}</td>
                      <td>${formatARS(venta.total_ars)}</td>
                      <td>{venta.total_kilos ? `${venta.total_kilos.toFixed(0)}kg` : '-'}</td>
                      <td>{venta.items?.length || 0}</td>
                      <td>
                        <select 
                          value={venta.estado}
                          onChange={(e) => cambiarEstado(venta.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: getEstadoColor(venta.estado),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pendiente">PENDIENTE</option>
                          <option value="vendido">VENDIDO</option>
                          <option value="cancelado">CANCELADO</option>
                        </select>
                      </td>
                      <td>
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => abrirModalEditar(venta)}
                          style={{ fontSize: '11px', padding: '4px 8px', marginRight: '4px' }}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => eliminarVenta(venta.id)}
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                    {ventaExpandida === venta.id && venta.items && (
                      <tr>
                        <td colSpan={8} style={{ backgroundColor: '#1a1a1a', padding: '16px', borderTop: '2px solid #333' }}>
                          <div style={{ maxWidth: '800px' }}>
                            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                              Detalle de Productos
                            </h4>
                            <div style={{ display: 'grid', gap: '8px' }}>
                              {venta.items.map((item, idx) => (
                                <div 
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 14px',
                                    backgroundColor: '#2a2a2a',
                                    borderRadius: '8px',
                                    border: '1px solid #444',
                                    fontSize: '13px'
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', marginBottom: '2px', color: '#fff' }}>
                                      {item.producto}
                                    </div>
                                    {item.presentacion && (
                                      <div style={{ fontSize: '11px', color: '#999' }}>
                                        {item.presentacion}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ 
                                    display: 'flex', 
                                    gap: '20px', 
                                    alignItems: 'center',
                                    fontSize: '12px'
                                  }}>
                                    <div style={{ textAlign: 'center' }}>
                                      <div style={{ color: '#999', fontSize: '10px', marginBottom: '2px' }}>
                                        Cantidad
                                      </div>
                                      <div style={{ fontWeight: '600', color: '#fff' }}>
                                        {item.cantidad} {item.unidad || 'kg'}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                      <div style={{ color: '#999', fontSize: '10px', marginBottom: '2px' }}>
                                        Precio Unit.
                                      </div>
                                      <div style={{ fontWeight: '600', color: '#fff' }}>
                                        ${formatARS(item.precio)}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                      <div style={{ color: '#999', fontSize: '10px', marginBottom: '2px' }}>
                                        Subtotal
                                      </div>
                                      <div style={{ 
                                        fontWeight: '700', 
                                        color: '#10b981',
                                        fontSize: '14px'
                                      }}>
                                        ${formatARS(item.subtotal)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="comment" style={{ marginTop: 20 }}>
        💡 Cuando cambies el estado a VENDIDO, se descontará automáticamente del stock (próxima implementación)
      </div>

      {/* Modal de edición */}
      {modalEditar && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setModalEditar(null)}
        >
          <div 
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid #2a2a2a'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
              Editar Venta
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
                Cliente
              </label>
              <select
                value={modalEditar.cliente_id || ''}
                onChange={(e) => {
                  const clienteId = e.target.value
                  const cliente = clientes.find(c => c.id.toString() === clienteId)
                  setModalEditar({
                    ...modalEditar,
                    cliente_id: parseInt(clienteId),
                    cliente_nombre: cliente?.nombre || ''
                  })
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #3a3a3a',
                  fontSize: '14px',
                  backgroundColor: '#0f0f0f',
                  color: '#ffffff'
                }}
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
                Fecha de la venta
              </label>
              <input
                type="date"
                value={modalEditar.created_at ? new Date(modalEditar.created_at).toISOString().slice(0, 10) : ''}
                onChange={(e) => {
                  const fecha = new Date(modalEditar.created_at || new Date());
                  const [year, month, day] = e.target.value.split('-');
                  fecha.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
                  setModalEditar({
                    ...modalEditar,
                    created_at: fecha.toISOString()
                  });
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #3a3a3a',
                  fontSize: '14px',
                  backgroundColor: '#0f0f0f',
                  color: '#ffffff',
                  colorScheme: 'dark'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
                Hora de la venta
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <select
                  value={modalEditar.created_at ? new Date(modalEditar.created_at).getHours() : 0}
                  onChange={(e) => {
                    const fecha = new Date(modalEditar.created_at || new Date());
                    fecha.setHours(parseInt(e.target.value));
                    setModalEditar({
                      ...modalEditar,
                      created_at: fecha.toISOString()
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3a3a3a',
                    fontSize: '14px',
                    backgroundColor: '#0f0f0f',
                    color: '#ffffff'
                  }}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')} h
                    </option>
                  ))}
                </select>
                <select
                  value={modalEditar.created_at ? new Date(modalEditar.created_at).getMinutes() : 0}
                  onChange={(e) => {
                    const fecha = new Date(modalEditar.created_at || new Date());
                    fecha.setMinutes(parseInt(e.target.value));
                    setModalEditar({
                      ...modalEditar,
                      created_at: fecha.toISOString()
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3a3a3a',
                    fontSize: '14px',
                    backgroundColor: '#0f0f0f',
                    color: '#ffffff'
                  }}
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')} min
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-ghost"
                onClick={() => setModalEditar(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn"
                onClick={guardarEdicion}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
