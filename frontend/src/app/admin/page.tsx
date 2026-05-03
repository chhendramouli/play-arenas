"use client";
import { Booking, Arena } from "@/components/types";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/components/apiClient";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const SPORTS = ["Football", "Basketball", "Badminton", "Tennis", "Cricket", "Swimming"];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: bookings = [], isLoading: bookingsLoading, refetch } = useQuery<Booking[]>({
    queryKey: ["admin-bookings"],
    queryFn: async () => { const { data } = await apiClient.get("/api/bookings"); return data; },
    enabled: !!user && user.role === "ADMIN",
    refetchInterval: 5000,
  });

  const { data: arenas = [], isLoading: arenasLoading } = useQuery<Arena[]>({
    queryKey: ["admin-arenas"],
    queryFn: async () => { const { data } = await apiClient.get("/api/arenas?includeInactive=true"); return data; },
    enabled: !!user && user.role === "ADMIN",
  });

  const { data: dashboard } = useQuery<{
    totalArenas: number;
    activeArenas: number;
    totalBookings: number;
    bySport: Record<string, number>;
    byArena: Record<string, number>;
    byLocation: Record<string, number>;
    byStatus: Record<string, number>;
  }>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => { const { data } = await apiClient.get("/api/arenas/dashboard"); return data; },
    enabled: !!user && user.role === "ADMIN",
    refetchInterval: 10000,
  });

  const { data: health } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => { const { data } = await apiClient.get("/actuator/health"); return data; },
    refetchInterval: 10000,
  });

  const createArena = useMutation({
    mutationFn: (data: any) => apiClient.post("/api/arenas", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-arenas"] }); setShowForm(false); setEditingId(null); toast.success("Arena created"); },
    onError: () => toast.error("Failed to create"),
  });

  const updateArena = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/api/arenas/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-arenas"] }); qc.invalidateQueries({ queryKey: ["arenas"] }); setShowForm(false); setEditingId(null); toast.success("Arena updated"); },
    onError: () => toast.error("Failed to update"),
  });

  const deleteArena = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/arenas/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-arenas"] }); toast.success("Arena deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const toggleActive = useMutation({
    mutationFn: ({ a, active }: { a: Arena; active: boolean }) =>
      apiClient.put(`/api/arenas/${a.id}`, {
        name: a.name, location: a.location, sportType: a.sportType,
        pricePerHour: a.pricePerHour, imageUrl: a.imageUrl ?? null, active,
      }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-arenas"] });
      qc.invalidateQueries({ queryKey: ["arenas"] });
      toast.success(vars.active ? "Arena activated" : "Arena deactivated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const cancelBooking = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/bookings/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-bookings"] }); toast.success("Booking cancelled"); },
    onError: () => toast.error("Failed to cancel"),
  });

  const [tab, setTab] = useState<"dashboard" | "bookings" | "arenas">("bookings");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", location: "", sportType: "Football", pricePerHour: "", imageUrl: "" });

  const startEdit = (a: Arena) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      location: a.location,
      sportType: a.sportType,
      pricePerHour: String(a.pricePerHour),
      imageUrl: a.imageUrl ?? "",
    });
    setShowForm(true);
    // Scroll into view
    if (typeof window !== "undefined") setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setForm({ name: "", location: "", sportType: "Football", pricePerHour: "", imageUrl: "" });
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--muted)" }}>Verifying credentials...</p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="page-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Access Denied</h1>
        <p style={{ color: "var(--muted)" }}>You do not have permission to view this page.</p>
        <Link href="/" className="btn-primary">Return to Home</Link>
      </div>
    );
  }

  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length;
  const pending   = bookings.filter(b => b.status === "PENDING").length;
  const failed    = bookings.filter(b => b.status === "CANCELLED" || b.status === "FAILED").length;
  const dbStatus      = health?.components?.db?.status ?? health?.status ?? "UNKNOWN";
  const apiStatus     = health ? "UP" : "DOWN";
  const temporalUp    = health?.status === "UP";
  const allBookings = [...bookings].sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const badgeClass = (s: string) => s === "CONFIRMED" ? "badge badge-ok" : s === "PENDING" ? "badge badge-warn" : "badge badge-err";

  const handleSubmit = () => {
    if (!form.name || !form.location || !form.pricePerHour) { toast.error("Fill all required fields"); return; }
    const payload = {
      name: form.name,
      location: form.location,
      sportType: form.sportType,
      pricePerHour: parseFloat(form.pricePerHour),
      imageUrl: form.imageUrl || null,
      active: true,
    };
    if (editingId) {
      updateArena.mutate({ id: editingId, data: payload });
    } else {
      createArena.mutate(payload);
    }
  };

  return (
    <div className="page-bg">
      {/* Navbar */}
      <nav className="navbar">
        <div className="admin-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "var(--lp-blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, borderRadius: 4 }}>L</div>
          <span className="logo-text">Back Office</span>
          <span style={{ fontSize: 10, color: "var(--accent)", background: "rgba(0,180,216,.1)", border: "1px solid var(--accent)", borderRadius: 4, padding: "2px 8px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>ADMIN</span>
        </div>
        <div className="admin-tabs" style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTab("dashboard")} className={tab === "dashboard" ? "btn-primary" : "btn-ghost"} style={{ fontSize: 13, padding: "7px 16px" }}>Dashboard</button>
          <button onClick={() => setTab("bookings")} className={tab === "bookings" ? "btn-primary" : "btn-ghost"} style={{ fontSize: 13, padding: "7px 16px" }}>Bookings</button>
          <button onClick={() => setTab("arenas")} className={tab === "arenas" ? "btn-primary" : "btn-ghost"} style={{ fontSize: 13, padding: "7px 16px" }}>Arenas</button>
        </div>
        <Link href="/" className="nav-pill">Customer View →</Link>
      </nav>

      <div className="admin-wrap">
        {/* Health Strip */}
        <div className="glass health-strip" style={{ padding: "12px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 24, background: "var(--surface-2)" }}>
          {[
            { label: `Database: ${dbStatus}`, up: dbStatus === "UP" },
            { label: `API Gateway: ${apiStatus}`, up: apiStatus === "UP" },
            { label: `Temporal Worker: ${temporalUp ? "ACTIVE" : "UNKNOWN"}`, up: temporalUp },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.up ? "var(--accent)" : "#f87171", boxShadow: `0 0 8px ${s.up ? "var(--accent)" : "#f87171"}` }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── DASHBOARD TAB ── */}
        {tab === "dashboard" && (
          <>
            <div className="stat-grid" style={{ marginBottom: 24 }}>
              {[
                { label: "Total Arenas",   val: dashboard?.totalArenas   ?? "—", color: "var(--text)" },
                { label: "Active Arenas",  val: dashboard?.activeArenas  ?? "—", color: "var(--accent)" },
                { label: "Total Bookings", val: dashboard?.totalBookings ?? "—", color: "var(--text)" },
                { label: "Confirmed",      val: dashboard?.byStatus?.CONFIRMED ?? 0, color: "var(--accent)" },
              ].map(s => (
                <div key={s.label} className="stat-card glass">
                  <p className="stat-lbl">{s.label}</p>
                  <p className="stat-val" style={{ color: s.color }}>{s.val}</p>
                </div>
              ))}
            </div>

            <div className="admin-chart-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {[
                { title: "Bookings by Sport",    data: dashboard?.bySport    ?? {} },
                { title: "Bookings by Location", data: dashboard?.byLocation ?? {} },
                { title: "Bookings by Arena",    data: dashboard?.byArena    ?? {} },
                { title: "Bookings by Status",   data: dashboard?.byStatus   ?? {} },
              ].map(card => {
                const entries = Object.entries(card.data).sort((a, b) => Number(b[1]) - Number(a[1]));
                const max = entries.length ? Math.max(...entries.map(([, v]) => Number(v))) : 1;
                return (
                  <div key={card.title} className="glass" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".06em" }}>{card.title}</h3>
                    {entries.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--muted)" }}>No data</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {entries.slice(0, 8).map(([k, v]) => (
                          <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                              <span style={{ color: "var(--muted)" }}>{k}</span>
                              <span style={{ color: "#fff", fontWeight: 700 }}>{Number(v)}</span>
                            </div>
                            <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(Number(v) / max) * 100}%`, background: "var(--accent)" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── BOOKINGS TAB ── */}
        {tab === "bookings" && (
          <>
            <div className="stat-grid" style={{ marginBottom: 24 }}>
              {[
                { label: "Total Bookings", val: bookings.length, color: "var(--text)" },
                { label: "Confirmed", val: confirmed, color: "var(--accent)" },
                { label: "Pending", val: pending, color: "var(--amber)" },
                { label: "Failed / Cancelled", val: failed, color: "#f87171" },
              ].map(s => (
                <div key={s.label} className="stat-card glass">
                  <p className="stat-lbl">{s.label}</p>
                  <p className="stat-val" style={{ color: s.color }}>{s.val}</p>
                </div>
              ))}
            </div>

            <div className="tbl-wrap">
              <div className="tbl-head">
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>All Bookings ({allBookings.length})</h2>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>Auto-refreshes every 5s</p>
                </div>
                <button onClick={() => refetch()} className="nav-pill" disabled={bookingsLoading}>
                  {bookingsLoading ? "Refreshing…" : "🔄 Refresh Now"}
                </button>
              </div>
              {allBookings.length === 0 ? (
                <div style={{ padding: 56, textAlign: "center" }}>
                  <div style={{ fontSize: 34, marginBottom: 12 }}>📋</div>
                  <p style={{ fontWeight: 600, color: "#fff", marginBottom: 6 }}>No bookings yet</p>
                  <Link href="/" style={{ color: "var(--accent)", fontSize: 13 }}>Make your first booking →</Link>
                </div>
              ) : (
                <table>
                  <thead><tr><th>Booking ID</th><th>Arena</th><th>Customer</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {allBookings.map(b => {
                      const startParts = b.startTime.replace("T", " ").split(/[- :]/);
                      const startLocal = new Date(
                        +startParts[0], +startParts[1] - 1, +startParts[2],
                        +startParts[3], +startParts[4], +(startParts[5] || 0)
                      );
                      const timeStr = startLocal.toLocaleString("en-IN", { 
                        dateStyle: "medium", 
                        timeStyle: "short",
                        hour12: true 
                      });

                      return (
                        <tr key={b.id}>
                          <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>
                            {b.id.substring(0, 8)}
                          </td>
                          <td style={{ fontWeight: 600, color: "#fff" }}>{b.arena?.name ?? "—"}</td>
                          <td style={{ color: "var(--muted)" }}>{b.userEmail}</td>
                          <td style={{ color: "var(--muted)", fontSize: 13 }}>{timeStr}</td>
                          <td><span className={badgeClass(b.status)}>{b.status}</span></td>
                          <td>
                            {(b.status === "CONFIRMED" || b.status === "PENDING") && (
                              <button
                                onClick={() => { if (confirm("Cancel this booking?")) cancelBooking.mutate(b.id); }}
                                style={{ fontSize: 11, padding: "4px 10px", background: "rgba(239,68,68,.15)", color: "#f87171", border: "1px solid rgba(239,68,68,.3)", borderRadius: 4, cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── ARENAS TAB ── */}
        {tab === "arenas" && (
          <div className="tbl-wrap">
            <div className="tbl-head">
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Arenas ({arenas.length})</h2>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>Manage all play arenas</p>
              </div>
              <button onClick={() => { if (showForm) cancelEdit(); else setShowForm(true); }} className="btn-primary" style={{ fontSize: 13, padding: "8px 18px" }}>
                {showForm ? "✕ Cancel" : "+ Add Arena"}
              </button>
            </div>

            {showForm && (
              <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>{editingId ? "Edit Arena" : "New Arena"}</h3>
                <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Name *", key: "name", placeholder: "e.g. Koramangala Football Turf" },
                    { label: "Location *", key: "location", placeholder: "e.g. Let's Play, Koramangala, Bangalore" },
                    { label: "Price per Hour (₹) *", key: "pricePerHour", placeholder: "e.g. 800", type: "number" },
                    { label: "Image URL", key: "imageUrl", placeholder: "https://images.unsplash.com/..." },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input
                        type={f.type || "text"}
                        placeholder={f.placeholder}
                        value={(form as Record<string, string>)[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, color: "#fff", fontSize: 13, outline: "none" }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Sport *</label>
                    <select
                      value={form.sportType}
                      onChange={e => setForm(p => ({ ...p, sportType: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, color: "#fff", fontSize: 13, outline: "none" }}
                    >
                      {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-actions" style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button onClick={handleSubmit} disabled={createArena.isPending || updateArena.isPending} className="btn-primary" style={{ padding: "10px 24px" }}>
                    {editingId
                      ? (updateArena.isPending ? "Saving…" : "Save Changes")
                      : (createArena.isPending  ? "Creating…" : "Create Arena")}
                  </button>
                  {editingId && (
                    <button onClick={cancelEdit} className="btn-ghost" style={{ padding: "10px 18px", fontSize: 13 }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {arenasLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading arenas…</div>
            ) : (
              <table>
                <thead><tr><th>Name</th><th>Location</th><th>Sport</th><th>Price/hr</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {arenas.map(a => {
                    const isActive = a.active !== false;
                    return (
                      <tr key={a.id} style={{ opacity: isActive ? 1 : 0.55 }}>
                        <td style={{ fontWeight: 600, color: "#fff" }}>{a.name}</td>
                        <td style={{ color: "var(--muted)", fontSize: 13 }}>{a.location}</td>
                        <td><span className="sport-tag">{a.sportType}</span></td>
                        <td style={{ color: "var(--accent)", fontWeight: 600 }}>₹{a.pricePerHour}/hr</td>
                        <td>
                          <span className={isActive ? "badge badge-ok" : "badge badge-err"}>
                            {isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions" style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => toggleActive.mutate({ a, active: !isActive })}
                              disabled={toggleActive.isPending}
                              style={{ fontSize: 11, padding: "4px 10px", background: isActive ? "rgba(245,158,11,.15)" : "rgba(34,197,94,.15)", color: isActive ? "var(--amber)" : "#22c55e", border: `1px solid ${isActive ? "rgba(245,158,11,.3)" : "rgba(34,197,94,.3)"}`, borderRadius: 4, cursor: "pointer" }}
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => startEdit(a)}
                              style={{ fontSize: 11, padding: "4px 10px", background: "rgba(0,180,216,.15)", color: "var(--accent)", border: "1px solid rgba(0,180,216,.3)", borderRadius: 4, cursor: "pointer" }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { if (confirm(`Delete "${a.name}"?`)) deleteArena.mutate(a.id); }}
                              style={{ fontSize: 11, padding: "4px 10px", background: "rgba(239,68,68,.15)", color: "#f87171", border: "1px solid rgba(239,68,68,.3)", borderRadius: 4, cursor: "pointer" }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
