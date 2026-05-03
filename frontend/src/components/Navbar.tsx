"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [city, setCity] = useState("India");
  const [locStatus, setLocStatus] = useState<"idle"|"loading"|"granted"|"denied">("idle");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (pathname.startsWith("/admin")) {
    return null; // Admin page has its own navbar
  }

  const NavLink = ({ href, icon, label }: { href: string; icon: string; label: string }) => {
    const isActive = pathname === href;
    return (
      <Link href={href} style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        color: isActive ? "#fff" : "var(--muted)", 
        textDecoration: "none", 
        fontSize: 14, 
        fontWeight: isActive ? 700 : 500,
        transition: "all 0.2s ease",
        padding: "6px 12px",
        borderRadius: 8,
        background: isActive ? "rgba(255,255,255,0.05)" : "transparent"
      }} className="nav-hover-effect">
        <span style={{ fontSize: 16 }}>{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <nav className="navbar" style={{ padding: "0 40px", height: 80 }}>
      {/* Left: Logo */}
      <Link href="/" className="brand-link" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div style={{
          width: 36, height: 36, background: "var(--lp-blue)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 20, borderRadius: 8, boxShadow: "0 0 20px rgba(0, 123, 196, 0.3)"
        }}>
          L
        </div>
        <div className="brand-text" style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "1px", textTransform: "uppercase" }}>
            LET&apos;S
          </span>
          <span style={{ fontSize: 12, color: "var(--lp-blue)", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}>
            PLAY
          </span>
        </div>
      </Link>

      {/* Center: Nav links */}
      <div className="nav-links" style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 40 }}>
        <NavLink href="/" icon="🏠" label="Home" />
        <NavLink href="/venues" icon="🏟️" label="Venues" />
        {user && <NavLink href="/bookings" icon="📅" label="My Bookings" />}
      </div>

      {/* Right: Actions */}
      <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
        <button
          className="nav-pill"
          style={{ 
            border: "1px solid rgba(255,255,255,0.1)", 
            cursor: locStatus === "denied" ? "default" : "pointer",
            background: "rgba(255,255,255,0.03)",
            padding: "8px 16px",
            borderRadius: 12
          }}
          onClick={() => {
            if (locStatus === "granted" || locStatus === "denied") {
              sessionStorage.removeItem("letsplay_city");
              setLocStatus("idle"); setCity("India");
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
        >
          <span style={{ marginRight: 6 }}>📍</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{locStatus === "loading" ? "Detecting…" : city}</span>
        </button>
        
        {user ? (
          <div style={{ position: "relative" }} ref={menuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ 
                width: 40, height: 40, borderRadius: "50%", 
                background: "var(--lp-blue)", border: "2px solid rgba(255,255,255,0.1)", 
                display: "flex", alignItems: "center", justifyContent: "center", 
                fontSize: 16, fontWeight: 800, color: "#fff", cursor: "pointer",
                transition: "transform 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>

            {showUserMenu && (
              <div style={{
                position: "absolute", top: "calc(100% + 12px)", right: 0,
                width: 200, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                padding: 8, zIndex: 1000, overflow: "hidden",
                animation: "slideIn 0.2s ease-out"
              }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 4 }}>
                   <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{user.name}</p>
                   <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>{user.email}</p>
                </div>
                
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setShowUserMenu(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: "#fff", textDecoration: "none", fontSize: 13, borderRadius: 8 }} className="menu-item-hover">
                    <span>🛡️</span> Back Office
                  </Link>
                )}
                
                <Link href="/profile" onClick={() => setShowUserMenu(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: "#fff", textDecoration: "none", fontSize: 13, borderRadius: 8 }} className="menu-item-hover">
                  <span>👤</span> My Profile
                </Link>

                <button 
                  onClick={() => { logout(); router.push("/"); setShowUserMenu(false); }}
                  style={{ 
                    display: "flex", alignItems: "center", gap: 10, width: "100%", 
                    padding: "10px 16px", color: "#ff4d4d", background: "transparent", 
                    border: "none", fontSize: 13, cursor: "pointer", borderRadius: 8,
                    textAlign: "left"
                  }} 
                  className="menu-item-hover"
                >
                  <span>🚪</span> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="btn-primary" style={{ padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700 }}>Sign In</Link>
        )}
      </div>

      <style jsx>{`
        .menu-item-hover:hover {
          background: rgba(255,255,255,0.05);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-hover-effect:hover {
          background: rgba(255,255,255,0.08) !important;
          color: #fff !important;
        }
      `}</style>
    </nav>
  );
}
