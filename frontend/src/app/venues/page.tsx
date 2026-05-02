"use client";
import { useState, useEffect } from "react";
import ArenaCard from "@/components/ArenaCard";
import { Arena } from "@/components/types";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import apiClient from "@/components/apiClient";
import { ArenaSkeleton } from "@/components/Skeletons";

const SPORTS = ["All", "Football", "Basketball", "Badminton", "Tennis", "Cricket", "Swimming"];
const ICONS: Record<string, string> = {
  Football: "⚽", Basketball: "🏀", Badminton: "🏸",
  Tennis:   "🎾", Cricket:    "🏏", Swimming:  "🏊",
};

export default function VenuesPage() {
  const sp     = useSearchParams();
  const router = useRouter();
  const initialSport = sp.get("sport") ?? "All";
  const initialDate  = sp.get("date") ?? "";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeSport, setActiveSport] = useState(
    SPORTS.includes(initialSport) ? initialSport : "All"
  );
  const [date, setDate] = useState(initialDate);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Keep URL in sync so Quick Book selections survive page refresh / share
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeSport !== "All") params.set("sport", activeSport);
    if (date) params.set("date", date);
    const qs = params.toString();
    router.replace(qs ? `/venues?${qs}` : `/venues`, { scroll: false });
  }, [activeSport, date, router]);

  const { data: arenas = [], isLoading } = useQuery<Arena[]>({
    queryKey: ['arenas'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/arenas');
      return data;
    }
  });

  const filtered = arenas.filter(a => {
    if (a.active === false) return false; // Hide deactivated arenas from customer view
    const matchSport = activeSport === "All" || a.sportType === activeSport;
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.location.toLowerCase().includes(q);
    return matchSport && matchSearch;
  });

  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="page-bg" style={{ minHeight: "calc(100vh - 64px)", padding: "40px 28px" }}>
      <div style={{ maxWidth: 1260, margin: "0 auto" }}>
        
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="section-eyebrow">BROWSE ALL</span>
          <h1 className="section-heading">VENUES</h1>
          {dateLabel && (
            <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "rgba(0,180,216,.1)", border: "1px solid var(--accent)", fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
              <span>📅 {dateLabel}</span>
              <button
                onClick={() => setDate("")}
                aria-label="Clear date filter"
                style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
              >×</button>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="search-bar" style={{ marginBottom: 28 }}>
          <span className="search-icon">🔍</span>
          <input
            id="arena-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by arena name or city…"
            className="search-input"
          />
          {search && (
            <button onClick={() => setSearch("")} className="search-clear">✕</button>
          )}
        </div>

        {/* Sport filter chips */}
        <div className="filter-bar" style={{ marginBottom: 44 }}>
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

        {/* Results count */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            {isLoading ? "Fetching arenas…" : `${filtered.length} arena${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Arena grid */}
        {isLoading ? (
          <div className="slot-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
            {[1,2,3,4,5,6].map(i => <ArenaSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass" style={{ padding: "56px 40px", textAlign: "center", maxWidth: 580, margin: "0 auto" }}>
            <div style={{ fontSize: 38, marginBottom: 14 }}>🔍</div>
            <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 7, color: "#fff" }}>No arenas found</p>
            <p style={{ fontSize: 13.5, color: "var(--muted)" }}>Try a different sport or search term</p>
          </div>
        ) : (
          <div className="slot-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
            {filtered.map(a => <ArenaCard key={a.id} arena={a} date={date || undefined} />)}
          </div>
        )}

      </div>
    </div>
  );
}
