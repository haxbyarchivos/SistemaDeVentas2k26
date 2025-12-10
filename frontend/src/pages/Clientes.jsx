// /src/pages/Clientes.jsx

import React, { useState, useEffect, useRef } from "react";
import PageContainer from "../components/PageContainer";
import { Link } from "react-router-dom";
import supabase from "../utils/supabaseClient.js";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [listas, setListas] = useState([]);
  const [modo, setModo] = useState(null);
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
          {clientes.length === 0 ? (
            <tr><td colSpan={6}>No hay clientes.</td></tr>
          ) : (
            clientes.map((c) => {
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
