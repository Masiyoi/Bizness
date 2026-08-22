import { useState, useEffect, useCallback, useRef } from "react";
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
  const googleBtnRef = useRef<HTMLDivElement>(null);
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
      // GSI rejects percentage widths ("Provided button width is invalid: 100%").
      // Measure the container's real pixel width and pass that number instead.
      if (window.google && googleBtnRef.current) {
        const pxWidth = googleBtnRef.current.offsetWidth || 320;
        window.google.accounts.id.initialize({ client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, callback: handleGoogleResponse });
        window.google.accounts.id.renderButton(googleBtnRef.current, { theme: "filled_white", size: "large", width: pxWidth, text: "signin_with", shape: "rectangular" });
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
      <div style={s.orb1} /><div style={s.orb2} /><div style={s.dots} />
      <div style={s.centerWrap}>
        <div className="lp-card" style={s.card}>
          <div style={{ marginBottom: 28 }}>
            <div style={s.tag}>Member Login</div>
            <h1 style={s.heading}>Sign In</h1>
            <p style={s.sub}>Enter your credentials to continue</p>
          </div>
          {verifiedMsg && (
            <div style={s.successBox}>{"\u2705"} {verifiedMsg}</div>
          )}
          {locked && lockedUntil && (
            <div style={s.lockedBox}>
              {"\u{1F512}"} Account locked until {lockedUntil.toLocaleTimeString("en-KE")}. Too many failed attempts.
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
                  {resendMsg && <div style={{ marginTop: 8, fontSize: 12, color: "#bbf7d0" }}>{resendMsg}</div>}
                </div>
              )}
            </div>
          )}
          <div style={{ marginBottom: 20, minHeight: 44 }}>
            {googleLoading
              ? <div style={s.gLoad}>Signing in with Google…</div>
              : <div ref={googleBtnRef} id="google-login-btn" style={{ width: "100%", minHeight: 44 }} />
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
                color: "rgba(255,255,255,0.5)",
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
                  {showPassword ? "\u{1F648}" : "\u{1F441}\uFE0F"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading || locked} className="lp-submit">
              {loading ? "Signing in…" : locked ? "Account Locked" : "Sign In →"}
            </button>
          </form>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)", margin: "24px 0" }} />
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
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
  .lp-inp{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.16);border-radius:6px;padding:13px 16px;color:#fff;font-size:14px;font-family:'DM Sans',sans-serif;width:100%;outline:none;letter-spacing:0.2px;transition:border-color 0.2s,background 0.2s}
  .lp-inp:focus{border-color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1)}
  .lp-inp::placeholder{color:rgba(255,255,255,0.25)}
  .lp-submit{width:100%;border:none;border-radius:6px;padding:14px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;cursor:pointer;background:#fff;color:#000;transition:all 0.22s;margin-top:4px}
  .lp-submit:hover:not(:disabled){background:#e8e8e8;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.5)}
  .lp-submit:disabled{opacity:0.4;cursor:not-allowed}
  .lp-link{color:#fff;cursor:pointer;font-weight:600;font-family:'DM Sans',sans-serif;font-size:12px;transition:opacity 0.2s;opacity:0.7}
  .lp-link:hover{opacity:1}
  .lp-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:rgba(255,255,255,0.4);transition:color 0.2s;padding:0}
  .lp-eye:hover{color:#fff}
  @keyframes lpFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  .lp-card{animation:lpFadeUp 0.45s ease both}
  .lp-collapse{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows 0.3s ease,opacity 0.25s ease,margin-top 0.3s ease;margin-top:0}
  .lp-collapse > form{overflow:hidden;min-height:0}
  .lp-collapse-open{grid-template-rows:1fr;opacity:1;margin-top:4px}
`;
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans',sans-serif", background: "#ffffff", overflow: "hidden",
    padding: "clamp(20px,4vw,40px) clamp(16px,4vw,24px)", position: "relative",
  },
  orb1: { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)", top: -120, left: -120, pointerEvents: "none" },
  orb2: { position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.03) 0%,transparent 70%)", bottom: -100, right: -100, pointerEvents: "none" },
  dots: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "28px 28px" },
  centerWrap: { width: "100%", maxWidth: 460, position: "relative", zIndex: 1 },
  card: {
    width: "100%",
    backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.55)), url('/signin.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
    padding: "clamp(28px,5vw,48px) clamp(20px,5vw,42px)",
    position: "relative", zIndex: 1,
  },
  tag: { fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "3px", color: "#ffffff", textTransform: "uppercase" as const, marginBottom: 10 },
  heading: { fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "clamp(20px,4vw,26px)" as any, color: "#fff", marginBottom: 6 },
  sub: { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)" },
  label: { display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 },
  successBox: { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, padding: "12px 16px", color: "#bbf7d0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 20 },
  errorBox: { background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.35)", borderRadius: 6, padding: "12px 16px", color: "#fca5a5", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 20 },
  lockedBox: { background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.35)", borderRadius: 6, padding: "12px 16px", color: "#fca5a5", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 20, fontWeight: 600 },
  resendBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 4, padding: "6px 14px", color: "#fca5a5", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  gLoad: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, textAlign: "center" as const },
  orRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  emailToggle: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20, padding: "4px 0" },
  divLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.15)", display: "block" },
  divText: { fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "1px", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const },
};