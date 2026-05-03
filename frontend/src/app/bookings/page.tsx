"use client";
import { Booking } from "@/components/types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";

function parseLocal(dt: string): Date {
  const p = dt.replace("T", " ").split(/[- :]/);
  return new Date(+p[0], +p[1] - 1, +p[2], +p[3], +p[4], +(p[5] || 0));
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { dateStyle: "medium" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

type Tab = "upcoming" | "past";

const SPORT_ICONS: Record<string, string> = {
  Football: "⚽", Basketball: "🏀", Badminton: "🏸", Tennis: "🎾",
  Cricket: "🏏", Swimming: "🏊", Squash: "🎯", Volleyball: "🏐",
  "Table Tennis": "🏓", Kabaddi: "🤼",
};

export default function MyBookingsPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const { data: bookings = [], isLoading, refetch } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: async () => {
      const r = await authFetch(`${API}/api/bookings/my`);
      if (!r.ok) throw new Error("Failed to fetch bookings");
      return r.json();
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      const r = await authFetch(`${API}/api/bookings/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.success("Booking cancelled");
      refetch();
    } catch {
      toast.error("Failed to cancel booking");
    }
  };

  if (loading) return <div className="page-bg" style={{ padding: 50, textAlign: "center" }}>Loading...</div>;
  if (!user) return null;

  const now = new Date();

  const pending  = bookings.filter(b => b.status === "PENDING");
  const upcoming = bookings.filter(b => b.status === "CONFIRMED" && parseLocal(b.startTime) > now);
  const past     = bookings.filter(b =>
    (b.status === "CONFIRMED" && parseLocal(b.startTime) <= now) ||
    b.status === "CANCELLED" ||
    b.status === "FAILED"
  );

  const displayed = activeTab === "upcoming" ? upcoming : past;

  return (
    <div className="page-bg" style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", marginBottom: 6 }}>My Bookings</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>View and manage your sports arena reservations.</p>
        </div>

        {/* Pending warning banner */}
        {pending.length > 0 && (
          <div style={{
            background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
            borderRadius: 14, padding: "14px 18px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fbbf24", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                {pending.length} booking{pending.length > 1 ? "s" : ""} awaiting payment
              </p>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>
                These holds expire in 2 minutes. Complete payment on the booking page.
              </p>
            </div>
            {pending.length === 1 && (
              <Link
                href={`/book?id=${pending[0].arena?.id}`}
                style={{
                  background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.4)",
                  color: "#fbbf24", padding: "8px 14px", borderRadius: 8, fontSize: 12,
                  fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap"
                }}
              >
                Complete →
              </Link>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14,
          padding: 5, marginBottom: 24
        }}>
          {([
            { key: "upcoming", label: "Upcoming", icon: "📅", count: upcoming.length },
            { key: "past",     label: "Past",     icon: "🕐", count: past.length },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 14, transition: "all 0.2s",
                background: activeTab === t.key ? "rgba(129,140,248,0.15)" : "transparent",
                color: activeTab === t.key ? "#c7d2fe" : "var(--muted)",
                borderBottom: activeTab === t.key ? "2px solid #818cf8" : "2px solid transparent",
              }}
            >
              {t.icon} {t.label}
              {t.count > 0 && (
                <span style={{
                  marginLeft: 8, background: activeTab === t.key ? "#818cf8" : "rgba(255,255,255,0.1)",
                  color: activeTab === t.key ? "#fff" : "var(--muted)",
                  borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 800
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>Loading bookings…</div>
        ) : displayed.length === 0 ? (
          <div className="glass" style={{ padding: "56px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {activeTab === "upcoming" ? "📅" : "🕐"}
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              {activeTab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>
              {activeTab === "upcoming"
                ? "You have no confirmed future reservations."
                : "Your completed and cancelled bookings will appear here."}
            </p>
            {activeTab === "upcoming" && (
              <Link href="/venues" className="btn-primary" style={{ padding: "12px 28px", borderRadius: 12 }}>
                Browse Venues →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {displayed
              .sort((a, b) => {
                const diff = parseLocal(a.startTime).getTime() - parseLocal(b.startTime).getTime();
                return activeTab === "upcoming" ? diff : -diff;
              })
              .map(b => {
                const start = parseLocal(b.startTime);
                const end   = parseLocal(b.endTime);
                const isPast = b.status === "CONFIRMED" && start <= now;
                const isCancelled = b.status === "CANCELLED" || b.status === "FAILED";
                const sportIcon = SPORT_ICONS[b.arena?.sportType || ""] || "🏟️";

                const statusColor =
                  b.status === "CONFIRMED" && !isPast ? "#4ade80" :
                  b.status === "CONFIRMED" && isPast  ? "#60a5fa" :
                  b.status === "CANCELLED"            ? "#f87171" :
                  "#f87171";

                const statusLabel =
                  b.status === "CONFIRMED" && !isPast ? "Confirmed" :
                  b.status === "CONFIRMED" && isPast  ? "Completed" :
                  b.status === "CANCELLED"            ? "Cancelled" :
                  "Failed";

                return (
                  <div
                    key={b.id}
                    className="glass"
                    style={{
                      padding: "20px 22px",
                      borderRadius: 16,
                      opacity: isCancelled ? 0.65 : 1,
                      borderLeft: `3px solid ${statusColor}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                      {/* Left: info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 22 }}>{sportIcon}</span>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>
                              {b.arena?.name || "Unknown Arena"}
                            </h3>
                            {b.arena?.location && (
                              <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, marginTop: 1 }}>
                                📍 {b.arena.location}
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--muted)" }}>
                          <span>📅 {fmtDate(start)}</span>
                          <span>⏰ {fmtTime(start)} – {fmtTime(end)}</span>
                          {b.arena?.sportType && (
                            <span style={{
                              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 6, padding: "1px 8px", fontSize: 11, color: "#e5e7eb"
                            }}>
                              {b.arena.sportType}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: status + action */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
                        <span style={{
                          background: `${statusColor}18`,
                          color: statusColor,
                          border: `1px solid ${statusColor}40`,
                          borderRadius: 20, padding: "4px 12px",
                          fontSize: 12, fontWeight: 700
                        }}>
                          {statusLabel}
                        </span>
                        {b.status === "CONFIRMED" && !isPast && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            style={{
                              background: "transparent", border: "1px solid rgba(248,113,113,0.3)",
                              color: "#f87171", padding: "5px 12px", borderRadius: 8,
                              fontSize: 12, fontWeight: 600, cursor: "pointer"
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

      </div>
    </div>
  );
}
