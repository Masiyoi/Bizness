import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

declare global {
  interface Window { grecaptcha: any; }
}

const T = {
  navy: "#0D1B3E", navyMid: "#152348", navyLight: "#1E2F5A",
  gold: "#C8A951", goldLight: "#DEC06A",
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

  // ── Sent confirmation screen ───────────────────────────────────────────
  if (sent) return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.orb1} /><div style={s.orb2} /><div style={s.dots} />
      <div className="lp-card" style={{ ...s.card, textAlign: "center", maxWidth: 440 }}>
        <div style={s.ornRow}>
          <div style={s.ornLine} /><div style={s.ornDiamond} /><div style={s.ornLine} />
        </div>
        <div style={{ fontSize: 52, marginBottom: 18 }}>📨</div>
        <h1 style={{ ...s.heading, textAlign: "center", fontSize: "clamp(18px,4vw,22px)", marginBottom: 10 }}>
          Check your inbox
        </h1>
        <p style={{ ...s.sub, marginBottom: 10 }}>We sent a password reset link to</p>
        <div style={{
          background: T.navyLight, border: `1px solid rgba(200,169,81,0.25)`, borderRadius: 8,
          padding: "9px 16px", color: T.goldLight, fontWeight: 700, fontSize: 13,
          marginBottom: 22, display: "inline-block", fontFamily: "'Jost',sans-serif",
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
        <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, fontFamily: "'Jost',sans-serif", marginTop: 18 }}>
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

  // ── Request form ──────────────────────────────────────────────────────
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
              fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 600,
              color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center",
              gap: 6, marginBottom: 28, padding: 0, transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = T.goldLight)}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            ← Back to Sign In
          </button>

          {/* Lock icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 16, marginBottom: 24,
            background: `linear-gradient(135deg,${T.gold},${T.goldLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 28px rgba(200,169,81,0.3)", fontSize: 26,
          }}>
            🔑
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
              {loading ? "Sending Reset Link…" : "Send Reset Link →"}
            </button>
          </form>

          <div style={{
            height: 1,
            background: "linear-gradient(90deg,transparent,rgba(200,169,81,0.18),transparent)",
            margin: "24px 0",
          }} />

          <p style={{
            fontFamily: "'Jost',sans-serif", fontSize: 13,
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
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  .lp-inp{background:rgba(255,255,255,0.05);border:1px solid rgba(200,169,81,0.22);border-radius:8px;padding:13px 16px;color:#fff;font-size:14px;font-family:'Jost',sans-serif;width:100%;outline:none;letter-spacing:0.2px;transition:border-color 0.2s,background 0.2s}
  .lp-inp:focus{border-color:#C8A951;background:rgba(200,169,81,0.07)}
  .lp-inp::placeholder{color:rgba(255,255,255,0.22)}

  .lp-submit{width:100%;border:none;border-radius:6px;padding:14px;font-family:'Jost',sans-serif;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;background:linear-gradient(135deg,#C8A951,#DEC06A);color:#0D1B3E;transition:all 0.25s}
  .lp-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(200,169,81,0.35)}
  .lp-submit:disabled{opacity:0.6;cursor:not-allowed}

  .lp-link{color:#DEC06A;cursor:pointer;font-weight:600;font-family:'Jost',sans-serif;font-size:13px;transition:color 0.2s}
  .lp-link:hover{color:#fff}

  @keyframes lpFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .lp-card{animation:lpFadeUp 0.5s ease both}
`;

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Jost',sans-serif", background: "#0D1B3E", overflow: "hidden",
    padding: "clamp(20px,4vw,40px) clamp(16px,4vw,24px)", position: "relative",
  },
  orb1: { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(200,169,81,0.07) 0%,transparent 70%)", top: -120, left: -120, pointerEvents: "none" },
  orb2: { position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(200,169,81,0.04) 0%,transparent 70%)", bottom: -100, right: -100, pointerEvents: "none" },
  dots: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(rgba(200,169,81,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px" },
  centerWrap: { width: "100%", maxWidth: 460, position: "relative", zIndex: 1 },
  card: {
    width: "100%", background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,81,0.15)", borderRadius: 20,
    padding: "clamp(28px,5vw,48px) clamp(20px,5vw,42px)",
    backdropFilter: "blur(8px)", position: "relative", zIndex: 1,
  },
  tag: { fontFamily: "'Jost',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "3px", color: "#C8A951", textTransform: "uppercase" as const, marginBottom: 10 },
  heading: { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "clamp(20px,4vw,26px)" as any, color: "#fff", marginBottom: 0 },
  sub: { fontFamily: "'Jost',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)" },
  label: { display: "block", fontFamily: "'Jost',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "rgba(200,169,81,0.75)", textTransform: "uppercase" as const, marginBottom: 8 },
  errorBox: { background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontFamily: "'Jost',sans-serif", fontSize: 13, marginBottom: 18 },
  ornRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, width: "100%" },
  ornLine: { flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(200,169,81,0.4),transparent)" },
  ornDiamond: { width: 5, height: 5, background: "#C8A951", transform: "rotate(45deg)", flexShrink: 0 },
};