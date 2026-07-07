import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

declare global {
  interface Window {
    google: any;
    grecaptcha: any;
  }
}

const redirectByRole = (user: any, navigate: (p: string) => void) =>
  navigate(user?.role === "admin" ? "/admin" : "/");

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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [verifiedMsg,   setVerifiedMsg]   = useState("");
  const [unverified,    setUnverified]    = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg,     setResendMsg]     = useState("");
  const [locked,        setLocked]        = useState(false);
  const [lockedUntil,   setLockedUntil]   = useState<Date | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (location.search.includes("verified=true"))
      setVerifiedMsg("Email verified! You can now sign in.");
  }, [location]);

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setGoogleLoading(true); setError("");
    try {
      const res = await axios.post("/api/auth/google", { credential: response.credential }, {
        withCredentials: true,
      });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      redirectByRole(res.data.user, navigate);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Google sign-in failed.");
    } finally { setGoogleLoading(false); }
  }, [navigate]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (window.google) {
        window.google.accounts.id.initialize({ client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, callback: handleGoogleResponse });
        window.google.accounts.id.renderButton(document.getElementById("google-login-btn"), { theme: "outline", size: "large", width: "100%", text: "signin_with", shape: "rectangular" });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [handleGoogleResponse]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=6LdlHMQsAAAAAJ5Ft84oddhVF0cUKkU7u65Xlb2o";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      const badge = document.querySelector(".grecaptcha-badge");
      if (badge) badge.remove();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError(""); setUnverified(false); setLocked(false);
    try {
      const recaptchaToken = await getRecaptchaToken("login");
      const res = await axios.post("/api/auth/login", { email, password, recaptchaToken }, {
        withCredentials: true,
      });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      redirectByRole(res.data.user, navigate);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Login failed.");
      if (err.response?.data?.unverified) setUnverified(true);
      if (err.response?.status === 423) {
        setLocked(true);
        setLockedUntil(new Date(err.response.data.lockedUntil));
      }
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResendLoading(true); setResendMsg("");
    try {
      const res = await axios.post("/api/auth/resend-verification", { email });
      setResendMsg(res.data.msg);
    } catch { setResendMsg("Failed to resend."); }
    finally { setResendLoading(false); }
  };

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* Left brand panel */}
      <div className="lp-left">
        <div style={{ position: "absolute", top: 28, left: 28, width: 80, height: 80, border: "1px solid rgba(0,0,0,0.06)", borderRadius: 4, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 28, right: 28, width: 60, height: 60, border: "1px solid rgba(0,0,0,0.04)", borderRadius: 4, pointerEvents: "none" }} />

        <div style={s.logoMark}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 22, color: "#fff" }}>LP</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", marginBottom: 22, zIndex: 1, position: "relative" }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(0,0,0,0.15))" }} />
          <div style={{ width: 4, height: 4, background: "rgba(0,0,0,0.2)", transform: "rotate(45deg)", flexShrink: 0 }} />
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(0,0,0,0.15),transparent)" }} />
        </div>

        <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 28, color: "#0a0a0a", textAlign: "center", lineHeight: 1.2, marginBottom: 14, zIndex: 1, position: "relative" }}>
          Welcome Back
        </h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(0,0,0,0.4)", textAlign: "center", lineHeight: 1.8, maxWidth: 260, zIndex: 1, position: "relative" }}>
          Kenya's premium destination for the finest products.
        </p>

        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 14, width: "100%", zIndex: 1, position: "relative" }}>
          {[["🔒", "Secure, encrypted login"], ["👑", "Access your premium account"], ["🚚", "Track your orders instantly"]].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 3, flexShrink: 0, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{icon}</div>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={s.right}>
        <div className="lp-card" style={s.card}>

          {/* Mobile-only logo */}
          <div className="lp-mobile-logo">
            <div style={{ width: 40, height: 40, borderRadius: 3, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>LP</span>
            </div>
          </div>

      {/* Image Hero — edge-to-edge, bleeds past card padding. Swap src for your own asset. */}
      <div className="lp-hero">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
          alt="Let's Go Shopping"
        />
        <div className="lp-hero-overlay" />
        <div className="lp-hero-caption">
          <p className="lp-hero-title">Let's Go Shopping</p>
        </div>
      </div>

          <div style={{ marginBottom: 28 }}>
            <div style={s.tag}>Member Login</div>
            <h1 style={s.heading}>Sign In</h1>
            <p style={s.sub}>Enter your credentials to continue</p>
          </div>

          {verifiedMsg && (
            <div style={s.successBox}>✅ {verifiedMsg}</div>
          )}

          {locked && lockedUntil && (
            <div style={s.lockedBox}>
              🔒 Account locked until {lockedUntil.toLocaleTimeString("en-KE")}. Too many failed attempts.
            </div>
          )}

          {error && !locked && (
            <div style={s.errorBox}>
              {error}
              {unverified && (
                <div style={{ marginTop: 10 }}>
                  <button onClick={handleResend} disabled={resendLoading} style={s.resendBtn}>
                    {resendLoading ? "Sending…" : "Resend verification email"}
                  </button>
                  {resendMsg && <div style={{ marginTop: 8, fontSize: 12, color: "#166534" }}>{resendMsg}</div>}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 20, minHeight: 44 }}>
            {googleLoading
              ? <div style={s.gLoad}>Signing in with Google…</div>
              : <div id="google-login-btn" style={{ width: "100%", minHeight: 44 }} />
            }
          </div>

          <div style={s.orRow}>
            <span style={s.divLine} />
            <span style={s.divText}>OR</span>
            <span style={s.divLine} />
          </div>

          <div
            style={{ ...s.emailToggle, cursor: "pointer" }}
            onClick={() => setShowEmailForm(x => !x)}
            role="button"
            aria-expanded={showEmailForm}
          >
            <span style={s.divText}>with email</span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1,
                color: "rgba(0,0,0,0.5)",
                marginLeft: 6,
                transform: showEmailForm ? "rotate(45deg)" : "rotate(0deg)",
                transition: "transform 0.25s ease",
                display: "inline-block",
              }}
            >
              +
            </span>
          </div>

          <div className={`lp-collapse ${showEmailForm ? "lp-collapse-open" : ""}`}>
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={s.label}>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={254}
                className="lp-inp"
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ ...s.label, marginBottom: 0 }}>Password</label>
                <span className="lp-link" style={{ fontSize: 11 }} onClick={() => navigate("/forgot-password")}>
                  Forgot password?
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  maxLength={128}
                  className="lp-inp"
                  style={{ paddingRight: 48 }}
                />
                <button type="button" className="lp-eye" onClick={() => setShowPassword(x => !x)}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading || locked} className="lp-submit">
              {loading ? "Signing in…" : locked ? "Account Locked" : "Sign In →"}
            </button>
          </form>
          </div>

          <div style={{ height: 1, background: "rgba(0,0,0,0.07)", margin: "24px 0" }} />
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(0,0,0,0.4)", textAlign: "center" }}>
            Don't have an account?{" "}
            <span className="lp-link" onClick={() => navigate("/register")}>Join Free</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  .lp-inp{background:#fff;border:1px solid rgba(0,0,0,0.12);border-radius:6px;padding:13px 16px;color:#0a0a0a;font-size:14px;font-family:'DM Sans',sans-serif;width:100%;outline:none;letter-spacing:0.2px;transition:border-color 0.2s,box-shadow 0.2s}
  .lp-inp:focus{border-color:rgba(0,0,0,0.4);box-shadow:0 0 0 3px rgba(0,0,0,0.06)}
  .lp-inp::placeholder{color:rgba(0,0,0,0.25)}

  .lp-submit{width:100%;border:none;border-radius:6px;padding:14px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;cursor:pointer;background:#000;color:#fff;transition:all 0.22s;margin-top:4px}
  .lp-submit:hover:not(:disabled){background:#222;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.15)}
  .lp-submit:disabled{opacity:0.4;cursor:not-allowed}

  .lp-link{color:#000;cursor:pointer;font-weight:600;font-family:'DM Sans',sans-serif;font-size:12px;transition:opacity 0.2s;opacity:0.6}
  .lp-link:hover{opacity:1}

  .lp-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:rgba(0,0,0,0.3);transition:color 0.2s;padding:0}
  .lp-eye:hover{color:#000}

  @keyframes lpFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .lp-card{animation:lpFadeUp 0.4s ease both}

  .lp-hero{position:relative;width:calc(100% + 2 * clamp(18px,5vw,42px));margin:calc(-1 * clamp(24px,5vw,48px)) calc(-1 * clamp(18px,5vw,42px)) 26px;height:380px;overflow:hidden;border-radius:12px 12px 0 0;background:#0a0a0a}
  .lp-hero img{width:100%;height:100%;object-fit:cover;object-position:center 30%;display:block;animation:lpHeroZoom 14s ease-in-out infinite alternate}
  .lp-hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,0.6) 100%)}
  .lp-hero-caption{position:absolute;left:0;right:0;bottom:20px;text-align:center}
  .lp-hero-title{font-family:'DM Sans',sans-serif;font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.3px}
  @keyframes lpHeroZoom{from{transform:scale(1)}to{transform:scale(1.08)}}

  .lp-collapse{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows 0.3s ease,opacity 0.25s ease,margin-top 0.3s ease;margin-top:0}
  .lp-collapse > form{overflow:hidden;min-height:0}
  .lp-collapse-open{grid-template-rows:1fr;opacity:1;margin-top:4px}

  .lp-left{width:420px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 44px;position:relative;overflow:hidden;border-right:1px solid rgba(0,0,0,0.07);background:#f9f9f9}

  .lp-mobile-logo{display:none;align-items:center;gap:12px;margin-bottom:28px}

  @media(max-width:768px){
    .lp-left{display:none !important}
    .lp-mobile-logo{display:flex !important}
  }
`;

const s: Record<string, React.CSSProperties> = {
  page:       { minHeight: "100vh", display: "flex", fontFamily: "'DM Sans',sans-serif", background: "#fff", overflow: "hidden" },
  logoMark:   { width: 72, height: 72, borderRadius: 6, marginBottom: 36, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", position: "relative", zIndex: 1 },
  right:      { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(20px,4vw,40px) clamp(16px,4vw,24px)", background: "#fff", position: "relative", overflow: "hidden" },
  card:       { width: "100%", maxWidth: 430, background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: "clamp(24px,5vw,48px) clamp(18px,5vw,42px)", boxShadow: "0 2px 24px rgba(0,0,0,0.06)", position: "relative", zIndex: 1 },
  tag:        { fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "3px", color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: 10 },
  heading:    { fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "clamp(20px,4vw,26px)" as any, color: "#0a0a0a", marginBottom: 6 },
  sub:        { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(0,0,0,0.4)", fontWeight: 300 },
  label:      { display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "rgba(0,0,0,0.5)", textTransform: "uppercase" as const, marginBottom: 8 },
  successBox: { background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 6, padding: "12px 16px", color: "#166534", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 20 },
  errorBox:   { background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: 6, padding: "12px 16px", color: "#991b1b", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 20 },
  lockedBox:  { background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "12px 16px", color: "#991b1b", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 20, fontWeight: 600 },
  resendBtn:  { background: "transparent", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 4, padding: "6px 14px", color: "#991b1b", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  gLoad:      { background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, padding: "12px", color: "rgba(0,0,0,0.3)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, textAlign: "center" as const },
  divider:    { display: "flex", alignItems: "center", gap: 12, marginBottom: 22 },
  orRow:      { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  emailToggle:{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20, padding: "4px 0" },
  divLine:    { flex: 1, height: 1, background: "rgba(0,0,0,0.08)", display: "block" },
  divText:    { fontFamily: "'Roboto', arial, sans-serif", fontSize: 14, fontWeight: 500, color: "#3c4043", letterSpacing: "0.15px", whiteSpace: "nowrap" as const },
};
