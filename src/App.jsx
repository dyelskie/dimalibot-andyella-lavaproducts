import { useEffect, useState } from "react";
import api, { clearTokens } from "./api";
import AuthPage from "./AuthPage";
import Products from "./Products";
import ThemeToggle from "./ThemeToggle";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!localStorage.getItem("access_token"));
  const [now, setNow] = useState(() => new Date());

  // Menu bar clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // On page load, ask the API who we are (keeps the role accurate)
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setChecking(false);
      return;
    }
    api
      .get("/api/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => clearTokens())
      .finally(() => setChecking(false));
  }, []);

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {
        refresh_token: localStorage.getItem("refresh_token"),
      });
    } catch {
      /* ignore: we clear local tokens regardless */
    }
    clearTokens();
    setUser(null);
  };

  const clock = now.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <header className="menubar">
        <div className="menubar-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true" /> Inventory
          </span>

          <div className="menubar-right">
            {user && (
              <>
                <span className="who">{user.username}</span>
                <span className={`badge ${user.role === "admin" ? "badge-admin" : ""}`}>{user.role}</span>
              </>
            )}
            <span className="clock">{clock}</span>
            <ThemeToggle />
            {user && (
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Log out
              </button>
            )}
          </div>
        </div>
      </header>

      {checking ? (
        <p className="center muted pad">Loading…</p>
      ) : user ? (
        <Products user={user} />
      ) : (
        <AuthPage onAuth={setUser} />
      )}
    </>
  );
}