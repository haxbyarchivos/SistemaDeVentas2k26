import React, { useEffect, useState } from 'react'
import PageContainer from '../components/PageContainer'
import { Link } from 'react-router-dom'
import supabase from '../utils/supabaseClient'
import '../styles/global.css'

// Estilos reutilizables
const styles = {
	input: {width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px'},
	dropdown: {position:'absolute', top:'100%', left:0, right:0, backgroundColor:'white', border:'1px solid #ccc', borderRadius:'4px', marginTop:'4px', maxHeight:'180px', overflow:'auto', zIndex:10},
	dropdownItem: {padding:'8px', cursor:'pointer', borderBottom:'1px solid #eee', fontSize:'12px'}
}

export default function Cotizar(){
	const [presentaciones, setPresentaciones] = useState([])
	const [productos, setProductos] = useState([])
	const [loading, setLoading] = useState(false)
	const [selectedProductId, setSelectedProductId] = useState(null)
	const [selectedPresentacionId, setSelectedPresentacionId] = useState(null)
	const [cantidad, setCantidad] = useState(1)
	const [precioUnitUSD, setPrecioUnitUSD] = useState('')
	const [valorDolar, setValorDolar] = useState('')
	const [items, setItems] = useState([])
	const [searchProducto, setSearchProducto] = useState('')
	const [showProductosDropdown, setShowProductosDropdown] = useState(false)
	const [searchPresentacion, setSearchPresentacion] = useState('')
	const [showPresentacionDropdown, setShowPresentacionDropdown] = useState(false)

	useEffect(()=> {
		async function fetchPresentaciones(){
			const { data, error } = await supabase
				.from('presentaciones')
				.select('*')
				.eq('activo', true)
				.order('nombre', { ascending: true })

			if(error){
				console.error('Error cargando presentaciones:', error)
				setPresentaciones([])
			} else if(data){
				setPresentaciones(data || [])
			}
		}
		fetchPresentaciones()
		
		async function fetchProductos(){
			const { data, error } = await supabase
				.from('productos')
				.select('*')
				.eq('activo', true)
				.order('nombre', { ascending: true })
			if(error){
				console.error('Error cargando productos:', error)
				setProductos([])
			} else if(data){
				setProductos(data || [])
			}
		}
		fetchProductos()
		
		async function fetchConfig(){
			const { data, error } = await supabase
				.from('app_config')
				.select('value')
				.eq('key','valor_dolar')
				.limit(1)
				.maybeSingle()
			if(error){
				console.error('Error fetching config:', error)
			} else if(data && data.value){
				setValorDolar(data.value)
			}
		}
		fetchConfig()
	},[])

	function handleSelect(e){
		const id = e.target.value
		setSelectedPresentacionId(id)
		const pres = presentaciones.find(p => p.id === id)
		if(pres) setSearchPresentacion(pres.nombre)
	}

	function handlePresentacionSearch(value){
		setSearchPresentacion(value)
		setShowPresentacionDropdown(true)
	}

	function selectPresentacion(pres){
		setSelectedPresentacionId(pres.id)
		setSearchPresentacion(pres.nombre)
		setShowPresentacionDropdown(false)
	}

	function selectProducto(prod){
		setSelectedProductId(prod.id)
		setSearchProducto(prod.nombre)
		setShowProductosDropdown(false)
		// Reset presentación
		setSelectedPresentacionId(null)
		setSearchPresentacion('')
	}

	const filteredPresentaciones = presentaciones.filter(p =>
		p.nombre?.toLowerCase().includes(searchPresentacion.toLowerCase())
	)

	const filteredProductos = productos.filter(p =>
		p.nombre?.toLowerCase().includes(searchProducto.toLowerCase())
	)

	function handleProductSelect(e){
		const id = e.target.value
		setSelectedProductId(id)
		const prod = productos.find(p => p.id === id)
		if(prod) setSearchProducto(prod.nombre)
	}

	function getPresentacionPeso(){
		if(!selectedPresentacionId) return 0
		const pres = presentaciones.find(p => p.id === selectedPresentacionId)
		return pres ? (Number(pres.peso_kg) || 0) : 0
	}

	function kilosTotales(){
		return getPresentacionPeso() * (Number(cantidad) || 1)
	}

	function agregarAlCarrito(){
		if(!selectedPresentacionId){
			alert('Seleccioná una presentación antes de agregar')
			return
		}
		if(!precioUnitUSD || Number(precioUnitUSD) === 0){
			alert('Ingresá un precio por kg')
			return
		}

		const prod = productos.find(p => p.id === selectedProductId)
		const pres = presentaciones.find(p => p.id === selectedPresentacionId)
		const peso = getPresentacionPeso()
		const kilos = kilosTotales()
		const precioUSD = kilos * Number(precioUnitUSD)

		const item = {
			id: Date.now(),
			producto_nombre: prod?.nombre || 'N/D',
			presentacion_nombre: pres?.nombre || 'N/D',
			cantidad: Number(cantidad) || 1,
			peso_por_unidad: peso,
			kilos: kilos,
			precio_unit_usd: Number(precioUnitUSD),
			precio_item_usd: precioUSD,
			precio_item_ars: precioUSD * (Number(valorDolar) || 0)
		}

		setItems(prev => [...prev, item])
		// Reset form
		setSelectedProductId(null)
		setSelectedPresentacionId(null)
		setSearchProducto('')
		setSearchPresentacion('')
		setCantidad(1)
		setPrecioUnitUSD('')
	}

	function eliminarItem(itemId){
		setItems(prev => prev.filter(it => it.id !== itemId))
	}

	function vaciarCarrito(){
		if(window.confirm('¿Estás seguro de que querés vaciar el carrito?')){
			setItems([])
		}
	}

	function totalUSD(){
		return items.reduce((sum, it) => sum + it.precio_item_usd, 0)
	}

	function totalARS(){
		return totalUSD() * (Number(valorDolar) || 0)
	}

	function generarMensajeWhatsApp(){
		const fecha = new Date().toLocaleDateString('es-AR')
		let msg = `*COTIZACIÓN - ${fecha}*\n\n`
		msg += `Dólar: $${valorDolar}\n\n`
		msg += `*Detalles:*\n`
		items.forEach((it, idx) => {
			msg += `${idx + 1}. ${it.producto_nombre} - ${it.presentacion_nombre}\n`
			msg += `   Cant: ${it.cantidad} x ${it.peso_por_unidad}kg = ${it.kilos.toFixed(3)}kg\n`
			msg += `   Precio: $${it.precio_item_usd.toFixed(2)} USD / $${it.precio_item_ars.toFixed(2)} ARS\n\n`
		})
		msg += `*TOTALES:*\n`
		msg += `USD: $${totalUSD().toFixed(2)}\n`
		msg += `ARS: $${totalARS().toFixed(2)}`
		return msg
	}

	function copiarAlPortapapeles(){
		const msg = generarMensajeWhatsApp()
		navigator.clipboard.writeText(msg).then(() => {
			alert('✓ Cotización copiada al portapapeles')
		}).catch(err => {
			console.error('Error copiando:', err)
			alert('No se pudo copiar. Intenta manualmente.')
		})
	}

	function exportarPDF(){
		const msg = generarMensajeWhatsApp()
		const ventana = window.open()
		ventana.document.write('<pre style="font-family:monospace;white-space:pre-wrap;">' + msg.replace(/\*/g, '') + '</pre>')
		ventana.print()
	}

	async function guardarVenta(){
		if(items.length === 0){
			alert('El carrito está vacío')
			return
		}
		try {
			alert(`✓ Venta guardada con ${items.length} items\nTotal: $${totalUSD().toFixed(2)} USD / $${totalARS().toFixed(2)} ARS`)
			setItems([])
		} catch(err) {
			console.error('Error guardando venta:', err)
			alert('Error al guardar la venta')
		}
	}

	async function saveValorDolarToConfig(value){
		try{
			const up = { key: 'valor_dolar', value: String(value), updated_at: new Date().toISOString() }
			const { error } = await supabase.from('app_config').upsert(up, { onConflict: 'key' })
			if(error) console.error('Error guardando valor_dolar:', error)
		}catch(err){
			console.error('Error guardando valor_dolar (catch):', err)
		}
	}

	const footerContent = (
		<div style={{display:'flex', alignItems:'center', gap:8}}>
			<Link to='/dashboard' className='back-link'>Volver</Link>
			<div style={{display:'flex', gap:8, alignItems:'center'}}>
				<label className='small' style={{margin:0}}>Dólar (ARS)</label>
				<input className='input' style={{width:120}} value={valorDolar} onChange={e=>setValorDolar(e.target.value)} onBlur={e=>saveValorDolarToConfig(e.target.value)} placeholder='Ej: 350.50' />
				<button className='btn btn-ghost' onClick={()=>saveValorDolarToConfig(valorDolar)}>Guardar</button>
			</div>
		</div>
	)

	return (
		<PageContainer title="Cotizador" subtitle="Crear cotizaciones precisas" footer={footerContent}>

			<div style={{display:'grid', gap:12}}>
						<div style={{display:'grid', gridTemplateColumns: '1fr 1fr 120px 120px', gap:8, alignItems:'end'}}>
							<div>
								<label className='small'>Producto</label>
								<select value={selectedProductId} onChange={handleProductSelect} style={{width:'100%', backgroundColor:'#000', color:'#fff', padding:'8px', borderRadius:'4px', border:'1px solid #ddd'}}>
									<option value=''>-- Seleccioná producto (opcional)--</option>
									{productos.map(p => (
										<option key={p.id} value={p.id}>{p.nombre} {p.codigo ? `(${p.codigo})` : ''}</option>
									))}
								</select>
								{productos.length === 0 && !loading && <div className='small'>No hay productos cargados en la tabla `productos`.</div>}
							</div>

							<div style={{position:'relative'}}>
								<label className='small'>Envase / Presentación</label>
								<input 
									type='text' 
									className='input'
									placeholder='Busca un envase...'
									value={searchPresentacion}
									onChange={e => handlePresentacionSearch(e.target.value)}
									onFocus={() => setShowPresentacionDropdown(true)}
									style={{width:'100%'}}
								/>
								{showPresentacionDropdown && (
									<div style={{position:'absolute', top:'100%', left:0, right:0, backgroundColor:'white', border:'1px solid #ccc', borderRadius:'4px', marginTop:'4px', maxHeight:'200px', overflow:'auto', zIndex:10}}>
										{filteredPresentaciones.length === 0 ? (
											<div style={{padding:'8px', color:'#999'}}>No hay coincidencias</div>
										) : (
											filteredPresentaciones.map(p => (
												<div 
													key={p.id}
													onClick={() => selectPresentacion(p)}
													style={{padding:'8px', cursor:'pointer', borderBottom:'1px solid #eee', backgroundColor: selectedId === p.id ? '#e0e0e0' : 'white'}}
												>
													{p.nombre} ({p.peso} kg)
												</div>
											))
										)}
									</div>
								)}
								{!loading && presentaciones.length === 0 && <div className='small'>No hay envases cargados en la tabla `presentaciones`.</div>}
							</div>

					<div>
						<label className='small'>Cantidad</label>
						<input type='number' min={1} value={cantidad} onChange={e=>setCantidad(e.target.value)} className='input' />
					</div>

					<div>
						<label className='small'>Peso / unidad (kg)</label>
						<input type='number' step='0.001' value={pesoPorUnidad} onChange={e=>setPesoPorUnidad(e.target.value)} className='input' />
					</div>

					<div>
						<label className='small'>Precio unit. (USD por kg)</label>
						<input type='number' step='0.01' value={precioUnitUSD} onChange={e=>setPrecioUnitUSD(e.target.value)} className='input' />
					</div>
				</div>

				<div style={{display:'flex', gap:8}}>
					<button className='btn' onClick={agregarItem}>Agregar item</button>
					<button className='btn'>Guardar cotización</button>
					<button className='btn'>Exportar (PDF / JSON)</button>
				</div>

				<div className='small'>Kilos por item: <strong>{kilosTotales().toFixed(3)}</strong> kg</div>

				<table className='table'>
					<thead>
						<tr>
							<th>Presentación</th>
							<th>Cantidad</th>
							<th>Kg</th>
							<th>Precio unit. (USD/kg)</th>
							<th>Precio item (USD)</th>
							<th>Acciones</th>
						</tr>
					</thead>
					<tbody>
						{items.length === 0 && (
							<tr><td colSpan={6} className='small'>No hay items agregados.</td></tr>
						)}
						{items.map(it => (
							<tr key={it.id}>
								<td>{it.presentacion_nombre}</td>
								<td>{it.cantidad}</td>
								<td>{it.kilos.toFixed(3)}</td>
								<td>{(it.precio_unit_usd || 0).toFixed(2)}</td>
								<td>{( (it.precio_unit_usd || 0) * it.kilos ).toFixed(2)}</td>
								<td>{( ((it.precio_unit_usd || 0) * it.kilos) * (Number(valorDolar) || 0) ).toFixed(2)} ARS</td>
								<td><button className='btn btn-ghost' onClick={()=>eliminarItem(it.id)}>Eliminar</button></td>
							</tr>
						))}
					</tbody>
				</table>

				<div style={{display:'flex', justifyContent:'flex-end', marginTop:12, gap:12}}>
					<div className='title'>Total USD: ${totalUSD().toFixed(2)}</div>
					<div className='title'>Total ARS: ${ (totalUSD() * (Number(valorDolar) || 0)).toFixed(2) }</div>
				</div>

			</div>

			<div className='comment'>Seleccioná un envase y la cantidad; el peso por unidad se completa automáticamente desde la tabla `presentaciones`. Si necesitás que el cálculo incluya el valor del dólar o reglas especiales, lo integramos después.</div>
		</PageContainer>
	)
}
