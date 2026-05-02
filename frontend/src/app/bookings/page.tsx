"use client";
import { Booking } from "@/components/types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";

export default function MyBookingsPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const { data: bookings = [], isLoading, refetch } = useQuery<Booking[]>({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const r = await authFetch(`${API}/api/bookings/my`);
      if (!r.ok) throw new Error("Failed to fetch bookings");
      return r.json();
    },
    enabled: !!user,
  });

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const r = await authFetch(`${API}/api/bookings/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to cancel");
      toast.success("Booking cancelled");
      refetch();
    } catch (e: unknown) {
      toast.error("Failed to cancel booking");
    }
  };

  const badgeClass = (s: string) => s === "CONFIRMED" ? "badge badge-ok" : s === "PENDING" ? "badge badge-warn" : "badge badge-err";
  const badgeIcon  = (s: string) => s === "CONFIRMED" ? "✓ " : s === "PENDING" ? "⏳ " : "✕ ";

  if (loading) return <div className="page-bg" style={{ padding: 50, textAlign: 'center' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div className="page-bg" style={{ minHeight: "calc(100vh - 64px)", padding: "40px 28px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        
        <div style={{ marginBottom: 32 }}>
          <h1 className="section-heading" style={{ fontSize: 32, marginBottom: 8 }}>My Bookings</h1>
          <p style={{ color: "var(--muted)" }}>View and manage your sports arena reservations.</p>
        </div>

        {isLoading ? (
          <p style={{ color: "var(--muted)" }}>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <div className="glass" style={{ padding: "56px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 38, marginBottom: 14 }}>📋</div>
            <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 7, color: "#fff" }}>No bookings yet</p>
            <p style={{ fontSize: 13.5, color: "var(--muted)" }}>You haven't made any reservations.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {bookings.map(b => {
              // Backend sends LocalDateTime without timezone — parse as-is
              const startParts = b.startTime.replace("T", " ").split(/[- :]/);
              const startLocal = new Date(
                +startParts[0], +startParts[1] - 1, +startParts[2],
                +startParts[3], +startParts[4], +(startParts[5] || 0)
              );
              const endParts = b.endTime.replace("T", " ").split(/[- :]/);
              const endLocal = new Date(
                +endParts[0], +endParts[1] - 1, +endParts[2],
                +endParts[3], +endParts[4], +(endParts[5] || 0)
              );
              const dateFmt = startLocal.toLocaleDateString("en-IN", { dateStyle: "medium" });
              const startTimeFmt = startLocal.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
              const endTimeFmt = endLocal.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

              return (
                <div key={b.id} className="glass booking-list-card" style={{ padding: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{b.arena?.name || "Unknown Arena"}</h3>
                    <div className="booking-meta" style={{ fontSize: 13, color: "var(--muted)", display: "flex", gap: 18, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>📅 {dateFmt}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>⏰ {startTimeFmt} – {endTimeFmt}</span>
                      {b.arena?.sportType && (
                        <span className="sport-tag" style={{ fontSize: 11 }}>{b.arena.sportType}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="booking-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className={badgeClass(b.status)}>{badgeIcon(b.status)}{b.status}</span>
                    {b.status === "PENDING" && (
                      <button 
                        onClick={() => handleCancel(b.id)}
                        className="btn-ghost"
                        style={{ padding: "6px 12px", fontSize: 12, borderColor: "#ef4444", color: "#ef4444" }}
                      >
                        Cancel
                      </button>
                    )}
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
