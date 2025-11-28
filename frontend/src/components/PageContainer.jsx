import React from 'react';


export default function PageContainer({ title, subtitle, children, footer }){
return (
<div className="app-center">
<div className="card">
<div className="header">
<div>
<div className="title">{title}</div>
{subtitle && <div className="sub">{subtitle}</div>}
</div>
<div style={{display:'flex', gap:8}}>
{footer}
</div>
</div>


<div>
{children}
</div>
</div>
</div>
)
}