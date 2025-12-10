import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SalesCard from "../components/SalesCard";
import supabase from "../utils/supabaseClient";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [ventasDia, setVentasDia] = useState(0);
  const [ventasSemana, setVentasSemana] = useState(0);
  const [ventasMes, setVentasMes] = useState(0);
  const [porcentajeDia, setPorcentajeDia] = useState(0);
  const [porcentajeSemana, setPorcentajeSemana] = useState(0);
  const [porcentajeMes, setPorcentajeMes] = useState(0);
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

  useEffect(() => {
    if (user) {
      cargarEstadisticas();
    }
  }, [user]);

  async function cargarEstadisticas() {
    try {
      // Configurar fechas en UTC (para coincidir con cómo se guardan en Supabase)
      const ahora = new Date();
      
      // Crear fechas en UTC para Argentina (UTC-3)
      const offsetArgentina = -3 * 60;
      const offsetLocal = ahora.getTimezoneOffset();
      const diffMinutos = offsetArgentina - offsetLocal;
      
      // Fecha actual de Argentina en UTC
      const ahoraArgentina = new Date(ahora.getTime() + diffMinutos * 60000);
      const hoyUTC = new Date(Date.UTC(
        ahoraArgentina.getUTCFullYear(),
        ahoraArgentina.getUTCMonth(),
        ahoraArgentina.getUTCDate(),
        0, 0, 0, 0
      ));
      const mananaUTC = new Date(hoyUTC);
      mananaUTC.setUTCDate(mananaUTC.getUTCDate() + 1);

      // Obtener el lunes de esta semana
      const diaSemana = ahoraArgentina.getUTCDay();
      const diasDesdeLunes = (diaSemana === 0 ? 6 : diaSemana - 1);
      const lunesActualUTC = new Date(hoyUTC);
      lunesActualUTC.setUTCDate(lunesActualUTC.getUTCDate() - diasDesdeLunes);

      // Primer día del mes actual
      const primerDiaMesUTC = new Date(Date.UTC(
        ahoraArgentina.getUTCFullYear(),
        ahoraArgentina.getUTCMonth(),
        1, 0, 0, 0, 0
      ));

      // Períodos anteriores
      const ayerUTC = new Date(hoyUTC);
      ayerUTC.setUTCDate(ayerUTC.getUTCDate() - 1);

      const lunesSemanaAnteriorUTC = new Date(lunesActualUTC);
      lunesSemanaAnteriorUTC.setUTCDate(lunesSemanaAnteriorUTC.getUTCDate() - 7);

      const primerDiaMesAnteriorUTC = new Date(Date.UTC(
        ahoraArgentina.getUTCFullYear(),
        ahoraArgentina.getUTCMonth() - 1,
        1, 0, 0, 0, 0
      ));
      const ultimoDiaMesAnteriorUTC = new Date(Date.UTC(
        ahoraArgentina.getUTCFullYear(),
        ahoraArgentina.getUTCMonth(),
        0, 23, 59, 59, 999
      ));

      // Consulta: Ventas del día (hoy 00:00 a 23:59)
      const { data: ventasHoy } = await supabase
        .from('ventas')
        .select('total_ars')
        .eq('estado', 'vendido')
        .gte('created_at', hoyUTC.toISOString())
        .lt('created_at', mananaUTC.toISOString());

      const totalHoy = ventasHoy?.reduce((sum, v) => sum + Number(v.total_ars || 0), 0) || 0;
      setVentasDia(totalHoy);

      // Consulta: Ventas de ayer
      const { data: ventasAyer } = await supabase
        .from('ventas')
        .select('total_ars')
        .eq('estado', 'vendido')
        .gte('created_at', ayerUTC.toISOString())
        .lt('created_at', hoyUTC.toISOString());

      const totalAyer = ventasAyer?.reduce((sum, v) => sum + Number(v.total_ars || 0), 0) || 0;
      const porcentajeCambioDia = totalAyer > 0 ? ((totalHoy - totalAyer) / totalAyer) * 100 : 0;
      setPorcentajeDia(porcentajeCambioDia);

      // Consulta: Ventas de la semana (lunes a hoy)
      const { data: ventasEstaSemana } = await supabase
        .from('ventas')
        .select('total_ars')
        .eq('estado', 'vendido')
        .gte('created_at', lunesActualUTC.toISOString());

      const totalEstaSemana = ventasEstaSemana?.reduce((sum, v) => sum + Number(v.total_ars || 0), 0) || 0;
      setVentasSemana(totalEstaSemana);

      // Consulta: Ventas de la semana anterior (lunes a domingo pasado)
      const { data: ventasSemanaAnterior } = await supabase
        .from('ventas')
        .select('total_ars')
        .eq('estado', 'vendido')
        .gte('created_at', lunesSemanaAnteriorUTC.toISOString())
        .lt('created_at', lunesActualUTC.toISOString());

      const totalSemanaAnterior = ventasSemanaAnterior?.reduce((sum, v) => sum + Number(v.total_ars || 0), 0) || 0;
      const porcentajeCambioSemana = totalSemanaAnterior > 0 ? ((totalEstaSemana - totalSemanaAnterior) / totalSemanaAnterior) * 100 : 0;
      setPorcentajeSemana(porcentajeCambioSemana);

      // Consulta: Ventas del mes actual
      const { data: ventasEsteMes } = await supabase
        .from('ventas')
        .select('total_ars')
        .eq('estado', 'vendido')
        .gte('created_at', primerDiaMesUTC.toISOString());

      const totalEsteMes = ventasEsteMes?.reduce((sum, v) => sum + Number(v.total_ars || 0), 0) || 0;
      setVentasMes(totalEsteMes);

      // Consulta: Ventas del mes anterior
      const { data: ventasMesAnterior } = await supabase
        .from('ventas')
        .select('total_ars')
        .eq('estado', 'vendido')
        .gte('created_at', primerDiaMesAnteriorUTC.toISOString())
        .lte('created_at', ultimoDiaMesAnteriorUTC.toISOString());

      const totalMesAnterior = ventasMesAnterior?.reduce((sum, v) => sum + Number(v.total_ars || 0), 0) || 0;
      const porcentajeCambioMes = totalMesAnterior > 0 ? ((totalEsteMes - totalMesAnterior) / totalMesAnterior) * 100 : 0;
      setPorcentajeMes(porcentajeCambioMes);

    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }

  function formatARS(value) {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function calcularFillPercent(periodo) {
    const ahora = new Date();
    if (periodo === 'dia') {
      const horaActual = ahora.getHours();
      const minutoActual = ahora.getMinutes();
      return ((horaActual * 60 + minutoActual) / (24 * 60)) * 100;
    } else if (periodo === 'semana') {
      const diaSemana = ahora.getDay();
      const diasPasados = (diaSemana === 0 ? 6 : diaSemana - 1);
      return (diasPasados / 7) * 100;
    } else if (periodo === 'mes') {
      const diaActual = ahora.getDate();
      const ultimoDiaMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
      return (diaActual / ultimoDiaMes) * 100;
    }
    return 50;
  }

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
          title="Ventas del Día   " 
          value={`$${formatARS(ventasDia)}`}
          percent={`${porcentajeDia >= 0 ? '+' : ''}${porcentajeDia.toFixed(1)}%`}
          fillPercent={calcularFillPercent('dia')}
        />
        <SalesCard 
          title="Ventas Semanales" 
          value={`$${formatARS(ventasSemana)}`}
          percent={`${porcentajeSemana >= 0 ? '+' : ''}${porcentajeSemana.toFixed(1)}%`}
          fillPercent={calcularFillPercent('semana')}
        />
        <SalesCard 
          title="Ventas Mensuales" 
          value={`$${formatARS(ventasMes)}`}
          percent={`${porcentajeMes >= 0 ? '+' : ''}${porcentajeMes.toFixed(1)}%`}
          fillPercent={calcularFillPercent('mes')}
        />
      </div>
    </div>
  );
}
