// src/components/common/Footer.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';
import { T, SOCIAL_LINKS } from '../../constants/theme';

// ── Social icons ──────────────────────────────
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/>
    </svg>
  ),
  TikTok: (
    <svg width="18" height="20" viewBox="0 0 24 26" fill="none">
      <path d="M17 1c.4 2.2 1.7 3.7 4 4v3.5c-1.4 0-2.7-.4-4-1.2V16a7 7 0 1 1-7-7c.3 0 .6 0 .9.04V12.6a3.5 3.5 0 1 0 2.1 3.4V1h4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  YouTube: (
    <svg width="20" height="16" viewBox="0 0 24 18" fill="none">
      <rect x="1" y="1" width="22" height="16" rx="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M10 5.5l6 3.5-6 3.5V5.5z" fill="currentColor"/>
    </svg>
  ),
};

// ── Link data ─────────────────────────────────
const SHOP_LINKS = [
  { label: 'New Arrivals',      path: '/?category=New' },
  { label: 'Dresses',           path: '/?category=Dresses' },
  { label: 'Shoes & Sneakers',  path: '/?category=Shoes' },
  { label: 'Bags & Purses',     path: '/?category=Bags' },
  { label: 'Female Wear',       path: '/?category=Female+Wear' },
  { label: 'Jackets & Hoodies', path: '/?category=Jackets' },
  { label: 'Jerseys',           path: '/?category=Jerseys' },
  { label: 'Socks',             path: '/?category=Socks' },
];

const SUPPORT_LINKS = [
  { label: 'Track My Order',      path: '/orders' },
  { label: 'Returns & Exchanges', path: '/returns' },
  { label: 'Delivery Info',       path: '/delivery' },
  { label: 'Size Guide',          path: '/size-guide' },
  { label: 'FAQs',                path: '/faqs' },
  { label: 'Contact Us',          path: '/contact' },
];

const COMPANY_LINKS = [
  { label: 'About Luku Prime', path: '/about' },
  { label: 'Careers',          path: '/careers' },
  { label: 'Press',            path: '/press' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy',     path: '/privacy' },
  { label: 'Terms & Conditions', path: '/terms' },
  { label: 'Cookie Policy',      path: '/cookies' },
];

const TRUST_BADGES = [
  '🚚 CBD from KSh 100',
  '↩️ 30-Day Returns',
  '🔒 Secure Checkout',
];

// ── Types ─────────────────────────────────────
type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

// ── Component ─────────────────────────────────
export default function Footer() {
  const navigate = useNavigate();

  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState<SubscribeStatus>('idle');
  const [message, setMessage] = useState('');

  // ── Newsletter handler ───────────────────────
  const handleSubscribe = async () => {
    // Auth guard
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await axios.post('/api/subscribers', { email });
      
      setStatus('success');
      setMessage(res.data.msg || 'Subscribed successfully!');
      setEmail('');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.msg ?? 'Network error. Please try again.');
    }
  };

  // ── Derived button label ─────────────────────
  const btnLabel =
    status === 'loading' ? '...' :
    status === 'success' ? '✓ Joined' :
    'Subscribe';

  const inputBorderColor =
    status === 'error'   ? 'rgba(220,80,80,0.7)' :
    status === 'success' ? 'rgba(46,204,113,0.5)' :
    'rgba(255,255,255,0.12)';

  const btnBg =
    status === 'success' ? '#2ecc71' : T.gold;

  // ── Render ────────────────────────────────────
  return (
    <footer style={{ background: T.navy, fontFamily: "'Jost','DM Sans',sans-serif" }}>
      <style>{footerCss}</style>

      {/* Gold rule */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg,transparent,${T.gold} 30%,${T.goldLight} 50%,${T.gold} 70%,transparent)`,
      }}/>

      {/* Main grid */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: 'clamp(40px,6vw,60px) clamp(16px,5%,5%) clamp(32px,5vw,48px)',
      }}>
        <div className="ft-grid">

          {/* ── Brand column ──────────────────── */}
          <div>
            <img
              src={logo}
              alt="Luku Prime"
              style={{ height: 44, objectFit: 'contain', marginBottom: 8 }}
            />
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '3px',
              color: 'rgba(200,169,81,0.6)', textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              Walk prime Live prime
            </div>
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.85, marginBottom: 20, maxWidth: 280,
            }}>
              Kenya's premier fashion destination — authentic drops, fast delivery,
              and style that speaks before you do.
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {TRUST_BADGES.map(b => (
                <span key={b} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(200,169,81,0.1)',
                  border: '1px solid rgba(200,169,81,0.25)',
                  borderRadius: 20, padding: '4px 10px',
                  fontSize: 10, fontWeight: 700, color: T.gold,
                }}>
                  {b}
                </span>
              ))}
            </div>

            {/* ── Newsletter ─────────────────── */}
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
              color: 'rgba(200,169,81,0.6)', textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Newsletter
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 10, lineHeight: 1.6 }}>
              New drops, exclusive deals & style inspo — straight to your inbox.
            </p>

            <div style={{ display: 'flex' }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                disabled={status === 'loading' || status === 'success'}
                onChange={e => {
                  setEmail(e.target.value);
                  if (status !== 'idle') { setStatus('idle'); setMessage(''); }
                }}
                onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.07)',
                  border: `1px solid ${inputBorderColor}`,
                  borderRight: 'none',
                  borderRadius: '8px 0 0 8px',
                  padding: '10px 14px',
                  fontFamily: "'Jost',sans-serif",
                  fontSize: 12,
                  color: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                onClick={handleSubscribe}
                disabled={status === 'loading' || status === 'success'}
                style={{
                  background: btnBg,
                  border: 'none',
                  borderRadius: '0 8px 8px 0',
                  padding: '10px 16px',
                  fontFamily: "'Jost',sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  color: T.navy,
                  cursor: (status === 'loading' || status === 'success') ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: status === 'loading' ? 0.7 : 1,
                  transition: 'background 0.25s, opacity 0.2s',
                  minWidth: 88,
                }}
              >
                {btnLabel}
              </button>
            </div>

            {/* Feedback message */}
            {message && (
              <p style={{
                marginTop: 8,
                fontSize: 11,
                lineHeight: 1.5,
                color: status === 'success' ? '#2ecc71' : '#e05555',
              }}>
                {message}
              </p>
            )}
          </div>

          {/* ── Shop links ────────────────────── */}
          <div>
            <div className="ft-col-title">Shop</div>
            {SHOP_LINKS.map(l => (
              <button key={l.label} className="ft-link" onClick={() => navigate(l.path)}>
                {l.label}
              </button>
            ))}
          </div>

          {/* ── Support + Company ─────────────── */}
          <div>
            <div className="ft-col-title">Customer Care</div>
            {SUPPORT_LINKS.map(l => (
              <button key={l.label} className="ft-link" onClick={() => navigate(l.path)}>
                {l.label}
              </button>
            ))}
            <div className="ft-col-title" style={{ marginTop: 24 }}>Company</div>
            {COMPANY_LINKS.map(l => (
              <button key={l.label} className="ft-link" onClick={() => navigate(l.path)}>
                {l.label}
              </button>
            ))}
          </div>

          {/* ── Social + Contact ──────────────── */}
          <div>
            <div className="ft-col-title">Follow Us</div>
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ft-social"
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = s.hoverBg;
                  el.style.borderColor = 'rgba(200,169,81,0.3)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'rgba(255,255,255,0.03)';
                  el.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <span style={{ color: s.color, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {SOCIAL_ICONS[s.name]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                    {s.name}
                  </div>
                  <div style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.label}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>↗</span>
              </a>
            ))}

            {/* Contact card */}
            <div style={{
              marginTop: 20, padding: 14, borderRadius: 10,
              background: 'rgba(200,169,81,0.07)',
              border: '1px solid rgba(200,169,81,0.18)',
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '2px',
                color: 'rgba(200,169,81,0.65)', textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                Get in Touch
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.9 }}>
                📍 Nairobi CBD, Kenya<br/>
                📞 +254 707 099 935<br/>
                ✉️ lukuprime254@gmail.com<br/>
                🕐 Mon–Sat, 9am – 6pm
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: 'rgba(200,169,81,0.15)',
        maxWidth: 1100,
        margin: '0 auto',
      }}/>

      {/* Bottom bar */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '18px clamp(16px,5%,5%)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
          © 2025 Luku Prime · All rights reserved · Made by Masiyoi
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {LEGAL_LINKS.map(l => (
            <button key={l.label} className="ft-legal" onClick={() => navigate(l.path)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── Styles ────────────────────────────────────
const footerCss = `
  .ft-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.2fr;
    gap: clamp(24px,4vw,48px);
    align-items: start;
  }
  @media (max-width: 900px) {
    .ft-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  }
  @media (max-width: 540px) {
    .ft-grid { grid-template-columns: 1fr; gap: 28px; }
  }

  .ft-col-title {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: rgba(200,169,81,0.7);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ft-col-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(200,169,81,0.2);
  }

  .ft-link {
    background: none;
    border: none;
    padding: 0;
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    color: rgba(255,255,255,0.42);
    display: block;
    margin-bottom: 11px;
    text-align: left;
    cursor: pointer;
    transition: color 0.15s;
    line-height: 1;
  }
  .ft-link:hover { color: #C8A951; }

  .ft-social {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    margin-bottom: 10px;
    transition: all 0.2s;
    text-decoration: none;
  }

  .ft-legal {
    background: none;
    border: none;
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.28);
    cursor: pointer;
    transition: color 0.15s;
    padding: 0;
  }
  .ft-legal:hover { color: #C8A951; }
`;
