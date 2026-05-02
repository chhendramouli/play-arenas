import { Arena } from "./types";
import Link from "next/link";

const GRADIENTS: Record<string, string> = {
  Football:   "linear-gradient(135deg, #064e3b 0%, #10b981 100%)",
  Basketball: "linear-gradient(135deg, #78350f 0%, #f59e0b 100%)",
  Badminton:  "linear-gradient(135deg, #312e81 0%, #6366f1 100%)",
  Tennis:     "linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)",
  Cricket:    "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
  Swimming:   "linear-gradient(135deg, #164e63 0%, #06b6d4 100%)",
  Default:    "linear-gradient(135deg, #4c1d95 0%, #a855f7 100%)",
};

// Deterministic pseudo-random seeded by arena ID — avoids SSR/client hydration mismatch
function seededNum(id: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < id.length; i++) { h = (Math.imul(31, h) + id.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

export default function ArenaCard({ arena, date }: { arena: Arena; date?: string }) {
  const bg = GRADIENTS[arena.sportType] ?? GRADIENTS.Default;
  const rating = (4.0 + (seededNum(arena.id, 1) % 10) / 10).toFixed(1);
  const reviews = 20 + (seededNum(arena.id, 2) % 180);
  const slotsOpen = 2 + (seededNum(arena.id, 3) % 8);
  const href = date ? `/book/${arena.id}?date=${encodeURIComponent(date)}` : `/book/${arena.id}`;

  return (
    <Link href={href} className="arena-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Photo Area */}
      <div style={{ aspectRatio: "16/9", position: "relative", background: bg, overflow: "hidden" }}>
        {arena.imageUrl && (
          <img
            src={arena.imageUrl}
            alt={arena.name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
            loading="lazy"
          />
        )}
        {/* Featured Badge */}
        <div style={{
          position: "absolute", top: 12, left: 12, background: "var(--amber)",
          color: "#000", fontSize: 11, fontWeight: 700, padding: "4px 10px",
          borderRadius: 4, textTransform: "uppercase", zIndex: 1
        }}>
          Featured
        </div>
        {/* Slots Badge */}
        <div style={{
          position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.7)",
          color: "#fff", fontSize: 12, padding: "4px 10px", borderRadius: 6, fontWeight: 600, zIndex: 1
        }}>
          ⏱ {slotsOpen} slots open
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: 16 }}>
        {/* Name and Rating */}
        <div className="arena-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>{arena.name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
            <span style={{ color: "var(--amber)" }}>★</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>{rating}</span>
            <span style={{ color: "var(--muted)" }}>({reviews})</span>
          </div>
        </div>

        {/* Location */}
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 4 }}>
          <span>📍</span>{arena.location}
        </p>

        {/* Sport Tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          <span className="sport-tag">{arena.sportType}</span>
          <span className="sport-tag">Indoor</span>
        </div>

        {/* Bottom Row */}
        <div className="arena-card-foot" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>₹{arena.pricePerHour}</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>/hr</span>
          </div>
          <span className="btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
            Book Now →
          </span>
        </div>
      </div>
    </Link>
  );
}
