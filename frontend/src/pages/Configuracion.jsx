import React, { useState, useEffect } from 'react'
import PageContainer from '../components/PageContainer'
import { Link } from 'react-router-dom'
import '../styles/global.css'
export default function Configuracion(){
const [dolar, setDolar] = useState('')
useEffect(()=>{
const v = localStorage.getItem('valorDolar')
if(v) setDolar(v)
},[])
const save = ()=>{
localStorage.setItem('valorDolar', dolar)
alert('Valor del dólar guardado')
}
return (
<PageContainer title="Configuración" subtitle="Preferencias generales"
footer={<Link to='/dashboard' className='back-link'>Volver</Link>}>
<div style={{display:'grid', gap:12}}>
<div>
<label className='small'>Valor del dólar (ARS) 💲</label>
<input className='input' value={dolar}
onChange={e=>setDolar(e.target.value)} placeholder='Ej: 1200' />
</div>
<div style={{display:'flex', gap:8}}>
<button className='btn' onClick={save}>Guardar</button>
</div>
<div className='comment'>Comentarios: Guardamos el valor del Dolar (clave: "valorDolar"). Lo usaremos en el cotizador.</div>
</div>
</PageContainer>
)
}
