export const ArenaSkeleton = () => (
  <div className="glass" style={{ height: 320, borderRadius: 24, overflow: 'hidden', animation: 'pulse 1.5s infinite' }}>
    <div style={{ height: 180, background: 'rgba(255,255,255,0.05)' }} />
    <div style={{ padding: 20 }}>
      <div style={{ height: 24, width: '70%', background: 'rgba(255,255,255,0.05)', marginBottom: 12, borderRadius: 4 }} />
      <div style={{ height: 16, width: '40%', background: 'rgba(255,255,255,0.05)', marginBottom: 12, borderRadius: 4 }} />
      <div style={{ height: 40, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }} />
    </div>
  </div>
);
