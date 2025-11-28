import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/", { replace: true });
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      localStorage.removeItem("user");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  if (!user) return null;

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
        color: "white",
      }}
    >
      {/* CONTENEDOR CENTRADO */}
      <div
        style={{
          width: "600px",
          padding: "30px",
          backgroundColor: "#1d1d1d",
          borderRadius: "8px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2>Dashboard</h2>

          <div>
            <span style={{ marginRight: 12 }}>
              Hola, <strong>{user.username}</strong>
            </span>

            <button
              onClick={handleLogout}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                backgroundColor: "#fff",
                color: "#000",
                fontWeight: "bold",
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main>
  <p style={{ marginTop: 0, marginBottom: 20 }}>
  </p>
  
</main>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginTop: "20px",
  }}
>
  {[
    { label: "📦 Productos", to: "/productos" },
    { label: "💸 Ventas", to: "/ventas" },
    { label: "📊 Stock", to: "/stock" },
    { label: "👤 Clientes", to: "/clientes" },
    { label: "💲 Cotizar", to: "/cotizar" },
    { label: "⚙️ Configuración", to: "/configuracion" },
  ].map((btn) => (
    <button
      key={btn.to}
      onClick={() => navigate(btn.to)}
      style={{
        padding: "18px",
        background: "#1e1e1e",
        color: "white",
        border: "1px solid #333",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "bold",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "#2d2d2d";
        e.target.style.transform = "translateY(-3px)";
        e.target.style.boxShadow = "0px 4px 12px rgba(0,0,0,0.4)";
        e.target.style.borderColor = "#555";
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "#1e1e1e";
        e.target.style.transform = "translateY(0)";
        e.target.style.boxShadow = "none";
        e.target.style.borderColor = "#333";
      }}
    >
      {btn.label}
    </button>
  ))}
</div>

      </div>
    </div>
  );

}
