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

// Grouping hours for tabs
const MORNING_HOURS   = Array.from({ length: 7 }, (_, i) => i + 5);  // 5 AM - 11 AM
const AFTERNOON_HOURS = Array.from({ length: 5 }, (_, i) => i + 12); // 12 PM - 4 PM
const EVENING_HOURS   = Array.from({ length: 7 }, (_, i) => i + 17); // 5 PM - 11 PM

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
  const [activeTab,    setActiveTab]    = useState<"morning" | "afternoon" | "evening">("morning");
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
      const bh = d.bookedHours;
      setBookedHours(Array.isArray(bh) ? bh : Object.values(bh ?? {}));
    } catch {
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

  const currentHours = activeTab === "morning" ? MORNING_HOURS : activeTab === "afternoon" ? AFTERNOON_HOURS : EVENING_HOURS;

  return (
    <div className="page-bg">
      <div className="book-layout-container">
        
        {/* Left Column: Details & Slots */}
        <div className="book-main-col">
          
          {/* Header Card */}
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
          </div>

          {(status === "IDLE" || status === "BOOKING") && (
            <>
              {/* Date Selector */}
              <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Select Date</h2>
                <div className="date-strip">
                  {dates.map((d) => {
                    const iso = fmtDate(d);
                    const isSelected = iso === selectedDate;
                    return (
                      <button
                        key={iso}
                        onClick={() => setSelectedDate(iso)}
                        className={`date-chip ${isSelected ? "date-chip-active" : ""}`}
                        style={{ background: isSelected ? cfg.color : "var(--surface)", border: isSelected ? `1px solid ${cfg.color}` : "1px solid var(--border)" }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", opacity: isSelected ? 1 : 0.6 }}>{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                        <span style={{ fontSize: 18, fontWeight: 800 }}>{d.getDate()}</span>
                        <span style={{ fontSize: 10, opacity: isSelected ? 1 : 0.6 }}>{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Tabbed Selector */}
              <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Select Time Slot</h2>
                
                {/* Tabs */}
                <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.03)", padding: 4, borderRadius: 12, marginBottom: 20 }}>
                  <button onClick={() => setActiveTab("morning")} className={`tab-btn ${activeTab === "morning" ? "active" : ""}`}>🌅 Morning</button>
                  <button onClick={() => setActiveTab("afternoon")} className={`tab-btn ${activeTab === "afternoon" ? "active" : ""}`}>☀️ Afternoon</button>
                  <button onClick={() => setActiveTab("evening")} className={`tab-btn ${activeTab === "evening" ? "active" : ""}`}>🌙 Evening</button>
                </div>

                {slotsLoading ? (
                  <div className="slots-placeholder">Loading availability...</div>
                ) : (
                  <div className="slot-grid-optimized">
                    {currentHours.map((h) => {
                      const isBooked = bookedHours.includes(h);
                      const isPast   = isPastHour(h);
                      const isDisabled = isBooked || isPast;
                      const isSelected = selectedHour === h;
                      return (
                        <button
                          key={h}
                          disabled={isDisabled}
                          onClick={() => setSelectedHour(isSelected ? null : h)}
                          className={`slot-btn-premium ${isSelected ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                          style={{ border: isSelected ? `2px solid ${cfg.color}` : "1px solid var(--border)" }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{fmtHour(h)}</span>
                          <span style={{ fontSize: 10, opacity: 0.6 }}>{isBooked ? "Not Available" : isPast ? "Elapsed" : "Available"}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Success / Failure Views (Non-tabbed) */}
          {(status === "SUCCESS" || status === "FAILED") && (
            <div className="glass" style={{ padding: 40, textAlign: "center" }}>
               {status === "SUCCESS" ? (
                 <div style={{ animation: "fadeIn 0.5s ease" }}>
                    <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
                    <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12 }}>All Set!</h2>
                    <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32 }}>Your booking at {arena.name} is confirmed.</p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                      <Link href="/bookings" className="btn-primary" style={{ padding: "14px 28px", borderRadius: 12, background: "#fff", color: "#000" }}>Manage Bookings</Link>
                      <Link href="/venues" className="btn-ghost" style={{ padding: "14px 28px", borderRadius: 12 }}>Browse More</Link>
                    </div>
                 </div>
               ) : (
                 <div>
                    <div style={{ fontSize: 72, marginBottom: 20 }}>❌</div>
                    <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Booking Failed</h2>
                    <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32 }}>The session timed out or payment was declined.</p>
                    <button onClick={resetBooking} className="btn-primary" style={{ padding: "14px 28px", borderRadius: 12, background: "#ef4444" }}>Try Again</button>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Right Column / Sticky Sidebar: Checkout */}
        {status !== "SUCCESS" && status !== "FAILED" && (
          <div className="book-side-col">
            <div className="glass sticky-card" style={{ padding: 24 }}>
              {status === "IDLE" ? (
                <>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Booking Summary</h3>
                  <div className="summary-list">
                    <div className="summary-item"><span>Date</span><strong>{selectedDate}</strong></div>
                    <div className="summary-item"><span>Time</span><strong>{selectedHour !== null ? fmtHour(selectedHour) : "Select a slot"}</strong></div>
                    <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
                    <div className="summary-item"><span>Price</span><strong>{fmt(arena.pricePerHour)}</strong></div>
                    <div className="summary-item"><span>Tax (18%)</span><strong>{fmt(tax)}</strong></div>
                    <div className="summary-item total"><span>Total</span><strong style={{ color: cfg.color }}>{fmt(total)}</strong></div>
                  </div>
                  <button 
                    disabled={selectedHour === null || status === "BOOKING"}
                    onClick={hold}
                    className="btn-pay-now"
                    style={{ background: selectedHour === null ? "var(--surface-2)" : cfg.color, color: selectedHour === null ? "var(--muted)" : "#000" }}
                  >
                    {status === "BOOKING" ? "Processing..." : (user ? "Pay & Confirm" : "Sign In to Book")}
                  </button>
                </>
              ) : status === "PAYMENT" ? (
                <div style={{ textAlign: "center" }}>
                   <div className="countdown-ring">{mm}:{ss}</div>
                   <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 16 }}>Complete Payment</h3>
                   <p style={{ fontSize: 13, color: "var(--muted)", margin: "12px 0 24px" }}>Please confirm the payment of {fmt(total)} before the timer expires.</p>
                   <div style={{ display: "flex", gap: 10 }}>
                     <button onClick={() => pay(true)} className="btn-ok">Confirm</button>
                     <button onClick={() => pay(false)} className="btn-err" style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444" }}>Cancel</button>
                   </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div className="loader" style={{ margin: "0 auto 16px" }} />
                  <p>Securing your slot...</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        .book-layout-container {
          display: flex; gap: 24px; max-width: 1100px; margin: 0 auto; padding: 32px 24px 80px;
        }
        .book-main-col { flex: 1; min-width: 0; }
        .book-side-col { width: 340px; flex-shrink: 0; }
        .sticky-card { position: sticky; top: 88px; }
        
        .tab-btn {
          flex: 1; padding: 10px; border-radius: 10px; border: none; background: transparent;
          color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .tab-btn:hover { color: #fff; }
        .tab-btn.active { background: var(--surface); color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }

        .slot-grid-optimized { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
        .slot-btn-premium {
          display: flex; flex-direction: column; align-items: center; padding: 12px;
          background: rgba(255,255,255,0.03); border-radius: 12px; cursor: pointer; transition: all 0.2s;
        }
        .slot-btn-premium:hover:not(.disabled) { background: rgba(255,255,255,0.08); transform: translateY(-2px); }
        .slot-btn-premium.active { background: #fff !important; color: #000 !important; }
        .slot-btn-premium.disabled { opacity: 0.3; cursor: not-allowed; }

        .summary-list { display: flex; flex-direction: column; gap: 10px; }
        .summary-item { display: flex; justify-content: space-between; font-size: 14px; color: var(--muted); }
        .summary-item strong { color: #fff; }
        .summary-item.total { font-size: 18px; font-weight: 900; margin-top: 8px; }

        .btn-pay-now {
          width: 100%; margin-top: 24px; padding: 16px; border-radius: 12px; border: none;
          font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.3s;
        }
        .btn-pay-now:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }

        .countdown-ring {
          width: 80px; height: 80px; border-radius: 50%; border: 4px solid var(--accent);
          display: flex; align-items: center; justify-content: center; margin: 0 auto;
          font-size: 20px; font-weight: 800; font-family: monospace;
        }

        .slots-placeholder { padding: 40px; text-align: center; color: var(--muted); font-size: 14px; }

        @media (max-width: 960px) {
          .book-layout-container { flex-direction: column; }
          .book-side-col { width: 100%; }
          .sticky-card { position: fixed; bottom: 0; left: 0; right: 0; top: auto; z-index: 1000; border-radius: 20px 20px 0 0; border-top: 1px solid var(--border); box-shadow: 0 -10px 30px rgba(0,0,0,0.5); }
          .summary-list { display: none; }
          .btn-pay-now { margin-top: 0; }
          .book-main-col { padding-bottom: 120px; }
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .loader { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
