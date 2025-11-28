import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";

// Importar páginas nuevas
import Productos from "../pages/Productos";
import Ventas from "../pages/Ventas";
import Stock from "../pages/Stock";
import Clientes from "../pages/Clientes";
import Cotizar from "../pages/Cotizar";
import Configuracion from "../pages/Configuracion";

function ProtectedRoute({ children }) {
  try {
    const user = localStorage.getItem("user");
    if (!user) return <Navigate to="/" replace />;
    return children;
  } catch {
    return <Navigate to="/" replace />;
  }
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* PROTEGIDAS */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/cotizar" element={<ProtectedRoute><Cotizar /></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />

        {/* CUALQUIER OTRA → LOGIN */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
