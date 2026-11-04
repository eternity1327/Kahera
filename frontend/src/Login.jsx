import React, { useState } from "react";
import { api, setToken, setActiveRole, setActiveUsername } from "./api.js";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await api("/auth/register", {
          method: "POST",
          body: { username, password },
        });
      }
      const data = await api("/auth/login", {
        method: "POST",
        form: { username, password },
        body: { username, password },
      });
      setToken(data.access_token);
      setActiveUsername(username);
      setActiveRole(username.toLowerCase().includes("owner") ? "owner" : "cashier");
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role) => {
    const user = role === "agent" ? "restock" : role;
    setToken("mock-token-" + user);
    setActiveRole(role);
    setActiveUsername(user);
    onLogin();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "radial-gradient(circle at top right, rgba(0, 90, 156, 0.08), transparent 70%), var(--color-background)",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "32px", boxShadow: "var(--shadow-modal)" }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            className="brand-icon"
            style={{ width: "48px", height: "48px", fontSize: "1.5rem", margin: "0 auto 12px" }}
          >
            K
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Kahera</h1>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
            Inventory Management & REST API Restock Assistant
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-error-bg)",
              border: "1px solid var(--color-error-border)",
              color: "var(--color-error)",
              fontSize: "0.82rem",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {/* Quick Demo Access Bar */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-text-muted)",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            Quick 1-Click Demo Login
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700 }}
              onClick={() => handleQuickDemoLogin("owner")}
            >
              👑 Owner
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700 }}
              onClick={() => handleQuickDemoLogin("cashier")}
            >
              💼 Cashier
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700 }}
              onClick={() => handleQuickDemoLogin("agent")}
            >
              🤖 Agent
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--color-divider)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>or log in with credentials</span>
          <div style={{ flex: 1, height: "1px", background: "var(--color-divider)" }} />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label>Username</label>
            <input
              required
              placeholder="e.g. owner or cashier"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: "11px", marginTop: "4px" }} disabled={loading}>
            {loading ? "Signing in..." : isRegister ? "Create Account (Owner)" : "Sign In"}
          </button>

          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              fontSize: "0.82rem",
              fontWeight: 500,
              cursor: "pointer",
              padding: "4px",
              marginTop: "4px",
            }}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Already registered? Sign in" : "First time user? Register as Owner"}
          </button>
        </form>
      </div>
    </div>
  );
}
