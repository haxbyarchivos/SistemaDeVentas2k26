import React from 'react'
import PageContainer from '../components/PageContainer'
import { Link } from 'react-router-dom'
import '../styles/global.css'
export default function Cotizar(){
return (
<PageContainer title="Cotizador" subtitle="Crear cotizaciones precisas"
footer={<Link to='/dashboard' className='back-link'>Volver</Link>}>
<div style={{display:'grid', gap:12}}>
{/*
 Aquí implementarás el formulario del cotizador.
 REGLAS IMPORTANTES (para cuando implementemos la lógica):
 - Si el nombre del item empieza con un número seguido de espacio =>
ese número son repeticiones.
 - Si el producto es F300 o F450 => esos números son parte del nombre
y NO repeticiones.
 - Fórmula: precioUSD × valorDólar × kilos × repeticiones
 - Mostrar precio por item en pesos y el TOTAL exacto (sin redondeos
innecesarios)
 */}
<div className='small'>Formulario del cotizador - placeholder.
Implementaremos selección de productos, cantidad, kg, agregar múltiples items y
mostrar total.</div>
<div style={{display:'flex', gap:8}}>
<button className='btn'>Agregar item</button>
<button className='btn'>Guardar cotización</button>
<button className='btn'>Exportar (PDF / JSON)</button>
</div>
<table className='table'>
<thead>
<tr>
<th>Producto</th>
<th>Cantidad</th>
<th>Kg</th>
<th>Precio unit. (USD)</th>
<th>Precio (ARS)</th>
</tr>
</thead>
<tbody>
<tr><td colSpan={5} className='small'>Items del presupuesto
aparecerán aquí. Placeholder.</td></tr>
</tbody>
</table>
<div style={{display:'flex', justifyContent:'flex-end', marginTop:12}}>
<div className='title'>Total: $0</div>
</div>
</div>
<div className='comment'>Comentarios: Cuando quieras, programamos la
lógica paso a paso cuidando precisión aritmética y reglas especiales.</div>
</PageContainer>
)
}
