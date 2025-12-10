import React, { useState, useEffect, useRef } from 'react'
import PageContainer from '../components/PageContainer'
import { Link } from 'react-router-dom'
import supabase from '../utils/supabaseClient'
import '../styles/global.css'

export default function Stock(){
	const [modalAbierto, setModalAbierto] = useState(null) // 'ingreso' o 'egreso'
	const [productos, setProductos] = useState([])
	const [presentaciones, setPresentaciones] = useState([])
	const [productosStock, setProductosStock] = useState([])
	const [movimientos, setMovimientos] = useState([])
	const [loading, setLoading] = useState(true)
	const [searchProducto, setSearchProducto] = useState('')
	const [showProductosDropdown, setShowProductosDropdown] = useState(false)
	const [selectedProductId, setSelectedProductId] = useState(null)
	const [searchPresentacion, setSearchPresentacion] = useState('')
	const [showPresentacionDropdown, setShowPresentacionDropdown] = useState(false)
	const [selectedPresentacionId, setSelectedPresentacionId] = useState(null)
	const [cantidad, setCantidad] = useState(1)
	const [modalConfig, setModalConfig] = useState(false)
	const [productoConfig, setProductoConfig] = useState(null)
	const [nuevoStockMinimo, setNuevoStockMinimo] = useState(0)
	const refProducto = useRef(null)
	const refPresentacion = useRef(null)

	useEffect(() => {
		cargarDatos()
		cargarStock()
	}, [])

	useEffect(() => {
		function handleClickOutside(event) {
			if (refProducto.current && !refProducto.current.contains(event.target)) {
				setShowProductosDropdown(false)
			}
			if (refPresentacion.current && !refPresentacion.current.contains(event.target)) {
				setShowPresentacionDropdown(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	async function cargarDatos() {
		try {
			const { data: prodData } = await supabase
				.from('productos')
				.select('*')
				.eq('activo', true)
				.order('nombre', { ascending: true })
			if (prodData) setProductos(prodData)

			const { data: presData } = await supabase
				.from('presentaciones')
				.select('*')
				.eq('activo', true)
				.order('nombre', { ascending: true })
			if (presData) setPresentaciones(presData)
		} catch (err) {
			console.error('Error cargando datos:', err)
		}
	}

	async function cargarStock() {
		try {
			setLoading(true)
			
			// Cargar productos con stock
			const { data: stockData } = await supabase
				.from('productos')
				.select('id, nombre, stock, stock_minimo')
				.eq('activo', true)
				.order('nombre', { ascending: true })
			
			if (stockData) setProductosStock(stockData)

			// Cargar últimos movimientos con información del producto
			const { data: movData } = await supabase
				.from('movimientos_stock')
				.select(`
					*,
					productos (
						nombre
					)
				`)
				.order('created_at', { ascending: false })
				.limit(50)
			
			if (movData) setMovimientos(movData)
		} catch (err) {
			console.error('Error cargando stock:', err)
		} finally {
			setLoading(false)
		}
	}

	function abrirModal(tipo) {
		setModalAbierto(tipo)
		setSearchProducto('')
		setSelectedProductId(null)
		setSearchPresentacion('')
		setSelectedPresentacionId(null)
		setCantidad(1)
	}

	function cerrarModal() {
		setModalAbierto(null)
	}

	function abrirModalConfig(prod) {
		setProductoConfig(prod)
		setNuevoStockMinimo(prod.stock_minimo || 10)
		setModalConfig(true)
	}

	function cerrarModalConfig() {
		setModalConfig(false)
		setProductoConfig(null)
	}

	async function guardarStockMinimo() {
		if (!productoConfig) return

		try {
			const { error } = await supabase
				.from('productos')
				.update({ stock_minimo: nuevoStockMinimo })
				.eq('id', productoConfig.id)

			if (error) {
				console.error('Error actualizando stock mínimo:', error)
				alert('Error al actualizar: ' + error.message)
				return
			}

			alert(`✓ Stock mínimo actualizado a ${nuevoStockMinimo}kg para ${productoConfig.nombre}`)
			cargarStock()
			cerrarModalConfig()
		} catch (err) {
			console.error('Error:', err)
			alert('Error al actualizar stock mínimo')
		}
	}

	async function consolidarMovimientos() {
		if (!window.confirm('¿Estás seguro de consolidar todo el historial de movimientos?\n\nEsto eliminará todos los movimientos antiguos y creará un solo registro por producto.\nEl stock actual NO cambiará.')) {
			return
		}

		try {
			// Obtener todos los productos con stock
			const { data: productos, error: errorProd } = await supabase
				.from('productos')
				.select('id, nombre, stock')

			if (errorProd) throw errorProd

			if (!productos || productos.length === 0) {
				alert('No hay productos para consolidar')
				return
			}

			let consolidados = 0
			let errores = 0
			const total = productos.length

			// Mostrar progreso inicial
			console.log(`🗜️ Iniciando consolidación de ${total} productos...`)

			for (let i = 0; i < productos.length; i++) {
				const prod = productos[i]
				
				// Mostrar progreso cada 5 productos
				if ((i + 1) % 5 === 0 || i === productos.length - 1) {
					console.log(`📦 Procesando: ${i + 1}/${total} - ${prod.nombre}`)
				}

				try {
					// Primero crear el movimiento consolidado
					const { error: errorInsert } = await supabase
						.from('movimientos_stock')
						.insert({
							producto_id: prod.id,
							tipo: 'consolidacion',
							cantidad: prod.stock || 0,
							created_at: new Date().toISOString(),
							observaciones: `Consolidación de historial - Stock actual: ${prod.stock || 0}kg`
						})

					if (errorInsert) {
						console.error(`❌ Error creando consolidación de ${prod.nombre}:`, errorInsert)
						errores++
						continue
					}

					// Después eliminar todos los movimientos anteriores EXCEPTO el que acabamos de crear
					const { error: errorDelete } = await supabase
						.from('movimientos_stock')
						.delete()
						.eq('producto_id', prod.id)
						.neq('tipo', 'consolidacion')

					if (errorDelete) {
						console.error(`❌ Error eliminando movimientos antiguos de ${prod.nombre}:`, errorDelete)
						errores++
						continue
					}

					consolidados++
				} catch (err) {
					console.error(`❌ Error procesando ${prod.nombre}:`, err)
					errores++
				}
			}

			console.log(`✅ Consolidación finalizada: ${consolidados}/${total} productos`)

			if (errores > 0) {
				alert(`⚠️ Consolidación completada con errores\n\nProductos consolidados: ${consolidados}\nErrores: ${errores}\n\nRevisa la consola para más detalles`)
			} else {
				alert(`✓ Historial consolidado exitosamente\n${consolidados} productos procesados`)
			}
			
			cargarStock()
		} catch (err) {
			console.error('Error consolidando:', err)
			alert('Error al consolidar historial: ' + err.message)
		}
	}

	function selectProducto(prod) {
		setSelectedProductId(prod.id)
		setSearchProducto(prod.nombre)
		setShowProductosDropdown(false)
	}

	function selectPresentacion(pres) {
		setSelectedPresentacionId(pres.id)
		setSearchPresentacion(pres.nombre)
		setShowPresentacionDropdown(false)
	}

	function esProductoPorUnidad(nombreProducto) {
		return nombreProducto.toLowerCase().includes('cera')
	}

	async function guardarMovimiento() {
		if (!selectedProductId || !selectedPresentacionId || cantidad <= 0) {
			alert('Completa todos los campos')
			return
		}

		try {
			const producto = productos.find(p => p.id === selectedProductId)
			const presentacion = presentaciones.find(p => p.id === selectedPresentacionId)
			
			if (!producto || !presentacion) {
				alert('Producto o presentación no encontrado')
				return
			}

			// Debug: Ver qué contiene la presentación
			console.log('Presentación seleccionada:', presentacion)
			console.log('Peso kg:', presentacion.peso_kg)
			console.log('Cantidad ingresada:', cantidad)

			// Calcular cantidad en kg según la presentación (usando peso_kg, NO contenido_kg)
			const contenidoKg = Number(presentacion.peso_kg) || 1
			const cantidadEnKg = cantidad * contenidoKg

			console.log('Cantidad en kg calculada:', cantidadEnKg)

			// Obtener stock actual del producto
			const { data: productoData, error: fetchError } = await supabase
				.from('productos')
				.select('stock')
				.eq('id', selectedProductId)
				.single()

			if (fetchError) {
				console.error('Error obteniendo stock:', fetchError)
				alert('Error al obtener stock actual')
				return
			}

			const stockAnterior = productoData?.stock || 0
			let stockNuevo = stockAnterior

			// Calcular nuevo stock según el tipo de movimiento
			if (modalAbierto === 'ingreso') {
				stockNuevo = stockAnterior + cantidadEnKg
			} else if (modalAbierto === 'egreso') {
				stockNuevo = stockAnterior - cantidadEnKg
				if (stockNuevo < 0) {
					if (!window.confirm(`El stock quedará negativo (${stockNuevo.toFixed(2)}kg). ¿Continuar?`)) {
						return
					}
				}
			}

			console.log('Stock anterior:', stockAnterior)
			console.log('Stock nuevo:', stockNuevo)

			// 1. Insertar movimiento en tabla movimientos_stock
			const movimiento = {
				tipo: modalAbierto,
				producto_id: selectedProductId,
				presentacion_id: selectedPresentacionId,
				cantidad: cantidadEnKg,
				created_at: new Date().toISOString(),
				observaciones: `${modalAbierto === 'ingreso' ? 'Ingreso' : 'Egreso'} manual: ${cantidad} ${presentacion.nombre} (${cantidadEnKg.toFixed(2)}kg)`
			}

			const { error: insertError } = await supabase
				.from('movimientos_stock')
				.insert([movimiento])

			if (insertError) {
				console.error('Error insertando movimiento:', insertError)
				alert('Error al registrar movimiento: ' + insertError.message)
				return
			}

			// 2. Actualizar stock en tabla productos
			const { error: updateError } = await supabase
				.from('productos')
				.update({ stock: stockNuevo })
				.eq('id', selectedProductId)

			if (updateError) {
				console.error('Error actualizando stock:', updateError)
				alert('Error al actualizar stock: ' + updateError.message)
				return
			}

			alert(`✓ ${modalAbierto === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado\nCantidad: ${cantidad} ${presentacion.nombre} (${cantidadEnKg.toFixed(2)}kg)\nStock anterior: ${stockAnterior.toFixed(2)}kg\nStock nuevo: ${stockNuevo.toFixed(2)}kg`)
			
			cargarDatos()
			cargarStock()
			cerrarModal()
		} catch (err) {
			console.error('Error guardando movimiento:', err)
			alert('Error al guardar el movimiento')
		}
	}

	const inputStyle = {
		width: '100%',
		padding: '8px',
		border: '1px solid #555',
		borderRadius: '4px',
		fontSize: '14px',
		boxSizing: 'border-box',
		backgroundColor: '#1a1a1a',
		color: '#fff'
	}

	const dropdownStyle = {
		position: 'absolute',
		top: '100%',
		left: 0,
		right: 0,
		backgroundColor: '#1a1a1a',
		border: '1px solid #555',
		borderRadius: '4px',
		marginTop: '4px',
		maxHeight: '180px',
		overflow: 'auto',
		zIndex: 10
	}

	const dropdownItemStyle = {
		padding: '10px',
		cursor: 'pointer',
		fontSize: '14px',
		color: '#fff'
	}

	const productosFiltrados = productos.filter(p =>
		p.nombre.toLowerCase().includes(searchProducto.toLowerCase())
	)

	const presentacionesFiltradas = presentaciones.filter(p =>
		p.nombre.toLowerCase().includes(searchPresentacion.toLowerCase())
	)

	const productoSeleccionado = productos.find(p => p.id === selectedProductId)
	const esPorUnidad = productoSeleccionado ? esProductoPorUnidad(productoSeleccionado.nombre) : false

	return (
		<PageContainer 
			title="Stock" 
			subtitle="Movimientos e inventario"
			footer={<Link to='/dashboard' className='back-link'>Volver</Link>}
		>
		<div style={{display:'flex', gap:8, marginBottom:12}}>
			<button className='btn' onClick={() => abrirModal('ingreso')}>Ingreso manual</button>
			<button className='btn' onClick={() => abrirModal('egreso')}>Egreso manual</button>
			<button 
				className='btn' 
				onClick={consolidarMovimientos}
				style={{ marginLeft: 'auto', backgroundColor: '#f59e0b' }}
				title="Consolida todo el historial de movimientos en un solo registro por producto"
			>
				🗜️ Consolidar historial
			</button>
		</div>

		<div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
			{/* Columna izquierda: Stock de productos */}
			<div style={{ flex: '1 1 50%', minWidth: 0 }}>
				<h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#fff' }}>Stock de Productos</h3>
				{loading ? (
					<div className='small'>Cargando stock...</div>
				) : (
					<table className='table' style={{ marginBottom: '30px' }}>
						<thead>
							<tr>
								<th>Producto</th>
								<th>Stock actual</th>
								<th>Stock mínimo</th>
								<th>Estado</th>
								<th>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{productosStock.length === 0 ? (
								<tr>
									<td colSpan={5} className='small'>No hay productos con stock</td>
								</tr>
							) : (
								productosStock.map(prod => {
									const stock = prod.stock || 0
									const stockMinimo = prod.stock_minimo || 10
									const esAlerta = stock < stockMinimo
									return (
										<tr key={prod.id}>
											<td>{prod.nombre}</td>
											<td>{stock.toFixed(2)} kg</td>
											<td>{stockMinimo.toFixed(0)} kg</td>
											<td>
												{esAlerta ? (
													<span style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ Stock bajo</span>
												) : (
													<span style={{ color: '#10b981' }}>✓ OK</span>
												)}
											</td>
											<td>
												<button 
													className='btn btn-ghost' 
													onClick={() => abrirModalConfig(prod)}
													style={{ padding: '4px 8px', fontSize: '12px' }}
												>
													⚙️ Configurar
												</button>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				)}
			</div>

			{/* Columna derecha: Últimos movimientos */}
			<div style={{ flex: '1 1 50%', minWidth: 0 }}>
				<h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#fff' }}>Últimos Movimientos</h3>
				<div style={{ maxHeight: '500px', overflowY: 'auto' }}>
					<table className='table' style={{ fontSize: '12px' }}>
						<thead style={{ position: 'sticky', top: 0, backgroundColor: '#1a1a1a', zIndex: 1 }}>
							<tr>
								<th style={{ padding: '8px 6px' }}>Fecha</th>
								<th style={{ padding: '8px 6px' }}>Tipo</th>
								<th style={{ padding: '8px 6px' }}>Producto</th>
								<th style={{ padding: '8px 6px' }}>Cantidad</th>
								<th style={{ padding: '8px 6px' }}>Observaciones</th>
							</tr>
						</thead>
						<tbody>
							{movimientos.length === 0 ? (
								<tr>
									<td colSpan={5} className='small'>No hay movimientos registrados</td>
								</tr>
							) : (
								movimientos.map(mov => (
									<tr key={mov.id}>
										<td style={{ padding: '6px', fontSize: '11px' }}>
											{new Date(mov.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} {new Date(mov.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
										</td>
										<td style={{ padding: '6px' }}>
											<span style={{
												padding: '3px 6px',
												borderRadius: '3px',
												fontSize: '10px',
												fontWeight: 'bold',
												backgroundColor: 
													mov.tipo === 'ingreso' ? '#10b981' : 
													mov.tipo === 'egreso' ? '#ef4444' : 
													mov.tipo === 'consolidacion' ? '#8b5cf6' :
													'#f59e0b',
												color: 'white',
												display: 'inline-block',
												whiteSpace: 'nowrap'
											}}>
												{mov.tipo === 'ingreso' ? 'ING' : 
												 mov.tipo === 'egreso' ? 'EGR' :
												 mov.tipo === 'consolidacion' ? 'CONS' :
												 mov.tipo === 'venta' ? 'VTA' : 'DEV'}
											</span>
										</td>
										<td style={{ padding: '6px', fontSize: '11px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
											{mov.productos?.nombre || 'N/D'}
										</td>
										<td style={{ 
											padding: '6px',
											fontSize: '11px',
											color: mov.cantidad < 0 ? '#ef4444' : '#10b981',
											fontWeight: 'bold',
											whiteSpace: 'nowrap'
										}}>
											{mov.cantidad > 0 ? '+' : ''}{mov.cantidad.toFixed(2)}
										</td>
										<td style={{ padding: '6px', fontSize: '10px', color: '#999', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
											{mov.observaciones || '-'}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				<div className='comment' style={{ marginTop: '8px', fontSize: '11px' }}>
					💡 Los movimientos automáticos por ventas se registrarán cuando cambies el estado a "vendido"
				</div>
			</div>
		</div>			{/* Modal de ingreso/egreso */}
			{modalAbierto && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.7)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000
					}}
					onClick={cerrarModal}
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
							{modalAbierto === 'ingreso' ? 'Ingreso Manual' : 'Egreso Manual'}
						</h3>

						{/* Selector de Producto */}
						<div style={{ marginBottom: '16px', position: 'relative' }} ref={refProducto}>
							<label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
								Producto
							</label>
							<input
								type="text"
								placeholder="Buscar producto..."
								value={searchProducto}
								onChange={(e) => {
									setSearchProducto(e.target.value)
									setShowProductosDropdown(true)
									setSelectedProductId(null)
								}}
								onFocus={() => setShowProductosDropdown(true)}
								onMouseDown={(e) => e.stopPropagation()}
								style={inputStyle}
							/>
							{showProductosDropdown && productosFiltrados.length > 0 && (
								<div style={dropdownStyle} onMouseDown={(e) => e.stopPropagation()}>
									{productosFiltrados.map(prod => (
										<div
											key={prod.id}
											style={dropdownItemStyle}
											onMouseDown={(e) => {
												e.stopPropagation()
												selectProducto(prod)
											}}
											onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
											onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
										>
											{prod.nombre}
										</div>
									))}
								</div>
							)}
						</div>

						{/* Selector de Presentación */}
						<div style={{ marginBottom: '16px', position: 'relative' }} ref={refPresentacion}>
							<label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
								Presentación
							</label>
							<input
								type="text"
								placeholder="Buscar presentación..."
								value={searchPresentacion}
								onChange={(e) => {
									setSearchPresentacion(e.target.value)
									setShowPresentacionDropdown(true)
									setSelectedPresentacionId(null)
								}}
								onFocus={() => setShowPresentacionDropdown(true)}
								onMouseDown={(e) => e.stopPropagation()}
								style={inputStyle}
							/>
							{showPresentacionDropdown && presentacionesFiltradas.length > 0 && (
								<div style={dropdownStyle} onMouseDown={(e) => e.stopPropagation()}>
									{presentacionesFiltradas.map(pres => (
										<div
											key={pres.id}
											style={dropdownItemStyle}
											onMouseDown={(e) => {
												e.stopPropagation()
												selectPresentacion(pres)
											}}
											onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
											onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
										>
											{pres.nombre}
										</div>
									))}
								</div>
							)}
						</div>

						{/* Input de Cantidad */}
						<div style={{ marginBottom: '20px' }}>
							<label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
								Cantidad (unidades)
								{selectedPresentacionId && (
									<span style={{ color: '#10b981', marginLeft: '8px' }}>
										{presentaciones.find(p => p.id === selectedPresentacionId)?.peso_kg 
											? `= ${(cantidad * (presentaciones.find(p => p.id === selectedPresentacionId)?.peso_kg || 1)).toFixed(2)}kg`
											: ''}
									</span>
								)}
							</label>
							<input
								type="number"
								min="0"
								step="1"
								value={cantidad}
								onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
								onMouseDown={(e) => e.stopPropagation()}
								style={inputStyle}
							/>
						</div>

						{/* Botones */}
						<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
							<button className="btn btn-ghost" onClick={cerrarModal} onMouseDown={(e) => e.stopPropagation()}>
								Cancelar
							</button>
							<button className="btn" onClick={guardarMovimiento} onMouseDown={(e) => e.stopPropagation()}>
								Guardar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Configurar Stock Mínimo */}
			{modalConfig && productoConfig && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.7)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000
					}}
					onClick={cerrarModalConfig}
				>
					<div
						style={{
							backgroundColor: '#1a1a1a',
							borderRadius: '12px',
							padding: '24px',
							maxWidth: '400px',
							width: '90%',
							border: '1px solid #2a2a2a'
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
							Configurar Stock Mínimo
						</h3>

						<div style={{ marginBottom: '16px' }}>
							<label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
								Producto
							</label>
							<div style={{ padding: '8px', color: '#fff', fontWeight: 'bold' }}>
								{productoConfig.nombre}
							</div>
						</div>

						<div style={{ marginBottom: '20px' }}>
							<label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
								Stock mínimo (kg)
							</label>
							<input
								type="number"
								min="0"
								step="1"
								value={nuevoStockMinimo}
								onChange={(e) => setNuevoStockMinimo(parseFloat(e.target.value) || 0)}
								style={inputStyle}
							/>
						</div>

						<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
							<button className="btn btn-ghost" onClick={cerrarModalConfig}>
								Cancelar
							</button>
							<button className="btn" onClick={guardarStockMinimo}>
								Guardar
							</button>
						</div>
					</div>
				</div>
			)}
		</PageContainer>
	)
}
