import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import versionInfo from '../version.json';

export default function Sidebar({ isMobile = false, isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [sessionTime, setSessionTime] = useState("0s");
  const [cuentasExpanded, setCuentasExpanded] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Calcular tiempo de sesión
  useEffect(() => {
    const loginTime = localStorage.getItem("loginTime");
    if (!loginTime) {
      localStorage.setItem("loginTime", new Date().getTime().toString());
    }

    const interval = setInterval(() => {
      const login = parseInt(localStorage.getItem("loginTime") || "0");
      const now = new Date().getTime();
      const diff = Math.floor((now - login) / 1000);

      let timeString = "";
      if (diff < 60) {
        timeString = `${diff}s`;
      } else if (diff < 3600) {
        timeString = `${Math.floor(diff / 60)}m ${diff % 60}s`;
      } else {
        timeString = `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
      }
      setSessionTime(timeString);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
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
    { label: "💲 Cotizar", to: "/cotizar2" },
  ];

  const cuentasSubmenu = [
    { label: "💰 Saldos Clientes", to: "/cuentas/clientes" },
    { label: "📊 Movimientos", to: "/cuentas/movimientos" },
  ];

  const isActive = (path) => location.pathname === path;
  const isCuentasActive = () => location.pathname.startsWith('/cuentas');

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
              fontSize: isMobile ? "20px" : "18px",
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

        {/* MENÚ CUENTAS COLAPSABLE */}
        {!collapsed && (
          <>
            <button
              onClick={() => setCuentasExpanded(!cuentasExpanded)}
              style={{
                width: "100%",
                padding: "15px 20px",
                background: isCuentasActive() ? "#2d2d2d" : "transparent",
                border: "none",
                borderLeft: isCuentasActive() ? "4px solid #fff" : "4px solid transparent",
                color: isCuentasActive() ? "white" : "#999",
                textAlign: "left",
                cursor: "pointer",
                fontSize: isMobile ? "20px" : "18px",
                fontWeight: isCuentasActive() ? "bold" : "normal",
                transition: "all 0.2s ease",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                if (!isCuentasActive()) {
                  e.target.style.backgroundColor = "#262626";
                  e.target.style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCuentasActive()) {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#999";
                }
              }}
            >
              <span>💳 Cuentas</span>
              <span style={{ fontSize: "14px" }}>{cuentasExpanded ? "▼" : "▶"}</span>
            </button>

            {cuentasExpanded && (
              <div style={{ backgroundColor: "#1a1a1a" }}>
                {cuentasSubmenu.map((subItem) => (
                  <button
                    key={subItem.to}
                    onClick={() => handleNavigate(subItem.to)}
                    style={{
                      width: "100%",
                      padding: "12px 20px 12px 40px",
                      background: isActive(subItem.to) ? "#2d2d2d" : "transparent",
                      border: "none",
                      borderLeft: isActive(subItem.to) ? "4px solid #4da6ff" : "4px solid transparent",
                      color: isActive(subItem.to) ? "white" : "#999",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: isMobile ? "18px" : "16px",
                      fontWeight: isActive(subItem.to) ? "bold" : "normal",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(subItem.to)) {
                        e.target.style.backgroundColor = "#262626";
                        e.target.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(subItem.to)) {
                        e.target.style.backgroundColor = "transparent";
                        e.target.style.color = "#999";
                      }
                    }}
                  >
                    {subItem.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* CONFIGURACIÓN AL FINAL */}
        <button
          onClick={() => handleNavigate("/configuracion")}
          style={{
            width: "100%",
            padding: "15px 20px",
            background: isActive("/configuracion") ? "#2d2d2d" : "transparent",
            border: "none",
            borderLeft: isActive("/configuracion") ? "4px solid #fff" : "4px solid transparent",
            color: isActive("/configuracion") ? "white" : "#999",
            textAlign: collapsed && !isMobile ? "center" : "left",
            cursor: "pointer",
            fontSize: isMobile ? "20px" : "18px",
            fontWeight: isActive("/configuracion") ? "bold" : "normal",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          onMouseEnter={(e) => {
            if (!isActive("/configuracion")) {
              e.target.style.backgroundColor = "#262626";
              e.target.style.color = "white";
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive("/configuracion")) {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#999";
            }
          }}
          title={collapsed && !isMobile ? "⚙️ Configuración" : ""}
        >
          {collapsed && !isMobile ? "⚙️" : "⚙️ Configuración"}
        </button>
      </nav>

      {/* FOOTER DEL SIDEBAR - USUARIO Y LOGOUT */}
      <div
        style={{
          borderTop: "1px solid #333",
          padding: "15px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {/* INFORMACIÓN DE USUARIO */}
        {!collapsed && !isMobile && (
          <div style={{ marginBottom: "12px", color: "#999", fontSize: "16px" }}>
            <p style={{ margin: "0 0 6px 0" }}>Usuario:</p>
            <p style={{ margin: 0, color: "white", fontWeight: "bold", fontSize: "18px", wordBreak: "break-word" }}>
              {user.username}
            </p>
          </div>
        )}
        {isMobile && (
          <div style={{ marginBottom: "12px", color: "#999", fontSize: "18px" }}>
            <p style={{ margin: "0 0 6px 0" }}>Usuario:</p>
            <p style={{ margin: 0, color: "white", fontWeight: "bold", fontSize: "20px" }}>
              {user.username}
            </p>
          </div>
        )}

        {/* TIEMPO DE SESIÓN */}
        {!collapsed && (
          <div
            style={{
              backgroundColor: "#222",
              padding: "12px",
              borderRadius: "5px",
              fontSize: "16px",
              color: "#999",
              textAlign: "center",
              borderLeft: "2px solid #4da6ff",
            }}
          >
            <p style={{ margin: "0 0 5px 0", fontSize: "15px" }}>Sesión activa:</p>
            <p style={{ margin: 0, color: "#4da6ff", fontWeight: "bold", fontSize: "18px" }}>
              {sessionTime}
            </p>
          </div>
        )}

        {/* BOTÓN LOGOUT */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#c41e3a",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: isMobile ? "18px" : "16px",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#a01830")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#c41e3a")}
          title={collapsed && !isMobile ? "Logout" : ""}
        >
          {collapsed && !isMobile ? "🚪" : "Cerrar Sesión"}
        </button>

        {/* INFORMACIÓN DEL SISTEMA */}
        {!collapsed && (
          <div
            style={{
              backgroundColor: "#1a1a1a",
              padding: "10px",
              borderRadius: "5px",
              fontSize: "11px",
              color: "#666",
              borderTop: "1px solid #333",
              paddingTop: "12px",
              textAlign: "center",
              lineHeight: "1.5",
            }}
          >
            <p style={{ margin: "0 0 3px 0", fontWeight: "bold", color: "#999" }}>Sistema de Ventas</p>
            <p style={{ margin: 0 }}>v{versionInfo.version}.{versionInfo.build}</p>
            <p style={{ margin: "3px 0 0 0", fontSize: "10px", color: "#555" }}>© 2K26</p>
          </div>
        )}
      </div>
    </div>
  );
}
