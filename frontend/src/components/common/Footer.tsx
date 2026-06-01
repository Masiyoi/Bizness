// src/components/common/Footer.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';
import { T, SOCIAL_LINKS } from '../../constants/theme';

// ─────────────────────────────────────────────
//  API base URL — set via environment variable
//  Dev:  VITE_API_URL=https://expert-eureka-4jx6vjqgqpgwhj754-5000.app.github.dev
//  Prod: VITE_API_URL=https://api.lukuprime.com   (or whatever your prod URL is)
// ─────────────────────────────────────────────
const API_BASE = 'https://expert-eureka-4jx6vjqgqpgwhj754-5000.app.github.dev';

// ── Social icons ──────────────────────────────
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Instagram: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/>
    </svg>
  ),
  TikTok: (
    <svg width="20" height="23" viewBox="0 0 24 26" fill="none">
      <path d="M17 1c.4 2.2 1.7 3.7 4 4v3.5c-1.4 0-2.7-.4-4-1.2V16a7 7 0 1 1-7-7c.3 0 .6 0 .9.04V12.6a3.5 3.5 0 1 0 2.1 3.4V1h4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  YouTube: (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
      <rect x="1" y="1" width="22" height="16" rx="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M10 5.5l6 3.5-6 3.5V5.5z" fill="currentColor"/>
    </svg>
  ),
};

// ── Link data ─────────────────────────────────
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

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

// Payment badge wrapper — dark outline on black bg
const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  border: '1px solid rgba(255,255,255,0.15)',
  overflow: 'hidden',
  height: 28,
  padding: '0 6px',
  background: 'rgba(255,255,255,0.08)',
};

export default function Footer() {
  const navigate = useNavigate();

  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState<SubscribeStatus>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    // Auth guard — change 'token' key to match your app's auth storage
    const token = localStorage.getItem('token');
    if (!token) {
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
      setMessage(err?.response?.data?.msg ?? 'Network error. Please try again.');
    }
  };

  const btnLabel =
    status === 'loading' ? '...' :
    status === 'success' ? '✓ Joined' :
    'Subscribe';

  const inputBorderColor =
    status === 'error'   ? 'rgba(220,80,80,0.7)' :
    status === 'success' ? 'rgba(46,204,113,0.6)' :
    'rgba(255,255,255,0.20)';

  const btnBg    = status === 'success' ? '#2ecc71' : '#ffffff';
  const btnColor = status === 'success' ? '#fff' : '#000000';

  return (
    <footer style={{ background: '#0a0a0a', fontFamily: "'Jost','DM Sans',sans-serif" }}>
      <style>{footerCss}</style>

      {/* Top rule */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.10)' }}/>

      {/* Main grid */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: 'clamp(40px,6vw,60px) clamp(16px,5%,5%) clamp(32px,5vw,48px)',
      }}>
        <div className="ft-grid">

          {/* ── Brand column ── */}
          <div>
            <img src={logo} alt="Luku Prime" style={{ height: 48, objectFit: 'contain', marginBottom: 10, filter: 'brightness(0) invert(1)' }} />
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '2.5px',
              color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 14,
            }}>
              Walk Prime · Live Prime
            </div>
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.8, marginBottom: 20, maxWidth: 280,
            }}>
              Kenya's premier fashion destination — authentic drops, fast delivery,
              and style that speaks before you do.
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {TRUST_BADGES.map(b => (
                <span key={b} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 20, padding: '5px 12px',
                  fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                }}>
                  {b}
                </span>
              ))}
            </div>

            {/* Payment methods */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontSize: 11, fontWeight: 800, letterSpacing: '1.5px',
                color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12,
              }}>
                We Accept
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={badgeStyle}>
                  <svg width="38" height="16" viewBox="0 0 38 16" fill="none">
                    <rect width="38" height="16" rx="3" fill="#4CAF50"/>
                    <text x="4" y="11.5" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="7.5" fill="#fff" letterSpacing="0.3">M-PESA</text>
                  </svg>
                </span>
                <span style={badgeStyle}>
                  <svg width="38" height="16" viewBox="0 0 38 16" fill="none">
                    <rect width="38" height="16" rx="3" fill="#1A1F71"/>
                    <text x="5" y="12" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="9" fill="#fff" fontStyle="italic" letterSpacing="0.5">VISA</text>
                  </svg>
                </span>
                <span style={badgeStyle}>
                  <svg width="38" height="16" viewBox="0 0 38 16" fill="none">
                    <rect width="38" height="16" rx="3" fill="#252525"/>
                    <circle cx="15" cy="8" r="5.5" fill="#EB001B"/>
                    <circle cx="23" cy="8" r="5.5" fill="#F79E1B"/>
                    <ellipse cx="19" cy="8" rx="2.2" ry="5.5" fill="#FF5F00"/>
                  </svg>
                </span>
                <span style={badgeStyle}>
                  <svg width="38" height="16" viewBox="0 0 38 16" fill="none">
                    <rect width="38" height="16" rx="3" fill="#E4002B"/>
                    <text x="3" y="11.5" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="6.5" fill="#fff" letterSpacing="0.2">AIRTEL</text>
                  </svg>
                </span>
                <span style={badgeStyle}>
                  <svg width="38" height="16" viewBox="0 0 38 16" fill="none">
                    <rect width="38" height="16" rx="3" fill="#007BC1"/>
                    <text x="3" y="11.5" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="6.5" fill="#fff" letterSpacing="0.3">AMEX</text>
                  </svg>
                </span>
              </div>
            </div>

            {/* Newsletter */}
            <div style={{
              fontSize: 12, fontWeight: 800, letterSpacing: '1.5px',
              color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8,
            }}>
              Newsletter
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 12, lineHeight: 1.6 }}>
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
                  padding: '11px 14px',
                  fontFamily: "'Jost',sans-serif",
                  fontSize: 14,
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
                  padding: '11px 18px',
                  fontFamily: "'Jost',sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: btnColor,
                  cursor: (status === 'loading' || status === 'success') ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: status === 'loading' ? 0.7 : 1,
                  transition: 'background 0.25s, opacity 0.2s',
                  minWidth: 96,
                }}
              >
                {btnLabel}
              </button>
            </div>

            {message && (
              <p style={{
                marginTop: 8, fontSize: 12, lineHeight: 1.5,
                color: status === 'success' ? '#2ecc71' : '#e05555',
              }}>
                {message}
              </p>
            )}
          </div>

          {/* ── Support + Company ── */}
          <div>
            <div className="ft-col-title">Customer Care</div>
            {SUPPORT_LINKS.map(l => (
              <button key={l.label} className="ft-link" onClick={() => navigate(l.path)}>
                {l.label}
              </button>
            ))}
            <div className="ft-col-title" style={{ marginTop: 28 }}>Company</div>
            {COMPANY_LINKS.map(l => (
              <button key={l.label} className="ft-link" onClick={() => navigate(l.path)}>
                {l.label}
              </button>
            ))}
          </div>

          {/* ── Social + Contact ── */}
          <div>
            <div className="ft-col-title">Follow Us</div>
            <div style={{ display: 'flex', gap: 22, marginBottom: 32 }}>
              {SOCIAL_LINKS.map(s => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  style={{ color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                >
                  {SOCIAL_ICONS[s.name]}
                </a>
              ))}
            </div>

            {/* Get in Touch */}
            <div>
              <div className="ft-col-title">Get in Touch</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', lineHeight: 2.2 }}>
                📍 Nairobi CBD, Kenya<br/>
                📞 <a href="tel:+254707099935" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}>
                  +254 707 099 935
                </a><br/>
                ✉️ <a href="mailto:lukuprime254@gmail.com" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}>
                  lukuprime254@gmail.com
                </a><br/>
                🕐 Mon–Sat, 9am – 6pm
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: 'rgba(255,255,255,0.08)',
        maxWidth: 1100,
        margin: '0 auto',
      }}/>

      {/* Bottom bar */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '20px clamp(16px,5%,5%)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          © 2025 Luku Prime · All rights reserved · Made by Masiyoi
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
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
    grid-template-columns: 2fr 1fr 1.2fr;
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
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.9);
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ft-col-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.10);
  }

  .ft-link {
    background: none;
    border: none;
    padding: 0;
    font-family: 'Jost', sans-serif;
    font-size: 15px;
    color: rgba(255,255,255,0.45);
    display: block;
    margin-bottom: 14px;
    text-align: left;
    cursor: pointer;
    transition: color 0.15s;
    line-height: 1;
  }
  .ft-link:hover { color: #ffffff; }

  .ft-legal {
    background: none;
    border: none;
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    cursor: pointer;
    transition: color 0.15s;
    padding: 0;
  }
  .ft-legal:hover { color: #ffffff; }
`;