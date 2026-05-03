"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { Arena } from "@/components/types";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";
const SC: Record<string, { icon: string; bg: string }> = {
  Football:   { icon: "⚽", bg: "rgba(16,185,129,.15)" },
  Basketball: { icon: "🏀", bg: "rgba(245,158,11,.15)" },
  Badminton:  { icon: "🏸", bg: "rgba(99,102,241,.15)" },
  Tennis:     { icon: "🎾", bg: "rgba(239,68,68,.15)" },
  Cricket:    { icon: "🏏", bg: "rgba(59,130,246,.15)" },
  Swimming:   { icon: "🏊", bg: "rgba(6,182,212,.15)" },
  Default:    { icon: "🏟️", bg: "rgba(168,85,247,.15)" },
};

type Status = "IDLE" | "BOOKING" | "PAYMENT" | "SUCCESS" | "FAILED";

const ALL_HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

const getDates = () => Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i); return d;
});

// Format date as YYYY-MM-DD using LOCAL date (not UTC) to avoid off-by-one
const fmtDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmtHour = (h: number) =>
  `${h.toString().padStart(2, "0")}:00 – ${(h + 1).toString().padStart(2, "0")}:00`;

// Page wrapper providing the Suspense boundary required for useSearchParams()
// in static-export builds (Next.js 15+).
export default function BookPageWrapper() {
  return (
    <Suspense fallback={
      <div className="page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)" }}>
        <p style={{ color: "var(--muted)" }}>Loading…</p>
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
  // /book?id=<uuid>&date=<yyyy-mm-dd>  (route is no longer dynamic — easier to host statically)
  const arenaIdFromQuery = searchParams.get("id");

  const [arena,       setArena]       = useState<Arena | null | "not-found">(null);
  const [bookingId,   setBookingId]   = useState<string | null>(null);
  const [status,      setStatus]      = useState<Status>("IDLE");
  const [countdown,   setCountdown]   = useState(120);
  // Captured at hold-time so the success card still has them after slots reload (which clears selectedHour)
  const [bookedDate,  setBookedDate]  = useState<string | null>(null);
  const [bookedHour,  setBookedHour]  = useState<number | null>(null);

  const dates = getDates();
  // Honour ?date=YYYY-MM-DD query param if it falls within the next 7 selectable days
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
      // bookedHours comes back as a Set serialised as an array/object — normalise it
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

    // Backend expects LocalDateTime format ("2026-05-03T18:00:00") — send the local
    // wall-clock time directly without UTC conversion. The selected hour is what
    // the user sees, and slot availability is also computed in local time.
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
      if (ok) loadSlots(); // Refresh slots so the booked slot goes grey
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
      <div style={{ fontSize: 48 }}>🏟️</div>
      <p style={{ fontWeight: 700, fontSize: 18 }}>Arena not found</p>
      <Link href="/" className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>← Back to all arenas</Link>
    </div>
  );

  if (!arena) return (
    <div className="page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)" }}>
      <p style={{ color: "var(--muted)" }}>Loading arena…</p>
    </div>
  );

  const cfg   = SC[arena.sportType] ?? SC.Default;
  const tax   = Math.round(arena.pricePerHour * 0.18);
  const total = arena.pricePerHour + tax;
  const fmt   = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const mm    = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss    = String(countdown % 60).padStart(2, "0");

  // Determine which hours are in the past (for today only)
  const now = new Date();
  const isToday = selectedDate === fmtDate(now);
  const currentHour = now.getHours();

  const isPastHour = (h: number) => isToday && h <= currentHour;

  return (
    <div className="page-bg">
      <div className="book-wrap">

        {/* Arena info card */}
        <div className="glass" style={{ padding: 24, marginBottom: 14 }}>
          <div className="book-arena-head" style={{ display: "flex", gap: 15, alignItems: "center", marginBottom: 18 }}>
            <div className="card-icon" style={{ background: cfg.bg, width: 58, height: 58, borderRadius: 12, fontSize: 26 }}>{cfg.icon}</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 4, color: "#fff" }}>{arena.name}</h1>
              <p className="card-loc" style={{ margin: 0, color: "var(--muted)" }}><span>📍</span>{arena.location}</p>
            </div>
          </div>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />
          <div className="info-grid">
            <div className="info-cell"><p className="info-lbl">Sport</p><p className="info-val">{arena.sportType}</p></div>
            <div className="info-cell"><p className="info-lbl">Rate</p><p className="info-val">{fmt(arena.pricePerHour)}/hr</p></div>
            <div className="info-cell"><p className="info-lbl">Duration</p><p className="info-val">1 Hour</p></div>
          </div>
        </div>

        {/* Slot picker — only when IDLE or BOOKING */}
        {(status === "IDLE" || status === "BOOKING") && (
          <div className="glass" style={{ padding: 26, marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: "#fff" }}>Choose Date &amp; Time</h2>

            {/* Date strip */}
            <div className="date-strip">
              {dates.map(d => {
                const iso = fmtDate(d);
                const isSelected = iso === selectedDate;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    className={`date-chip ${isSelected ? "date-chip-active" : ""}`}
                  >
                    <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: isSelected ? "#000" : "inherit" }}>
                      {d.toLocaleDateString("en-IN", { weekday: "short" })}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: isSelected ? "#000" : "inherit" }}>
                      {d.getDate()}
                    </span>
                    <span style={{ fontSize: 10, color: isSelected ? "rgba(0,0,0,.7)" : "var(--muted)" }}>
                      {d.toLocaleDateString("en-IN", { month: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time grid */}
            <div style={{ marginTop: 20 }}>
              <div className="slot-legend-row" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em", margin: 0 }}>
                  Time Slots
                </p>
                <div className="slot-legend" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--surface-2)", border: "1px solid var(--border)", display: "inline-block" }} />
                    Available
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.25)", display: "inline-block" }} />
                    Booked
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", display: "inline-block" }} />
                    Elapsed
                  </span>
                </div>
              </div>

              {slotsLoading ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading slots…</p>
              ) : ALL_HOURS.length === 0 ? (
                <div className="glass" style={{ padding: "20px", textAlign: "center" }}>
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>No slots available on this date</p>
                </div>
              ) : (
                <div className="slot-grid time-slot-grid">
                  {ALL_HOURS.map(h => {
                    const isBooked = bookedHours.includes(h);
                    const isPast   = isPastHour(h);
                    const isDisabled = isBooked || isPast;

                    return (
                      <button
                        key={h}
                        disabled={isDisabled}
                        onClick={() => !isDisabled && setSelectedHour(h === selectedHour ? null : h)}
                        className={`slot-btn ${selectedHour === h ? "slot-active" : ""} ${isBooked ? "slot-booked" : ""} ${isPast ? "slot-past" : ""}`}
                        title={isBooked ? "This slot is already booked" : isPast ? "This time has already passed" : ""}
                      >
                        {fmtHour(h)}
                        {isBooked && (
                          <span style={{ display: "block", fontSize: 9, marginTop: 2, textTransform: "uppercase", letterSpacing: ".07em", opacity: 0.7 }}>Booked</span>
                        )}
                        {isPast && !isBooked && (
                          <span style={{ display: "block", fontSize: 9, marginTop: 2, textTransform: "uppercase", letterSpacing: ".07em", opacity: 0.7 }}>Elapsed</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirm / status card */}
        <div className="glass" style={{ padding: 26 }}>

          {status === "IDLE" && (
            <>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 5, color: "#fff" }}>Confirm Booking</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                Your slot will be held for 2 minutes while payment is processed.
              </p>
              <div className="order-box">
                <div className="order-row">
                  <span>
                    {selectedHour !== null
                      ? `${selectedDate} · ${fmtHour(selectedHour)}`
                      : "No slot selected"}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{fmt(arena.pricePerHour)}</span>
                </div>
                <div className="order-row"><span>GST (18%)</span><span style={{ fontWeight: 600, color: "var(--text)" }}>{fmt(tax)}</span></div>
                <div className="order-row order-total">
                  <span>Total</span><span className="order-total-amt">{fmt(total)}</span>
                </div>
              </div>
              <button
                id="hold-slot-btn"
                onClick={hold}
                disabled={selectedHour === null}
                className="btn-primary"
                style={{ opacity: selectedHour === null ? 0.45 : 1, width: "100%", padding: 14 }}
              >
                {user ? "Reserve & Pay →" : "Sign in to Book →"}
              </button>
              {selectedHour === null && (
                <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
                  Please select a date and time slot above
                </p>
              )}
            </>
          )}

          {status === "BOOKING" && (
            <div className="result">
              <div style={{ fontSize: 46, marginBottom: 14 }}>⏳</div>
              <p style={{ fontWeight: 600, fontSize: 16, color: "var(--accent)" }}>Reserving your slot…</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Please wait while we hold this slot for you</p>
            </div>
          )}

          {status === "PAYMENT" && (
            <>
              <div className="payment-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>Complete Payment</h2>
                <span className={`countdown ${countdown < 30 ? "cd-urgent" : "cd-safe"}`}>{mm}:{ss}</span>
              </div>
              <div className="pay-box">
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
                  Your slot has been reserved. Please complete the payment before the timer expires to confirm your booking.
                </p>
                <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }} />
                <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
                  <span>Slot</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>
                    {selectedHour !== null ? `${selectedDate} · ${fmtHour(selectedHour)}` : "—"}
                  </span>
                </div>
                <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                  <span>Amount</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{fmt(total)}</span>
                </div>
              </div>
              <div className="payment-actions" style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button id="payment-success-btn" onClick={() => pay(true)}  className="btn-ok">Confirm Payment</button>
                <button id="payment-fail-btn"    onClick={() => pay(false)} className="btn-err">Cancel</button>
              </div>
            </>
          )}

          {status === "SUCCESS" && (
            <div className="result">
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", marginBottom: 7 }}>Booking Confirmed!</h2>
              <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 4 }}>
                Your reservation has been confirmed successfully.
              </p>
              <div className="pay-box" style={{ textAlign: "left", margin: "16px 0 24px" }}>
                <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                  <span>Arena</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{arena.name}</span>
                </div>
                <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                  <span>Date & Time</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{bookedDate ?? selectedDate} · {bookedHour !== null ? fmtHour(bookedHour) : (selectedHour !== null ? fmtHour(selectedHour) : "—")}</span>
                </div>
                <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
                  <span>Amount Paid</span>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{fmt(total)}</span>
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 22 }}>
                A confirmation has been sent. See you at the venue!
              </p>
              <div className="result-actions" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/bookings" className="btn-primary" style={{ display: "inline-flex", padding: "11px 22px", fontSize: 14 }}>View My Bookings</Link>
                <Link href="/venues" className="btn-ghost" style={{ display: "inline-flex", padding: "11px 22px", fontSize: 14 }}>Book Another Arena</Link>
              </div>
            </div>
          )}

          {status === "FAILED" && (
            <div className="result">
              <div style={{ fontSize: 56, marginBottom: 16 }}>😔</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ef4444", marginBottom: 7 }}>Booking Unsuccessful</h2>
              <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 6 }}>
                We couldn&apos;t complete your booking. The payment was cancelled, the hold expired, or the slot is no longer available.
              </p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 26 }}>
                Please try again or choose a different time slot.
              </p>
              <div className="result-actions" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={resetBooking} className="btn-primary" style={{ padding: "11px 22px", fontSize: 14 }}>Try Again</button>
                <Link href="/venues" className="btn-ghost" style={{ display: "inline-flex", padding: "11px 22px", fontSize: 14 }}>Browse Venues</Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
