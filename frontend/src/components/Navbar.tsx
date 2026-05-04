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
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Geolocation
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

  const refreshCity = () => {
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
  };

  if (pathname.startsWith("/admin")) return null;

  const navLinks = [
    { href: "/", icon: "🏠", label: "Home" },
    { href: "/venues", icon: "🏟️", label: "Venues" },
    ...(user ? [{ href: "/bookings", icon: "📅", label: "My Bookings" }] : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin", icon: "🛡️", label: "Back Office" }] : []),
  ];

  return (
    <>
      <nav style={{
        padding: "0 20px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 200,
        backdropFilter: "blur(20px)",
        background: "rgba(10,10,10,0.9)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "1px" }}>
            <span style={{ color: "#c7d2fe" }}>D</span><span style={{ color: "#fff" }}>PLAY</span>
          </span>
        </Link>

        {/* Desktop center links */}
        <div className="desktop-nav" style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {navLinks.map(({ href, icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 7,
                color: isActive ? "#fff" : "var(--muted)",
                textDecoration: "none", fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                padding: "7px 14px", borderRadius: 12,
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                transition: "all 0.2s",
              }} className="nav-hover-effect">
                <span style={{ fontSize: 15 }}>{icon}</span>{label}
              </Link>
            );
          })}
        </div>

        {/* Desktop right actions */}
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* City pill */}
          <button onClick={refreshCity} style={{
            border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
            background: "rgba(255,255,255,0.03)", padding: "7px 14px",
            borderRadius: 12, display: "flex", alignItems: "center", color: "var(--muted)",
          }}>
            <span style={{ marginRight: 5 }}>📍</span>
            <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", color: "#e5e7eb" }}>
              {locStatus === "loading" ? "Detecting…" : city}
            </span>
          </button>

          {user ? (
            <div style={{ position: "relative" }} ref={menuRef}>
              <button onClick={() => setShowUserMenu(!showUserMenu)} style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "var(--lp-blue)", border: "2px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800, color: "#fff", cursor: "pointer",
              }}>
                {user.name.charAt(0).toUpperCase()}
              </button>
              {showUserMenu && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  width: 230, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                  padding: 10, zIndex: 1000,
                  animation: "slideIn 0.25s cubic-bezier(0.16,1,0.3,1)"
                }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 6 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{user.name}</p>
                    <p style={{ fontSize: 11, color: "var(--muted)", margin: "3px 0 0", wordBreak: "break-all" }}>{user.email}</p>
                  </div>
                  <Link href="/profile" onClick={() => setShowUserMenu(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", color: "#fff", textDecoration: "none", fontSize: 14, borderRadius: 10 }} className="menu-item-hover">
                    <span>👤</span> My Profile
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setShowUserMenu(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", color: "#fff", textDecoration: "none", fontSize: 14, borderRadius: 10 }} className="menu-item-hover">
                      <span>🛡️</span> Back Office
                    </Link>
                  )}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "6px 0" }} />
                  <button onClick={() => { logout(); router.push("/"); setShowUserMenu(false); }} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "10px 14px", color: "#ff4d4d", background: "transparent",
                    border: "none", fontSize: 14, cursor: "pointer", borderRadius: 10,
                    textAlign: "left", fontWeight: 700,
                  }} className="menu-item-hover">
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-primary" style={{ padding: "10px 22px", borderRadius: 12, fontSize: 14, fontWeight: 800 }}>Sign In</Link>
          )}
        </div>

        {/* Mobile right: city + avatar/sign-in + hamburger */}
        <div className="mobile-nav" style={{ display: "none", alignItems: "center", gap: 10 }}>
          {user ? (
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--lp-blue)", border: "2px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Link href="/login" className="btn-primary" style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 800 }}>Sign In</Link>
          )}
          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, width: 40, height: 40, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 5, cursor: "pointer", flexShrink: 0,
            }}
            aria-label="Toggle menu"
          >
            <span style={{
              display: "block", width: 18, height: 2, background: mobileOpen ? "#c7d2fe" : "#fff",
              borderRadius: 2, transition: "all 0.25s",
              transform: mobileOpen ? "rotate(45deg) translate(5px, 5px)" : "none",
            }} />
            <span style={{
              display: "block", width: 18, height: 2, background: mobileOpen ? "#c7d2fe" : "#fff",
              borderRadius: 2, transition: "all 0.25s",
              opacity: mobileOpen ? 0 : 1,
            }} />
            <span style={{
              display: "block", width: 18, height: 2, background: mobileOpen ? "#c7d2fe" : "#fff",
              borderRadius: 2, transition: "all 0.25s",
              transform: mobileOpen ? "rotate(-45deg) translate(5px, -5px)" : "none",
            }} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-nav" style={{
          display: "block",
          position: "fixed", top: 64, left: 0, right: 0,
          background: "rgba(10,10,10,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          zIndex: 199,
          padding: "16px 20px 24px",
          animation: "slideDown 0.2s ease",
        }}>
          {/* City */}
          <button onClick={() => { refreshCity(); }} style={{
            width: "100%", marginBottom: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)", padding: "11px 16px",
            borderRadius: 12, display: "flex", alignItems: "center", cursor: "pointer",
            color: "#e5e7eb",
          }}>
            <span style={{ marginRight: 8 }}>📍</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {locStatus === "loading" ? "Detecting…" : city}
            </span>
          </button>

          {/* Nav links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {navLinks.map(({ href, icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 16px", borderRadius: 12,
                  color: isActive ? "#fff" : "var(--muted)",
                  textDecoration: "none", fontSize: 15,
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? "rgba(199,210,254,0.08)" : "transparent",
                  borderLeft: isActive ? "3px solid #818cf8" : "3px solid transparent",
                }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>{label}
                </Link>
              );
            })}
          </div>

          {/* User section */}
          {user && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
              <div style={{ padding: "0 4px", marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{user.name}</p>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>{user.email}</p>
              </div>
              <Link href="/profile" onClick={() => setMobileOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 16px", borderRadius: 12,
                color: "var(--muted)", textDecoration: "none", fontSize: 15,
              }}>
                <span style={{ fontSize: 18 }}>👤</span> My Profile
              </Link>
              <button onClick={() => { logout(); router.push("/"); setMobileOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "13px 16px", color: "#ff4d4d", background: "transparent",
                border: "none", fontSize: 15, cursor: "pointer", borderRadius: 12,
                textAlign: "left", fontWeight: 700, marginTop: 4,
              }}>
                <span style={{ fontSize: 18 }}>🚪</span> Sign Out
              </button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .menu-item-hover:hover { background: rgba(255,255,255,0.07); }
        .nav-hover-effect:hover { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav  { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav  { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}
