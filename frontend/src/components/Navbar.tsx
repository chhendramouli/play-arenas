"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [city, setCity] = useState("India");
  const [locStatus, setLocStatus] = useState<"idle"|"loading"|"granted"|"denied">("idle");

  useEffect(() => {
    const saved = sessionStorage.getItem("letsplay_city");
    if (saved) { setCity(saved); setLocStatus("granted"); return; }
    if (!navigator.geolocation) { setLocStatus("denied"); return; }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const d = await r.json();
          const detected = d.address?.city || d.address?.town || d.address?.county || "India";
          sessionStorage.setItem("letsplay_city", detected);
          setCity(detected);
          setLocStatus("granted");
        } catch { setLocStatus("denied"); }
      },
      () => setLocStatus("denied"),
      { timeout: 8000 }
    );
  }, []);

  if (pathname.startsWith("/admin")) {
    return null; // Admin page has its own navbar
  }

  return (
    <nav className="navbar">
      {/* Left: Logo */}
      <Link href="/" className="brand-link" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div style={{
          width: 32, height: 32, background: "var(--lp-blue)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 18, borderRadius: 4
        }}>
          L
        </div>
        <div className="brand-text" style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "1px", textTransform: "uppercase" }}>
            LET&apos;S
          </span>
          <span style={{ fontSize: 11, color: "var(--lp-blue)", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
            PLAY
          </span>
        </div>
      </Link>

      {/* Center: Nav links */}
      <div className="nav-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <Link href="/" style={{ color: pathname === "/" ? "#fff" : "var(--muted)", textDecoration: "none", fontSize: 14, fontWeight: pathname === "/" ? 600 : 500 }}>Home</Link>
        <Link href="/venues" style={{ color: pathname === "/venues" ? "#fff" : "var(--muted)", textDecoration: "none", fontSize: 14, fontWeight: pathname === "/venues" ? 600 : 500 }}>Venues</Link>
        {user && (
          <Link href="/bookings" style={{ color: pathname === "/bookings" ? "#fff" : "var(--muted)", textDecoration: "none", fontSize: 14, fontWeight: pathname === "/bookings" ? 600 : 500 }}>My Bookings</Link>
        )}
      </div>

      {/* Right: Actions */}
      <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="nav-pill"
          style={{ border: "1px solid var(--border)", cursor: locStatus === "denied" ? "default" : "pointer" }}
          onClick={() => {
            if (locStatus === "granted" || locStatus === "denied") {
              sessionStorage.removeItem("letsplay_city");
              setLocStatus("idle");
              setCity("India");
              setTimeout(() => {
                if (!navigator.geolocation) return;
                setLocStatus("loading");
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    try {
                      const { latitude, longitude } = pos.coords;
                      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { headers: { "Accept-Language": "en" } });
                      const d = await r.json();
                      const detected = d.address?.city || d.address?.town || d.address?.county || "India";
                      sessionStorage.setItem("letsplay_city", detected);
                      setCity(detected); setLocStatus("granted");
                    } catch { setLocStatus("denied"); }
                  },
                  () => setLocStatus("denied"),
                  { timeout: 8000 }
                );
              }, 100);
            }
          }}
          title={locStatus === "denied" ? "Location access denied" : "Click to update location"}
        >
          <span>📍</span>
          {locStatus === "loading" ? "Detecting…" : city}
        </button>
        
        {user ? (
          <>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>Back Office</Link>
            )}
            <button onClick={() => { logout(); router.push("/"); }} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px", cursor: "pointer" }}>
              Sign Out
            </button>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          </>
        ) : (
          <Link href="/login" className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>Sign In</Link>
        )}
        <Link href="/venues" className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>Book Now</Link>
      </div>
    </nav>
  );
}
