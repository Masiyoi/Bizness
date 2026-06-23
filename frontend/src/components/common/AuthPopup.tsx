// src/components/common/AuthPopup.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const getRecaptchaToken = (action: string): Promise<string> => {
  return new Promise((resolve) => {
    window.grecaptcha.ready(async () => {
      const token = await window.grecaptcha.execute(
        import.meta.env.VITE_RECAPTCHA_SITE_KEY,
        { action }
      );
      resolve(token);
    });
  });
};

const redirectByRole = (user: any, navigate: (p: string) => void) =>
  navigate(user?.role === 'admin' ? '/admin' : '/');

/* ─── Inline CSS ─────────────────────────────────────────────────────────── */
const css = `
  /* Hide reCAPTCHA badge — disclosed in Privacy Policy & Terms */
  .grecaptcha-badge { visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }

  @keyframes apFadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes apRiseIn   { from { opacity:0; transform:translateY(24px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
  @keyframes apTileIn   { from { opacity:0; transform:translateX(-100%) } to { opacity:1; transform:translateX(0) } }

  .ap-overlay {
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(10,10,10,0.55);
    backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: apFadeIn 0.25s ease both;
  }

  .ap-modal {
    width: 100%; max-width: 880px;
    background: #FAFAFA;
    display: grid; grid-template-columns: 1fr 1fr;
    position: relative;
    border: 1px solid rgba(0,0,0,0.1);
    animation: apRiseIn 0.35s cubic-bezier(.22,.68,0,1.2) both;
    max-height: 92vh; overflow: hidden;
  }
  @media(max-width:760px) { .ap-modal { grid-template-columns: 1fr; max-height: 94vh; overflow-y: auto } }

  .ap-modal-img {
    position: relative; background: #0A0A0A; overflow: hidden; min-height: 420px;
  }
  .ap-modal-img img {
    width: 100%; height: 100%; object-fit: cover;
    filter: grayscale(100%) contrast(1.1); opacity: 0.85;
  }
  @media(max-width:760px) {
    .ap-overlay { align-items: center; padding: 24px; }
    .ap-modal {
      grid-template-columns: 1fr;
      width: 100%;
      max-width: 360px;
      max-height: unset;
      border-radius: 16px;
      overflow: hidden;
      margin: auto;
    }
    .ap-modal-img {
      display: flex !important;
      height: 460px;
      min-height: unset;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding: 24px 20px 32px;
      border-radius: 16px;
    }
    .ap-modal-img img {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover; object-position: top;
      border-radius: 16px;
    }
    .ap-modal-body { display: none !important; }
    .ap-close {
      top: 12px; right: 12px;
      background: rgba(0,0,0,0.35);
      border-color: rgba(255,255,255,0.25);
      color: #fff; border-radius: 50%;
    }
    .ap-close:hover { background: rgba(0,0,0,0.65); }
  }
  .ap-modal-img-label {
    position: absolute; bottom: 28px; left: 28px;
    font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic;
    font-size: 32px; font-weight: 300; color: #fff; line-height: 1.1;
  }
  .ap-mobile-promo {
    display: none;
  }
  @media(max-width:760px) {
    .ap-modal-img-label { display: none; }
    .ap-mobile-promo {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      z-index: 2;
      width: 100%;
      padding: 0 8px;
    }
    .ap-mobile-promo-badge {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 10px; font-weight: 600; letter-spacing: 3px;
      text-transform: uppercase; color: rgba(255,255,255,0.7);
      border: 1px solid rgba(255,255,255,0.3);
      padding: 4px 14px; border-radius: 20px;
      background: rgba(0,0,0,0.25); margin-bottom: 12px;
    }
    .ap-mobile-promo-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 34px; font-weight: 300; font-style: italic;
      color: #fff; line-height: 1.1; margin-bottom: 6px;
    }
    .ap-mobile-promo-title strong {
      font-weight: 600; display: block; font-style: normal; font-size: 38px;
    }
    .ap-mobile-promo-sub {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 12px; color: rgba(255,255,255,0.6);
      letter-spacing: 1px; margin-bottom: 24px;
    }
    .ap-mobile-signin-btn {
      width: 100%; background: #fff; color: #0a0a0a;
      border: none; padding: 14px;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 11px; font-weight: 700; letter-spacing: 3px;
      text-transform: uppercase; cursor: pointer;
      transition: background 0.18s; margin-bottom: 10px;
    }
    .ap-mobile-signin-btn:hover { background: #f0f0f0; }
    .ap-mobile-google-wrap {
      width: 100%;
    }
  }

  .ap-modal-body { padding: clamp(28px,4vw,52px); display: flex; flex-direction: column; overflow-y: auto; }

  .ap-close {
    position: absolute; top: 18px; right: 18px;
    width: 32px; height: 32px; border: 1px solid rgba(0,0,0,0.15);
    background: none; cursor: pointer; font-size: 14px; color: #0A0A0A;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s; z-index: 2;
  }
  .ap-close:hover { background: #0A0A0A; color: #fff; border-color: #0A0A0A; }

  .ap-eyebrow {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 10px; font-weight: 500;
    letter-spacing: 3.5px; text-transform: uppercase; color: #888; margin-bottom: 14px;
    display: flex; align-items: center; gap: 10px;
  }
  .ap-eyebrow::before { content: ''; width: 26px; height: 1px; background: #888; }

  .ap-title {
    font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300;
    font-size: clamp(28px,4vw,40px); letter-spacing: -1px; color: #0A0A0A;
    line-height: 1.05; margin-bottom: 10px;
  }
  .ap-title em { font-style: italic; color: #888; }

  .ap-sub {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 13px; font-weight: 300;
    color: #888; line-height: 1.65; margin-bottom: 24px; max-width: 360px;
  }

  .ap-tabs { display: flex; border-bottom: 1px solid rgba(0,0,0,0.1); margin-bottom: 22px; }
  .ap-tab {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 11px; font-weight: 500;
    letter-spacing: 2px; text-transform: uppercase; color: #888;
    background: none; border: none; padding: 0 0 12px; margin-right: 28px;
    cursor: pointer; position: relative; transition: color 0.18s;
  }
  .ap-tab::after {
    content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
    background: #0A0A0A; transform: scaleX(0); transform-origin: left;
    transition: transform 0.22s cubic-bezier(.22,.68,0,1.2);
  }
  .ap-tab.active { color: #0A0A0A; }
  .ap-tab.active::after { transform: scaleX(1); }
  .ap-tab:disabled { cursor: not-allowed; opacity: 0.5; }

  .ap-field { margin-bottom: 14px; }
  .ap-label {
    display: block; font-family: 'DM Sans', system-ui, sans-serif; font-size: 10px;
    font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: #888;
    margin-bottom: 7px;
  }
  .ap-input {
    width: 100%; border: 1px solid rgba(0,0,0,0.15); background: #fff;
    padding: 13px 14px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 13px;
    color: #0A0A0A; outline: none; transition: border-color 0.18s;
  }
  .ap-input:focus { border-color: #0A0A0A; }
  .ap-input::placeholder { color: #bbb; }
  .ap-input-wrap { position: relative; }
  .ap-eye {
    position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; font-size: 14px; color: #aaa;
    padding: 0; transition: color 0.18s;
  }
  .ap-eye:hover { color: #0A0A0A; }

  .ap-forgot {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 11px; color: #888;
    cursor: pointer; text-decoration: underline; text-underline-offset: 2px;
  }
  .ap-forgot:hover { color: #0A0A0A; }

  .ap-error {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 12px; color: #0A0A0A;
    background: rgba(0,0,0,0.05); border-left: 2px solid #0A0A0A;
    padding: 10px 12px; margin-bottom: 16px; line-height: 1.5;
  }
  .ap-success {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 12px; color: #166534;
    background: rgba(22,163,74,0.07); border-left: 2px solid #166534;
    padding: 10px 12px; margin-bottom: 16px; line-height: 1.5;
  }

  .ap-submit {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 11px; font-weight: 500;
    letter-spacing: 3px; text-transform: uppercase; background: #0A0A0A; color: #fff;
    border: none; padding: 15px; cursor: pointer; margin-top: 4px;
    transition: background 0.2s; width: 100%;
  }
  .ap-submit:hover:not(:disabled) { background: #222; }
  .ap-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .ap-outline-btn {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 11px; font-weight: 500;
    letter-spacing: 2px; text-transform: uppercase; background: transparent; color: #555;
    border: 1px solid rgba(0,0,0,0.2); padding: 12px; cursor: pointer; width: 100%;
    transition: all 0.18s;
  }
  .ap-outline-btn:hover:not(:disabled) { border-color: #0A0A0A; color: #0A0A0A; }
  .ap-outline-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ap-later {
    margin-top: 16px; text-align: center;
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 11px; font-weight: 500;
    letter-spacing: 1.5px; text-transform: uppercase; color: #888;
    background: none; border: none; cursor: pointer; text-decoration: underline;
    text-underline-offset: 3px; transition: color 0.18s;
  }
  .ap-later:hover { color: #0A0A0A; }

  .ap-divider { display: flex; align-items: center; gap: 10px; margin: 18px 0; }
  .ap-divider-line { flex: 1; height: 1px; background: rgba(0,0,0,0.1); }
  .ap-divider-text {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 10px; color: #aaa;
    letter-spacing: 1.5px; text-transform: uppercase; white-space: nowrap;
  }

  .ap-switch {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 12px; color: #888;
    text-align: center; margin-top: 18px;
  }
  .ap-switch span { color: #0A0A0A; font-weight: 500; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }

  /* ── Floating minimized tile ── */
  .ap-tile {
    position: fixed; left: 0; top: 50%; transform: translateY(-50%);
    z-index: 9997; background: #0A0A0A; color: #fff;
    padding: 18px 14px; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    border-radius: 0 8px 8px 0;
    box-shadow: 2px 0 12px rgba(0,0,0,0.25);
    animation: apTileIn 0.4s cubic-bezier(.22,.68,0,1.2) both;
    transition: padding 0.18s, background 0.18s;
  }
  .ap-tile:hover { padding-right: 20px; background: #222; }
  .ap-tile-text {
    font-family: 'DM Sans', system-ui, sans-serif; font-size: 10px; font-weight: 500;
    letter-spacing: 2px; text-transform: uppercase;
    writing-mode: vertical-rl; text-orientation: mixed;
  }
  .ap-tile-icon { font-size: 16px; line-height: 1; }
  @media(max-width:480px) { .ap-tile { padding: 14px 10px } .ap-tile-text { font-size: 9px } }
`;

type Mode = 'signin' | 'signup';

interface AuthPopupProps {
  onAuthSuccess?: (user: any) => void;
}

export default function AuthPopup({ onAuthSuccess }: AuthPopupProps) {
  const navigate = useNavigate();

  const handleGoogleResponse = async (response: { credential: string }) => {
    setGoogleLoading(true); setError('');
    try {
      const res = await axios.post('/api/auth/google', { credential: response.credential }, { withCredentials: true });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onAuthSuccess?.(res.data.user);
      setVisible(false); setMin(false);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Google sign-in failed.');
    } finally { setGoogleLoading(false); }
  };

  const [visible, setVisible]     = useState(false);
  const [minimized, setMin]       = useState(false);
  const [mode, setMode]           = useState<Mode>('signin');

  // shared
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]               = useState('');

  // signup-only
  const [fullName, setFullName]   = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading]     = useState(false);
  const [resendMsg, setResendMsg]             = useState('');

  // login-only
  const [unverified, setUnverified] = useState(false);
  const [locked, setLocked]         = useState(false);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  // Show on every visit while logged out.
  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) setVisible(true);
  }, []);

  // Load reCAPTCHA v3 script once.
  useEffect(() => {
    if (document.querySelector('script[data-ap-recaptcha]')) return;
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=6LdlHMQsAAAAAJ5Ft84oddhVF0cUKkU7u65Xlb2o';
    script.async = true;
    script.setAttribute('data-ap-recaptcha', 'true');
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const init = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      const el = document.getElementById('ap-google-btn');
      if (el) window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: '100%', text: 'signin_with', shape: 'rectangular' });
      const elMobile = document.getElementById('ap-google-btn-mobile');
      if (elMobile) window.google.accounts.id.renderButton(elMobile, { theme: 'outline', size: 'large', width: '100%', text: 'signin_with', shape: 'rectangular' });
    };
    const t = setTimeout(init, 200);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (document.querySelector('script[data-ap-google]')) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.setAttribute('data-ap-google', 'true');
    document.body.appendChild(script);
  }, []);

  const close = () => { setVisible(false); setMin(true); };
  const reopen = () => { setMin(false); setVisible(true); };

  const resetMessages = () => { setError(''); setUnverified(false); setLocked(false); };

  const switchMode = (m: Mode) => {
    setMode(m);
    resetMessages();
    setPassword(''); setConfirmPw(''); setFullName(''); setRegisteredEmail(''); setResendMsg('');
  };

  const handleLogin = useCallback(async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); resetMessages();
    try {
      const recaptchaToken = await getRecaptchaToken('login');
      const res = await axios.post('/api/auth/login', { email, password, recaptchaToken }, { withCredentials: true });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onAuthSuccess?.(res.data.user);
      setVisible(false); setMin(false);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Login failed.');
      if (err.response?.data?.unverified) setUnverified(true);
      if (err.response?.status === 423) {
        setLocked(true);
        setLockedUntil(new Date(err.response.data.lockedUntil));
      }
    } finally { setLoading(false); }
  }, [email, password, navigate]);

  const handleRegister = useCallback(async () => {
    if (!fullName || !email || !password || !confirmPw) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true); resetMessages();
    try {
      const recaptchaToken = await getRecaptchaToken('register');
      await axios.post('/api/auth/register', { full_name: fullName, email, password, recaptchaToken });
      setRegisteredEmail(email);
    } catch (err: any) {
      setError(err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
    } finally { setLoading(false); }
  }, [fullName, email, password, confirmPw]);

  const handleResend = async () => {
    setResendLoading(true); setResendMsg('');
    try {
      const res = await axios.post('/api/auth/resend-verification', { email: registeredEmail || email });
      setResendMsg(res.data.msg);
    } catch { setResendMsg('Failed to resend. Please try again.'); }
    finally { setResendLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mode === 'signin' ? handleLogin() : handleRegister();
  };

  if (!visible && !minimized) return null;

  return (
    <>
      <style>{css}</style>

      {minimized && !visible && (
        <div className="ap-tile" onClick={reopen} role="button" aria-label="Sign in or sign up">
          <span className="ap-tile-icon">＋</span>
          <span className="ap-tile-text">Sign In</span>
        </div>
      )}

      {visible && (
        <div className="ap-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="ap-modal">
            <button className="ap-close" onClick={close} aria-label="Minimize">✕</button>

            <div className="ap-modal-img">
              <img
                src="https://res.cloudinary.com/dfiy43f01/image/upload/v1782201742/Lara_Bubmann_outfit__knns7x.jpg"
                alt="Luku Prime"
              />
              <div className="ap-modal-img-label">Luku ni Prime<br/>Siku Zote</div>

              {/* Mobile-only promo overlay */}
              <div className="ap-mobile-promo">
                <div className="ap-mobile-promo-badge">Limited Offer</div>
                <div className="ap-mobile-promo-title">
                  Get <strong>10% Off</strong>
                </div>
                <div className="ap-mobile-promo-sub">On your first order · No code needed</div>

                <button
                  className="ap-mobile-signin-btn"
                  onClick={() => { close(); navigate('/login'); }}
                >
                  Sign In to Claim →
                </button>

                <div className="ap-mobile-google-wrap">
                  {googleLoading
                    ? <div style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', padding:'12px', color:'rgba(255,255,255,0.5)', fontFamily:"'DM Sans',sans-serif", fontSize:12, textAlign:'center' as const }}>Signing in…</div>
                    : <div id="ap-google-btn-mobile" style={{ width:'100%', minHeight:44 }} />
                  }
                </div>
              </div>
            </div>

            <div className="ap-modal-body">

              {/* ── Registered: check inbox state ── */}
              {registeredEmail ? (
                <>
                  <p className="ap-eyebrow">Almost there</p>
                  <h2 className="ap-title">Check your <em>inbox</em></h2>
                  <p className="ap-sub">
                    We sent a verification link to <strong style={{ color:'#0A0A0A' }}>{registeredEmail}</strong>.
                    Click it to activate your account — don't forget to check spam.
                  </p>
                  {resendMsg && <div className="ap-success">{resendMsg}</div>}
                  <button className="ap-outline-btn" onClick={handleResend} disabled={resendLoading}>
                    {resendLoading ? 'Sending…' : 'Resend verification email'}
                  </button>
                  <p className="ap-switch">
                    Already verified? <span onClick={() => switchMode('signin')}>Sign in here</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="ap-eyebrow">Welcome</p>
                  <h2 className="ap-title">
                    {mode === 'signin' ? <>Sign in to <em>continue</em></> : <>Create your <em>account</em></>}
                  </h2>
                  <p className="ap-sub">
                    {mode === 'signin'
                      ? 'Access your orders, wishlist, and saved details.'
                      : 'Join Luku Prime for faster checkout and exclusive drops.'}
                  </p>

                  <div className="ap-tabs">
                    <button className={`ap-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => switchMode('signin')} disabled={loading}>Sign In</button>
                    <button className={`ap-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')} disabled={loading}>Sign Up</button>
                  </div>

                  <div style={{ marginBottom: 16, minHeight: 44 }}>
                    {googleLoading
                      ? <div style={{ background:'rgba(0,0,0,0.03)', border:'1px solid rgba(0,0,0,0.08)', padding:'12px', color:'rgba(0,0,0,0.3)', fontFamily:"'DM Sans',sans-serif", fontSize:13, textAlign:'center' as const }}>Signing in with Google…</div>
                      : <div id="ap-google-btn" style={{ width:'100%', minHeight:44 }} />
                    }
                  </div>

                  <div className="ap-divider" style={{ marginBottom: 16 }}>
                    <div className="ap-divider-line"/>
                    <span className="ap-divider-text">or with email</span>
                    <div className="ap-divider-line"/>
                  </div>

                  {locked && lockedUntil && (
                    <div className="ap-error">
                      Account locked until {lockedUntil.toLocaleTimeString('en-KE')}. Too many failed attempts.
                    </div>
                  )}

                  {error && !locked && (
                    <div className="ap-error">
                      {error}
                      {unverified && (
                        <div style={{ marginTop: 8 }}>
                          <button type="button" className="ap-outline-btn" onClick={handleResend} disabled={resendLoading} style={{ padding: '8px' }}>
                            {resendLoading ? 'Sending…' : 'Resend verification email'}
                          </button>
                          {resendMsg && <div style={{ marginTop: 6, fontSize: 11, color: '#166534' }}>{resendMsg}</div>}
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                      <div className="ap-field">
                        <label className="ap-label">Full Name</label>
                        <input className="ap-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Wanjiku" maxLength={100} autoComplete="name" />
                      </div>
                    )}
                    <div className="ap-field">
                      <label className="ap-label">Email</label>
                      <input className="ap-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} autoComplete="email" />
                    </div>
                    <div className="ap-field">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                        <label className="ap-label" style={{ marginBottom: 0 }}>Password</label>
                        {mode === 'signin' && (
                          <span className="ap-forgot" onClick={() => { close(); navigate('/forgot-password'); }}>Forgot password?</span>
                        )}
                      </div>
                      <div className="ap-input-wrap">
                        <input
                          className="ap-input"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                          maxLength={128}
                          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                          style={{ paddingRight: 40 }}
                        />
                        <button type="button" className="ap-eye" onClick={() => setShowPassword(x => !x)}>
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    {mode === 'signup' && (
                      <div className="ap-field">
                        <label className="ap-label">Confirm Password</label>
                        <input className="ap-input" type={showPassword ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat your password" maxLength={128} autoComplete="new-password" />
                      </div>
                    )}

                    <button className="ap-submit" type="submit" disabled={loading || locked}>
                      {loading
                        ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                        : locked
                          ? 'Account Locked'
                          : (mode === 'signin' ? 'Sign In →' : 'Create Account →')}
                    </button>
                  </form>

                  <button className="ap-later" onClick={close}>Maybe later</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}