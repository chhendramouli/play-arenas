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
    <Suspense fallback={<div className="page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>Loading...</div>}>
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
      <p style={{ fontWeight: 800, fontSize: 24, color: "#fff" }}>Arena not found</p>
      <Link href="/" className="btn-primary" style={{ padding: "12px 24px" }}>← Back to all arenas</Link>
    </div>
  );

  if (!arena) return (
    <div className="page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
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
    <div className="page-bg" style={{ paddingBottom: 100 }}>
      <div style={{ display: "flex", gap: 24, maxWidth: 1100, margin: "0 auto", padding: "32px 24px", flexWrap: "wrap" }}>
        
        {/* Main Content */}
        <div style={{ flex: "1 1 600px", minWidth: 0 }}>
          
          <div className="glass" style={{ padding: 28, marginBottom: 20, position: "relative", overflow: "hidden" }}>
             <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.05, pointerEvents: "none" }}>{cfg.icon}</div>
             <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <div style={{ background: cfg.bg, width: 72, height: 72, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, border: `1px solid ${cfg.color}33` }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "block" }}>{arena.sportType} Venue</span>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{arena.name}</h1>
                  <p style={{ fontSize: 14, color: "var(--muted)" }}>📍 {arena.location}</p>
                </div>
             </div>
          </div>

          {(status === "IDLE" || status === "BOOKING") && (
            <>
              <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Select Date</h2>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                  {dates.map((d) => {
                    const iso = fmtDate(d);
                    const isSelected = iso === selectedDate;
                    return (
                      <button
                        key={iso}
                        onClick={() => setSelectedDate(iso)}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64, padding: "12px 8px", borderRadius: 12, border: isSelected ? `2px solid ${cfg.color}` : "1px solid var(--border)",
                          background: isSelected ? cfg.bg : "var(--surface)", color: isSelected ? cfg.color : "var(--muted)", cursor: "pointer", transition: "all 0.2s"
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 700 }}>{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                        <span style={{ fontSize: 18, fontWeight: 800 }}>{d.getDate()}</span>
                        <span style={{ fontSize: 10 }}>{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Select Time Slot</h2>
                <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.03)", padding: 4, borderRadius: 12, marginBottom: 20 }}>
                  {(["morning", "afternoon", "evening"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 10, border: "none", background: activeTab === t ? "var(--surface)" : "transparent",
                        color: activeTab === t ? "#fff" : "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer"
                      }}
                    >
                      {t === "morning" ? "🌅 Morning" : t === "afternoon" ? "☀️ Afternoon" : "🌙 Evening"}
                    </button>
                  ))}
                </div>

                {slotsLoading ? <p style={{ textAlign: "center", color: "var(--muted)" }}>Loading slots...</p> : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
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
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", padding: 12, borderRadius: 12, cursor: isDisabled ? "not-allowed" : "pointer",
                            background: isSelected ? cfg.color : (isDisabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)"),
                            color: isSelected ? "#000" : (isDisabled ? "rgba(255,255,255,0.15)" : "#fff"),
                            border: isSelected ? `2px solid ${cfg.color}` : "1px solid var(--border)", transition: "all 0.2s"
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{fmtHour(h)}</span>
                          <span style={{ fontSize: 9, opacity: 0.6 }}>{isBooked ? "Booked" : isPast ? "Elapsed" : "Available"}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {(status === "SUCCESS" || status === "FAILED") && (
            <div className="glass" style={{ padding: 40, textAlign: "center" }}>
               {status === "SUCCESS" ? (
                 <div>
                    <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
                    <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12 }}>All Set!</h2>
                    <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32 }}>Your booking at {arena.name} is confirmed for {bookedDate} at {bookedHour !== null ? fmtHour(bookedHour) : ""}.</p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                      <Link href="/bookings" className="btn-primary" style={{ padding: "12px 24px" }}>Manage Bookings</Link>
                      <Link href="/venues" className="btn-ghost" style={{ padding: "12px 24px" }}>Browse More</Link>
                    </div>
                 </div>
               ) : (
                 <div>
                    <div style={{ fontSize: 72, marginBottom: 20 }}>❌</div>
                    <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Booking Failed</h2>
                    <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32 }}>We couldn't secure this slot. Please try another time.</p>
                    <button onClick={() => setStatus("IDLE")} className="btn-primary" style={{ padding: "12px 24px" }}>Try Again</button>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        {status !== "SUCCESS" && status !== "FAILED" && (
          <div style={{ flex: "1 1 300px", minWidth: 300 }}>
            <div className="glass" style={{ padding: 24, position: "sticky", top: 88 }}>
              {status === "IDLE" || status === "BOOKING" ? (
                <>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Summary</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                       <span style={{ color: "var(--muted)" }}>Date</span>
                       <span style={{ color: "#fff", fontWeight: 700 }}>{selectedDate}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                       <span style={{ color: "var(--muted)" }}>Time</span>
                       <span style={{ color: "#fff", fontWeight: 700 }}>{selectedHour !== null ? fmtHour(selectedHour) : "Select a slot"}</span>
                    </div>
                    <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                       <span style={{ color: "var(--muted)" }}>Amount</span>
                       <span style={{ color: "#fff", fontWeight: 700 }}>{fmt(arena.pricePerHour)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                       <span style={{ color: "var(--muted)" }}>GST (18%)</span>
                       <span style={{ color: "#fff", fontWeight: 700 }}>{fmt(tax)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: cfg.color, marginTop: 8 }}>
                       <span>Total</span>
                       <span>{fmt(total)}</span>
                    </div>
                  </div>
                  <button 
                    disabled={selectedHour === null || status === "BOOKING"}
                    onClick={hold}
                    style={{
                      width: "100%", marginTop: 24, padding: 16, borderRadius: 12, border: "none",
                      background: selectedHour === null ? "var(--surface-2)" : cfg.color, color: selectedHour === null ? "var(--muted)" : "#000",
                      fontSize: 16, fontWeight: 800, cursor: selectedHour === null ? "not-allowed" : "pointer"
                    }}
                  >
                    {status === "BOOKING" ? "Processing..." : (user ? "Confirm & Pay" : "Sign In to Book")}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: "center" }}>
                   <div style={{ width: 80, height: 80, borderRadius: "50%", border: `4px solid ${cfg.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, fontWeight: 900, fontFamily: "monospace", color: cfg.color }}>
                     {mm}:{ss}
                   </div>
                   <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Awaiting Payment</h3>
                   <p style={{ fontSize: 13, color: "var(--muted)", margin: "12px 0 24px" }}>Please complete your payment before the timer expires.</p>
                   <div style={{ display: "flex", gap: 10 }}>
                     <button onClick={() => pay(true)} className="btn-ok" style={{ flex: 1, padding: 12 }}>Pay Now</button>
                     <button onClick={() => pay(false)} style={{ flex: 1, padding: 12, background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
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
