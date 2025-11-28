import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Si ya hay usuario en localStorage, redirijo al dashboard
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Completa todos los campos");
      return;
    }

    // Mock de usuarios
    // admin -> role admin, cualquier otro -> cajero (esto lo podés cambiar después)
    const usuarios = [
      { username: "admin", password: "1234", role: "admin" },
      { username: "cajero", password: "1234", role: "cajero" },
      { username: "haxby", password: "1234", role: "admin" },
    ];

    const found = usuarios.find(
      (u) => u.username === username && u.password === password
    );

    if (!found) {
      setError("Usuario o contraseña incorrectos");
      return;
    }

    // Guardar sesión (localStorage)
    localStorage.setItem("user", JSON.stringify({ username: found.username, role: found.role }));

    // Redirigir al dashboard
    navigate("/dashboard", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          padding: "40px",
          borderRadius: "8px",
          backgroundColor: "#111",
          width: "320px",
          textAlign: "center",
          color: "white",
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>Login</h1>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#222",
              color: "white",
            }}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#222",
              color: "white",
            }}
          />

          {error && <p style={{ color: "tomato", margin: "6px 0" }}>{error}</p>}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              cursor: "pointer",
              backgroundColor: "#fff",
              color: "#000",
              fontWeight: "bold",
              borderRadius: "5px",
              border: "none",
            }}
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
