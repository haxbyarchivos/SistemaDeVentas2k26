// /src/pages/Clientes.jsx

import React, { useState, useEffect, useRef } from "react";
import PageContainer from "../components/PageContainer";
import { Link } from "react-router-dom";
import supabase from "../utils/supabaseClient.js";
import styled from "styled-components";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [listas, setListas] = useState([]);
  const [modo, setModo] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({
    id: null,
    nombre: "",
    telefono: "",
    direccion: "",
    rubro: "",
    lista_precio_id: null
  });

  const fileInputRef = useRef(null);

  // CARGAR CLIENTES Y LISTAS DESDE SUPABASE
  useEffect(() => {
    cargarClientes();
    cargarListas();
  }, []);

  const cargarListas = async () => {
    try {
      const { data, error } = await supabase
        .from('listas_precios')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setListas(data || []);
    } catch (err) {
      console.error('Error cargando listas:', err);
    }
  };

  const cargarClientes = async () => {
  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      // Si querés poblar con JSON base la primera vez
      if (Array.isArray(clientesJSON) && clientesJSON.length) {
        const { data: inserted, error: insErr } = await supabase
          .from("clientes")
          .insert(clientesJSON)
          .select();
        if (insErr) throw insErr;
        setClientes(inserted);
      } else {
        setClientes([]);
      }
    } else {
      setClientes(data);
    }
  } catch (err) {
    console.error("Error cargando clientes:", err);
    // fallback opcional:
    setClientes(clientesJSON || []);
  }

    // Si Supabase está vacío → cargar JSON inicial
    if (data.length === 0) {
      for (let c of clientesJSON) {
        await supabase.from("clientes").insert([{ ...c }]);
      }
      setClientes(clientesJSON);
    } else {
      setClientes(data);
    }
  };

  // AGREGAR / EDITAR
  const abrirAgregar = () => {
    setModo("agregar");
    setForm({ id: null, nombre: "", telefono: "", direccion: "", rubro: "", lista_precio_id: null });
  };

  const abrirEditar = (c) => {
    setModo("editar");
    setForm(c);
  };

 const guardar = async () => {
  if (!form.nombre || !form.nombre.trim()) {
    return alert("El nombre es obligatorio.");
  }

  try {
    if (modo === "agregar") {
      const { data, error } = await supabase
        .from("clientes")
        .insert([
          {
            nombre: form.nombre,
            telefono: form.telefono,
            direccion: form.direccion,
            rubro: form.rubro,
            lista_precio_id: form.lista_precio_id
          }
        ])
        .select(); // pedir que devuelva el registro insertado

      if (error) throw error;

      // data es un array con el/los registros insertados (con id generado)
      setClientes(prev => [...prev, ...data]);
      setModo(null);
      setForm({ id: null, nombre: "", telefono: "", direccion: "", rubro: "", lista_precio_id: null });
      return;
    }

    // MODO EDITAR
    // Asegurarnos que id sea number (si tu id es bigint en DB)
    const idToUpdate = typeof form.id === "number" ? form.id : Number(form.id);
    if (!idToUpdate) return alert("ID inválido para actualizar.");

    const { data, error } = await supabase
      .from("clientes")
      .update({
        nombre: form.nombre,
        telefono: form.telefono,
        direccion: form.direccion,
        rubro: form.rubro,
        lista_precio_id: form.lista_precio_id
      })
      .eq("id", idToUpdate)
      .select();

    if (error) throw error;

    // data es el/los registros actualizados; actualizamos el state con lo que devolvió Supabase
    if (data && data.length) {
      setClientes(prev => prev.map(c => (c.id === data[0].id ? data[0] : c)));
    } else {
      // si no devolvió nada, recargar desde DB
      console.warn("Update no devolvió datos — recargando tabla.");
      await cargarClientes();
    }

    setModo(null);
    setForm({ id: null, nombre: "", telefono: "", direccion: "", rubro: "", lista_precio_id: null });
  } catch (err) {
    console.error("Error en guardar():", err);
    alert("Error guardando en la base de datos. Revisá la consola para más detalles.");
  }
};

  // ACTUALIZAR DESDE JSON BASE (OPCIONAL)
  const mergeFromJSON = async () => {
    if (!Array.isArray(clientesJSON)) return alert("JSON inválido");

    const map = new Map(clientes.map((c) => [c.id, c]));

    clientesJSON.forEach((base) => {
      const local = map.get(base.id);
      if (local) map.set(base.id, { ...base, ...local });
      else map.set(base.id, base);
    });

    const merged = Array.from(map.values());

    for (let c of merged) {
      const exists = await supabase.from("clientes").select("*").eq("id", c.id);

      if (exists.data?.length) {
        await supabase.from("clientes").update(c).eq("id", c.id);
      } else {
        await supabase.from("clientes").insert(c);
      }
    }

    setClientes(merged);
    alert("Actualizado sin perder datos.");
  };

  // EXPORTAR JSON
  const exportJSON = () => {
    const data = JSON.stringify(clientes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes_export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // IMPORTAR JSON
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const imported = JSON.parse(text);

    if (!Array.isArray(imported)) return alert("Archivo inválido");

    const map = new Map(clientes.map((c) => [c.id, c]));

    imported.forEach((base) => {
      const local = map.get(base.id);
      if (local) map.set(base.id, { ...base, ...local });
      else map.set(base.id, base);
    });

    const merged = Array.from(map.values());

    for (let c of merged) {
      const exists = await supabase.from("clientes").select("*").eq("id", c.id);
      if (exists.data?.length) {
        await supabase.from("clientes").update(c).eq("id", c.id);
      } else {
        await supabase.from("clientes").insert(c);
      }
    }

    setClientes(merged);
    alert("Importado correctamente.");
  };

  // FILTRADO DE CLIENTES
  const clientesFiltrados = clientes.filter(c => {
    const termino = busqueda.toLowerCase();
    return (
      c.nombre?.toLowerCase().includes(termino) ||
      c.telefono?.toLowerCase().includes(termino) ||
      c.direccion?.toLowerCase().includes(termino) ||
      c.rubro?.toLowerCase().includes(termino)
    );
  });

  return (
    <PageContainer
      title="Clientes"
      subtitle="Administración de clientes"
      footer={<Link to="/dashboard" className="back-link">Volver</Link>}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="small">Listado de clientes</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={abrirAgregar}>Agregar cliente</button>
          <button className="btn" onClick={mergeFromJSON}>Actualizar</button>
          <button className="btn" onClick={exportJSON}>Exportar JSON</button>
          <button className="btn" onClick={() => fileInputRef.current.click()}>
            Importar JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="application/json"
            onChange={handleImport}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
        <SearchInput value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Rubro</th>
            <th>Lista de Precios</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientesFiltrados.length === 0 ? (
            <tr><td colSpan={6}>{busqueda ? 'No se encontraron clientes.' : 'No hay clientes.'}</td></tr>
          ) : (
            clientesFiltrados.map((c) => {
              const lista = listas.find(l => l.id === c.lista_precio_id);
              return (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>{c.telefono}</td>
                  <td>{c.direccion}</td>
                  <td>{c.rubro}</td>
                  <td>{lista ? lista.nombre : 'Sin asignar'}</td>
                  <td>
                    <button className="btn-small" onClick={() => abrirEditar(c)}>
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {modo && (
        <div className="modal">
          <div className="modal-content">
            <h3>{modo === "agregar" ? "Agregar Cliente" : "Editar Cliente"}</h3>

            <input
              className="input"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <input
              className="input"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
            <input
              className="input"
              placeholder="Dirección"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
            <input
              className="input"
              placeholder="Rubro"
              value={form.rubro}
              onChange={(e) => setForm({ ...form, rubro: e.target.value })}
            />

            <select
              className="input"
              value={form.lista_precio_id || ''}
              onChange={(e) => setForm({ ...form, lista_precio_id: e.target.value || null })}
              style={{ marginTop: 8 }}
            >
              <option value="">Sin lista de precios</option>
              {listas.map(lista => (
                <option key={lista.id} value={lista.id}>
                  {lista.nombre} ({lista.moneda})
                </option>
              ))}
            </select>

            <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
              <button className="btn" onClick={guardar}>Guardar</button>
              <button className="btn-cancel" onClick={() => setModo(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

// Componente de búsqueda con styled-components
const SearchInput = ({ value, onChange }) => {
  return (
    <StyledWrapper>
      <div>
        <div className="grid" />
        <div id="poda">
          <div className="glow" />
          <div className="darkBorderBg" />
          <div className="darkBorderBg" />
          <div className="darkBorderBg" />
          <div className="white" />
          <div className="border" />
          <div id="main">
            <input placeholder="Buscar cliente..." type="text" value={value} onChange={onChange} className="input" />
            <div id="input-mask" />
            <div id="pink-mask" />
            <div className="filterBorder" />
            <div id="filter-icon">
              <svg preserveAspectRatio="none" height={27} width={27} viewBox="4.8 4.56 14.832 15.408" fill="none">
                <path d="M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z" stroke="#d6d6e6" strokeWidth={1} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div id="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width={24} viewBox="0 0 24 24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" height={24} fill="none" className="feather feather-search">
                <circle stroke="url(#search)" r={8} cy={11} cx={11} />
                <line stroke="url(#searchl)" y2="16.65" y1={22} x2="16.65" x1={22} />
                <defs>
                  <linearGradient gradientTransform="rotate(50)" id="search">
                    <stop stopColor="#f8e7f8" offset="0%" />
                    <stop stopColor="#b6a9b7" offset="50%" />
                  </linearGradient>
                  <linearGradient id="searchl">
                    <stop stopColor="#b6a9b7" offset="0%" />
                    <stop stopColor="#837484" offset="50%" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .grid {
    height: 800px;
    width: 800px;
    background-image: linear-gradient(to right, #0f0f10 1px, transparent 1px),
      linear-gradient(to bottom, #0f0f10 1px, transparent 1px);
    background-size: 1rem 1rem;
    background-position: center center;
    position: absolute;
    z-index: -1;
    filter: blur(1px);
  }
  .white,
  .border,
  .darkBorderBg,
  .glow {
    max-height: 70px;
    max-width: 314px;
    height: 100%;
    width: 100%;
    position: absolute;
    overflow: hidden;
    z-index: -1;
    border-radius: 12px;
    filter: blur(3px);
  }
  .input {
    background-color: #010201;
    border: none;
    width: 301px;
    height: 56px;
    border-radius: 10px;
    color: white;
    padding-inline: 59px;
    font-size: 18px;
  }
  #poda {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .input::placeholder {
    color: #c0b9c0;
  }

  .input:focus {
    outline: none;
  }

  #main:focus-within > #input-mask {
    display: none;
  }

  #input-mask {
    pointer-events: none;
    width: 100px;
    height: 20px;
    position: absolute;
    background: linear-gradient(90deg, transparent, black);
    top: 18px;
    left: 70px;
  }
  #pink-mask {
    pointer-events: none;
    width: 30px;
    height: 20px;
    position: absolute;
    background: #cf30aa;
    top: 10px;
    left: 5px;
    filter: blur(20px);
    opacity: 0.8;
    transition: all 2s;
  }
  #main:hover > #pink-mask {
    opacity: 0;
  }

  .white {
    max-height: 63px;
    max-width: 307px;
    border-radius: 10px;
    filter: blur(2px);
  }

  .white::before {
    content: "";
    z-index: -2;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(83deg);
    position: absolute;
    width: 600px;
    height: 600px;
    background-repeat: no-repeat;
    background-position: 0 0;
    filter: brightness(1.4);
    background-image: conic-gradient(
      rgba(0, 0, 0, 0) 0%,
      #a099d8,
      rgba(0, 0, 0, 0) 8%,
      rgba(0, 0, 0, 0) 50%,
      #dfa2da,
      rgba(0, 0, 0, 0) 58%
    );
    transition: all 2s;
  }
  .border {
    max-height: 59px;
    max-width: 303px;
    border-radius: 11px;
    filter: blur(0.5px);
  }
  .border::before {
    content: "";
    z-index: -2;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(70deg);
    position: absolute;
    width: 600px;
    height: 600px;
    filter: brightness(1.3);
    background-repeat: no-repeat;
    background-position: 0 0;
    background-image: conic-gradient(
      #1c191c,
      #402fb5 5%,
      #1c191c 14%,
      #1c191c 50%,
      #cf30aa 60%,
      #1c191c 64%
    );
    transition: all 2s;
  }
  .darkBorderBg {
    max-height: 65px;
    max-width: 312px;
  }
  .darkBorderBg::before {
    content: "";
    z-index: -2;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(82deg);
    position: absolute;
    width: 600px;
    height: 600px;
    background-repeat: no-repeat;
    background-position: 0 0;
    background-image: conic-gradient(
      rgba(0, 0, 0, 0),
      #18116a,
      rgba(0, 0, 0, 0) 10%,
      rgba(0, 0, 0, 0) 50%,
      #6e1b60,
      rgba(0, 0, 0, 0) 60%
    );
    transition: all 2s;
  }
  #poda:hover > .darkBorderBg::before {
    transform: translate(-50%, -50%) rotate(262deg);
  }
  #poda:hover > .glow::before {
    transform: translate(-50%, -50%) rotate(240deg);
  }
  #poda:hover > .white::before {
    transform: translate(-50%, -50%) rotate(263deg);
  }
  #poda:hover > .border::before {
    transform: translate(-50%, -50%) rotate(250deg);
  }

  #poda:hover > .darkBorderBg::before {
    transform: translate(-50%, -50%) rotate(-98deg);
  }
  #poda:hover > .glow::before {
    transform: translate(-50%, -50%) rotate(-120deg);
  }
  #poda:hover > .white::before {
    transform: translate(-50%, -50%) rotate(-97deg);
  }
  #poda:hover > .border::before {
    transform: translate(-50%, -50%) rotate(-110deg);
  }

  #poda:focus-within > .darkBorderBg::before {
    transform: translate(-50%, -50%) rotate(442deg);
    transition: all 4s;
  }
  #poda:focus-within > .glow::before {
    transform: translate(-50%, -50%) rotate(420deg);
    transition: all 4s;
  }
  #poda:focus-within > .white::before {
    transform: translate(-50%, -50%) rotate(443deg);
    transition: all 4s;
  }
  #poda:focus-within > .border::before {
    transform: translate(-50%, -50%) rotate(430deg);
    transition: all 4s;
  }

  .glow {
    overflow: hidden;
    filter: blur(30px);
    opacity: 0.4;
    max-height: 130px;
    max-width: 354px;
  }
  .glow:before {
    content: "";
    z-index: -2;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(60deg);
    position: absolute;
    width: 999px;
    height: 999px;
    background-repeat: no-repeat;
    background-position: 0 0;
    background-image: conic-gradient(
      #000,
      #402fb5 5%,
      #000 38%,
      #000 50%,
      #cf30aa 60%,
      #000 87%
    );
    transition: all 2s;
  }

  @keyframes rotate {
    100% {
      transform: translate(-50%, -50%) rotate(450deg);
    }
  }
  @keyframes leftright {
    0% {
      transform: translate(0px, 0px);
      opacity: 1;
    }

    49% {
      transform: translate(250px, 0px);
      opacity: 0;
    }
    80% {
      transform: translate(-40px, 0px);
      opacity: 0;
    }

    100% {
      transform: translate(0px, 0px);
      opacity: 1;
    }
  }

  #filter-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    max-height: 40px;
    max-width: 38px;
    height: 100%;
    width: 100%;

    isolation: isolate;
    overflow: hidden;
    border-radius: 10px;
    background: linear-gradient(180deg, #161329, black, #1d1b4b);
    border: 1px solid transparent;
  }
  .filterBorder {
    height: 42px;
    width: 40px;
    position: absolute;
    overflow: hidden;
    top: 7px;
    right: 7px;
    border-radius: 10px;
  }

  .filterBorder::before {
    content: "";

    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(90deg);
    position: absolute;
    width: 600px;
    height: 600px;
    background-repeat: no-repeat;
    background-position: 0 0;
    filter: brightness(1.35);
    background-image: conic-gradient(
      rgba(0, 0, 0, 0),
      #3d3a4f,
      rgba(0, 0, 0, 0) 50%,
      rgba(0, 0, 0, 0) 50%,
      #3d3a4f,
      rgba(0, 0, 0, 0) 100%
    );
    animation: rotate 4s linear infinite;
  }
  #main {
    position: relative;
  }
  #search-icon {
    position: absolute;
    left: 20px;
    top: 15px;
  }
`;
