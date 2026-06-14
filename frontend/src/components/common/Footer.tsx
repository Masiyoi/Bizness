// src/components/common/Footer.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
      { label: 'About Us',      path: '/about'   },
      { label: 'Careers',       path: '/careers' },
      { label: 'Press',         path: '/press'   },
      { label: 'Store Locator', path: '/stores'  },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Track My Order',      path: '/orders'     },
      { label: 'FAQ',                 path: '/faqs'       },
      { label: 'Returns & Exchanges', path: '/returns'    },
      { label: 'Delivery Info',       path: '/delivery'   },
      { label: 'Size Guide',          path: '/size-guide' },
      { label: 'Contact Us',          path: '/contact'    },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy',     path: '/privacy' },
      { label: 'Terms & Conditions', path: '/terms'   },
      { label: 'Cookie Policy',      path: '/cookies' },
    ],
  },
  {
    heading: 'Socials',
    links: SOCIAL_LINKS.map(s => ({ label: s.name, path: s.url, external: true })),
  },
];

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

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
          {COLUMNS.map(col => (
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