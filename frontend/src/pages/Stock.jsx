import React from 'react'
import PageContainer from '../components/PageContainer'
import { Link } from 'react-router-dom'
import '../styles/global.css'
export default function Stock(){
return (
<PageContainer title="Stock" subtitle="Movimientos e inventario"
footer={<Link to='/dashboard' className='back-link'>Volver</Link>}>
<div style={{display:'flex', gap:8, marginBottom:12}}>
<button className='btn'>Ingreso manual</button>
<button className='btn'>Egreso manual</button>
</div>
<table className='table'>
<thead>
<tr>
<th>Producto</th>
<th>Stock actual</th>
<th>Último movimiento</th>
<th>Alertas</th>
</tr>
</thead>
<tbody>
<tr><td colSpan={4} className='small'>Listado de stock (placeholder)</
td></tr>
</tbody>
</table>
<div className='comment'>Comentarios: Implementá aquí la lista completa y
un log de movimientos (fecha, tipo, cantidad, usuario).</div>
</PageContainer>
)
}
