import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
declare global {
  interface Window { grecaptcha: any; }
}
const T = {
  navy: "#000000", navyMid: "#111111", navyLight: "#1a1a1a",
  gold: "#ffffff", goldLight: "#e0e0e0",
};
const getRecaptchaToken = (action: string): Promise<string> =>
  new Promise((resolve) => {
    window.grecaptcha.ready(async () => {
      const token = await window.grecaptcha.execute(
        import.meta.env.VITE_RECAPTCHA_SITE_KEY,
        { action }
      );
      resolve(token);
    });
  });
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    if (email.length > 254) { setError("Invalid email address."); return; }
    setLoading(true); setError("");
    try {
      const recaptchaToken = await getRecaptchaToken("forgot_password");
      await axios.post("/api/auth/forgot-password", { email, recaptchaToken });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // -- Sent confirmation screen -------------------------------------------
  if (sent) return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.orb1} /><div style={s.orb2} /><div style={s.dots} />
      <div className="lp-card" style={{ ...s.card, textAlign: "center", maxWidth: 440 }}>
        <div style={s.ornRow}>
          <div style={s.ornLine} /><div style={s.ornDiamond} /><div style={s.ornLine} />
        </div>
        <div style={{ fontSize: 52, marginBottom: 18 }}>??</div>
        <div style={s.tag}>Reset Requested</div>
        <h1 style={{ ...s.heading, textAlign: "center", fontSize: "clamp(18px,4vw,22px)", marginBottom: 10 }}>
          Check your inbox
        </h1>
        <p style={{ ...s.sub, marginBottom: 10 }}>We sent a password reset link to</p>
        <div style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
          padding: "9px 16px", color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 13,
          marginBottom: 22, display: "inline-block", fontFamily: "'DM Sans',sans-serif",
          wordBreak: "break-all" as const,
        }}>
          {email}
        </div>
        <p style={{ ...s.sub, marginBottom: 28, lineHeight: 1.7 }}>
          The link expires in <strong style={{ color: "rgba(255,255,255,0.55)" }}>30 minutes</strong>.
          Check your <strong style={{ color: "rgba(255,255,255,0.55)" }}>spam folder</strong> if you don't see it.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="lp-submit"
          style={{ maxWidth: 320, margin: "0 auto", display: "block" }}
        >
          Back to Sign In
        </button>
        <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", marginTop: 18 }}>
          Didn't receive it?{" "}
          <span
            className="lp-link"
            onClick={() => { setSent(false); setEmail(""); }}
          >
            Try again
          </span>
        </p>
      </div>
    </div>
  );
  // -- Request form ------------------------------------------------------
  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.orb1} /><div style={s.orb2} /><div style={s.dots} />
      <div style={s.centerWrap}>
        <div className="lp-card" style={s.card}>
          {/* Back link */}
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
              color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center",
              gap: 6, marginBottom: 28, padding: 0, transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            ? Back to Sign In
          </button>
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 16, marginBottom: 24,
            background: "linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 28px rgba(255,255,255,0.25)", fontSize: 26,
          }}>
            ??
          </div>
          <div style={{ marginBottom: 28 }}>
            <div style={s.tag}>Account Recovery</div>
            <h1 style={s.heading}>Forgot Password?</h1>
            <p style={{ ...s.sub, lineHeight: 1.7, marginTop: 8 }}>
              No worries. Enter your email and we'll send you a secure link to reset your password.
            </p>
          </div>
          {error && (
            <div style={s.errorBox}>{error}</div>
          )}
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={s.label}>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                autoComplete="email"
                autoFocus
                maxLength={254}
                className="lp-inp"
              />
            </div>
            <button type="submit" disabled={loading} className="lp-submit">
              {loading ? "Sending Reset Link…" : "Send Reset Link ?"}
            </button>
          </form>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)", margin: "24px 0" }} />
          <p style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 13,
            color: "rgba(255,255,255,0.28)", textAlign: "center",
          }}>
            Remember your password?{" "}
            <span className="lp-link" onClick={() => navigate("/login")}>Sign In</span>
          </p>
        </div>
      </div>
    </div>
  );
}
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .lp-inp{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.16);border-radius:3px;padding:13px 16px;color:#fff;font-size:14px;font-family:'DM Sans',sans-serif;width:100%;outline:none;letter-spacing:0.2px;transition:border-color 0.2s,background 0.2s}
  .lp-inp:focus{border-color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1)}
  .lp-inp::placeholder{color:rgba(255,255,255,0.25)}
  .lp-submit{width:100%;border:none;border-radius:3px;padding:14px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;cursor:pointer;background:#fff;color:#000;transition:all 0.22s;margin-top:4px}
  .lp-submit:hover:not(:disabled){background:#e8e8e8;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.5)}
  .lp-submit:disabled{opacity:0.45;cursor:not-allowed}
  .lp-link{color:#fff;cursor:pointer;font-weight:500;font-family:'DM Sans',sans-serif;font-size:12px;transition:opacity 0.2s;opacity:0.7}
  .lp-link:hover{opacity:1}
  .lp-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:rgba(255,255,255,0.35);transition:color 0.2s;padding:0}
  .lp-eye:hover{color:#fff}
  @keyframes lpFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  .lp-card{animation:lpFadeUp 0.45s ease both}
  .lp-left{width:420px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 44px;position:relative;overflow:hidden;border-right:1px solid rgba(255,255,255,0.07)}
  .lp-mobile-logo{display:none;align-items:center;gap:12px;margin-bottom:26px}
  @media(max-width:768px){
    .lp-left{display:none !important}
    .lp-mobile-logo{display:flex !important}
  }
`;
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans',sans-serif", background: "#000000", overflow: "hidden",
    padding: "clamp(20px,4vw,40px) clamp(16px,4vw,24px)", position: "relative",
  },
  orb1: { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)", top: -120, left: -120, pointerEvents: "none" },
  orb2: { position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.03) 0%,transparent 70%)", bottom: -100, right: -100, pointerEvents: "none" },
  dots: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "28px 28px" },
  centerWrap: { width: "100%", maxWidth: 460, position: "relative", zIndex: 1 },
  card: {
    width: "100%", background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
    padding: "clamp(28px,5vw,48px) clamp(20px,5vw,42px)",
    backdropFilter: "blur(8px)", position: "relative", zIndex: 1,
  },
  tag: { fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "3px", color: "#ffffff", textTransform: "uppercase" as const, marginBottom: 10 },
  heading: { fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "clamp(20px,4vw,26px)" as any, color: "#fff", marginBottom: 0 },
  sub: { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)" },
  label: { display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, marginBottom: 8 },
  errorBox: { background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 18 },
  ornRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, width: "100%" },
  ornLine: { flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)" },
  ornDiamond: { width: 5, height: 5, background: "#ffffff", transform: "rotate(45deg)", flexShrink: 0 },
};