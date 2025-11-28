import React from 'react'
import PageContainer from '../components/PageContainer'
import { Link } from 'react-router-dom'
import '../styles/global.css'


export default function Productos(){
return (
<PageContainer title="Productos" subtitle="Listado de productos" footer={<Link to='/dashboard' className='back-link'>Volver</Link>}>


{/* Tabla vacía - completa luego con lectura de /data/productos.json */}
<table className='table'>
<thead>
<tr>
<th>Producto</th>
<th>Precio (USD)</th>
<th>Kg / unidad</th>
<th>Stock</th>
<th>Tipo</th>
<th>Acciones</th>
</tr>
</thead>
<tbody>
{/* Aquí mapearás los productos */}
<tr>
<td colSpan={6} className='small'>No hay productos cargados. (Placeholder)</td>
</tr>
</tbody>
</table>


<div style={{marginTop:12, display:'flex', gap:8}}>
<button className='btn btn-ghost'>Agregar producto</button>
<button className='btn btn-ghost'>Editar seleccionado</button>
<button className='btn btn-ghost'>Eliminar Producto</button>
</div>


<div className='comment'>Comentarios: Aquí deberás implementar CRUD usando /data/productos.json (local). Luego podremos conectar a Firebase.</div>
</PageContainer>
)
}