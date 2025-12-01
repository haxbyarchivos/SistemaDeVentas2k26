import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../utils/supabaseClient'

export default function Configuracion() {
  const [tema, setTema] = useState('oscuro')
  const [notificaciones, setNotificaciones] = useState(true)
  const [idioma, setIdioma] = useState('es')
  const [user, setUser] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [showFormulario, setShowFormulario] = useState(false)
  const [formData, setFormData] = useState({ username: '', password: '', role: 'cajero' })
  const [editingId, setEditingId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Cargar usuario actual
    const raw = localStorage.getItem('user')
    if (raw) {
      setUser(JSON.parse(raw))
    }

    // Cargar configuración guardada
    const temaGuardado = localStorage.getItem('tema') || 'oscuro'
    const notificacionesGuardadas = localStorage.getItem('notificaciones') !== 'false'
    const idiomaGuardado = localStorage.getItem('idioma') || 'es'

    setTema(temaGuardado)
    setNotificaciones(notificacionesGuardadas)
    setIdioma(idiomaGuardado)

    // Cargar usuarios si es admin
    if (raw) {
      const userData = JSON.parse(raw)
      if (userData.role === 'admin') {
        cargarUsuarios()
      }
    }
  }, [])

  const cargarUsuarios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('usuarios').select('*').order('username')
      if (error) throw error
      setUsuarios(data || [])
    } catch (err) {
      console.error('Error al cargar usuarios:', err.message)
      alert('Error al cargar usuarios: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = () => {
    localStorage.setItem('tema', tema)
    localStorage.setItem('notificaciones', notificaciones)
    localStorage.setItem('idioma', idioma)
    alert('Configuración guardada correctamente')
  }

  const handleRestoreDefaults = () => {
    if (window.confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      localStorage.removeItem('tema')
      localStorage.removeItem('notificaciones')
      localStorage.removeItem('idioma')
      setTema('oscuro')
      setNotificaciones(true)
      setIdioma('es')
      alert('Configuración restaurada')
    }
  }

  const handleSaveUsuario = async (e) => {
    e.preventDefault()

    if (!formData.username || !formData.password) {
      alert('Completa todos los campos')
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        // Actualizar usuario
        const { error } = await supabase
          .from('usuarios')
          .update({ username: formData.username, password: formData.password, role: formData.role })
          .eq('id', editingId)

        if (error) throw error
        alert('Usuario actualizado correctamente')
      } else {
        // Crear nuevo usuario
        const { error } = await supabase.from('usuarios').insert([formData])
        if (error) throw error
        alert('Usuario creado correctamente')
      }

      setFormData({ username: '', password: '', role: 'cajero' })
      setEditingId(null)
      setShowFormulario(false)
      cargarUsuarios()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditarUsuario = (usuario) => {
    setFormData({ username: usuario.username, password: usuario.password, role: usuario.role })
    setEditingId(usuario.id)
    setShowFormulario(true)
  }

  const handleEliminarUsuario = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setLoading(true)
      try {
        const { error } = await supabase.from('usuarios').delete().eq('id', id)
        if (error) throw error
        alert('Usuario eliminado correctamente')
        cargarUsuarios()
      } catch (err) {
        alert('Error: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCancelar = () => {
    setFormData({ username: '', password: '', role: 'cajero' })
    setEditingId(null)
    setShowFormulario(false)
  }

  return (
    <div
      style={{
        padding: '40px',
        color: 'white',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
      }}
    >
      <h1 style={{ marginBottom: '30px' }}>Configuración</h1>

      {/* CONTENEDOR PRINCIPAL */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '30px',
          marginBottom: '40px',
        }}
      >
        {/* TARJETA 1: TEMA */}
        <div
          style={{
            backgroundColor: '#1d1d1d',
            borderRadius: '8px',
            padding: '25px',
            border: '1px solid #333',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>🎨 Tema</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="tema"
                value="oscuro"
                checked={tema === 'oscuro'}
                onChange={(e) => setTema(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
              <span>Oscuro (Recomendado)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="tema"
                value="claro"
                checked={tema === 'claro'}
                onChange={(e) => setTema(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
              <span>Claro</span>
            </label>
          </div>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '15px' }}>
            Elige entre tema oscuro o claro para una mejor experiencia visual.
          </p>
        </div>

        {/* TARJETA 2: NOTIFICACIONES */}
        <div
          style={{
            backgroundColor: '#1d1d1d',
            borderRadius: '8px',
            padding: '25px',
            border: '1px solid #333',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>🔔 Notificaciones</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              checked={notificaciones}
              onChange={(e) => setNotificaciones(e.target.checked)}
              style={{ cursor: 'pointer', width: '20px', height: '20px' }}
            />
            <span>{notificaciones ? 'Habilitadas' : 'Deshabilitadas'}</span>
          </div>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '15px' }}>
            {notificaciones
              ? 'Recibirás notificaciones de eventos importantes.'
              : 'No recibirás notificaciones.'}
          </p>
        </div>

        {/* TARJETA 3: IDIOMA */}
        <div
          style={{
            backgroundColor: '#1d1d1d',
            borderRadius: '8px',
            padding: '25px',
            border: '1px solid #333',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>🌐 Idioma</h2>
          <select
            value={idioma}
            onChange={(e) => setIdioma(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#222',
              color: 'white',
              border: '1px solid #444',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '15px' }}>
            Selecciona el idioma de la interfaz.
          </p>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '40px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleSaveConfig}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4da6ff',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#3d96ff')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#4da6ff')}
        >
          ✓ Guardar Configuración
        </button>
        <button
          onClick={handleRestoreDefaults}
          style={{
            padding: '12px 24px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#555')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#666')}
        >
          ↻ Restaurar Defaults
        </button>
      </div>

      {/* SECCIÓN DE GESTIÓN DE USUARIOS (solo para admin) */}
      {user?.role === 'admin' && (
        <div
          style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '25px',
            border: '1px solid #444',
            marginBottom: '40px',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>👥 Gestión de Usuarios</h2>

          {/* BOTÓN PARA CREAR USUARIO */}
          {!showFormulario && (
            <button
              onClick={() => setShowFormulario(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '20px',
              }}
            >
              + Crear Nuevo Usuario
            </button>
          )}

          {/* FORMULARIO */}
          {showFormulario && (
            <form
              onSubmit={handleSaveUsuario}
              style={{
                backgroundColor: '#222',
                padding: '20px',
                borderRadius: '5px',
                marginBottom: '20px',
                display: 'grid',
                gap: '12px',
              }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#999' }}>
                  Usuario
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Nombre de usuario"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: '1px solid #444',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#999' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Contraseña"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: '1px solid #444',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#999' }}>
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: '1px solid #444',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="cajero">Cajero</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: editingId ? '#007bff' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {editingId ? 'Actualizar' : 'Crear'} Usuario
                </button>
                <button
                  type="button"
                  onClick={handleCancelar}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* LISTA DE USUARIOS */}
          <div>
            <h3 style={{ marginBottom: '15px' }}>Usuarios Registrados ({usuarios.length})</h3>
            {loading && !usuarios.length ? (
              <p style={{ color: '#999' }}>Cargando...</p>
            ) : usuarios.length === 0 ? (
              <p style={{ color: '#999' }}>No hay usuarios registrados</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: '10px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                {usuarios.map((usr) => (
                  <div
                    key={usr.id}
                    style={{
                      backgroundColor: '#333',
                      padding: '15px',
                      borderRadius: '5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{usr.username}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                        Rol: <span style={{ color: usr.role === 'admin' ? '#ff6b6b' : '#4da6ff' }}>{usr.role}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditarUsuario(usr)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminarUsuario(usr.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#c41e3a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INFORMACIÓN */}
      <div
        style={{
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333',
          fontSize: '13px',
          color: '#999',
          lineHeight: '1.6',
        }}
      >
        <strong>ℹ️ Información del Sistema:</strong>
        <p style={{ marginTop: '8px', marginBottom: 0 }}>
          Versión: 1.0.0 | Sistema de Ventas 2K26
        </p>
      </div>
    </div>
  )
}
