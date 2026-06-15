import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const T = {
  navy: "#000000", navyMid: "#111111", navyLight: "#1a1a1a",
  gold: "#ffffff", goldLight: "#e0e0e0",
};

const getPasswordStrength = (p: string) => {
  let s = 0;
  if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

export default function ResetPassword() {
  const navigate        = useNavigate();
  const { token }       = useParams<{ token: string }>();

  const [password,      setPassword]      = useState("");
  const [confirm,       setConfirm]       = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [validating,    setValidating]    = useState(true);
  const [tokenValid,    setTokenValid]    = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState("");
  const [fieldErrors,   setFieldErrors]   = useState<{ password?: string; confirm?: string }>({});

  const strength = getPasswordStrength(password);

  // ── Validate token on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setValidating(false); setTokenValid(false); return; }
    axios.get(`/api/auth/reset-password/${token}`)
      .then(() => { setTokenValid(true); })
      .catch(() => { setTokenValid(false); })
      .finally(() => setValidating(false));
  }, [token]);

  const validate = (): boolean => {
    const e: { password?: string; confirm?: string } = {};
    if (password.length < 8)   e.password = "Password must be at least 8 characters.";
    if (password.length > 128) e.password = "Password must be under 128 characters.";
    if (!/[A-Z]/.test(password)) e.password = "Must include at least one uppercase letter.";
    if (!/[0-9]/.test(password)) e.password = "Must include at least one number.";
    if (password !== confirm)  e.confirm  = "Passwords do not match.";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      await axios.post(`/api/auth/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (validating) return (
    <div style={{ ...s.page, flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <div style={s.orb1} /><div style={s.orb2} /><div style={s.dots} />
      <div style={s.spinner} />
      <p style={{ fontFamily: "'DM Sans',sans-serif", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
        Validating your reset link…
      </p>
    </div>
  );

  // ── Invalid / expired token ────────────────────────────────────────────
  if (!tokenValid) return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.orb1} /><div style={s.orb2} /><div style={s.dots} />
      <div className="lp-card" style={{ ...s.card, textAlign: "center", maxWidth: 440 }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>⏰</div>
        <div style={s.tag}>Link Expired</div>
        <h1 style={{ ...s.heading, textAlign: "center", fontSize: "clamp(18px,4vw,22px)", marginBottom: 12 }}>
          Reset Link Invalid
        </h1>
        <p style={{ ...s.sub, lineHeight: 1.75, marginBottom: 28 }}>
          This password reset link is either invalid or has expired. Reset links are valid for <strong style={{ color: "rgba(255,255,255,0.5)" }}>30 minutes</strong>.
        </p>
        <button
          onClick={() => navigate("/forgot-password")}
          className="lp-submit"
          style={{ maxWidth: 300, margin: "0 auto 16px", display: "block" }}
        >
          Request New Link →
        </button>
        <span className="lp-link" onClick={() => navigate("/login")} style={{ fontSize: 12 }}>
          Back to Sign In
        </span>
      </div>
    </div>
  );

  // ── Success screen ─────────────────────────────────────────────────────
  if (success) return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.orb1} /><div style={s.orb2} /><div style={s.dots} />
      <div className="lp-card" style={{ ...s.card, textAlign: "center", maxWidth: 440 }}>
        <div style={s.ornRow}>
          <div style={s.ornLine} /><div style={s.ornDiamond} /><div style={s.ornLine} />
        </div>
        <div style={{ fontSize: 52, marginBottom: 18 }}>✅</div>
        <div style={s.tag}>All Done</div>
        <h1 style={{ ...s.heading, textAlign: "center", fontSize: "clamp(18px,4vw,22px)", marginBottom: 12 }}>
          Password Reset!
        </h1>
        <p style={{ ...s.sub, lineHeight: 1.75, marginBottom: 28 }}>
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="lp-submit"
          style={{ maxWidth: 300, margin: "0 auto", display: "block" }}
        >
          Sign In Now →
        </button>
      </div>
    </div>
  );

  // ── Reset form ─────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.orb1} /><div style={s.orb2} /><div style={s.dots} />

      <div style={s.centerWrap}>
        <div className="lp-card" style={s.card}>

          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 16, marginBottom: 24,
            background: "linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 28px rgba(255,255,255,0.25)", fontSize: 26,
          }}>
            🔒
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={s.tag}>New Password</div>
            <h1 style={s.heading}>Reset Password</h1>
            <p style={{ ...s.sub, lineHeight: 1.7, marginTop: 8 }}>
              Choose a strong password for your Luku Prime account.
            </p>
          </div>

          {/* Password requirements */}
          <div style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 22,
          }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: 8 }}>
              Password Requirements
            </div>
            {[
              { label: "At least 8 characters",     met: password.length >= 8 },
              { label: "One uppercase letter (A–Z)", met: /[A-Z]/.test(password) },
              { label: "One number (0–9)",           met: /[0-9]/.test(password) },
            ].map(req => (
              <div key={req.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: req.met ? "#22c55e" : "rgba(255,255,255,0.25)", flexShrink: 0 }}>
                  {req.met ? "✓" : "○"}
                </span>
                <span style={{
                  fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                  color: req.met ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.28)",
                  transition: "color 0.2s",
                }}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* New password */}
            <div>
              <label style={s.label}>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); }}
                  autoComplete="new-password"
                  autoFocus
                  maxLength={128}
                  className="lp-inp"
                  style={{ paddingRight: 50, borderColor: fieldErrors.password ? "#ef4444" : "rgba(255,255,255,0.15)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(x => !x)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "rgba(255,255,255,0.3)", padding: 0 }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {/* Strength bar */}
              {password && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, flex: 1 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 3, transition: "background 0.3s",
                        backgroundColor: strength >= i ? strengthColor[strength] : "rgba(255,255,255,0.1)",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: strengthColor[strength], fontWeight: 700, fontFamily: "'DM Sans',sans-serif", minWidth: 36 }}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
              {fieldErrors.password && <span style={s.err}>{fieldErrors.password}</span>}
            </div>

            {/* Confirm password */}
            <div>
              <label style={s.label}>Confirm New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setFieldErrors(p => ({ ...p, confirm: undefined })); }}
                  autoComplete="new-password"
                  maxLength={128}
                  className="lp-inp"
                  style={{
                    paddingRight: 44,
                    borderColor: fieldErrors.confirm
                      ? "#ef4444"
                      : confirm && confirm === password
                        ? "#22c55e"
                        : "rgba(255,255,255,0.15)",
                  }}
                />
                {/* Match indicator */}
                {confirm && (
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>
                    {confirm === password ? "✅" : "❌"}
                  </span>
                )}
              </div>
              {fieldErrors.confirm && <span style={s.err}>{fieldErrors.confirm}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="lp-submit"
              style={{ marginTop: 4 }}
            >
              {loading ? "Updating Password…" : "Set New Password →"}
            </button>
          </form>

          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)", margin: "24px 0" }} />
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.28)", textAlign: "center" }}>
            <span className="lp-link" onClick={() => navigate("/login")}>← Back to Sign In</span>
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
  err: { color: "#f87171", fontSize: 11, fontFamily: "'DM Sans',sans-serif", marginTop: 5, display: "block" },
  errorBox: { background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 18 },
  spinner: { width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#ffffff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  ornRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, width: "100%" },
  ornLine: { flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)" },
  ornDiamond: { width: 5, height: 5, background: "#ffffff", transform: "rotate(45deg)", flexShrink: 0 },
};