import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Sidebar({ isMobile = false, isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) onClose();
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

  const sidebarStyle = {
    position: isMobile ? "fixed" : "fixed",
    left: 0,
    top: 0,
    height: "100vh",
    width: collapsed && !isMobile ? "80px" : isMobile && !isOpen ? "0px" : "280px",
    backgroundColor: "#1a1a1a",
    borderRight: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease",
    zIndex: isMobile ? 998 : 1000,
    overflowY: "auto",
    overflowX: "hidden",
  };

  return (
    <div style={sidebarStyle}>
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
        {!collapsed && !isMobile && <h3 style={{ margin: 0, color: "white" }}>Menú</h3>}
        {isMobile && (
          <h3 style={{ margin: 0, color: "white", flex: 1 }}>Menú</h3>
        )}
        {!isMobile && (
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
        )}
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "24px",
              padding: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* MENÚ ITEMS */}
      <nav style={{ flex: 1, padding: "10px 0" }}>
        {menuItems.map((item) => (
          <button
            key={item.to}
            onClick={() => handleNavigate(item.to)}
            style={{
              width: "100%",
              padding: "15px 20px",
              background: isActive(item.to) ? "#2d2d2d" : "transparent",
              border: "none",
              borderLeft: isActive(item.to) ? "4px solid #fff" : "4px solid transparent",
              color: isActive(item.to) ? "white" : "#999",
              textAlign: collapsed && !isMobile ? "center" : "left",
              cursor: "pointer",
              fontSize: isMobile ? "16px" : "14px",
              fontWeight: isActive(item.to) ? "bold" : "normal",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
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
            title={collapsed && !isMobile ? item.label : ""}
          >
            {collapsed && !isMobile ? item.label.split(" ")[0] : item.label}
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
        {!collapsed && !isMobile && (
          <div style={{ marginBottom: "12px", color: "#999", fontSize: "12px" }}>
            <p style={{ margin: "0 0 6px 0" }}>Usuario:</p>
            <p style={{ margin: 0, color: "white", fontWeight: "bold", wordBreak: "break-word" }}>
              {user.username}
            </p>
          </div>
        )}
        {isMobile && (
          <div style={{ marginBottom: "12px", color: "#999", fontSize: "14px" }}>
            <p style={{ margin: "0 0 6px 0" }}>Usuario:</p>
            <p style={{ margin: 0, color: "white", fontWeight: "bold" }}>
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
            fontSize: isMobile ? "14px" : "12px",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#a01830")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#c41e3a")}
          title={collapsed && !isMobile ? "Logout" : ""}
        >
          {collapsed && !isMobile ? "🚪" : "Cerrar Sesión"}
        </button>
      </div>
    </div>
  );
}
