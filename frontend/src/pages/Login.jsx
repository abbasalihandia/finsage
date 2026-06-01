import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await loginUser(form);
      login(res.data.user, res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>💰 FinSage</h1>
        <p style={styles.subtitle}>Your AI Finance Coach</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  },
  card: {
    background: "white",
    padding: "2.5rem",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logo: { fontSize: "2rem", textAlign: "center", marginBottom: "0.25rem" },
  subtitle: { textAlign: "center", color: "#666", marginBottom: "2rem" },
  field: { marginBottom: "1.2rem" },
  label: { display: "block", marginBottom: "0.4rem", fontWeight: "500", fontSize: "0.9rem" },
  input: {
    width: "100%", padding: "0.75rem 1rem", borderRadius: "8px",
    border: "1.5px solid #e0e0e0", fontSize: "1rem", outline: "none",
    transition: "border 0.2s",
  },
  error: { color: "#e74c3c", marginBottom: "1rem", fontSize: "0.9rem" },
  button: {
    width: "100%", padding: "0.85rem", background: "#0f3460",
    color: "white", border: "none", borderRadius: "8px",
    fontSize: "1rem", fontWeight: "600", marginTop: "0.5rem",
    transition: "background 0.2s",
  },
  footer: { textAlign: "center", marginTop: "1.5rem", color: "#666", fontSize: "0.9rem" },
  link: { color: "#0f3460", fontWeight: "600" },
};