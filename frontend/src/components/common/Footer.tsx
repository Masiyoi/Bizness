// src/components/common/Footer.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useRef, useState as useStateGallery } from 'react';
import { useNavigate as useNavGallery } from 'react-router-dom';
import { SOCIAL_LINKS } from '../../constants/theme';

// ── Payment logos from assets ────────────────────────────────────
import mpesaLogo      from '../../assets/M-PESA_LOGO-01.svg';
import airtelLogo     from '../../assets/Airtel_logo.svg';
import visaLogo       from '../../assets/Visa.png';
import mastercardLogo from '../../assets/MasterCard-Logo.svg';
import applePayLogo   from '../../assets/Apple_Pay_logo.svg';
import googlePayLogo  from '../../assets/Google_Pay_Logo.svg';

const PAYMENT_LOGOS = [
  { key: 'mpesa',      src: mpesaLogo,       alt: 'M-Pesa'       },
  { key: 'airtel',     src: airtelLogo,      alt: 'Airtel Money'  },
  { key: 'visa',       src: visaLogo,        alt: 'Visa'          },
  { key: 'mastercard', src: mastercardLogo,  alt: 'Mastercard'    },
  { key: 'applepay',   src: applePayLogo,    alt: 'Apple Pay'     },
  { key: 'googlepay',  src: googlePayLogo,   alt: 'Google Pay'    },
];

// ── Nav columns ──────────────────────────────────────────────────
const COLUMNS = [
  {
    heading: 'Luku Prime',
    links: [
      { label: 'About Us',      path: '/about?tab=about'   },
      { label: 'Careers',       path: '/about?tab=careers' },
      { label: 'Press',         path: '/about?tab=press'   },
      { label: 'Store Locator', path: '/about?tab=stores'  },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Track My Order',      path: '/about?tab=orders'     },
      { label: 'FAQ',                 path: '/about?tab=faqs'       },
      { label: 'Returns & Exchanges', path: '/about?tab=returns'    },
      { label: 'Delivery Info',       path: '/about?tab=delivery'   },
      { label: 'Size Guide',          path: '/about?tab=size-guide' },
      { label: 'Contact Us',          path: '/about?tab=contact'    },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy',     path: '/about?tab=privacy' },
      { label: 'Terms & Conditions', path: '/about?tab=terms'   },
      { label: 'Cookie Policy',      path: '/about?tab=cookies' },
    ],
  },
];

// ── Social icons (used in both desktop nav and mobile) ───────────────────────
const SOCIAL_ICONS = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
    <a href="https://www.instagram.com/lukuprimeshoesbagsthrift?igsh=MWxmazlvM2JseWNzeQ==" target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(214,36,159,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none"/>
      </svg>
    </a>
    <a href="https://tiktok.com/@lifewith_heels_bags" target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#010101', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(1,1,1,0.35)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
    </a>
    <a href="https://www.youtube.com/@Lukuprime254" target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#FF0000', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(255,0,0,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-.9C17.2 2.8 12 2.8 12 2.8s-5.2 0-8.3.2c-.5 0-1.4.1-2.3.9C.7 4.6.5 6.2.5 6.2S.3 8 .3 9.9v1.7c0 1.8.2 3.7.2 3.7s.2 1.6.9 2.3c.9.9 2 .8 2.5.9C5.5 18.7 12 18.8 12 18.8s5.2 0 8.3-.3c.5 0 1.4-.1 2.3-.9.7-.7.9-2.3.9-2.3s.2-1.8.2-3.7V9.9c0-1.8-.2-3.7-.2-3.7zM9.7 13.4V7.6l6.3 2.9-6.3 2.9z"/></svg>
    </a>
    <a href="https://www.facebook.com/lukuprimeshoesthriftbags" target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#1877F2', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(24,119,242,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
    </a>
    <a href="https://pin.it/4CAtrY1jW" target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#E60023', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(230,0,35,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
    </a>
    <a href="https://wa.me/254707099935" target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#25D366', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(37,211,102,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4C8 8 7.3 8.7 7.3 10.1s1 2.8 1.1 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.2L2 22l4.9-1.5C8.3 21.5 10.1 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.8 0-3.5-.5-4.9-1.4l-.4-.2-3 .8.8-2.9-.2-.4C3.5 15.5 3 13.8 3 12 3 7 7 3 12 3s9 4 9 9-4 9-9 9z"/></svg>
    </a>
  </div>
);

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

// ── Product Image Strip ─────────────────────────────────────────
function ProductStrip() {
  const navigate = useNavGallery();
  const [images, setImages] = useStateGallery<{ id: number; src: string; name: string }[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get('/api/products')
      .then(res => {
        const imgs = (res.data as any[])
          .filter(p => p.image_url || (p.images && p.images.length > 0))
          .map(p => ({
            id:   p.id,
            src:  p.image_url || (Array.isArray(p.images) ? p.images[0] : JSON.parse(p.images || '[]')[0]),
            name: p.name,
          }));
        // duplicate for seamless loop
        setImages([...imgs, ...imgs]);
      })
      .catch(() => {});
  }, []);

  if (images.length === 0) return null;

  return (
    <div style={{ overflow: 'hidden', marginBottom: 32, marginLeft: 'calc(-1 * clamp(16px,5%,48px))', marginRight: 'calc(-1 * clamp(16px,5%,48px))' }}>
      <style>{`
        @keyframes ft-scroll {
          0%   { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
        .ft-strip-track {
          display: flex;
          gap: 6px;
          animation: ft-scroll 60s linear infinite;
          width: max-content;
          will-change: transform;
        }
        .ft-strip-track:hover { animation-play-state: paused; }
        .ft-strip-img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          display: block;
          flex-shrink: 0;
          filter: grayscale(15%);
          transition: filter 0.2s, transform 0.2s;
        }
        .ft-strip-img:hover {
          filter: grayscale(0%);
          transform: scale(1.04);
          z-index: 1;
          position: relative;
        }
      `}</style>
      <div className="ft-strip-track" ref={trackRef}>
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => navigate(`/product/${img.id}`)}
            style={{ flexShrink: 0, display: 'block', overflow: 'hidden', cursor: 'pointer' }}
          >
            <img
              src={img.src}
              alt={img.name}
              className="ft-strip-img"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Accordion (mobile only) ──────────────────────────────────────
function AccordionCol({ heading, links, navigate }: {
  heading: string;
  links: { label: string; path: string; external?: boolean }[];
  navigate: (p: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ft-accordion">
      <button className="ft-accordion-btn" onClick={() => setOpen(o => !o)}>
        {heading}
        <span className={`ft-plus ${open ? 'open' : ''}`}>+</span>
      </button>
      <div className={`ft-accordion-body ${open ? 'open' : ''}`}>
        {links.map(l => l.external
          ? <a key={l.label} href={l.path} target="_blank" rel="noopener noreferrer" className="ft-link">{l.label}</a>
          : <button key={l.label} className="ft-link" onClick={() => navigate(l.path)}>{l.label}</button>
        )}
      </div>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────
export default function Footer() {
  const navigate = useNavigate();

  const [email,   setEmail]   = useState('');
  const [status,  setStatus]  = useState<SubscribeStatus>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    if (!email || !email.includes('@')) {
      setStatus('error'); setMessage('Please enter a valid email address.'); return;
    }
    setStatus('loading'); setMessage('');
    try {
      const res = await axios.post('/api/subscribers', { email });
      setStatus('success'); setMessage(res.data.msg || "You're in."); setEmail('');
    } catch (err: any) {
      setStatus('error'); setMessage(err?.response?.data?.msg ?? 'Network error. Try again.');
    }
  };

  return (
    <footer className="ft-root">
      <style>{css}</style>

      {/* ── Top rule ── */}
      <div className="ft-rule" />

      <div className="ft-container">

        {/* Desktop columns */}
        <div className="ft-nav-grid ft-desktop-only">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <div className="ft-col-heading">{col.heading}</div>
              {col.links.map(l => (l as any).external
                ? <a key={l.label} href={l.path} target="_blank" rel="noopener noreferrer" className="ft-link">{l.label}</a>
                : <button key={l.label} className="ft-link" onClick={() => navigate(l.path)}>{l.label}</button>
              )}
            </div>
          ))}
        </div>

        {/* Mobile accordions */}
        <div className="ft-mobile-only">
          {COLUMNS.map(col => (
            <AccordionCol key={col.heading} heading={col.heading} links={col.links as any} navigate={navigate} />
          ))}
        </div>

        {/* ── Bottom strip ── */}
        <div className="ft-bottom-strip">

          {/* Giant wordmark */}
          <div className="ft-wordmark">LUKU PRIME</div>

          {/* Socials */}
          <div style={{ marginBottom: 24 }}>{SOCIAL_ICONS}</div>

          {/* Tagline */}
          <p className="ft-tagline">
            Kenya's premier fashion destination — authentic drops, fast delivery,
            and style that speaks before you do.
          </p>


          {/* Newsletter */}
          <div className="ft-newsletter-row">
            <div className="ft-newsletter-label">Newsletter subscription</div>
            <div className="ft-newsletter-input-row">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                disabled={status === 'loading' || status === 'success'}
                onChange={e => { setEmail(e.target.value); if (status !== 'idle') { setStatus('idle'); setMessage(''); } }}
                onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                className={`ft-input ${status}`}
              />
              <button
                onClick={handleSubscribe}
                disabled={status === 'loading' || status === 'success'}
                className={`ft-sub-btn ${status}`}
              >
                {status === 'loading' ? '...' : status === 'success' ? '✓ Joined' : 'Subscribe'}
              </button>
            </div>
            {message && <p className={`ft-msg ${status}`}>{message}</p>}
          </div>

          <ProductStrip />

          {/* Payments + copyright */}
          <div className="ft-foot-row">
            <div className="ft-payments">
              {PAYMENT_LOGOS.map(({ key, src, alt }) => (
                <span key={key} className="ft-pay-logo">
                  <img src={src} alt={alt} className="ft-pay-img" />
                </span>
              ))}
            </div>
            <div className="ft-copy">© 2025 Luku Prime · Made by Masiyoi</div>
          </div>

        </div>
      </div>
    </footer>
  );
}

// ── CSS ──────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .ft-root {
    background: #fff;
    color: #111;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  }

  .ft-rule {
    height: 1px;
    background: #e0e0e0;
  }

  .ft-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 clamp(16px,5%,48px);
  }

  /* ── Desktop nav grid ── */
  .ft-nav-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    padding: 48px 0 40px;
    border-bottom: 1px solid #e0e0e0;
  }

  .ft-col-heading {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: #111;
    margin-bottom: 16px;
    text-transform: uppercase;
  }

  .ft-link {
    display: block;
    background: none;
    border: none;
    padding: 0;
    margin-bottom: 11px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #555;
    text-align: left;
    cursor: pointer;
    text-decoration: none;
    line-height: 1.3;
    transition: color 0.12s;
  }
  .ft-link:hover { color: #111; }

  /* ── Mobile accordion ── */
  .ft-accordion {
    border-bottom: 1px solid #e0e0e0;
  }
  .ft-accordion-btn {
    width: 100%;
    background: none;
    border: none;
    padding: 18px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #111;
  }
  .ft-plus {
    font-size: 22px;
    font-weight: 300;
    color: #555;
    line-height: 1;
    display: inline-block;
    transition: transform 0.2s ease;
  }
  .ft-plus.open { transform: rotate(45deg); }
  .ft-accordion-body {
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1);
  }
  .ft-accordion-body.open { max-height: 400px; }
  .ft-accordion-body .ft-link { padding-bottom: 2px; }

  /* ── Bottom strip ── */
  .ft-bottom-strip {
    padding: 48px 0 32px;
  }

  .ft-wordmark {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: clamp(52px, 10vw, 120px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 0.92;
    color: #111;
    margin-bottom: 24px;
    text-transform: uppercase;
  }

  .ft-tagline {
    font-size: 14px;
    color: #777;
    line-height: 1.7;
    max-width: 480px;
    margin: 0 0 32px;
  }

  /* Newsletter */
  .ft-newsletter-label {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #111;
    margin-bottom: 12px;
  }
  .ft-newsletter-input-row {
    display: flex;
    max-width: 440px;
    margin-bottom: 8px;
  }
  .ft-input {
    flex: 1;
    border: 1px solid #ccc;
    border-right: none;
    border-radius: 0;
    padding: 12px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #111;
    background: #fff;
    outline: none;
    transition: border-color 0.15s;
  }
  .ft-input:focus { border-color: #111; }
  .ft-input.error { border-color: #c03030; }
  .ft-input.success { border-color: #2ecc71; }
  .ft-sub-btn {
    background: #111;
    border: 1px solid #111;
    border-radius: 0;
    padding: 12px 20px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: #fff;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s;
  }
  .ft-sub-btn:hover:not(:disabled) { background: #333; border-color: #333; }
  .ft-sub-btn.success { background: #2ecc71; border-color: #2ecc71; }
  .ft-sub-btn:disabled { cursor: not-allowed; opacity: 0.7; }
  .ft-msg { font-size: 12px; margin: 4px 0 0; }
  .ft-msg.error { color: #c03030; }
  .ft-msg.success { color: #2ecc71; }

  /* ── Payment logos ── */
  .ft-foot-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid #e0e0e0;
  }
  .ft-payments {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .ft-pay-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    padding: 4px 10px;
    background: #f5f5f5;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
  }
  .ft-pay-img {
    height: 20px;
    width: auto;
    max-width: 72px;
    object-fit: contain;
    display: block;
  }
  .ft-copy {
    font-size: 12px;
    color: #aaa;
  }

  /* Show/hide helpers */
  .ft-desktop-only { display: grid; }
  .ft-mobile-only  { display: none;  }

  @media (max-width: 700px) {
    .ft-desktop-only { display: none; }
    .ft-mobile-only  { display: block; border-top: 1px solid #e0e0e0; }
    .ft-bottom-strip { padding-top: 32px; }
    .ft-newsletter-input-row { max-width: 100%; }
    .ft-payments { gap: 8px; }
    .ft-pay-logo { height: 28px; padding: 3px 7px; }
    .ft-pay-img  { height: 16px; }
    .ft-foot-row { flex-direction: column; align-items: flex-start; }
  }
`;