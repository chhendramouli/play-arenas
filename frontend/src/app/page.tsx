"use client";
import { useState } from "react";
import ArenaCard from "@/components/ArenaCard";
import { Arena } from "@/components/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/components/apiClient";
import { ArenaSkeleton } from "@/components/Skeletons";

const SPORTS = ["All", "Football", "Basketball", "Badminton", "Tennis", "Cricket", "Swimming"];
const ICONS: Record<string, string> = {
  Football: "⚽", Basketball: "🏀", Badminton: "🏸",
  Tennis:   "🎾", Cricket:    "🏏", Swimming:  "🏊",
};

// ── Quick Book widget ──────────────────────────────────────────────
function QuickBook() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [date, setDate]   = useState(today);
  const [sport, setSport] = useState("Any");

  const onFind = () => {
    const params = new URLSearchParams();
    params.set("date", date);
    if (sport && sport !== "Any") params.set("sport", sport);
    router.push(`/venues?${params.toString()}`);
  };

  return (
    <div style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 20 }}>Find a Venue</h2>

      <label style={{ display: "block", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", background: "var(--surface-2)", marginBottom: 12, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Select Date</span>
            <input
              type="date"
              value={date}
              min={today}
              max={maxDate}
              onChange={e => setDate(e.target.value)}
              style={{ background: "transparent", border: "none", color: "#fff", fontSize: 14, fontWeight: 500, padding: 0, outline: "none", colorScheme: "dark" }}
            />
          </div>
        </div>
      </label>

      <label style={{ display: "block", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", background: "var(--surface-2)", marginBottom: 20, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🏅</span>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Select Sport</span>
            <select
              value={sport}
              onChange={e => setSport(e.target.value)}
              style={{ background: "transparent", border: "none", color: "#fff", fontSize: 14, fontWeight: 500, padding: 0, outline: "none", appearance: "none" }}
            >
              <option value="Any" style={{ background: "#111" }}>Any sport</option>
              {SPORTS.filter(s => s !== "All").map(s => (
                <option key={s} value={s} style={{ background: "#111" }}>{ICONS[s]} {s}</option>
              ))}
            </select>
          </div>
        </div>
      </label>

      <button
        type="button"
        onClick={onFind}
        className="btn-primary"
        style={{ width: "100%", fontSize: 15, padding: 14, textAlign: "center", border: "none", cursor: "pointer" }}
      >
        Find Available Slots
      </button>
    </div>
  );
}

export default function Home() {
  const [activeSport, setActiveSport] = useState("All");

  const { data: arenas = [], isLoading } = useQuery<Arena[]>({
    queryKey: ['arenas'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/arenas');
      return data;
    }
  });

  const filtered = arenas.filter(a => activeSport === "All" || a.sportType === activeSport);

  return (
    <div className="page-bg">
      {/* ── Section 1: HERO ── */}
      <section className="home-hero" style={{
        minHeight: "calc(100vh - 64px)",
        background: "linear-gradient(135deg, #0d0d1a 0%, #000000 60%, #0a1628 100%)",
        display: "flex", alignItems: "center", padding: "60px 28px"
      }}>
        <div className="home-hero-inner" style={{ maxWidth: 1260, margin: "0 auto", width: "100%", display: "flex", gap: "40px", flexWrap: "wrap" }}>
          
          {/* Left Column */}
          <div className="home-hero-copy" style={{ flex: "1 1 55%" }}>
            <div style={{ display: "inline-flex", background: "var(--amber)", color: "#000", padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700, marginBottom: 24 }}>
              ⭐ India's #1 Sports Booking Platform
            </div>
            <h1 className="section-heading" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
              BOOK YOUR<br />
              <span style={{ color: "var(--dk-blue)" }}>GAME</span><br />
              TODAY
            </h1>
            <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 450, marginBottom: 32, lineHeight: 1.6 }}>
              Premium sports facilities at your fingertips.
              Badminton, Football, Basketball, Cricket & more.
            </p>
            <div className="home-hero-actions" style={{ display: "flex", gap: 16, marginBottom: 48 }}>
              <Link href="/venues" className="btn-primary">Explore Venues →</Link>
            </div>
            <div className="home-stats" style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <div><span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>50+</span> <span style={{ color: "var(--muted)", fontSize: 14 }}>Venues</span></div>
              <div><span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>15K+</span> <span style={{ color: "var(--muted)", fontSize: 14 }}>Bookings</span></div>
              <div><span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>4.8 ★</span> <span style={{ color: "var(--muted)", fontSize: 14 }}>Rating</span></div>
            </div>
          </div>

          {/* Right Column - Quick Book */}
          <div className="quick-book-col" style={{ flex: "1 1 35%", minWidth: 320 }}>
            <QuickBook />
          </div>
        </div>
      </section>

      {/* ── Section 2: TOP VENUES ── */}
      <section style={{ maxWidth: 1260, margin: "0 auto", padding: "72px 28px 88px" }}>
        <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <span className="section-eyebrow">NEAR YOU</span>
            <h2 className="section-heading" style={{ marginBottom: 0 }}>TOP VENUES</h2>
          </div>
          <Link href="/venues" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>View All Venues →</Link>
        </div>

        {/* Filters inline for Top Venues */}
        <div className="filter-bar" style={{ justifyContent: "flex-start", padding: 0, marginBottom: 32 }}>
          {SPORTS.map(s => (
            <span
              key={s}
              className={`chip ${activeSport === s ? "chip-active" : ""}`}
              onClick={() => setActiveSport(s)}
            >
              {s !== "All" && ICONS[s]} {s}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="slot-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
            {[1,2,3].map(i => <ArenaSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass" style={{ padding: "56px 40px", textAlign: "center" }}>
            <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 7 }}>No arenas found</p>
            <p style={{ fontSize: 13.5, color: "var(--muted)" }}>Try a different sport</p>
          </div>
        ) : (
          <div className="slot-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
            {filtered.slice(0, 6).map(a => <ArenaCard key={a.id} arena={a} />)}
          </div>
        )}
      </section>

    </div>
  );
}
