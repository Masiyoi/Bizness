import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
const getPasswordStrength = (p: string) => {
  let s = 0;
  if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#16a34a"];
// Shared page shell: white page, white card, logo at the top
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.centerWrap}>
        <div className="rp-card" style={s.card}>
          <div style={s.logoWrap}>
            <img src="/plugwalk.jpg" alt="Plug Walk" style={s.logo} />
            <div style={s.brand}>Plug Walk</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
export default function ResetPassword() {
  const navigate  = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [validating,   setValidating]   = useState(true);
  const [tokenValid,   setTokenValid]   = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [error,        setError]        = useState("");
  const [fieldErrors,  setFieldErrors]  = useState<{ password?: string; confirm?: string }>({});
  const strength = getPasswordStrength(password);
  // Validate token on mount
  useEffect(() => {
    if (!token) { setValidating(false); setTokenValid(false); return; }
    axios.get(`/api/auth/reset-password/${token}`)
      .then(() => { setTokenValid(true); })
      .catch(() => { setTokenValid(false); })
      .finally(() => setValidating(false));
  }, [token]);
  const validate = (): boolean => {
    const e: { password?: string; confirm?: string } = {};
    if (password.length < 8)     e.password = "Password must be at least 8 characters.";
    if (password.length > 128)   e.password = "Password must be under 128 characters.";
    if (!/[A-Z]/.test(password)) e.password = "Must include at least one uppercase letter.";
    if (!/[0-9]/.test(password)) e.password = "Must include at least one number.";
    if (password !== confirm)    e.confirm  = "Passwords do not match.";
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
  // Loading state
  if (validating) return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0 16px" }}>
        <div style={s.spinner} />
        <p style={{ ...s.sub, textAlign: "center" }}>Validating your reset link{"\u2026"}</p>
      </div>
    </Shell>
  );
  // Invalid / expired token
  if (!tokenValid) return (
    <Shell>
      <div style={{ textAlign: "center" }}>
        <div style={s.tag}>Link Expired</div>
        <h1 style={{ ...s.heading, textAlign: "center", marginBottom: 12 }}>Reset Link Invalid</h1>
        <p style={{ ...s.sub, lineHeight: 1.75, marginBottom: 28 }}>
          This password reset link is either invalid or has expired. Reset links are valid for <strong style={{ color: "#000" }}>30 minutes</strong>.
        </p>
        <button
          onClick={() => navigate("/forgot-password")}
          className="rp-submit"
          style={{ maxWidth: 300, margin: "0 auto 16px", display: "block" }}
        >
          Request New Link {"\u2192"}
        </button>
        <span className="rp-link" onClick={() => navigate("/login")}>Back to Sign In</span>
      </div>
    </Shell>
  );
  // Success screen
  if (success) return (
    <Shell>
      <div style={{ textAlign: "center" }}>
        <div style={s.tag}>All Done</div>
        <h1 style={{ ...s.heading, textAlign: "center", marginBottom: 12 }}>Password Reset</h1>
        <p style={{ ...s.sub, lineHeight: 1.75, marginBottom: 28 }}>
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="rp-submit"
          style={{ maxWidth: 300, margin: "0 auto", display: "block" }}
        >
          Sign In Now {"\u2192"}
        </button>
      </div>
    </Shell>
  );
  // Reset form
  return (
    <Shell>
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <div style={s.tag}>New Password</div>
        <h1 style={s.heading}>Reset Password</h1>
        <p style={{ ...s.sub, lineHeight: 1.7, marginTop: 8 }}>
          Choose a strong password for your Plug Walk account.
        </p>
      </div>
      {/* Password requirements */}
      <div style={s.reqBox}>
        <div style={s.reqTitle}>Password Requirements</div>
        {[
          { label: "At least 8 characters",            met: password.length >= 8 },
          { label: "One uppercase letter (A\u2013Z)",  met: /[A-Z]/.test(password) },
          { label: "One number (0\u20139)",            met: /[0-9]/.test(password) },
        ].map(req => (
          <div key={req.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: req.met ? "#16a34a" : "#bbb", flexShrink: 0, width: 10 }}>
              {req.met ? "\u2713" : "\u25CB"}
            </span>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: req.met ? "#111" : "#888", transition: "color 0.2s" }}>
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
              className="rp-inp"
              style={{ paddingRight: 64, borderColor: fieldErrors.password ? "#ef4444" : "#000" }}
            />
            <button type="button" onClick={() => setShowPassword(x => !x)} className="rp-eye">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {password && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <div style={{ display: "flex", gap: 4, flex: 1 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 3, transition: "background 0.3s",
                    backgroundColor: strength >= i ? strengthColor[strength] : "#e5e5e5",
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
              className="rp-inp"
              style={{
                paddingRight: 44,
                borderColor: fieldErrors.confirm ? "#ef4444" : confirm && confirm === password ? "#16a34a" : "#000",
              }}
            />
            {confirm && (
              <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: confirm === password ? "#4ade80" : "#f87171" }}>
                {confirm === password ? "\u2713" : "\u2717"}
              </span>
            )}
          </div>
          {fieldErrors.confirm && <span style={s.err}>{fieldErrors.confirm}</span>}
        </div>
        <button type="submit" disabled={loading} className="rp-submit" style={{ marginTop: 4 }}>
          {loading ? "Updating Password\u2026" : "Set New Password \u2192"}
        </button>
      </form>
      <div style={{ height: 1, background: "#eee", margin: "24px 0" }} />
      <p style={{ textAlign: "center" }}>
        <span className="rp-link" onClick={() => navigate("/login")}>{"\u2190"} Back to Sign In</span>
      </p>
    </Shell>
  );
}
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .rp-inp{background:#000;border:1px solid #000;border-radius:6px;padding:13px 16px;color:#fff;font-size:14px;font-family:'DM Sans',sans-serif;width:100%;outline:none;letter-spacing:0.2px;transition:border-color 0.2s,box-shadow 0.2s}
  .rp-inp:focus{box-shadow:0 0 0 3px rgba(0,0,0,0.15)}
  .rp-inp::placeholder{color:rgba(255,255,255,0.4)}
  .rp-submit{width:100%;border:none;border-radius:6px;padding:14px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;cursor:pointer;background:#000;color:#fff;transition:all 0.22s}
  .rp-submit:hover:not(:disabled){background:#222;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.25)}
  .rp-submit:disabled{opacity:0.45;cursor:not-allowed}
  .rp-link{color:#000;cursor:pointer;font-weight:600;font-family:'DM Sans',sans-serif;font-size:12px;text-decoration:underline;text-underline-offset:3px;opacity:0.7;transition:opacity 0.2s}
  .rp-link:hover{opacity:1}
  .rp-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.6);padding:0;transition:color 0.2s}
  .rp-eye:hover{color:#fff}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes rpFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  .rp-card{animation:rpFadeUp 0.45s ease both}
`;
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans',sans-serif", background: "#ffffff",
    padding: "clamp(20px,4vw,40px) clamp(16px,4vw,24px)",
  },
  centerWrap: { width: "100%", maxWidth: 460 },
  card: {
    width: "100%", background: "#fff",
    border: "1px solid #e5e5e5", borderRadius: 16,
    padding: "clamp(28px,5vw,44px) clamp(20px,5vw,40px)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
  },
  logoWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 26 },
  logo: { width: 72, height: 72, objectFit: "cover", borderRadius: "50%", display: "block" },
  brand: { fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "6px", textTransform: "uppercase" as const, color: "#000" },
  tag: { fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "3px", color: "#888", textTransform: "uppercase" as const, marginBottom: 10 },
  heading: { fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "clamp(20px,4vw,26px)" as any, color: "#000", marginBottom: 0 },
  sub: { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#666" },
  label: { display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "#333", textTransform: "uppercase" as const, marginBottom: 8 },
  err: { color: "#dc2626", fontSize: 11, fontFamily: "'DM Sans',sans-serif", marginTop: 5, display: "block" },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", color: "#b91c1c", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 18 },
  reqBox: { background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: "12px 16px", marginBottom: 22 },
  reqTitle: { fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: 8 },
  spinner: { width: 32, height: 32, border: "3px solid #e5e5e5", borderTopColor: "#000", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};