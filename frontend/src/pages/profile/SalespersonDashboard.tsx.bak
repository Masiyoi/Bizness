// src/pages/profile/SalespersonDashboard.tsx
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { User } from '../../constants/theme';

interface OutletCtx { user: User; setUser: (u: User) => void; }

interface AffiliateStats {
  isAffiliate: boolean;
  coupon_code: string;
  commission_pct: string | number;
  status: string;
  created_at: string;
  total_sales: string | number;
  total_earned: string | number;
  pending_balance: string | number;
}

const money = (v: string | number) =>
  `KSh ${Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

export default function SalespersonDashboard() {
  const { user } = useOutletContext<OutletCtx>();

  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/affiliate/me', { credentials: 'include' });

        if (res.status === 404) {
          if (!cancelled) { setStats(null); setLoading(false); }
          return;
        }
        if (!res.ok) throw new Error('Failed to load affiliate stats');

        const data = await res.json();
        if (!cancelled) { setStats(data); setLoading(false); }
      } catch (err) {
        console.error(err);
        if (!cancelled) { setError('Could not load your affiliate stats. Please try again.'); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const copyCode = async () => {
    if (!stats?.coupon_code) return;
    try {
      await navigator.clipboard.writeText(stats.coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '60px 0', textAlign: 'center', color: '#888' }}>
        Loading your affiliate dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '40px 0', textAlign: 'center', color: '#B3261E' }}>
        {error}
      </div>
    );
  }

  // Not (yet) an approved affiliate — point them back to the application flow.
  if (!stats || !stats.isAffiliate) {
    return (
      <div style={{
        fontFamily: "'DM Sans',sans-serif",
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.09)',
        borderRadius: 16,
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: 8 }}>
          You're not an approved salesperson yet
        </div>
        <p style={{ fontSize: 13, color: '#666', maxWidth: 420, margin: '0 auto' }}>
          Apply to become a salesperson to get your own coupon code and start earning 10% commission on every sale.
        </p>
      </div>
    );
  }

  const cards = [
    { label: 'Coupon Code', value: stats.coupon_code, isCode: true },
    { label: 'Commission Rate', value: `${stats.commission_pct}%` },
    { label: 'Total Sales', value: stats.total_sales },
    { label: 'Total Earned', value: money(stats.total_earned) },
    { label: 'Pending Payout', value: money(stats.pending_balance) },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── Hero ── */}
      <div style={{
        background: '#000',
        borderRadius: 16,
        padding: 'clamp(28px,4vw,44px)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 32,
      }}>
        <div style={{
          position: 'absolute', zIndex: 0, width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(200,169,81,0.14) 0%,transparent 70%)',
          top: -80, right: -60, pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '2px',
            color: '#E8CD7A', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Salesperson Dashboard
          </div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.5px' }}>
                        Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>

          <div
            onClick={copyCode}
            role="button"
            title="Click to copy"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1.5px solid rgba(232,205,122,0.5)',
              borderRadius: 8,
              padding: '10px 18px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '2px', color: '#E8CD7A' }}>
              {stats.coupon_code}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
              {copied ? 'Copied!' : 'Tap to copy'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {cards.filter(c => !c.isCode).map(c => (
          <div key={c.label} style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10,
            padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0A1628' }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Payout info ── */}
      <div style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10,
        padding: '18px 22px', fontSize: 13, color: '#444', lineHeight: 1.85,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <strong>Payouts</strong> are processed instantly via M-Pesa once your pending balance reaches KSh 500. Share your code — <strong style={{ color: '#B8860B' }}>{stats.coupon_code}</strong> — with your audience to keep earning. Questions? Reach us at{' '}
        <a href="mailto:lukuprime254@gmail.com" style={{ color: '#B8860B', fontWeight: 700, textDecoration: 'none' }}>lukuprime254@gmail.com</a>.
      </div>
    </div>
  );
}