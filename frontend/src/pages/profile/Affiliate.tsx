// src/pages/profile/Affiliate.tsx
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import type { User } from '../../constants/theme';

interface OutletCtx { user: User; setUser: (u: User) => void; }

interface AffiliateStats {
  referral_code:  string;
  clicks:         number;
  signups:        number;
  earnings:       number;
  pending_payout: number;
}

const TIERS = [
  { label: 'Starter',  range: '1 – 5 referrals',   rate: '5%'  },
  { label: 'Rising',   range: '6 – 20 referrals',  rate: '8%'  },
  { label: 'Elite',    range: '21+ referrals',     rate: '12%' },
];

const STEPS = [
  { step: '01', title: 'Share your link', desc: 'Send your unique referral link to friends, followers, or your audience.' },
  { step: '02', title: 'They shop',       desc: 'Anyone who buys through your link within 30 days counts toward your earnings.' },
  { step: '03', title: 'You get paid',    desc: 'Commission is credited to your account and paid out monthly via M-Pesa.' },
];

export default function Affiliate() {
  const { user } = useOutletContext<OutletCtx>();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get('/api/affiliate/me')
      .then(r => setStats(r.data))
      .catch(() => setStats(null)); // page still renders fully with placeholders below
  }, [user.id]);

  const referralCode = stats?.referral_code ?? user.id?.toString().slice(0, 8) ?? 'YOURCODE';
  const referralLink  = `https://www.lukuprime.shop/?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const statCards = [
    { label: 'Clicks',         value: stats ? stats.clicks : '—' },
    { label: 'Sign-ups',       value: stats ? stats.signups : '—' },
    { label: 'Total Earned',   value: stats ? `KSh ${stats.earnings.toLocaleString()}` : '—' },
    { label: 'Pending Payout', value: stats ? `KSh ${stats.pending_payout.toLocaleString()}` : '—' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── Hero card ── */}
      <div style={{
        background: '#000',
        borderRadius: 16,
        padding: 'clamp(28px,4vw,44px)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 32,
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)',
          backgroundSize: '26px 26px',
        }}/>
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,169,81,0.14) 0%,transparent 70%)', top: -80, right: -60, pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', maxWidth: 560 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(200,169,81,0.1)', border: '1px solid rgba(200,169,81,0.35)',
            borderRadius: 20, padding: '4px 14px', fontSize: 10, fontWeight: 700,
            letterSpacing: '2px', color: '#E8CD7A', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Affiliate Program
          </div>

          <h1 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
            Earn from every <em style={{ color: '#E8CD7A', fontStyle: 'normal' }}>referral</em>
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, margin: '0 0 24px', fontWeight: 300 }}>
            Share your link, get people shopping Luku Prime, and earn commission on every order they place.
          </p>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 10, padding: '10px 10px 10px 16px',
          }}>
            <span style={{ flex: 1, minWidth: 180, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {referralLink}
            </span>
            <button
              onClick={handleCopy}
              style={{
                background: 'transparent', color: '#E8CD7A',
                border: '1.5px solid #B8860B', borderRadius: 8,
                padding: '8px 18px', fontSize: 11, fontWeight: 700,
                letterSpacing: '1px', textTransform: 'uppercase',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {copied ? 'Copied ✓' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 40 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ padding: '18px 4px', borderBottom: '2px solid #000' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <span style={{ width: 2, height: 20, background: '#000', borderRadius: 2, flexShrink: 0 }}/>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0a0a0a', margin: 0, letterSpacing: '-0.2px' }}>How It Works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
          {STEPS.map(s => (
            <div key={s.step}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#B8860B', marginBottom: 8, letterSpacing: '-1px' }}>{s.step}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Commission tiers ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <span style={{ width: 2, height: 20, background: '#000', borderRadius: 2, flexShrink: 0 }}/>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0a0a0a', margin: 0, letterSpacing: '-0.2px' }}>Commission Tiers</h2>
        </div>
        {TIERS.map((t, i) => (
          <div key={t.label} style={{
            padding: '18px 0',
            borderBottom: i < TIERS.length - 1 ? '1px solid rgba(10,22,40,0.08)' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0A1628', marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: '#7A6A5A' }}>{t.range}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#B8860B' }}>{t.rate}</div>
          </div>
        ))}
      </div>

      {/* ── Payout info ── */}
      <div style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10,
        padding: '18px 22px', fontSize: 13, color: '#444', lineHeight: 1.85,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <strong>Payouts</strong> are processed monthly via M-Pesa once your pending balance reaches KSh 1,000. Questions about your earnings? Reach us at <strong>masiyoiisaac@gmail.com</strong>.
      </div>
    </div>
  );
}