import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SalesCard from "../components/SalesCard";

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

  if (!user) return null;

  return (
    <div
      style={{
        padding: "20px",
        color: "white",
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
      }}
    >
      <h1 style={{ fontSize: "clamp(24px, 8vw, 32px)", marginBottom: "10px" }}>Bienvenido, {user.username}!</h1>
      <p style={{ color: "#999", fontSize: "16px", marginBottom: "40px" }}>
        {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>

      {/* Aquí irán los gráficos y resúmenes */}
      <div style={{ marginTop: "30px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <SalesCard 
          title="Ventas del Día" 
          value="$12,500" 
          percent="15%" 
          fillPercent={60}
        />
        <SalesCard 
          title="Ventas Semanales" 
          value="$85,300" 
          percent="22%" 
          fillPercent={76}
        />
        <SalesCard 
          title="Ventas Mensuales" 
          value="$324,800" 
          percent="18%" 
          fillPercent={85}
        />
      </div>
    </div>
  );
}
