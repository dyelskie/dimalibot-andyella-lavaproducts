import { useEffect, useRef, useState } from "react";
import api from "./api";

const empty = { product_name: "", description: "", price: "", quantity: "" };
const peso = (n) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function Products({ user }) {
  const isAdmin = user.role === "admin";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / edit popup
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation popup
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Top banner
  const [banner, setBanner] = useState(null);
  const timer = useRef(null);

  const notify = (type, text) => {
    clearTimeout(timer.current);
    setBanner({ type, text, key: Date.now() });
    timer.current = setTimeout(() => setBanner(null), 4000);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  /* ---------- load ---------- */
  const load = async () => {
    try {
      const { data } = await api.get("/api/products");
      setProducts(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD PRODUCTS ERROR:", err.response?.status, err.response?.data || err);
      notify("error", err.response?.data?.error || "Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ---------- popup helpers ---------- */
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
    setForm(empty);
    setFormError("");
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(empty);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      product_name: p.product_name,
      description: p.description || "",
      price: p.price,
      quantity: p.quantity,
    });
    setFormError("");
    setFormOpen(true);
  };

  // Esc closes the popup, and the page behind it does not scroll
  useEffect(() => {
    if (!formOpen && !deleting) return;

    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (deleting) { if (!removing) setDeleting(null); }
      else closeForm();
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [formOpen, deleting, saving, removing]);

  /* ---------- save (add or update) ---------- */
  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const name = form.product_name.trim();

    try {
      if (editingId) {
        await api.put(`/api/products/${editingId}`, form);
        notify("success", `"${name}" was updated.`);
      } else {
        await api.post("/api/products", form);
        notify("success", `"${name}" was added.`);
      }
      setFormOpen(false);
      setEditingId(null);
      setForm(empty);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.error || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- delete ---------- */
  const confirmDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await api.delete(`/api/products/${deleting.id}`);
      notify("success", `"${deleting.product_name}" was deleted.`);
      setDeleting(null);
      await load();
    } catch (err) {
      setDeleting(null);
      notify("error", err.response?.data?.error || "Delete failed.");
    } finally {
      setRemoving(false);
    }
  };

  const backdropClose = (fn) => (e) => {
    if (e.target === e.currentTarget) fn();
  };

  return (
    <main className="container">
      {/* ---------- Banner ---------- */}
      {banner && (
        <div
          key={banner.key}
          className={`banner banner-${banner.type}`}
          role={banner.type === "error" ? "alert" : "status"}
        >
          <span className="banner-icon" aria-hidden="true">
            {banner.type === "error" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5.5M12 16.5v.01" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12.5l2.7 2.7L16 9.8" />
              </svg>
            )}
          </span>
          <span className="banner-text">{banner.text}</span>
          <button type="button" className="banner-close" onClick={() => setBanner(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {/* ---------- Catalog ---------- */}
      <section className="window">
        <div className="titlebar">
          <span className="lights" aria-hidden="true"><i /><i /><i /></span>
          <h1 className="titlebar-title">Products</h1>
          <span className="titlebar-count">
            {products.length} {products.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="toolbar">
          <span className="toolbar-text">
            {isAdmin ? "Manage your product catalog." : "Browse the product catalog (view only)."}
          </span>
          {isAdmin && (
            <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
              + Add product
            </button>
          )}
        </div>

        {loading ? (
          <p className="center muted pad">Loading products…</p>
        ) : products.length === 0 ? (
          <div className="empty">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
              <path d="M3 8l9 5 9-5M12 13v8" />
            </svg>
            <span>{isAdmin ? "No products yet. Click “Add product” to create one." : "No products yet."}</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th className="num">Price</th>
                  <th className="num">Qty</th>
                  {isAdmin && <th className="actions-col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Name" className="strong">{p.product_name}</td>
                    <td data-label="Description" className="muted">{p.description || "—"}</td>
                    <td data-label="Price" className="num">{peso(p.price)}</td>
                    <td data-label="Qty" className="num">{p.quantity}</td>
                    {isAdmin && (
                      <td data-label="Actions" className="actions-col">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(p)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- Add / Edit popup ---------- */}
      {formOpen && (
        <div className="overlay" onMouseDown={backdropClose(closeForm)}>
          <form
            onSubmit={submit}
            className="window modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className="titlebar">
              <span className="lights">
                <button type="button" className="light-btn" onClick={closeForm} aria-label="Close" />
                <i /><i />
              </span>
              <h2 id="form-title" className="titlebar-title">
                {editingId ? "Edit Product" : "New Product"}
              </h2>
              <span />
            </div>

            <div className="window-body form-grid">
              {formError && <div className="alert span-2" role="alert">{formError}</div>}

              <label className="span-2">
                Name
                <input
                  autoFocus
                  value={form.product_name}
                  onChange={set("product_name")}
                  maxLength={100}
                  required
                />
              </label>

              <label className="span-2">
                Description
                <textarea rows="3" value={form.description} onChange={set("description")} />
              </label>

              <label>
                Price (₱)
                <input type="number" step="0.01" min="0" value={form.price} onChange={set("price")} required />
              </label>

              <label>
                Quantity
                <input type="number" min="0" step="1" value={form.quantity} onChange={set("quantity")} required />
              </label>

              <div className="span-2 modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update" : "Add product"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ---------- Delete confirmation popup ---------- */}
      {deleting && (
        <div className="overlay" onMouseDown={backdropClose(() => !removing && setDeleting(null))}>
          <div
            className="window modal modal-sm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <div className="alert-dialog">
              <h2 id="delete-title">Delete “{deleting.product_name}”?</h2>
              <p className="muted">This can't be undone.</p>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setDeleting(null)} disabled={removing}>
                  Cancel
                </button>
                <button className="btn btn-danger-solid" onClick={confirmDelete} disabled={removing}>
                  {removing ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}