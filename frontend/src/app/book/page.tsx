"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { Arena } from "@/components/types";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";
const SC: Record<string, { icon: string; bg: string; color: string }> = {
  Football:   { icon: "⚽", bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  Basketball: { icon: "🏀", bg: "rgba(245,158,11,0.1)",  color: "#f59e0b" },
  Badminton:  { icon: "🏸", bg: "rgba(99,102,241,0.1)",  color: "#6366f1" },
  Tennis:     { icon: "🎾", bg: "rgba(239,68,68,0.1)",   color: "#ef4444" },
  Cricket:    { icon: "🏏", bg: "rgba(59,130,246,0.1)",  color: "#3b82f6" },
  Swimming:   { icon: "🏊", bg: "rgba(6,182,212,0.1)",   color: "#06b6d4" },
  Default:    { icon: "🏟️", bg: "rgba(168,85,247,0.1)",  color: "#a855f7" },
};

type Status = "IDLE" | "BOOKING" | "PAYMENT" | "SUCCESS" | "FAILED";

const ALL_HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 5 AM to 11 PM (23:00)

const getDates = () => Array.from({ length: 28 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i); return d;
});

const fmtDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmtHour = (h: number) =>
  `${h.toString().padStart(2, "0")}:00 – ${(h + 1).toString().padStart(2, "0")}:00`;

export default function BookPageWrapper() {
  return (
    <Suspense fallback={
      <div className="page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)" }}>
        <div className="loader" />
      </div>
    }>
      <BookPage />
    </Suspense>
  );
}

function BookPage() {
  const { user, authFetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const arenaIdFromQuery = searchParams.get("id");

  const [arena,       setArena]       = useState<Arena | null | "not-found">(null);
  const [bookingId,   setBookingId]   = useState<string | null>(null);
  const [status,      setStatus]      = useState<Status>("IDLE");
  const [countdown,   setCountdown]   = useState(120);
  const [bookedDate,  setBookedDate]  = useState<string | null>(null);
  const [bookedHour,  setBookedHour]  = useState<number | null>(null);

  const dates = getDates();
  const queryDate = searchParams.get("date");
  const validDates = dates.map(fmtDate);
  const initialDate = queryDate && validDates.includes(queryDate) ? queryDate : fmtDate(dates[0]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [available,    setAvailable]    = useState<number[]>([]);
  const [bookedHours,  setBookedHours]  = useState<number[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [arenaId,      setArenaId]      = useState<string>(arenaIdFromQuery ?? "");

  useEffect(() => {
    if (!arenaIdFromQuery) { setArena("not-found"); return; }
    setArenaId(arenaIdFromQuery);
    (async () => {
      const r = await fetch(`${API}/api/arenas/${arenaIdFromQuery}`);
      if (!r.ok) { setArena("not-found"); return; }
      setArena(await r.json());
    })();
  }, [arenaIdFromQuery]);

  const loadSlots = useCallback(async () => {
    if (!arenaId) return;
    setSlotsLoading(true);
    try {
      const r = await fetch(`${API}/api/arenas/${arenaId}/slots?date=${selectedDate}`);
      const d = await r.json();
      setAvailable(d.availableHours ?? []);
      const bh = d.bookedHours;
      setBookedHours(Array.isArray(bh) ? bh : Object.values(bh ?? {}));
    } catch {
      setAvailable([]);
      setBookedHours([]);
    } finally {
      setSlotsLoading(false);
      setSelectedHour(null);
    }
  }, [arenaId, selectedDate]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  useEffect(() => {
    if (status !== "PAYMENT") return;
    setCountdown(120);
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); setStatus("FAILED"); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [status]);

  const hold = async () => {
    if (!arena || arena === "not-found" || selectedHour === null) return;
    if (!user) { router.push("/login"); return; }
    setStatus("BOOKING");

    const pad = (n: number) => n.toString().padStart(2, "0");
    const localStart = `${selectedDate}T${pad(selectedHour)}:00:00`;
    const localEnd   = `${selectedDate}T${pad(selectedHour + 1)}:00:00`;

    try {
      const r = await authFetch(`${API}/api/bookings`, {
        method: "POST",
        body: JSON.stringify({
          arenaId:   arena.id,
          startTime: localStart,
          endTime:   localEnd,
        }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      const d = await r.json();
      setBookingId(d.id);
      setBookedDate(selectedDate);
      setBookedHour(selectedHour);
      setStatus("PAYMENT");
    } catch (e: unknown) {
      console.error(e);
      setStatus("FAILED");
    }
  };

  const pay = async (ok: boolean) => {
    try {
      await authFetch(`${API}/api/bookings/${bookingId}/payment?success=${ok}`, { method: "POST" });
      setStatus(ok ? "SUCCESS" : "FAILED");
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        loadSlots();
      }
    } catch { setStatus("FAILED"); }
  };

  const resetBooking = () => {
    setStatus("IDLE");
    setBookingId(null);
    setBookedDate(null);
    setBookedHour(null);
    loadSlots();
  };

  if (arena === "not-found") return (
    <div className="page-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", gap: 16 }}>
      <div style={{ fontSize: 64 }}>🏟️</div>
      <p style={{ fontWeight: 800, fontSize: 24, color: "#fff" }}>Arena not found</p>
      <Link href="/" className="btn-primary" style={{ padding: "12px 24px" }}>← Back to all arenas</Link>
    </div>
  );

  if (!arena) return (
    <div className="page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)" }}>
      <p style={{ color: "var(--muted)", fontWeight: 500 }}>Fetching arena details...</p>
    </div>
  );

  const cfg   = SC[arena.sportType] ?? SC.Default;
  const tax   = Math.round(arena.pricePerHour * 0.18);
  const total = arena.pricePerHour + tax;
  const fmt   = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const mm    = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss    = String(countdown % 60).padStart(2, "0");

  const now = new Date();
  const isToday = selectedDate === fmtDate(now);
  const currentHour = now.getHours();
  const isPastHour = (h: number) => isToday && h <= currentHour;

  return (
    <div className="page-bg">
      <div className="book-wrap" style={{ maxWidth: 640 }}>
        
        {/* Modern Header Section */}
        <div className="glass" style={{ padding: 28, marginBottom: 20, overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.05, pointerEvents: "none" }}>{cfg.icon}</div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", position: "relative" }}>
            <div style={{ background: cfg.bg, width: 72, height: 72, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, border: `1px solid ${cfg.color}33` }}>
              {cfg.icon}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "block" }}>{arena.sportType} Venue</span>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{arena.name}</h1>
              <p style={{ fontSize: 14, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: cfg.color }}>📍</span> {arena.location}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Price</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{fmt(arena.pricePerHour)}<span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}> / hr</span></p>
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Status</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>Available</p>
            </div>
          </div>
        </div>

        {/* Slot selection logic container */}
        {(status === "IDLE" || status === "BOOKING") && (
          <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Schedule Your Session</h2>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Select a date and time that works for you.</p>
              </div>
            </div>

            {/* Date Selection Strip */}
            <div className="date-strip" style={{ marginBottom: 24 }}>
              {dates.map((d, i) => {
                const iso = fmtDate(d);
                const isSelected = iso === selectedDate;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    className={`date-chip ${isSelected ? "date-chip-active" : ""}`}
                    style={{ transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", animation: `fadeIn 0.3s ease forwards ${i * 0.02}s` }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", opacity: isSelected ? 1 : 0.6 }}>
                      {d.toLocaleDateString("en-IN", { weekday: "short" })}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 800 }}>{d.getDate()}</span>
                    <span style={{ fontSize: 10, opacity: isSelected ? 1 : 0.6 }}>{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ height: 1, background: "var(--border)", marginBottom: 24 }} />

            {/* Time Slot Selection */}
            <div className="slot-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }}></span> Available Slots
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)" }}></span> Booked
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}></span> Past
                </div>
              </div>
            </div>

            {slotsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 48, background: "rgba(255,255,255,0.03)", borderRadius: 12, animation: "pulse 1.5s infinite" }} />
                ))}
              </div>
            ) : (
              <div className="slot-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                {ALL_HOURS.map((h, i) => {
                  const isBooked = bookedHours.includes(h);
                  const isPast   = isPastHour(h);
                  const isDisabled = isBooked || isPast;
                  const isSelected = selectedHour === h;

                  return (
                    <button
                      key={h}
                      disabled={isDisabled}
                      onClick={() => setSelectedHour(isSelected ? null : h)}
                      className={`slot-btn ${isSelected ? "slot-active" : ""} ${isBooked ? "slot-booked" : ""} ${isPast ? "slot-past" : ""}`}
                      style={{ 
                        padding: "14px", 
                        borderRadius: 12, 
                        fontSize: 14, 
                        fontWeight: isSelected ? 800 : 600,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        animation: `fadeIn 0.3s ease forwards ${i * 0.01}s`,
                        background: isSelected ? cfg.color : (isDisabled ? "" : "rgba(255,255,255,0.03)"),
                        color: isSelected ? "#000" : (isDisabled ? "rgba(255,255,255,0.2)" : "#fff"),
                        border: isSelected ? `1px solid ${cfg.color}` : "1px solid var(--border)"
                      }}
                    >
                      {fmtHour(h)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Checkout / Summary Section */}
        <div className="glass" style={{ padding: 28 }}>
          {status === "IDLE" && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Review Order</h3>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Slot will be held for 2 minutes during payment.</p>
              </div>
              
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 14 }}>
                  <span style={{ color: "var(--muted)" }}>Reservation Date</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{selectedDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 14 }}>
                  <span style={{ color: "var(--muted)" }}>Time Slot</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{selectedHour !== null ? fmtHour(selectedHour) : "—"}</span>
                </div>
                <div style={{ height: 1, background: "var(--border)", margin: "14px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: "var(--muted)" }}>Subtotal</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{fmt(arena.pricePerHour)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, fontSize: 14 }}>
                  <span style={{ color: "var(--muted)" }}>GST (18%)</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{fmt(tax)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Total Payable</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: cfg.color }}>{fmt(total)}</span>
                </div>
              </div>

              <button
                id="hold-slot-btn"
                onClick={hold}
                disabled={selectedHour === null}
                className="btn-primary"
                style={{ 
                  width: "100%", 
                  padding: 18, 
                  fontSize: 16, 
                  borderRadius: 14, 
                  background: selectedHour === null ? "rgba(255,255,255,0.05)" : cfg.color,
                  color: selectedHour === null ? "rgba(255,255,255,0.2)" : "#000",
                  border: "none",
                  cursor: selectedHour === null ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                {user ? "Confirm & Proceed to Payment" : "Sign In to Book Now"}
              </button>
            </>
          )}

          {status === "BOOKING" && (
            <div className="result" style={{ padding: "40px 0" }}>
              <div className="loader" style={{ margin: "0 auto 24px" }} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Locking your slot...</h2>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>We're holding this for you. Just a second!</p>
            </div>
          )}

          {status === "PAYMENT" && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <div className={`countdown ${countdown < 30 ? "cd-urgent" : "cd-safe"}`} style={{ fontSize: 32, padding: "12px 24px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid var(--border)" }}>
                  {mm}:{ss}
                </div>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Awaiting Payment</h2>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 32, maxWidth: 360, marginInline: "auto" }}>
                Complete the transaction to finalize your booking for <span style={{ color: "#fff", fontWeight: 700 }}>{bookedDate}</span> at <span style={{ color: "#fff", fontWeight: 700 }}>{bookedHour !== null ? fmtHour(bookedHour) : "—"}</span>.
              </p>
              <div style={{ display: "flex", gap: 14 }}>
                <button id="payment-success-btn" onClick={() => pay(true)} className="btn-ok" style={{ padding: 16, borderRadius: 12 }}>Pay {fmt(total)}</button>
                <button id="payment-fail-btn" onClick={() => pay(false)} className="btn-err" style={{ padding: 16, borderRadius: 12, background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>Cancel</button>
              </div>
            </div>
          )}

          {status === "SUCCESS" && (
            <div className="result" style={{ animation: "fadeIn 0.5s ease" }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12 }}>All Set!</h2>
              <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32 }}>Your booking at {arena.name} is confirmed.</p>
              
              <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: 20, marginBottom: 32, textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: "rgba(16,185,129,0.8)" }}>Date</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{bookedDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "rgba(16,185,129,0.8)" }}>Time</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{bookedHour !== null ? fmtHour(bookedHour) : "—"}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <Link href="/bookings" className="btn-primary" style={{ padding: "14px 28px", borderRadius: 12, background: "#fff", color: "#000" }}>Manage Bookings</Link>
                <Link href="/venues" className="btn-ghost" style={{ padding: "14px 28px", borderRadius: 12 }}>Browse More</Link>
              </div>
            </div>
          )}

          {status === "FAILED" && (
            <div className="result">
              <div style={{ fontSize: 72, marginBottom: 20 }}>❌</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Booking Failed</h2>
              <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32 }}>The session timed out or payment was declined.</p>
              <button onClick={resetBooking} className="btn-primary" style={{ padding: "14px 28px", borderRadius: 12, background: "#ef4444" }}>Try Again</button>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
        .loader {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
