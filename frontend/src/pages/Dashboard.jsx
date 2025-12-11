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
  const [movimientos, setMovimientos] = useState([]);
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
      cargarMovimientos();
    }
  }, [user]);

  async function cargarMovimientos() {
    try {
      const { data: movData } = await supabase
        .from('movimientos_stock')
        .select(`
          *,
          productos (
            nombre
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (movData) setMovimientos(movData);
    } catch (err) {
      console.error('Error cargando movimientos:', err);
    }
  }

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
        maxWidth: "100vw",
        overflowX: "hidden",
        boxSizing: "border-box"
      }}
    >
      <h1 style={{ fontSize: "clamp(24px, 8vw, 32px)", marginBottom: "10px" }}>Bienvenido, {user.username}!</h1>
      <p style={{ color: "#999", fontSize: "16px", marginBottom: "40px" }}>
        {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>

      {/* Aquí irán los gráficos y resúmenes */}
      <div style={{ 
        marginTop: "30px", 
        display: "flex", 
        gap: "20px", 
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "stretch"
      }}>
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

      {/* Últimos Movimientos de Stock */}
      <div style={{ 
        marginTop: '40px', 
        maxWidth: '1200px', 
        margin: '40px auto 0',
        padding: '0 20px'
      }}>
        <h3 style={{ 
          fontSize: '20px', 
          marginBottom: '16px', 
          color: '#fff',
          fontWeight: '600'
        }}>
          📦 Últimos Movimientos de Stock
        </h3>
        
        <div style={{
          backgroundColor: '#0f0f0f',
          borderRadius: '12px',
          border: '1px solid #1a1a1a',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#141414', borderBottom: '1px solid #1a1a1a' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Fecha</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Tipo</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Producto</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Cantidad</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ 
                      padding: '24px', 
                      textAlign: 'center', 
                      color: '#666',
                      fontSize: '13px'
                    }}>
                      No hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  movimientos.map(mov => (
                    <tr key={mov.id} style={{ 
                      borderBottom: '1px solid #1a1a1a',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#141414'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', color: '#ccc', fontSize: '13px' }}>
                        {new Date(mov.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                        {' '}
                        <span style={{ color: '#666' }}>
                          {new Date(mov.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: 
                            mov.tipo === 'ingreso' ? 'rgba(16, 185, 129, 0.15)' : 
                            mov.tipo === 'egreso' ? 'rgba(239, 68, 68, 0.15)' : 
                            mov.tipo === 'consolidacion' ? 'rgba(139, 92, 246, 0.15)' :
                            'rgba(245, 158, 11, 0.15)',
                          color: 
                            mov.tipo === 'ingreso' ? '#10b981' : 
                            mov.tipo === 'egreso' ? '#ef4444' : 
                            mov.tipo === 'consolidacion' ? '#8b5cf6' :
                            '#f59e0b',
                          display: 'inline-block'
                        }}>
                          {mov.tipo === 'ingreso' ? '↗ INGRESO' : 
                           mov.tipo === 'egreso' ? '↘ EGRESO' :
                           mov.tipo === 'consolidacion' ? '🗜 CONSOLIDACIÓN' :
                           mov.tipo === 'venta' ? '💰 VENTA' : '↩ DEVOLUCIÓN'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#fff', fontSize: '13px', fontWeight: '500' }}>
                        {mov.productos?.nombre || 'N/D'}
                      </td>
                      <td style={{ 
                        padding: '12px 16px',
                        fontSize: '13px',
                        color: mov.cantidad < 0 ? '#ef4444' : '#10b981',
                        fontWeight: '600'
                      }}>
                        {mov.cantidad > 0 ? '+' : ''}{mov.cantidad.toFixed(2)} kg
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: '12px', 
                        color: '#666',
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {mov.observaciones || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ 
          marginTop: '12px', 
          fontSize: '12px', 
          color: '#666', 
          textAlign: 'center' 
        }}>
          Mostrando los últimos 10 movimientos · Ver todos en la página de Stock
        </p>
      </div>
    </div>
  );
}
