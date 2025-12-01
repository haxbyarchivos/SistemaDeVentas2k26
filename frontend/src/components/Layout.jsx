import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", position: "relative" }}>
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* OVERLAY PARA MÓVIL */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: "280px",
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 999,
            pointerEvents: "auto",
          }}
        />
      )}

      <div
        style={{
          marginLeft: isMobile ? 0 : "280px",
          flex: 1,
          overflow: "auto",
          backgroundColor: "#0a0a0a",
          transition: "margin-left 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* BOTÓN HAMBURGUESA EN MÓVIL */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              position: "sticky",
              top: 0,
              left: 0,
              width: "100%",
              padding: "12px",
              backgroundColor: "#1a1a1a",
              border: "none",
              borderBottom: "1px solid #333",
              color: "white",
              cursor: "pointer",
              fontSize: "20px",
              textAlign: "left",
              zIndex: 100,
            }}
          >
            ☰ Menú
          </button>
        )}
        
        <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
