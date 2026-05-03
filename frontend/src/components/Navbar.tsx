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
    const saved = sessionStorage.getItem("dplay_city");
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
          sessionStorage.setItem("dplay_city", detected);
          setCity(detected);
          setLocStatus("granted");
        } catch { setLocStatus("denied"); }
      },
      () => setLocStatus("denied"),
      { timeout: 8000 }
    );
  }, []);

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
        padding: "6px 16px",
        borderRadius: 12,
        background: isActive ? "rgba(255,255,255,0.08)" : "transparent"
      }} className="nav-hover-effect">
        <span style={{ fontSize: 16 }}>{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <nav className="navbar" style={{ 
      padding: "0 40px", 
      height: 80, 
      display: "grid", 
      gridTemplateColumns: "1fr 2fr 1fr", // Balanced grid for centering
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(20px)",
      background: "rgba(10, 10, 10, 0.8)",
      borderBottom: "1px solid rgba(255,255,255,0.05)"
    }}>
      {/* Left: Logo */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Link href="/" className="brand-link" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "2px", textTransform: "uppercase" }}>
            <span style={{ color: "#818cf8", textShadow: "0 0 16px rgba(129,140,248,0.9)" }}>D</span><span style={{ color: "#fff" }}>PLAY</span>
          </span>
        </Link>
      </div>

      {/* Center: Nav links (Strictly Centered) */}
      <div className="nav-links" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
        <NavLink href="/" icon="🏠" label="Home" />
        <NavLink href="/venues" icon="🏟️" label="Venues" />
        {user && <NavLink href="/bookings" icon="📅" label="My Bookings" />}
        {user?.role === "ADMIN" && <NavLink href="/admin" icon="🛡️" label="Back Office" />}
      </div>

      {/* Right: Actions */}
      <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "flex-end" }}>
        <button
          className="nav-pill"
          style={{ 
            border: "1px solid rgba(255,255,255,0.1)", 
            cursor: locStatus === "denied" ? "default" : "pointer",
            background: "rgba(255,255,255,0.03)",
            padding: "8px 16px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            transition: "all 0.2s ease"
          }}
          onClick={() => {
            if (locStatus === "granted" || locStatus === "denied") {
              sessionStorage.removeItem("dplay_city");
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
                      sessionStorage.setItem("dplay_city", detected);
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
          <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>{locStatus === "loading" ? "Detecting…" : city}</span>
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
                transition: "transform 0.2s ease",
                boxShadow: "0 0 15px rgba(0, 123, 196, 0.2)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>

            {showUserMenu && (
              <div style={{
                position: "absolute", top: "calc(100% + 12px)", right: 0,
                width: 240, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                padding: 12, zIndex: 1000, overflow: "hidden",
                animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
              }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 8 }}>
                   <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{user.name}</p>
                   <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0", wordBreak: "break-all" }}>{user.email}</p>
                </div>
                
                <Link href="/profile" onClick={() => setShowUserMenu(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", color: "#fff", textDecoration: "none", fontSize: 14, borderRadius: 12 }} className="menu-item-hover">
                  <span style={{ fontSize: 18 }}>👤</span> My Profile
                </Link>

                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setShowUserMenu(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", color: "#fff", textDecoration: "none", fontSize: 14, borderRadius: 12 }} className="menu-item-hover">
                    <span style={{ fontSize: 18 }}>🛡️</span> Back Office
                  </Link>
                )}

                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />

                <button 
                  onClick={() => { logout(); router.push("/"); setShowUserMenu(false); }}
                  style={{ 
                    display: "flex", alignItems: "center", gap: 12, width: "100%", 
                    padding: "12px 16px", color: "#ff4d4d", background: "transparent", 
                    border: "none", fontSize: 14, cursor: "pointer", borderRadius: 12,
                    textAlign: "left", fontWeight: 700
                  }} 
                  className="menu-item-hover"
                >
                  <span style={{ fontSize: 18 }}>🚪</span> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="btn-primary" style={{ padding: "12px 28px", borderRadius: 14, fontSize: 14, fontWeight: 800 }}>Sign In</Link>
        )}
      </div>

      <style jsx>{`
        .menu-item-hover:hover {
          background: rgba(255,255,255,0.08);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-hover-effect:hover {
          background: rgba(255,255,255,0.12) !important;
          color: #fff !important;
        }
      `}</style>
    </nav>
  );
}
