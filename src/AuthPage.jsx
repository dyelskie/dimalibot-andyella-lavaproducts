import { useState } from "react";
import api, { saveTokens } from "./api";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setForm({ username: "", password: "" });
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegister && form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setBusy(true);
    try {
      if (isRegister) await api.post("/api/auth/register", form);

      const { data } = await api.post("/api/auth/login", {
        username: form.username,
        password: form.password,
      });

      saveTokens(data);
      onAuth(data.user);
    } catch (err) {
      console.error("Auth error:", err);

      if (!err.response) {
        setError("Can't reach the server. Check that the API is running and VITE_API_URL is correct.");
      } else {
        setError(
          err.response.data?.error ||
            err.response.data?.message ||
            `Server error (${err.response.status}).`
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form onSubmit={submit} className="window login-window">
        <div className="titlebar">
          <span className="lights" aria-hidden="true"><i /><i /><i /></span>
          <span className="titlebar-title">{isRegister ? "New Account" : "Login"}</span>
          <span />
        </div>

        <div className="window-body login-body">
          <div className="avatar" aria-hidden="true">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
            </svg>
          </div>

          <div>
            <h1>{isRegister ? "Create account" : "Welcome back"}</h1>
            <p className="muted">
              {isRegister ? "Sign up to view the product catalog." : "Sign in to continue."}
            </p>
          </div>

          {error && <div className="alert" role="alert">{error}</div>}

          <label>
            Username
            <input value={form.username} onChange={set("username")} autoComplete="username" required />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
          </label>

          <button className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </button>

          <button type="button" className="link" onClick={switchMode}>
            {isRegister ? "Already have an account? Sign in" : "No account? Create one"}
          </button>
        </div>
      </form>
    </div>
  );
}