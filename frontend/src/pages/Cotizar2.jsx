import React, { useEffect, useState, useRef } from 'react'
import PageContainer from '../components/PageContainer'
import { Link } from 'react-router-dom'
import supabase from '../utils/supabaseClient'
import '../styles/global.css'

export default function Cotizar2(){
	const [presentaciones, setPresentaciones] = useState([])
	const [productos, setProductos] = useState([])
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
	// Cliente (selector simple, junto al valor del dólar)
	const [clientes, setClientes] = useState([])
	const [searchCliente, setSearchCliente] = useState('')
	const [showClientesDropdown, setShowClientesDropdown] = useState(false)
	const [clientesErrorMsg, setClientesErrorMsg] = useState('')
	const [selectedListaPrecioId, setSelectedListaPrecioId] = useState(null)
	const [preciosPorProducto, setPreciosPorProducto] = useState({})
	const [selectedClientId, setSelectedClientId] = useState(null)
	const refProducto = useRef(null)
	const refPresentacion = useRef(null)
	const refCliente = useRef(null)

	useEffect(()=> {
		async function fetchData(){
			const { data: presData } = await supabase
				.from('presentaciones')
				.select('*')
				.eq('activo', true)
				.order('nombre', { ascending: true })
			if(presData) setPresentaciones(presData)

			const { data: prodData } = await supabase
				.from('productos')
				.select('*')
				.eq('activo', true)
				.order('nombre', { ascending: true })
			if(prodData) setProductos(prodData)

				// Cargar clientes (mínimo campos necesarios) con manejo de errores
				try {
					const { data: clientesData, error: clientesError } = await supabase
						.from('clientes')
						.select('*')
					if (clientesError) {
						console.error('Error cargando clientes:', clientesError)
						setClientesErrorMsg(clientesError.message || 'Error cargando clientes')
						setClientes([])
					} else {
						console.log('Clientes cargados:', (clientesData || []).length, clientesData)
						setClientesErrorMsg('')
						setClientes(clientesData || [])
					}
				} catch (err) {
					console.error('Exception cargando clientes:', err)
					setClientesErrorMsg('No se pudieron cargar los clientes')
					setClientes([])
				}


			const { data: configData } = await supabase
				.from('app_config')
				.select('value')
				.eq('key','valor_dolar')
				.maybeSingle()
			if(configData) setValorDolar(configData.value)
			
			// Cargar lista general por defecto
			const listaGeneralId = '12989162-fdb2-4532-a893-5107b4c1cffb'
			setSelectedListaPrecioId(listaGeneralId)
			loadPreciosDeLista(listaGeneralId)
		}
		fetchData()
	},[])

	// Detectar clicks fuera de los dropdowns
	useEffect(() => {
		function handleClickOutside(event) {
			if (refProducto.current && !refProducto.current.contains(event.target)) {
				setShowProductosDropdown(false)
			}
			if (refPresentacion.current && !refPresentacion.current.contains(event.target)) {
				setShowPresentacionDropdown(false)
			}
			if (refCliente.current && !refCliente.current.contains(event.target)) {
				setShowClientesDropdown(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const filteredProductos = productos.filter(p =>
		p.nombre?.toLowerCase().includes(searchProducto.toLowerCase())
	)

	const filteredPresentaciones = presentaciones.filter(p =>
		p.nombre?.toLowerCase().includes(searchPresentacion.toLowerCase())
	)

	const filteredClientes = clientes.filter(c => {
		const q = searchCliente.toLowerCase()
		const fields = [c?.nombre, c?.razon_social, c?.nombre_fantasia, c?.alias, c?.contacto, c?.email]
		return fields.some(v => typeof v === 'string' && v.toLowerCase().includes(q))
	})

	function selectCliente(cliente){
		setSelectedClientId(cliente.id)
		const label = cliente?.nombre || cliente?.razon_social || cliente?.nombre_fantasia || cliente?.alias || cliente?.contacto || cliente?.email || 'Cliente'
		setSearchCliente(label)
		setShowClientesDropdown(false)

		// Intentar tomar lista_precio_id directamente si existe en el registro
		const listaIdDirect = cliente?.lista_precio_id || cliente?.lista_precio || null
		if (listaIdDirect) {
			setSelectedListaPrecioId(listaIdDirect)
			loadPreciosDeLista(listaIdDirect)
			return
		}

		// Si no viene en el objeto, consultar el cliente para obtener su lista
		;(async () => {
			try {
				const { data, error } = await supabase
					.from('clientes')
					.select('lista_precio_id')
					.eq('id', cliente.id)
					.maybeSingle()
				if (error) {
					console.warn('No se pudo obtener lista_precio_id del cliente:', error.message)
					// Si hay error, usar lista general por defecto
					const listaGeneralId = '12989162-fdb2-4532-a893-5107b4c1cffb'
					setSelectedListaPrecioId(listaGeneralId)
					loadPreciosDeLista(listaGeneralId)
					return
				}
				// Si el cliente no tiene lista asignada (null), usar lista general
				const listaId = data?.lista_precio_id || '12989162-fdb2-4532-a893-5107b4c1cffb'
				setSelectedListaPrecioId(listaId)
				loadPreciosDeLista(listaId)
			} catch (err) {
				console.error('Error obteniendo lista del cliente:', err)
				// En caso de excepción, usar lista general
				const listaGeneralId = '12989162-fdb2-4532-a893-5107b4c1cffb'
				setSelectedListaPrecioId(listaGeneralId)
				loadPreciosDeLista(listaGeneralId)
			}
		})()
	}

	async function loadPreciosDeLista(listaId){
		try {
			console.log('Cargando precios de lista:', listaId)
			const { data, error } = await supabase
				.from('precios_producto')
				.select('producto_id, precio_usd_kg, activo')
				.eq('lista_precio_id', listaId)
			if (error) {
				console.error('Error cargando precios de lista:', error)
				setPreciosPorProducto({})
				return
			}
			const map = {}
			(data || []).forEach(row => {
				if (row?.producto_id && (row?.activo === true || row?.activo === null || typeof row?.activo === 'undefined')) {
					map[row.producto_id] = Number(row.precio_usd_kg)
				}
			})
			console.log('Precios cargados:', map)
			setPreciosPorProducto(map)
		} catch (err) {
			console.error('Exception cargando precios:', err)
			setPreciosPorProducto({})
		}
	}



	function selectProducto(prod){
		setSelectedProductId(prod.id)
		setSearchProducto(prod.nombre)
		setShowProductosDropdown(false)
		setSelectedPresentacionId(null)
		setSearchPresentacion('')

		// Autocompletar precio USD/kg si hay lista y precio definido
		console.log('Seleccionado producto:', prod?.id, 'Lista:', selectedListaPrecioId)
		if (preciosPorProducto && prod?.id && preciosPorProducto[prod.id] > 0) {
			setPrecioUnitUSD(String(preciosPorProducto[prod.id]))
			return
		}
		// Fallback: consultar precio de la lista del cliente, si no existe buscar en lista general
		;(async () => {
			try {
				if (!selectedListaPrecioId || !prod?.id) return
				
				// Intentar obtener precio de la lista del cliente
				const { data, error } = await supabase
					.from('precios_producto')
					.select('precio_usd_kg')
					.eq('lista_precio_id', selectedListaPrecioId)
					.eq('producto_id', prod.id)
					.maybeSingle()
				
				if (error) {
					console.warn('No se pudo obtener precio del producto:', error.message)
				}
				
				// Si encontró precio en la lista del cliente, usarlo
				if (data?.precio_usd_kg) {
					setPrecioUnitUSD(String(data.precio_usd_kg))
					return
				}
				
				// Si no hay precio en la lista del cliente, buscar en lista general
				const listaGeneralId = '12989162-fdb2-4532-a893-5107b4c1cffb'
				if (selectedListaPrecioId !== listaGeneralId) {
					console.log('Producto sin precio en lista del cliente, buscando en lista general...')
					const { data: dataGeneral, error: errorGeneral } = await supabase
						.from('precios_producto')
						.select('precio_usd_kg')
						.eq('lista_precio_id', listaGeneralId)
						.eq('producto_id', prod.id)
						.maybeSingle()
					
					if (!errorGeneral && dataGeneral?.precio_usd_kg) {
						setPrecioUnitUSD(String(dataGeneral.precio_usd_kg))
						console.log('Precio encontrado en lista general:', dataGeneral.precio_usd_kg)
					}
				}
			} catch (err) {
				console.error('Error fallback precio producto:', err)
			}
		})()
	}

	function selectPresentacion(pres){
		setSelectedPresentacionId(pres.id)
		setSearchPresentacion(pres.nombre)
		setShowPresentacionDropdown(false)
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
		const precioARS = precioUSD * (Number(valorDolar) || 0)

		const item = {
			id: Date.now(),
			producto_id: prod?.id || null,
			presentacion_id: pres?.id || null,
			producto: prod?.nombre || 'N/D',
			presentacion: pres?.nombre || 'N/D',
			cantidad: Number(cantidad) || 1,
			unidad: 'kg',
			peso_por_unidad: peso,
			kilos: kilos,
			precio_unit_usd: Number(precioUnitUSD),
			precio: precioARS / (Number(cantidad) || 1), // precio unitario en ARS
			subtotal: precioARS, // subtotal en ARS
			precio_item_usd: precioUSD,
			precio_item_ars: precioARS
		}

		setItems(prev => [...prev, item])
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

	function totalKilos(){
		return items.reduce((sum, it) => {
			// Solo sumar kilos de productos que NO son por unidad (no son ceras)
			if(!esProductoPorUnidad(it.producto)){
				return sum + it.kilos
			}
			return sum
		}, 0)
	}

	function formatARS(value){
		return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value) || 0)
	}

	function formatKilos(k){
		const n = Number(k) || 0
		if(Number.isInteger(n)) return String(n)
		return n.toFixed(3).replace(/\.0+$/,'').replace(/(\.\d*[1-9])0+$/,'$1')
	}

	function esProductoPorUnidad(nombreProducto){
		const nombre = (nombreProducto || '').toLowerCase()
		return nombre.includes('cera')
	}

	function generarMensajeWhatsApp(){
		const fecha = new Date().toLocaleDateString('es-AR')
		let msg = `*COTIZACIÓN - ${fecha}*\n\n`
		msg += `*Detalles:*\n`
		items.forEach((it, idx) => {
			msg += `${idx + 1}. ${it.producto}\n`
			if(esProductoPorUnidad(it.producto)){
				msg += ` x ${it.cantidad} ${it.cantidad === 1 ? 'unidad' : 'unidades'}\n`
			} else {
				msg += ` x ${formatKilos(it.kilos)}kg\n`
			}
			msg += `$${formatARS(it.precio_item_ars)} ARS\n\n`
		})
		msg += `*TOTALES:*\n`
		msg += `ARS: $${formatARS(totalARS())}`
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
		const fecha = new Date().toLocaleDateString('es-AR')
		const clienteNombre = searchCliente || 'Sin especificar'
		
		const ventana = window.open()
		ventana.document.write(`
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>Cotización - ${fecha}</title>
				<style>
					* { margin: 0; padding: 0; box-sizing: border-box; }
					body { 
						font-family: 'Segoe UI', Arial, sans-serif; 
						padding: 40px; 
						color: #333;
						background: #fff;
					}
					.header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						border-bottom: 3px solid #2c3e50;
						padding-bottom: 20px;
						margin-bottom: 30px;
					}
					.logo {
						width: 120px;
						height: auto;
					}
					.company-info {
						text-align: right;
					}
					.company-info h1 {
						font-size: 28px;
						color: #2c3e50;
						margin-bottom: 5px;
					}
					.company-info p {
						font-size: 14px;
						color: #7f8c8d;
					}
					.info-section {
						display: flex;
						justify-content: space-between;
						margin-bottom: 30px;
						padding: 15px;
						background: #ecf0f1;
						border-radius: 8px;
					}
					.info-block {
						flex: 1;
					}
					.info-block h3 {
						font-size: 12px;
						color: #7f8c8d;
						text-transform: uppercase;
						margin-bottom: 5px;
					}
					.info-block p {
						font-size: 16px;
						color: #2c3e50;
						font-weight: 600;
					}
					table {
						width: 100%;
						border-collapse: collapse;
						margin-bottom: 30px;
					}
					thead {
						background: #34495e;
						color: white;
					}
					th {
						padding: 12px;
						text-align: left;
						font-size: 13px;
						font-weight: 600;
						text-transform: uppercase;
					}
					td {
						padding: 12px;
						border-bottom: 1px solid #ecf0f1;
						font-size: 14px;
					}
					tbody tr:hover {
						background: #f8f9fa;
					}
					.text-right {
						text-align: right;
					}
					.totals {
						display: flex;
						justify-content: flex-end;
						margin-top: 20px;
					}
					.totals-box {
						width: 300px;
						background: #ecf0f1;
						padding: 20px;
						border-radius: 8px;
					}
					.total-row {
						display: flex;
						justify-content: space-between;
						margin-bottom: 10px;
						font-size: 16px;
					}
					.total-row.final {
						border-top: 2px solid #2c3e50;
						padding-top: 10px;
						margin-top: 10px;
						font-size: 20px;
						font-weight: 700;
						color: #2c3e50;
					}
					.footer {
						margin-top: 50px;
						padding-top: 20px;
						border-top: 1px solid #ecf0f1;
						text-align: center;
						font-size: 12px;
						color: #95a5a6;
					}
					@media print {
						body { padding: 20px; }
						.header { page-break-after: avoid; }
					}
				</style>
			</head>
			<body>
				<div class="header">
					<img src="/logo.png" alt="Logo" class="logo" />
					<div class="company-info">
						<h1>COTIZACIÓN</h1>
						<p>Coloplastic</p>
					</div>
				</div>
				
				<div class="info-section">
					<div class="info-block">
						<h3>Cliente</h3>
						<p>${clienteNombre}</p>
					</div>
					<div class="info-block">
						<h3>Fecha</h3>
						<p>${fecha}</p>
					</div>
					<div class="info-block">
						<h3>Cotización #</h3>
						<p>${Date.now().toString().slice(-6)}</p>
					</div>
				</div>
				
				<table>
					<thead>
						<tr>
							<th style="width: 5%">#</th>
							<th style="width: 45%">Producto</th>
							<th style="width: 15%" class="text-right">Cantidad</th>
							<th style="width: 17.5%" class="text-right">Precio Unit.</th>
							<th style="width: 17.5%" class="text-right">Total</th>
						</tr>
					</thead>
					<tbody>
						${items.map((it, idx) => {
							const cantidadTexto = esProductoPorUnidad(it.producto) 
								? `${it.cantidad} ${it.cantidad === 1 ? 'unidad' : 'unidades'}` 
								: `${formatKilos(it.kilos)}kg`
							
							const precioUnitario = esProductoPorUnidad(it.producto) 
								? it.precio_item_ars / it.cantidad
								: it.precio_item_ars / it.kilos
							
							return `
								<tr>
									<td>${idx + 1}</td>
									<td><strong>${it.producto}</strong></td>
									<td class="text-right">${cantidadTexto}</td>
									<td class="text-right">$${formatARS(precioUnitario)}</td>
									<td class="text-right"><strong>$${formatARS(it.precio_item_ars)}</strong></td>
								</tr>
							`
						}).join('')}
					</tbody>
				</table>
				
				<div class="totals">
					<div class="totals-box">
						<div class="total-row final">
							<span>TOTAL:</span>
							<span>$${formatARS(totalARS())}</span>
						</div>
					</div>
				</div>
				
				<div class="footer">
					<p>Coloplastic - Cotización generada el ${fecha}</p>
					<p>Comprobante de pago - No válido como factura oficial. </p>
                    <p>Este documento es solo de carácter informativo </p>
                     <p>y no tiene validez fiscal.</p>
				</div>
				
				<script>
					window.onload = function() {
						setTimeout(function() {
							window.print();
						}, 250);
					}
				</script>
			</body>
			</html>
		`)
		ventana.document.close()
	}

	async function guardarVenta(){
		if(items.length === 0){
			alert('El carrito está vacío')
			return
		}
		try {
			// Generar número de cotización
			const numeroCotizacion = `COT-${Date.now().toString().slice(-8)}`
			
			// Crear fecha con hora de Argentina (UTC-3)
			const ahora = new Date();
			const offsetArgentina = -3 * 60; // -3 horas en minutos
			const offsetLocal = ahora.getTimezoneOffset(); // offset del navegador
			const diffMinutos = offsetArgentina - offsetLocal;
			const fechaArgentina = new Date(ahora.getTime() + diffMinutos * 60000);
			
			// Preparar datos de la venta
			const ventaData = {
				numero_cotizacion: numeroCotizacion,
				cliente_id: selectedClientId,
				cliente_nombre: searchCliente || 'Sin especificar',
				estado: 'pendiente',
				total_ars: totalARS(),
				total_kilos: totalKilos(),
				valor_dolar: Number(valorDolar),
				items: items,
				created_at: fechaArgentina.toISOString(),
				updated_at: fechaArgentina.toISOString()
			}

			// Insertar en Supabase
			const { data, error } = await supabase
				.from('ventas')
				.insert([ventaData])
				.select()

			if (error) {
				console.error('Error al guardar:', error)
				alert('Error al guardar la venta: ' + error.message)
				return
			}

			alert(`✓ Cotización guardada como PENDIENTE\nNúmero: ${numeroCotizacion}\nTotal: $${formatARS(totalARS())} ARS`)
			setItems([])
			setSearchCliente('')
			setSelectedClientId(null)
		} catch(err) {
			console.error('Error guardando venta:', err)
			alert('Error al guardar la venta')
		}
	}

	async function saveValorDolarToConfig(value){
		try{
			const up = { key: 'valor_dolar', value: String(value), updated_at: new Date().toISOString() }
			await supabase.from('app_config').upsert(up, { onConflict: 'key' })
		}catch(err){
			console.error('Error guardando valor_dolar:', err)
		}
	}

	const inputStyle = {width:'100%', padding:'8px', border:'1px solid #555', borderRadius:'4px', fontSize:'14px', boxSizing:'border-box', backgroundColor:'#1a1a1a', color:'#fff'}
	const dropdownStyle = {position:'absolute', top:'100%', left:0, right:0, backgroundColor:'#1a1a1a', border:'1px solid #555', borderRadius:'4px', marginTop:'4px', maxHeight:'180px', overflow:'auto', zIndex:10}
	const dropdownItemStyle = {padding:'8px', cursor:'pointer', borderBottom:'1px solid #333', fontSize:'12px', color:'#fff'}

	const footerContent = (
		<div style={{display:'flex', alignItems:'center', gap:8, justifyContent:'space-between', flexWrap:'wrap'}}>
			<Link to='/dashboard' className='back-link'>Volver</Link>
			<div style={{display:'flex', gap:8, alignItems:'center'}}>
				{/* Cliente (a la izquierda del valor del dólar) */}
				<div style={{position:'relative'}} ref={refCliente}>
					<input
						type='text'
						placeholder='Cliente...'
						value={searchCliente}
						onChange={e => setSearchCliente(e.target.value)}
						onFocus={() => setShowClientesDropdown(true)}
						style={{...inputStyle, width:200}}
					/>
					{clientesErrorMsg && (
						<div className='small' style={{color:'#d63031', marginTop:4}}>{clientesErrorMsg}</div>
					)}
					{showClientesDropdown && (
						<div style={dropdownStyle}>
							{filteredClientes.length === 0 ? (
								<div style={{...dropdownItemStyle, color:'#999'}}>No hay clientes</div>
							) : (
								filteredClientes.map(c => (
									<div key={c.id} onClick={() => selectCliente(c)} style={{...dropdownItemStyle, backgroundColor: selectedClientId === c.id ? '#333' : '#1a1a1a'}}>
										{(c?.nombre || c?.razon_social || c?.nombre_fantasia || c?.alias || c?.contacto || c?.email || 'Cliente')}
									</div>
								))
							)}
						</div>
					)}
				</div>

				<label className='small' style={{margin:0, color:'#fff'}}>Dólar (ARS)</label>
				<input className='input' style={{width:120, backgroundColor:'#1a1a1a', color:'#fff'}} value={valorDolar} onChange={e=>setValorDolar(e.target.value)} onBlur={e=>saveValorDolarToConfig(e.target.value)} placeholder='Ej: 350.50' />
				<button className='btn btn-ghost' onClick={()=>saveValorDolarToConfig(valorDolar)}>Guardar</button>
			</div>
		</div>
	)



	return (
		<PageContainer title="Cotizador" subtitle="Crear cotizaciones precisas" footer={footerContent}>
			<div style={{display:'grid', gap:12}}>
				{/* Formulario */}
				<div style={{display:'grid', gridTemplateColumns: '1fr 1fr 100px 100px', gap:8, padding:'12px', backgroundColor:'#1a1a1a', borderRadius:'8px', alignItems:'end', border:'1px solid #333'}}>
					{/* Producto con búsqueda */}
					<div style={{position:'relative'}} ref={refProducto}>
						<label className='small' style={{color:'#fff'}}>Producto</label>
						<input 
							type='text' 
							placeholder='Busca producto...'
							value={searchProducto}
							onChange={e => setSearchProducto(e.target.value)}
							onFocus={() => setShowProductosDropdown(true)}
							style={inputStyle}
						/>
						{showProductosDropdown && (
							<div style={dropdownStyle}>
								{filteredProductos.length === 0 ? (
									<div style={{...dropdownItemStyle, color:'#999'}}>No hay productos</div>
								) : (
									filteredProductos.map(p => (
										<div 
											key={p.id}
											onClick={() => selectProducto(p)}
											style={{...dropdownItemStyle, backgroundColor: selectedProductId === p.id ? '#333' : '#1a1a1a'}}
										>
											{p.nombre} {p.codigo ? `(${p.codigo})` : ''}
										</div>
									))
								)}
							</div>
						)}
					</div>

					{/* Presentación con búsqueda */}
					<div style={{position:'relative'}} ref={refPresentacion}>
						<label className='small' style={{color:'#fff'}}>Presentación</label>
						<input 
							type='text' 
							placeholder='Busca envase...'
							value={searchPresentacion}
							onChange={e => setSearchPresentacion(e.target.value)}
							onFocus={() => setShowPresentacionDropdown(true)}
							style={inputStyle}
						/>
						{showPresentacionDropdown && (
							<div style={dropdownStyle}>
								{filteredPresentaciones.length === 0 ? (
									<div style={{...dropdownItemStyle, color:'#999'}}>No hay presentaciones</div>
								) : (
									filteredPresentaciones.map(p => (
										<div 
											key={p.id}
											onClick={() => selectPresentacion(p)}
											style={{...dropdownItemStyle, backgroundColor: selectedPresentacionId === p.id ? '#333' : '#1a1a1a'}}
										>
											{p.nombre} ({p.peso_kg || 0}kg)
										</div>
									))
								)}
							</div>
						)}
					</div>

					{/* Cantidad */}
					<div>
						<label className='small' style={{color:'#fff'}}>Cantidad</label>
						<input type='number' min={1} value={cantidad} onChange={e=>setCantidad(e.target.value)} style={inputStyle} />
					</div>

					{/* Precio USD/kg */}
					<div>
						<label className='small' style={{color:'#fff'}}>Precio USD/kg</label>
						<input type='number' step='0.01' value={precioUnitUSD} onChange={e=>setPrecioUnitUSD(e.target.value)} style={inputStyle} />
					</div>
				</div>

				{/* Info y botón agregar */}
				<div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
				<div className='small' style={{color:'#fff'}}>
					Kilos: <strong>{formatKilos(kilosTotales())}</strong> kg {precioUnitUSD && `| Precio: $${(kilosTotales() * Number(precioUnitUSD)).toFixed(2)} USD`}
				</div>
					<button className='btn' onClick={agregarAlCarrito}>➕ Agregar al carrito</button>
				</div>

				{/* Carrito */}
				<div style={{backgroundColor:'#1a1a1a', padding:'12px', borderRadius:'8px', border:'1px solid #333'}}>
					<h3 style={{margin:'0 0 12px 0', color:'#fff'}}>🛒 Carrito ({items.length} items)</h3>
					{items.length === 0 ? (
						<div className='small' style={{color:'#999'}}>El carrito está vacío. Agrega items para empezar.</div>
					) : (
						<table className='table' style={{width:'100%', fontSize:'12px', color:'#fff'}}>
							<thead>
								<tr style={{borderBottom:'1px solid #333'}}>
									<th style={{textAlign:'left', padding:'8px', color:'#aaa'}}>Producto</th>
									<th style={{textAlign:'left', padding:'8px', color:'#aaa'}}>Presentación</th>
									<th style={{textAlign:'left', padding:'8px', color:'#aaa'}}>Cant.</th>
									<th style={{textAlign:'left', padding:'8px', color:'#aaa'}}>Kg</th>
									<th style={{textAlign:'left', padding:'8px', color:'#aaa'}}>USD</th>
									<th style={{textAlign:'left', padding:'8px', color:'#aaa'}}>ARS</th>
									<th style={{textAlign:'left', padding:'8px', color:'#aaa'}}></th>
								</tr>
							</thead>
							<tbody>
								{items.map(it => (
									<tr key={it.id} style={{borderBottom:'1px solid #333'}}>
							<td style={{padding:'8px'}}>{it.producto}</td>
							<td style={{padding:'8px'}}>{it.presentacion}</td>
							<td style={{padding:'8px'}}>{it.cantidad}</td>
							<td style={{padding:'8px'}}>
								{esProductoPorUnidad(it.producto) 
									? `${it.cantidad} ${it.cantidad === 1 ? 'un.' : 'un.'}` 
									: `${formatKilos(it.kilos)}kg`
								}
							</td>
							<td style={{padding:'8px'}}>${it.precio_item_usd.toFixed(2)}</td>
										<td style={{padding:'8px'}}>${formatARS(it.precio_item_ars)}</td>
										<td style={{padding:'8px'}}><button className='btn btn-ghost' style={{fontSize:'11px'}} onClick={()=>eliminarItem(it.id)}>X</button></td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>

			{/* Totales */}
			{items.length > 0 && (
				<div style={{display:'flex', justifyContent:'flex-end', gap:20, padding:'12px', backgroundColor:'#1a1a1a', borderRadius:'8px', border:'1px solid #333'}}>
					<div className='title' style={{fontSize:'16px', color:'#f39c12'}}>Kg: {formatKilos(totalKilos())}</div>
					<div className='title' style={{fontSize:'16px', color:'#fff'}}>USD: ${totalUSD().toFixed(2)}</div>
					<div className='title' style={{fontSize:'16px', color:'#4da6ff'}}>ARS: ${formatARS(totalARS())}</div>
				</div>
			)}				{/* Botones de acción */}
				{items.length > 0 && (
					<div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
						<button className='btn' onClick={guardarVenta}>💾 Guardar venta</button>
						<button className='btn' onClick={copiarAlPortapapeles}>📋 Copiar WhatsApp</button>
						<button className='btn' onClick={exportarPDF}>📄 Exportar PDF</button>
						<button className='btn btn-ghost' onClick={vaciarCarrito} style={{color:'#d63031'}}>🗑️ Vaciar carrito</button>
					</div>
				)}
			</div>

			<div className='comment' style={{color:'#999'}}>Busca y agrega productos. Copia al portapapeles para WhatsApp, exporta PDF o guarda en el sistema.</div>
		</PageContainer>
	)
}
