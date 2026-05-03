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

const MORNING_HOURS   = [5, 6, 7, 8, 9, 10, 11];
const AFTERNOON_HOURS = [12, 13, 14, 15, 16];
const EVENING_HOURS   = [17, 18, 19, 20, 21, 22, 23];

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
    <Suspense fallback={<div className="page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}><div className="loader" /></div>}>
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

  useEffect(() => {
    if (!arenaIdFromQuery) { setArena("not-found"); return; }
    (async () => {
      try {
        const r = await fetch(`${API}/api/arenas/${arenaIdFromQuery}`);
        if (!r.ok) { setArena("not-found"); return; }
        setArena(await r.json());
      } catch { setArena("not-found"); }
    })();
  }, [arenaIdFromQuery]);

  const loadSlots = useCallback(async () => {
    if (!arenaIdFromQuery) return;
    setSlotsLoading(true);
    try {
      const r = await fetch(`${API}/api/arenas/${arenaIdFromQuery}/slots?date=${selectedDate}`);
      const d = await r.json();
      const bh = d.bookedHours;
      setBookedHours(Array.isArray(bh) ? bh : Object.values(bh ?? {}));
    } catch {
      setBookedHours([]);
    } finally {
      setSlotsLoading(false);
      setSelectedHour(null);
    }
  }, [arenaIdFromQuery, selectedDate]);

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
      if (!r.ok) throw new Error("Hold failed");
      const d = await r.json();
      setBookingId(d.id);
      setBookedDate(selectedDate);
      setBookedHour(selectedHour);
      setStatus("PAYMENT");
    } catch { setStatus("FAILED"); }
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

  if (arena === "not-found") return (
    <div className="page-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: 16 }}>
      <div style={{ fontSize: 64 }}>🏟️</div>
      <p className="glow-text" style={{ fontWeight: 800, fontSize: 24, color: "#fff" }}>Arena not found</p>
      <Link href="/" className="btn-primary" style={{ padding: "12px 24px" }}>← Back to all arenas</Link>
    </div>
  );

  if (!arena) return (
    <div className="page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <div className="loader" />
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
    <div className="page-bg" style={{ paddingBottom: 100 }}>
      <div className="book-layout-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* Main Content Column */}
        <div style={{ minWidth: 0 }}>
          
          <div className="premium-glass" style={{ padding: 28, marginBottom: 20, position: "relative", overflow: "hidden", borderRadius: 24 }}>
             <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.05, pointerEvents: "none" }}>{cfg.icon}</div>
             <div style={{ display: "flex", gap: 24, alignItems: "center", position: "relative" }}>
                <div style={{ background: cfg.bg, width: 80, height: 80, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, border: `1px solid ${cfg.color}33`, boxShadow: `0 0 20px ${cfg.color}22` }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6, display: "block" }}>{arena.sportType} Arena</span>
                  <h1 className="glow-text" style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: "-0.5px" }}>{arena.name}</h1>
                  <p style={{ fontSize: 14, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ opacity: 0.6 }}>📍</span> {arena.location}
                  </p>
                </div>
             </div>
          </div>

          {(status === "IDLE" || status === "BOOKING") && (
            <>
              <div className="premium-glass" style={{ padding: 28, marginBottom: 20, borderRadius: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>1. Pick a Date</h2>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Availability for 4 weeks</span>
                </div>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
                  {dates.map((d) => {
                    const iso = fmtDate(d);
                    const isSelected = iso === selectedDate;
                    return (
                      <button
                        key={iso}
                        onClick={() => setSelectedDate(iso)}
                        className={`date-chip-premium ${isSelected ? "active" : ""}`}
                      >
                        <span style={{ fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                        <span style={{ fontSize: 20, fontWeight: 800 }}>{d.getDate()}</span>
                        <span style={{ fontSize: 10 }}>{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="premium-glass" style={{ padding: 28, marginBottom: 20, borderRadius: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>2. Select Time</h2>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} /> Available
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} /> Booked
                    </div>
                  </div>
                </div>

                <div className="premium-tab-bar" style={{ marginBottom: 24 }}>
                  {(["morning", "afternoon", "evening"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`premium-tab ${activeTab === t ? "active" : ""}`}
                    >
                      {t === "morning" ? "🌅 Morning" : t === "afternoon" ? "☀️ Afternoon" : "🌙 Evening"}
                    </button>
                  ))}
                </div>

                {slotsLoading ? (
                  <div style={{ padding: 40, textAlign: "center" }}><div className="loader" style={{ margin: "0 auto" }} /></div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 14 }}>
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
                          style={{ borderColor: isSelected ? cfg.color : "rgba(255,255,255,0.08)" }}
                        >
                          <span style={{ fontSize: 15, fontWeight: 800 }}>{fmtHour(h)}</span>
                          <span style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
                            {isBooked ? "Reserved" : isPast ? "Elapsed" : "Available"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {(status === "SUCCESS" || status === "FAILED") && (
            <div className="premium-glass" style={{ padding: 60, textAlign: "center", borderRadius: 32 }}>
               {status === "SUCCESS" ? (
                 <div style={{ animation: "fadeIn 0.5s ease" }}>
                    <div style={{ fontSize: 80, marginBottom: 24 }}>✨</div>
                    <h2 className="glow-text" style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Booking Confirmed!</h2>
                    <p style={{ fontSize: 16, color: "var(--muted)", marginBottom: 40, maxWidth: 400, marginInline: "auto" }}>
                      Get ready! You&apos;re booked for <span style={{ color: "#fff", fontWeight: 700 }}>{bookedDate}</span> at <span style={{ color: "#fff", fontWeight: 700 }}>{bookedHour !== null ? fmtHour(bookedHour) : ""}</span>.
                    </p>
                    <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                      <Link href="/bookings" className="btn-primary" style={{ padding: "16px 32px", borderRadius: 16 }}>Manage Bookings</Link>
                      <Link href="/venues" className="btn-ghost" style={{ padding: "16px 32px", borderRadius: 16 }}>Explore More</Link>
                    </div>
                 </div>
               ) : (
                 <div style={{ animation: "fadeIn 0.5s ease" }}>
                    <div style={{ fontSize: 80, marginBottom: 24 }}>⚠️</div>
                    <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Hold Expired</h2>
                    <p style={{ fontSize: 16, color: "var(--muted)", marginBottom: 40 }}>The temporary hold on this slot has been released. Please try again.</p>
                    <button onClick={() => setStatus("IDLE")} className="btn-primary" style={{ padding: "16px 32px", borderRadius: 16, background: "#ef4444" }}>Try Again</button>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Sticky Sidebar Column */}
        {status !== "SUCCESS" && status !== "FAILED" && (
          <div className="sticky-sidebar">
            <div className="premium-glass" style={{ padding: 32, borderRadius: 24, position: "sticky", top: 88 }}>
              {status === "IDLE" || status === "BOOKING" ? (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 24, letterSpacing: "-0.5px" }}>Reservation</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                       <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>Date</span>
                       <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{selectedDate}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                       <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>Time Slot</span>
                       <span style={{ color: selectedHour !== null ? cfg.color : "var(--muted)", fontWeight: 800, fontSize: 14 }}>
                         {selectedHour !== null ? fmtHour(selectedHour) : "Not Selected"}
                       </span>
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                       <span style={{ color: "var(--muted)" }}>Base Price</span>
                       <span style={{ color: "#fff", fontWeight: 700 }}>{fmt(arena.pricePerHour)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                       <span style={{ color: "var(--muted)" }}>Service Tax</span>
                       <span style={{ color: "#fff", fontWeight: 700 }}>{fmt(tax)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                       <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Total</span>
                       <span style={{ fontSize: 28, fontWeight: 900, color: cfg.color }}>{fmt(total)}</span>
                    </div>
                  </div>
                  
                  <button 
                    disabled={selectedHour === null || status === "BOOKING"}
                    onClick={hold}
                    className="btn-pay-now"
                    style={{
                      background: selectedHour === null ? "rgba(255,255,255,0.04)" : cfg.color,
                      color: selectedHour === null ? "rgba(255,255,255,0.2)" : "#000",
                      marginTop: 32, borderRadius: 16, padding: 20, fontSize: 16, fontWeight: 800, border: "none"
                    }}
                  >
                    {status === "BOOKING" ? "Processing..." : (user ? "Confirm & Pay Now" : "Sign In to Book")}
                  </button>
                  
                  {selectedHour === null && (
                    <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: 14, opacity: 0.6 }}>
                      Select a time slot to continue
                    </p>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                   <div className="countdown-ring" style={{ borderColor: cfg.color, color: cfg.color, width: 100, height: 100, fontSize: 28 }}>
                     {mm}:{ss}
                   </div>
                   <h3 className="glow-text" style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginTop: 20 }}>Complete Payment</h3>
                   <p style={{ fontSize: 13, color: "var(--muted)", margin: "16px 0 32px", lineHeight: 1.5 }}>
                     Your slot is held. Finalize the transaction to secure your spot!
                   </p>
                   <div style={{ display: "flex", gap: 12 }}>
                     <button onClick={() => pay(true)} className="btn-ok" style={{ flex: 1.5, padding: 16, borderRadius: 12 }}>Pay Now</button>
                     <button onClick={() => pay(false)} style={{ flex: 1, padding: 16, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--muted)", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Cancel</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
