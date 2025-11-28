import React from "react";
import PageContainer from "../components/PageContainer";
import { Link } from "react-router-dom";
import "../styles/global.css";

export default function Ventas() {
  return (
    <PageContainer
      title="Ventas"
      subtitle="Registro de ventas"
      footer={<Link to="/dashboard" className="back-link">Volver</Link>}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div className="small">
          Listado de ventas y formulario de registro (placeholder)
        </div>
        <button className="btn">Registrar venta</button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Items</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={5} className="small">
              No hay ventas registradas. Placeholder.
            </td>
          </tr>
        </tbody>
      </table>

      <div className="comment">
        Comentarios: Cuando registres una venta, debes descontar stock
        automáticamente. Implementaremos esa lógica paso a paso.
      </div>
    </PageContainer>
  );
}
