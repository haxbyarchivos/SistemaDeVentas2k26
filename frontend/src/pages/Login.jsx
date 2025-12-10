import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabaseClient";
import { CardSpotlight } from "../components/ui/card-spotlight";
import { EncryptedText } from "../components/ui/encrypted-text";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Si ya hay sesión en Supabase, redirijo al dashboard
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError("Completa todos los campos");
      setLoading(false);
      return;
    }

    try {
      // Buscar usuario en la tabla 'usuarios'
      const { data: usuarios, error: searchError } = await supabase
        .from("usuarios")
        .select("id, username, password, role")
        .eq("username", username)
        .single();

      if (searchError || !usuarios) {
        setError("Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      // Validar contraseña
      if (usuarios.password !== password) {
        setError("Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      // Guardar sesión en localStorage con datos del usuario
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: usuarios.id,
          username: usuarios.username,
          role: usuarios.role,
        })
      );

      // Redirigir al dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Error al iniciar sesión: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Texto encriptado arriba */}
      <div style={{ marginBottom: "30px", textAlign: "center", zIndex: 20, fontSize: "clamp(18px, 5vw, 24px)" }}>
        <EncryptedText
          text="Bienvenido al Sistema de Ventas de "
          className="font-bold"
          revealedClassName="text-white"
        />
        <EncryptedText
          text="Coloplastic"
          className="font-bold"
          revealedClassName="text-[#F54927]"
          encryptedClassName="text-gray-600"
        />
      </div>

      {/* Formulario de login con efecto spotlight */}
      <CardSpotlight style={{ width: "90%", maxWidth: "380px", padding: 0 }}>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "white",
            position: "relative",
            zIndex: 20,
          }}
        >
          <h1 style={{ marginBottom: "20px" }}>Login</h1>

          <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#222",
              color: "white",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "text",
              position: "relative",
              zIndex: 20,
            }}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#222",
              color: "white",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "text",
              position: "relative",
              zIndex: 20,
            }}
          />

          {error && <p style={{ color: "tomato", margin: "6px 0", position: "relative", zIndex: 20 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              backgroundColor: loading ? "#888" : "#fff",
              color: "#000",
              fontWeight: "bold",
              borderRadius: "5px",
              border: "none",
              opacity: loading ? 0.7 : 1,
              position: "relative",
              zIndex: 20,
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        </div>
      </CardSpotlight>
    </div>
  );
}
