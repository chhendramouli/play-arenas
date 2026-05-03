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
    <div className="container" style={{ padding: "120px 20px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ 
        background: "rgba(255,255,255,0.03)", 
        border: "1px solid rgba(255,255,255,0.1)", 
        borderRadius: 32, 
        padding: 40,
        boxShadow: "0 20px 80px rgba(0,0,0,0.4)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 40 }}>
          <div style={{ 
            width: 100, height: 100, borderRadius: "50%", 
            background: "var(--lp-blue)", display: "flex", 
            alignItems: "center", justifyContent: "center",
            fontSize: 40, fontWeight: 900, color: "#fff",
            boxShadow: "0 0 30px rgba(0, 123, 196, 0.4)"
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900 }}>{user.name}</h1>
            <p style={{ margin: "4px 0 0", color: "var(--lp-blue)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{user.role} Account</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
            <label style={{ display: "block", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 }}>Full Name</label>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{user.name}</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
            <label style={{ display: "block", color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 }}>Email Address</label>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{user.email}</p>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
            <button className="btn-secondary" style={{ flex: 1, padding: "16px", borderRadius: 16 }}>Edit Profile</button>
            <button className="btn-secondary" style={{ flex: 1, padding: "16px", borderRadius: 16 }}>Security Settings</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: "center" }}>
        <button 
          onClick={() => router.push("/bookings")} 
          style={{ background: "transparent", border: "none", color: "var(--lp-blue)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
        >
          View My Bookings →
        </button>
      </div>
    </div>
  );
}
