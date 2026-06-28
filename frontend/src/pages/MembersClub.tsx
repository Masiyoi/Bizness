// src/pages/MembersClub.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { readUser } from '../constants/theme';
import type { User } from '../constants/theme';

// ── Types ────────────────────────────────────────────────────────────────────
interface MemberProfile {
  credits:       number;
  tier:          'Bronze' | 'Gold' | 'Diamond';
  activities:    Activity[];
  joined_at:     string;
}

interface Activity {
  id:          number;
  description: string;
  credits:     number;
  created_at:  string;
}

// ── Tier config ──────────────────────────────────────────────────────────────
const TIERS = [
  {
    name:     'Bronze' as const,
    min:      0,
    max:      499,
    color:    '#CD7F32',
    bg:       'rgba(205,127,50,0.08)',
    border:   'rgba(205,127,50,0.25)',
    perks:    ['Early access to sales', 'Birthday bonus (50 credits)', 'Member-only newsletter'],
  },
  {
    name:     'Gold' as const,
    min:      500,
    max:      1999,
    color:    '#B8960C',
    bg:       'rgba(184,150,12,0.08)',
    border:   'rgba(184,150,12,0.28)',
    perks:    ['All Bronze perks', 'Free shipping on orders over KSh 3,000', '10% discount code monthly', 'Priority customer support'],
  },
  {
    name:     'Diamond' as const,
    min:      2000,
    max:      Infinity,
    color:    '#6A7FA8',
    bg:       'rgba(106,127,168,0.08)',
    border:   'rgba(106,127,168,0.28)',
    perks:    ['All Gold perks', 'Free shipping on every order', 'Exclusive early drops', 'Personal stylist access', 'VIP event invites'],
  },
];

const EARN_WAYS = [
  { label: 'First order ever',        credits: 100, icon: '🛍️' },
  { label: 'Every KSh 100 spent',     credits: 1,   icon: '💳' },
  { label: 'Write a product review',  credits: 20,  icon: '✍️' },
  { label: 'Refer a friend',          credits: 150, icon: '🤝' },
  { label: 'Follow us on Instagram',  credits: 30,  icon: '📸' },
  { label: 'Birthday month bonus',    credits: 50,  icon: '🎂' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getTier(credits: number) {
  return TIERS.find(t => credits >= t.min && credits <= t.max) ?? TIERS[0];
}

function nextTier(credits: number) {
  const idx = TIERS.findIndex(t => credits >= t.min && credits <= t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

function TierBadge({ tier, size = 'md' }: { tier: typeof TIERS[0]; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 13 : size === 'sm' ? 9 : 10;
  const px = size === 'lg' ? '10px 20px' : size === 'sm' ? '4px 10px' : '6px 14px';
  return (
    <span style={{
      fontFamily: "'Jost', sans-serif", fontSize: sz, fontWeight: 700,
      letterSpacing: '2.5px', textTransform: 'uppercase',
      color: tier.color, background: tier.bg,
      border: `1px solid ${tier.border}`,
      padding: px, display: 'inline-block',
    }}>
      {tier.name}
    </span>
  );
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink:   #0A0A0A;
    --paper: #FAFAFA;
    --mid:   #888;
    --rule:  rgba(0,0,0,0.08);
    --f-display: 'Cormorant Garamond', Georgia, serif;
    --f-sans:    'Jost', system-ui, sans-serif;
  }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
  @keyframes shimmer  { from { background-position: -200% center } to { background-position: 200% center } }
  @keyframes barGrow  { from { width: 0 } to { width: var(--bar-w) } }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .mc-fade { animation: fadeUp 0.5s cubic-bezier(.22,.68,0,1.2) both }
  .mc-d1   { animation-delay: 0.05s }
  .mc-d2   { animation-delay: 0.12s }
  .mc-d3   { animation-delay: 0.20s }
  .mc-d4   { animation-delay: 0.28s }
  .mc-d5   { animation-delay: 0.36s }

  .mc-btn-primary {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 700;
    letter-spacing: 3px; text-transform: uppercase;
    background: #111; color: #fff; border: none;
    padding: 15px 32px; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }
  .mc-btn-primary:hover:not(:disabled) { opacity: 0.82; transform: translateY(-1px); }
  .mc-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .mc-btn-ghost {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 3px; text-transform: uppercase;
    background: transparent; color: #111;
    border: 1px solid rgba(0,0,0,0.22); padding: 14px 28px; cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .mc-btn-ghost:hover { border-color: #111; background: rgba(0,0,0,0.03); }

  .tier-card {
    border: 1px solid var(--rule);
    padding: clamp(24px,3vw,40px);
    position: relative; overflow: hidden;
    transition: border-color 0.25s, transform 0.25s;
    cursor: default;
  }
  .tier-card:hover { transform: translateY(-2px); }

  .earn-row {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--rule);
  }
  .earn-row:last-child { border-bottom: none; }

  .activity-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--rule);
  }
  .activity-row:last-child { border-bottom: none; }

  .skel { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
    background-size: 200% 100%; animation: pulse 1.4s ease infinite; }

  @media(max-width:640px) {
    .mc-tiers-grid  { grid-template-columns: 1fr !important; }
    .mc-hero-credit { font-size: clamp(56px,18vw,96px) !important; }
  }
`;

// ── Main ─────────────────────────────────────────────────────────────────────
export default function MembersClub() {
  const navigate = useNavigate();
  const [user,    setUser]    = useState<User | null>(readUser);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [cartCount, setCartCount]     = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 3000);
  };

  const fetchProfile = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const res = await axios.get('/api/members/profile');
      setProfile(res.data);
      setIsMember(true);
    } catch (e: any) {
      if (e.response?.status === 404) setIsMember(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (!user) return;
    axios.get('/api/cart').then(r => setCartCount(r.data.reduce((s: number, i: any) => s + i.quantity, 0))).catch(() => {});
    axios.get('/api/wishlist').then(r => setWishlistCount(r.data.length)).catch(() => {});
  }, [user]);

  const handleJoin = async () => {
    if (!user) { navigate('/login?redirect=/members-club'); return; }
    setJoining(true);
    try {
      await axios.post('/api/members/join');
      showToast('✦ Welcome to Luku Prime Members Club!');
      fetchProfile();
    } catch {
      showToast('Could not join — please try again.');
    } finally {
      setJoining(false);
    }
  };

  const tier    = profile ? getTier(profile.credits) : TIERS[0];
  const next    = profile ? nextTier(profile.credits) : TIERS[1];
  const barPct  = profile && next
    ? Math.min(100, ((profile.credits - tier.min) / (next.min - tier.min)) * 100)
    : 100;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', color: '#0A0A0A', overflowX: 'hidden' }}>
      <style>{css}</style>

      {toast && (
        <div style={{
          position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
          background: '#111', color: '#fff', fontFamily: "'Jost', sans-serif",
          fontSize: 12, fontWeight: 600, letterSpacing: '1px',
          padding: '12px 24px', zIndex: 9999, borderRadius: 4,
          boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
        }}>
          {toast}
        </div>
      )}

      <Navbar
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onLogout={() => { setUser(null); setCartCount(0); setWishlistCount(0); }}
      />

      {/* ── HERO ── */}
      <section style={{
        paddingTop: 'clamp(96px,14vw,160px)',
        paddingBottom: 'clamp(56px,8vw,96px)',
        paddingLeft: 'clamp(20px,5%,80px)',
        paddingRight: 'clamp(20px,5%,80px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        background: '#fff',
        textAlign: 'center',
      }}>
        <p className="mc-fade mc-d1" style={{
          fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 700,
          letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
          marginBottom: 20,
        }}>
          Luku Prime
        </p>
        <h1 className="mc-fade mc-d2" style={{
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic',
          fontSize: 'clamp(40px,7vw,88px)', color: '#0A0A0A',
          letterSpacing: '-1px', lineHeight: 1.0, marginBottom: 20,
        }}>
          Members Club
        </h1>
        <p className="mc-fade mc-d3" style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 'clamp(13px,1.5vw,15px)',
          color: '#888', lineHeight: 1.8, maxWidth: 460, margin: '0 auto 36px',
        }}>
          Shop, earn credits, unlock privileges. Three tiers. One community built around fashion that means something.
        </p>

        {!user && (
          <div className="mc-fade mc-d4" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="mc-btn-primary" onClick={handleJoin}>Join the Club</button>
            <button className="mc-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          </div>
        )}

        {user && !loading && !isMember && (
          <div className="mc-fade mc-d4">
            <button className="mc-btn-primary" onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining…' : 'Join the Club — It\'s Free'}
            </button>
          </div>
        )}

        {user && isMember && profile && (
          <div className="mc-fade mc-d4" style={{ display: 'inline-block' }}>
            <TierBadge tier={tier} size="lg" />
          </div>
        )}
      </section>

      {/* ── MEMBER DASHBOARD (logged in + member) ── */}
      {user && isMember && profile && !loading && (
        <section style={{
          maxWidth: 840, margin: '0 auto',
          padding: 'clamp(40px,6vw,80px) clamp(20px,5%,40px)',
        }}>

          {/* Credits hero */}
          <div className="mc-fade mc-d1" style={{
            textAlign: 'center', marginBottom: 48,
            padding: 'clamp(32px,5vw,56px)',
            background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
          }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12 }}>
              Your Credits
            </p>
            <div className="mc-hero-credit" style={{
              fontFamily: "'Cormorant Garamond', serif", fontWeight: 300,
              fontSize: 'clamp(64px,14vw,110px)', color: '#0A0A0A',
              lineHeight: 1, letterSpacing: '-2px', marginBottom: 8,
            }}>
              {profile.credits.toLocaleString()}
            </div>
            <TierBadge tier={tier} size="md" />

            {next && (
              <div style={{ marginTop: 28, maxWidth: 360, margin: '28px auto 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, color: '#888' }}>{tier.name}</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, color: '#888' }}>
                    {next.min - profile.credits} credits to {next.name}
                  </span>
                </div>
                <div style={{ height: 3, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: tier.color,
                    width: `${barPct}%`,
                    transition: 'width 1s cubic-bezier(.22,.68,0,1.2)',
                  }} />
                </div>
              </div>
            )}

            {!next && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: '#6A7FA8', marginTop: 16, fontWeight: 600, letterSpacing: '1px' }}>
                ✦ You've reached Diamond — the highest tier
              </p>
            )}

            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: '#bbb', marginTop: 20, letterSpacing: '1px' }}>
              Member since {fmtDate(profile.joined_at)}
            </p>
          </div>

          {/* Tier perks */}
          <div className="mc-fade mc-d2" style={{ marginBottom: 48 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>
              Your Perks — {tier.name}
            </p>
            <div style={{ background: '#fff', border: `1px solid ${tier.border}`, padding: 'clamp(20px,3vw,32px)' }}>
              {tier.perks.map((perk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < tier.perks.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <span style={{ color: tier.color, fontSize: 14, flexShrink: 0 }}>✦</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: '#333', fontWeight: 400 }}>{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity log */}
          {profile.activities?.length > 0 && (
            <div className="mc-fade mc-d3">
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>
                Recent Activity
              </p>
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', padding: '0 clamp(16px,3vw,28px)' }}>
                {profile.activities.slice(0, 8).map(act => (
                  <div key={act.id} className="activity-row">
                    <div>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: '#222', marginBottom: 3 }}>{act.description}</p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, color: '#aaa', letterSpacing: '0.5px' }}>{fmtDate(act.created_at)}</p>
                    </div>
                    <span style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700,
                      color: act.credits >= 0 ? '#3A7A3A' : '#C0392B',
                    }}>
                      {act.credits >= 0 ? '+' : ''}{act.credits}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── LOADING SKELETON ── */}
      {user && loading && (
        <section style={{ maxWidth: 840, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(20px,5%,40px)' }}>
          <div className="skel" style={{ height: 220, marginBottom: 24 }} />
          <div className="skel" style={{ height: 140 }} />
        </section>
      )}

      {/* ── TIERS SECTION (always visible) ── */}
      <section style={{
        background: '#fff', borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: 'clamp(48px,7vw,96px) clamp(20px,5%,80px)',
      }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <p className="mc-fade mc-d1" style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '3.5px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12, textAlign: 'center' }}>
            The Tiers
          </p>
          <h2 className="mc-fade mc-d2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(28px,4vw,48px)', color: '#0A0A0A', textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)', letterSpacing: '-0.5px' }}>
            The higher you climb,<br/>the better it gets
          </h2>

          <div className="mc-tiers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(12px,2vw,24px)' }}>
            {TIERS.map((t, i) => (
              <div key={t.name} className={`tier-card mc-fade mc-d${i + 2}`}
                style={{ borderColor: profile && getTier(profile.credits).name === t.name ? t.color : 'rgba(0,0,0,0.08)', background: profile && getTier(profile.credits).name === t.name ? t.bg : '#fff' }}>
                {profile && getTier(profile.credits).name === t.name && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: t.color, padding: '4px 12px', fontFamily: "'Jost', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#fff' }}>
                    Your tier
                  </div>
                )}
                <TierBadge tier={t} size="sm" />
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: '#aaa', margin: '10px 0 20px', letterSpacing: '0.5px' }}>
                  {t.max === Infinity ? `${t.min.toLocaleString()}+ credits` : `${t.min}–${t.max.toLocaleString()} credits`}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {t.perks.map((perk, pi) => (
                    <div key={pi} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: t.color, fontSize: 11, flexShrink: 0, marginTop: 1 }}>✦</span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: '#444', lineHeight: 1.5, fontWeight: 400 }}>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARN SECTION ── */}
      <section style={{
        maxWidth: 640, margin: '0 auto',
        padding: 'clamp(48px,7vw,96px) clamp(20px,5%,40px)',
      }}>
        <p className="mc-fade mc-d1" style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '3.5px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12 }}>
          How It Works
        </p>
        <h2 className="mc-fade mc-d2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(28px,4vw,44px)', color: '#0A0A0A', marginBottom: 'clamp(28px,4vw,44px)', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
          Every action earns.<br/>Credits never expire.
        </h2>
        <div className="mc-fade mc-d3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', padding: '0 clamp(16px,3vw,32px)' }}>
          {EARN_WAYS.map((way, i) => (
            <div key={i} className="earn-row">
              <span style={{ fontSize: 22, flexShrink: 0, width: 36, textAlign: 'center' }}>{way.icon}</span>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: '#222', flex: 1, fontWeight: 400 }}>{way.label}</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#111', flexShrink: 0 }}>
                +{way.credits} <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 400, color: '#aaa' }}>cr</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FOOTER BAND ── */}
      {(!user || (user && !isMember && !loading)) && (
        <section style={{
          background: '#0A0A0A', padding: 'clamp(48px,7vw,80px) clamp(20px,5%,80px)',
          textAlign: 'center',
        }}>
          <p className="mc-fade mc-d1" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(28px,4vw,48px)', color: '#fff', marginBottom: 12, lineHeight: 1.1 }}>
            Start earning today.
          </p>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.45)', marginBottom: 32, letterSpacing: '1px' }}>
            Free to join. No minimum spend.
          </p>
          <button
            className="mc-btn-primary"
            style={{ background: '#fff', color: '#111' }}
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? 'Joining…' : !user ? 'Create an Account' : 'Join the Club — Free'}
          </button>
        </section>
      )}

      <Footer />
    </div>
  );
}