"use client";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loading-spinner" style={{ 
          width: 50, height: 50, border: "4px solid rgba(255,255,255,0.1)", 
          borderTopColor: "var(--lp-blue)", borderRadius: "50%", 
          animation: "spin 1s linear infinite" 
        }} />
        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ 
        minHeight: "80vh", display: "flex", alignItems: "center", 
        justifyContent: "center", flexDirection: "column", gap: 24,
        textAlign: "center"
      }}>
        <div style={{ fontSize: 64 }}>👤</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>Access Denied</h1>
        <p style={{ color: "var(--muted)", maxWidth: 400 }}>
          You need to be signed in to view your profile and manage your account settings.
        </p>
        <button 
          onClick={() => router.push("/login")} 
          className="btn-primary" 
          style={{ padding: "14px 40px", borderRadius: 16, fontWeight: 800 }}
        >
          Sign In to Let&apos;s Play
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "60px 20px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ 
        background: "rgba(255,255,255,0.02)", 
        backdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,0.08)", 
        borderRadius: 24, 
        padding: "32px 40px",
        boxShadow: "0 40px 100px rgba(0,0,0,0.5)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: "50%", 
            background: "linear-gradient(135deg, var(--lp-blue), var(--lp-blue-light))", 
            display: "flex", 
            alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 900, color: "#fff",
            boxShadow: "0 10px 30px rgba(54, 67, 186, 0.4)"
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff" }}>{user.name}</h1>
            <p style={{ margin: "4px 0 0", color: "var(--lp-blue)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2 }}>{user.role} ACCOUNT</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
            <label style={{ display: "block", color: "var(--muted)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 6, letterSpacing: 1 }}>Full Name</label>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>{user.name}</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
            <label style={{ display: "block", color: "var(--muted)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 6, letterSpacing: 1 }}>Email Address</label>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>{user.email}</p>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button 
              onClick={() => alert("Profile editing coming soon!")}
              className="btn-secondary" 
              style={{ flex: 1, padding: "14px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            >
              Edit Profile
            </button>
            <button 
              onClick={() => alert("Security settings coming soon!")}
              className="btn-secondary" 
              style={{ flex: 1, padding: "14px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            >
              Security Settings
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <button 
          onClick={() => router.push("/bookings")} 
          style={{ 
            background: "transparent", 
            border: "none", 
            color: "var(--lp-blue)", 
            fontWeight: 800, 
            cursor: "pointer", 
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 1,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.letterSpacing = "2px"}
          onMouseLeave={(e) => e.currentTarget.style.letterSpacing = "1px"}
        >
          View My Bookings →
        </button>
      </div>
    </div>
  );
}
