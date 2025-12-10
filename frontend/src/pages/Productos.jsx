import React, { useState, useEffect } from 'react'
import PageContainer from '../components/PageContainer'
import { Link } from 'react-router-dom'
import supabase from '../utils/supabaseClient'
import '../styles/global.css'

export default function Productos(){
	const [productos, setProductos] = useState([])
	const [listas, setListas] = useState([])
	const [precios, setPrecios] = useState({}) // { producto_id: { lista_id: precio } }
	const [loading, setLoading] = useState(true)
	const [modalEditar, setModalEditar] = useState(false)
	const [productoSeleccionado, setProductoSeleccionado] = useState(null)
	const [preciosEditar, setPreciosEditar] = useState({})
	const [modalListas, setModalListas] = useState(false)
	const [listaEditar, setListaEditar] = useState(null)
	const [nombreLista, setNombreLista] = useState('')
	const [monedaLista, setMonedaLista] = useState('USD')

	useEffect(() => {
		cargarDatos()
	}, [])

	async function cargarDatos() {
		try {
			setLoading(true)
			
			// Cargar productos activos
			const { data: prodData } = await supabase
				.from('productos')
				.select('*')
				.eq('activo', true)
				.order('nombre')
			
			console.log('Productos cargados:', prodData)
			if (prodData) setProductos(prodData)

			// Cargar listas de precios activas
			const { data: listasData, error: listasError } = await supabase
				.from('listas_precios')
				.select('*')
				.order('nombre')
			
			if (listasError) {
				console.error('Error cargando listas:', listasError)
			}
			console.log('Listas de precios:', listasData)
			if (listasData) setListas(listasData)

			// Cargar todos los precios
			const { data: preciosData } = await supabase
				.from('precios_producto')
				.select('*')
			
			console.log('Precios cargados:', preciosData)
			console.log('Primer precio detallado:', preciosData?.[0])
			
			// Organizar precios por producto y lista
			const preciosMap = {}
			if (preciosData) {
				preciosData.forEach(p => {
					if (!preciosMap[p.producto_id]) {
						preciosMap[p.producto_id] = {}
					}
					preciosMap[p.producto_id][p.lista_precio_id] = p.precio_usd_kg
				})
			}
			console.log('Mapa de precios organizado:', preciosMap)
			setPrecios(preciosMap)

		} catch (err) {
			console.error('Error cargando datos:', err)
		} finally {
			setLoading(false)
		}
	}

	// ID de la lista general
	const LISTA_GENERAL_ID = '12989162-fdb2-4532-a893-5107b4c1cffb'

	function abrirModalEditar(producto) {
		setProductoSeleccionado(producto)
		// Cargar precios actuales del producto
		const preciosActuales = {}
		listas.forEach(lista => {
			preciosActuales[lista.id] = precios[producto.id]?.[lista.id] || 0
		})
		setPreciosEditar(preciosActuales)
		setModalEditar(true)
	}

	function cerrarModal() {
		setModalEditar(false)
		setProductoSeleccionado(null)
		setPreciosEditar({})
	}

	function abrirModalListas() {
		setModalListas(true)
	}

	function cerrarModalListas() {
		setModalListas(false)
		setListaEditar(null)
		setNombreLista('')
		setMonedaLista('USD')
	}

	function editarLista(lista) {
		setListaEditar(lista)
		setNombreLista(lista.nombre)
		setMonedaLista(lista.moneda)
	}

	async function guardarLista() {
		if (!nombreLista.trim()) {
			alert('Ingresa un nombre para la lista')
			return
		}

		try {
			if (listaEditar) {
				// Actualizar lista existente
				const { error } = await supabase
					.from('listas_precios')
					.update({ 
						nombre: nombreLista,
						moneda: monedaLista
					})
					.eq('id', listaEditar.id)

				if (error) throw error
				alert('✓ Lista actualizada correctamente')
			} else {
				// Crear nueva lista
				const { data: nuevaLista, error } = await supabase
					.from('listas_precios')
					.insert({ 
						nombre: nombreLista,
						moneda: monedaLista,
						activo: true
					})
					.select()
					.single()

				if (error) throw error

				// Copiar precios de la lista GENERAL a la nueva lista
				const { data: preciosGenerales } = await supabase
					.from('precios_producto')
					.select('producto_id, precio_usd_kg')
					.eq('lista_precio_id', LISTA_GENERAL_ID)

				if (preciosGenerales && preciosGenerales.length > 0) {
					const nuevosPreciosPromises = preciosGenerales.map(precio => 
						supabase
							.from('precios_producto')
							.insert({
								producto_id: precio.producto_id,
								lista_precio_id: nuevaLista.id,
								precio_usd_kg: precio.precio_usd_kg,
								activo: true
							})
					)

					await Promise.all(nuevosPreciosPromises)
				}

				alert('✓ Lista creada correctamente con precios de la lista GENERAL')
			}

			cargarDatos()
			setListaEditar(null)
			setNombreLista('')
			setMonedaLista('USD')
		} catch (err) {
			console.error('Error guardando lista:', err)
			alert('Error al guardar lista: ' + err.message)
		}
	}

	async function eliminarLista(listaId) {
		if (listaId === LISTA_GENERAL_ID) {
			alert('No puedes eliminar la lista GENERAL')
			return
		}

		if (!window.confirm('¿Estás seguro de eliminar esta lista de precios? Se eliminarán todos los precios asociados.')) {
			return
		}

		try {
			// Primero eliminar precios asociados
			await supabase
				.from('precios_producto')
				.delete()
				.eq('lista_precio_id', listaId)

			// Luego eliminar la lista
			const { error } = await supabase
				.from('listas_precios')
				.delete()
				.eq('id', listaId)

			if (error) throw error

			alert('✓ Lista eliminada correctamente')
			cargarDatos()
			setListaEditar(null)
			setNombreLista('')
		} catch (err) {
			console.error('Error eliminando lista:', err)
			alert('Error al eliminar lista: ' + err.message)
		}
	}

	async function guardarPrecios() {
		if (!productoSeleccionado) return

		try {
			// Para cada lista, actualizar o insertar precio
			for (const listaId of Object.keys(preciosEditar)) {
				const precio = parseFloat(preciosEditar[listaId]) || 0
				
				// Verificar si ya existe
				const { data: existente } = await supabase
					.from('precios_producto')
					.select('id')
					.eq('producto_id', productoSeleccionado.id)
					.eq('lista_precio_id', listaId)
					.single()

				if (existente) {
					// Actualizar
					await supabase
						.from('precios_producto')
						.update({ precio_usd_kg: precio })
						.eq('id', existente.id)
				} else {
					// Insertar
					await supabase
						.from('precios_producto')
						.insert({
							producto_id: productoSeleccionado.id,
							lista_precio_id: listaId,
							precio_usd_kg: precio
						})
				}
			}

			alert('✓ Precios actualizados correctamente')
			cargarDatos()
			cerrarModal()
		} catch (err) {
			console.error('Error guardando precios:', err)
			alert('Error al guardar precios: ' + err.message)
		}
	}

	if (loading) {
		return (
			<PageContainer title="Productos" subtitle="Listado de productos" footer={<Link to='/dashboard' className='back-link'>Volver</Link>}>
				<p>Cargando productos...</p>
			</PageContainer>
		)
	}

	return (
		<PageContainer title="Productos" subtitle="Listado de productos" footer={<Link to='/dashboard' className='back-link'>Volver</Link>}>
			<div style={{ marginBottom: '16px' }}>
				<button className="btn" onClick={abrirModalListas}>
					Gestionar Listas de Precios
				</button>
			</div>

			<table className='table'>
				<thead>
					<tr>
						<th>Producto</th>
						<th>Precio Lista General (USD)</th>
						<th>Acciones</th>
					</tr>
				</thead>
				<tbody>
					{productos.length === 0 ? (
						<tr>
							<td colSpan={3} className='small'>No hay productos cargados</td>
						</tr>
					) : (
						productos.map(prod => {
							const precioGeneral = precios[prod.id]?.[LISTA_GENERAL_ID] || 0
							return (
								<tr key={prod.id}>
									<td>{prod.nombre}</td>
									<td>${precioGeneral.toFixed(2)}</td>
									<td>
										<button 
											className='btn btn-ghost' 
											onClick={() => abrirModalEditar(prod)}
											style={{ padding: '4px 8px', fontSize: '12px' }}
										>
											Editar precios
										</button>
									</td>
								</tr>
							)
						})
					)}
				</tbody>
			</table>

			{/* Modal Editar Precios */}
			{modalEditar && productoSeleccionado && (
				<div 
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0,0,0,0.7)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 9999
					}}
					onMouseDown={cerrarModal}
				>
					<div 
						style={{
							backgroundColor: '#1a1a1a',
							padding: '24px',
							borderRadius: '8px',
							width: '90%',
							maxWidth: '500px',
							border: '1px solid #333',
							maxHeight: '80vh',
							overflowY: 'auto'
						}}
						onMouseDown={(e) => e.stopPropagation()}
					>
						<h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#fff' }}>
							Editar Precios: {productoSeleccionado.nombre}
						</h3>
						
						{/* Primero mostrar la lista GENERAL */}
						{listas.filter(lista => lista.id === LISTA_GENERAL_ID).map(lista => (
							<div key={lista.id} style={{ marginBottom: '16px' }}>
								<label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#10b981' }}>
									{lista.nombre} (USD)
								</label>
								<input
									type="number"
									min="0"
									step="0.01"
									value={preciosEditar[lista.id] || 0}
									onChange={(e) => setPreciosEditar({
										...preciosEditar,
										[lista.id]: e.target.value
									})}
									onMouseDown={(e) => e.stopPropagation()}
									style={{
										width: '100%',
										padding: '10px',
										backgroundColor: '#0f0f0f',
										border: '1px solid #333',
										borderRadius: '4px',
										color: '#fff',
										fontSize: '14px'
									}}
								/>
							</div>
						))}

						{/* Línea separadora */}
						{listas.filter(lista => lista.id !== LISTA_GENERAL_ID).length > 0 && (
							<div style={{ borderTop: '1px solid #333', margin: '16px 0' }}></div>
						)}

						{/* Luego las demás listas */}
						{listas.filter(lista => lista.id !== LISTA_GENERAL_ID).map(lista => (
							<div key={lista.id} style={{ marginBottom: '16px' }}>
								<label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
									{lista.nombre} (USD)
								</label>
								<input
									type="number"
									min="0"
									step="0.01"
									value={preciosEditar[lista.id] || 0}
									onChange={(e) => setPreciosEditar({
										...preciosEditar,
										[lista.id]: e.target.value
									})}
									onMouseDown={(e) => e.stopPropagation()}
									style={{
										width: '100%',
										padding: '10px',
										backgroundColor: '#0f0f0f',
										border: '1px solid #333',
										borderRadius: '4px',
										color: '#fff',
										fontSize: '14px'
									}}
								/>
							</div>
						))}

						<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
							<button className="btn btn-ghost" onClick={cerrarModal} onMouseDown={(e) => e.stopPropagation()}>
								Cancelar
							</button>
							<button className="btn" onClick={guardarPrecios} onMouseDown={(e) => e.stopPropagation()}>
								Guardar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Gestionar Listas de Precios */}
			{modalListas && (
				<div 
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0,0,0,0.7)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 9999
					}}
					onMouseDown={cerrarModalListas}
				>
					<div 
						style={{
							backgroundColor: '#1a1a1a',
							padding: '24px',
							borderRadius: '8px',
							width: '90%',
							maxWidth: '600px',
							border: '1px solid #333',
							maxHeight: '80vh',
							overflowY: 'auto'
						}}
						onMouseDown={(e) => e.stopPropagation()}
					>
						<h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#fff' }}>
							Gestionar Listas de Precios
						</h3>
						
						{/* Formulario crear/editar */}
						<div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#0f0f0f', borderRadius: '8px' }}>
							<h4 style={{ fontSize: '14px', color: '#10b981', marginBottom: '12px' }}>
								{listaEditar ? 'Editar Lista' : 'Nueva Lista'}
							</h4>
							<div style={{ marginBottom: '12px' }}>
								<label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
									Nombre de la lista
								</label>
								<input
									type="text"
									value={nombreLista}
									onChange={(e) => setNombreLista(e.target.value)}
									onMouseDown={(e) => e.stopPropagation()}
									placeholder="Ej: Cliente VIP"
									style={{
										width: '100%',
										padding: '10px',
										backgroundColor: '#1a1a1a',
										border: '1px solid #333',
										borderRadius: '4px',
										color: '#fff',
										fontSize: '14px'
									}}
								/>
							</div>
							<div style={{ marginBottom: '12px' }}>
								<label className="small" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#e5e5e5' }}>
									Moneda
								</label>
								<select
									value={monedaLista}
									onChange={(e) => setMonedaLista(e.target.value)}
									onMouseDown={(e) => e.stopPropagation()}
									style={{
										width: '100%',
										padding: '10px',
										backgroundColor: '#1a1a1a',
										border: '1px solid #333',
										borderRadius: '4px',
										color: '#fff',
										fontSize: '14px'
									}}
								>
									<option value="USD">USD</option>
									<option value="ARS">ARS</option>
									<option value="EUR">EUR</option>
								</select>
							</div>
							<div style={{ display: 'flex', gap: '8px' }}>
								<button className="btn" onClick={guardarLista} onMouseDown={(e) => e.stopPropagation()}>
									{listaEditar ? 'Actualizar' : 'Crear'}
								</button>
								{listaEditar && (
									<button className="btn btn-ghost" onClick={() => {
										setListaEditar(null)
										setNombreLista('')
										setMonedaLista('USD')
									}} onMouseDown={(e) => e.stopPropagation()}>
										Cancelar
									</button>
								)}
							</div>
						</div>

						{/* Lista de listas existentes */}
						<div>
							<h4 style={{ fontSize: '14px', color: '#e5e5e5', marginBottom: '12px' }}>
								Listas Existentes
							</h4>
							<table className='table' style={{ fontSize: '13px' }}>
								<thead>
									<tr>
										<th>Nombre</th>
										<th>Moneda</th>
										<th>Acciones</th>
									</tr>
								</thead>
								<tbody>
									{listas.map(lista => (
										<tr key={lista.id}>
											<td>
												{lista.nombre}
												{lista.id === LISTA_GENERAL_ID && (
													<span style={{ marginLeft: '8px', color: '#10b981', fontSize: '11px' }}>
														(Principal)
													</span>
												)}
											</td>
											<td>{lista.moneda}</td>
											<td>
												<button 
													className='btn btn-ghost' 
													onClick={() => editarLista(lista)}
													style={{ padding: '4px 8px', fontSize: '11px', marginRight: '4px' }}
												>
													Editar
												</button>
												{lista.id !== LISTA_GENERAL_ID && (
													<button 
														className='btn btn-ghost' 
														onClick={() => eliminarLista(lista.id)}
														style={{ padding: '4px 8px', fontSize: '11px', color: '#ef4444' }}
													>
														Eliminar
													</button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
							<button className="btn btn-ghost" onClick={cerrarModalListas} onMouseDown={(e) => e.stopPropagation()}>
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}
		</PageContainer>
	)
}