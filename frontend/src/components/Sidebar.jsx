import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const menuItems = [
    { label: "📊 Dashboard", to: "/dashboard" },
    { label: "📦 Productos", to: "/productos" },
    { label: "💸 Ventas", to: "/ventas" },
    { label: "📈 Stock", to: "/stock" },
    { label: "👤 Clientes", to: "/clientes" },
    { label: "💲 Cotizar", to: "/cotizar" },
    { label: "⚙️ Configuración", to: "/configuracion" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: collapsed ? "80px" : "280px",
        backgroundColor: "#1a1a1a",
        borderRight: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
        zIndex: 1000,
        overflowY: "auto",
      }}
    >
      {/* HEADER DEL SIDEBAR */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #333",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {!collapsed && <h3 style={{ margin: 0, color: "white" }}>Menú</h3>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* MENÚ ITEMS */}
      <nav style={{ flex: 1, padding: "10px 0" }}>
        {menuItems.map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            style={{
              width: "100%",
              padding: "15px 20px",
              background: isActive(item.to) ? "#2d2d2d" : "transparent",
              border: "none",
              borderLeft: isActive(item.to) ? "4px solid #fff" : "4px solid transparent",
              color: isActive(item.to) ? "white" : "#999",
              textAlign: collapsed ? "center" : "left",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: isActive(item.to) ? "bold" : "normal",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.to)) {
                e.target.style.backgroundColor = "#262626";
                e.target.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.to)) {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#999";
              }
            }}
            title={collapsed ? item.label : ""}
          >
            {collapsed ? item.label.split(" ")[0] : item.label}
          </button>
        ))}
      </nav>

      {/* FOOTER DEL SIDEBAR - USUARIO Y LOGOUT */}
      <div
        style={{
          borderTop: "1px solid #333",
          padding: "15px 20px",
        }}
      >
        {!collapsed && (
          <div style={{ marginBottom: "12px", color: "#999", fontSize: "12px" }}>
            <p style={{ margin: "0 0 6px 0" }}>Usuario:</p>
            <p style={{ margin: 0, color: "white", fontWeight: "bold", wordBreak: "break-word" }}>
              {user.username}
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#c41e3a",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "12px",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#a01830")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#c41e3a")}
          title={collapsed ? "Logout" : ""}
        >
          {collapsed ? "🚪" : "Cerrar Sesión"}
        </button>
      </div>
    </div>
  );
}
